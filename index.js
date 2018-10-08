/**
 * This script can be used to monitor a facebook message chat and react to
 * incoming messages according to the schema provided.
 *
 * The easiest way to deploy this is to open up a chrome debugger and paste
 * it into the console.
 *
 * @author Scott Leland Crossen
 *
 * **** Table of Emoji IDs ****
 * heart-eyes: #😍
 * laughing: #😆
 * amazed: #😮
 * tears: #😢
 * angry: #😠
 * thumbs-up: #👍
 * thumbs-down: #👎
 */
const WATCH_ROOT = 'body > div:nth-child(1) > div > div > div._1t2u > span:nth-child(2) > div._20bp > div._4_j4 > div._4u-c._1wfr._9hq > div._5f0v.uiScrollableArea.fade > div:nth-child(2) > div > div > div > div:nth-child(3)'
const COMMON_ROOT = WATCH_ROOT + ' > div:last-child > div'
const LAST_PERSON_IMAGE = COMMON_ROOT + ' > div._1t_q > div > div > div > img'
const LAST_MESSAGE_BUNDLE = COMMON_ROOT + ' > div._41ud'
const LAST_MESSAGE = LAST_MESSAGE_BUNDLE + ' > div:last-child'
const LAST_PERSON_URL = COMMON_ROOT + ' > div._1t_q > a'
const LAST_PERSON_NICKNAME = COMMON_ROOT + ' > div._41ud > h5'
const EMOJI_BUTTON = LAST_MESSAGE + ' > div > span > span > span._5zvq'
const TIME_WAIT_FOR_DOM = 100
// Binding for mouse hovering over an event
const HOVER_EVENT = new MouseEvent('mouseover', {view: window, bubbles: true, cancelable: true})
// Binding for mouse clicking over an event
const CLICK_EVENT = new MouseEvent('click', {view: window, bubbles: true, cancelable: true})
// This is a var so we can change it during runtime if we need to.
var nameToEmoji = {
  'Scott Crossen': 'heart'
}
const getElementID = (name) => {
  switch(nameToEmoji[name]) {
    case 'heart': return '#😍'
    case 'laugh': return '#😆'
    case 'amazed': return '#😮'
    case 'tears': return '#😢'
    case 'angry': return '#😠'
    case 'thumbsdown': return '#👎'
    default: return '#👍'
  }
}
// Decorated regex so we don't have to deal with it's stateful design.
class DecoratedRegex {
  constructor(regex) {
    this.regex = regex
  }
  test(toTest) {
    // For some reason regex's are stateful in JS:
    this.regex.lastIndex = 0
    return toTest.match(this.regex)
  }
}
// Decorate the observer to handle when our system fails.
class DecoratedObserver {
  constructor(toWatch, callback) {
    this.pathToWatch = toWatch
    this.running = false
    this.underlying = new MutationObserver(callback)
  }
  start() {
    if(!this.running) {
      try {
        this.underlying.observe(
          document.querySelector(this.pathToWatch),
          {attributes: false, childList: true, subtree: false}
        )
        this.running = true
      } catch (error) {
        this.running = false
      }
    }
  }
  kill() {
    this.underlying.disconnect()
    this.running = false
  }
  reset() {
    this.kill()
    this.start()
  }
  // Alias this for readability.
  attemptStartIfDisconnected() {
    this.start()
  }
}
// Delay DOM events so they'll actually happen
const delay = (value) => {
  return new Promise((resolve) => {
    setTimeout(resolve(value), TIME_WAIT_FOR_DOM)
  })
}
// Create an observer instance linked to the callback function
var locked = false
const observerCallback = function(mutationsList, observer) {
  if (!locked) {
    return Promise.resolve(() => {locked = true}).then(() => replyWithEmoji()).then(() => {locked = false})
  } else {
    return Promise.resolve()
  }
}
// Observe if the same user sends a message
var observer2 = new DecoratedObserver(LAST_MESSAGE_BUNDLE, observerCallback)
// Observe if a new user sends a message
var observer1 = new DecoratedObserver(WATCH_ROOT, function(mutationsList, observer) {
  observerCallback().then(() => observer2.reset())
})
// Action chain taken when observers triggered.
const replyWithEmoji = () => {
  // Nicknames can change so use image alt text.
  const name = document.querySelector(LAST_PERSON_IMAGE).alt
  // These events need to be delayed so the DOM can respond.
  // 1. Hover over last message
  return Promise.resolve(document.querySelector(LAST_MESSAGE).dispatchEvent(HOVER_EVENT))
  // 2. Wait a little
  .then(delay)
  // 3. Click on emoji button
  .then(document.querySelector(EMOJI_BUTTON).dispatchEvent(CLICK_EVENT))
  // 4. Wait a little
  .then(delay)
  // 5. Get ID of emoji to click on and then click
  .then(document.querySelector(getElementID(name)).dispatchEvent(CLICK_EVENT))
  // 6. Handle DOM errors.
  .catch((error) => {
    console.error(error)
    observer1.kill()
    observer2.kill()
  // It can happen that one observer won't restart on the first try so keep trying if necessary.
  }).then(() => {
    observer1.attemptStartIfDisconnected()
    observer2.attemptStartIfDisconnected()
  })
}
const messengerUrlRegex = new DecoratedRegex(/https:\/\/www\.messenger\.com\/t\/(\S*)/g)
if(messengerUrlRegex.test(window.location.href)) {
  observer1.start()
  observer2.start()
}
