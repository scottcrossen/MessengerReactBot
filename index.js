/**
 * This script can be used to monitor a facebook message chat and react to
 * incoming messages according to the schema provided.
 *
 * The easiest way to deploy this is to open up a chrome debugger and paste
 * it into the console.
 *
 * @author Scott Leland Crossen
 */
const WATCH_ROOT = 'body > div:nth-child(1) > div > div > div._1t2u > span:nth-child(2) > div._20bp > div._4_j4 > div._4u-c._1wfr._9hq > div._5f0v.uiScrollableArea.fade > div:nth-child(2) > div > div > div > div:nth-child(3)'
const COMMON_ROOT = WATCH_ROOT + ' > div:last-child > div'
const LAST_MESSAGE_BUNDLE = COMMON_ROOT + ' > div._41ud'
const LAST_MESSAGE = LAST_MESSAGE_BUNDLE + ' > div:last-child'
const LAST_PERSON_URL = COMMON_ROOT + ' > div._1t_q > a'
const LAST_PERSON_NICKNAME = COMMON_ROOT + ' > div._41ud > h5'
const EMOJI_BUTTON = LAST_MESSAGE + ' > div > span > span > span._5zvq'
// For some reason regex's are stateful here:
const messengerUrlRegex = /https:\/\/www\.messenger\.com\/t\/(\S*)/g
const TIME_WAIT_FOR_DOM = 100
// Binding for mouse hovering over an event
const HOVER_EVENT = new MouseEvent('mouseover', {
  view: window,
  bubbles: true,
  cancelable: true
})
// Binding for mouse clicking over an event
const CLICK_EVENT = new MouseEvent('click', {
  view: window,
  bubbles: true,
  cancelable: true
})
/*
  **** Table of Emoji IDs ****
  heart-eyes: #😍
  laughing: #😆
  amazed: #😮
  tears: #😢
  angry: #😠
  thumbs-up: #👍
  thumbs-down: #👎
*/
const nameToEmoji = {
  'scottcrossen42': 'heart'
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
const delay = (value) => {
  return new Promise((resolve) => {
    setTimeout(resolve.bind(null, value), TIME_WAIT_FOR_DOM)
  })
}
const replyWithEmoji = () => {
  /* A person's name can be extracted from the profile link. Nicknames can be
    changed so we'll use the individual's chat link to extract the username.
    If we're in a private chat use the URL cause it's not listed in divs
  */
  const personChatLocation = document.querySelector(LAST_PERSON_URL) || window.location
  messengerUrlRegex.lastIndex = 0
  const name = messengerUrlRegex.exec(personChatLocation.href)[1]
  /*
    Alternatively we could have used nicknames:
    document.querySelector(LAST_PERSON_NICKNAME).getAttribute('aria-label')
  */
  // These events need to be delayed so the DOM can respond.
  new Promise((resolve) => resolve(
    // Hover over last message
    document.querySelector(LAST_MESSAGE).dispatchEvent(HOVER_EVENT)
  )).then(() => delay(
    // Click on emoji button
    document.querySelector(EMOJI_BUTTON).dispatchEvent(CLICK_EVENT)
  )).then(() => delay(
    // Get ID of emoji to click on and then click
    document.querySelector(getElementID(name)).dispatchEvent(CLICK_EVENT)
  ))
}
// Only execute on messenger.com
messengerUrlRegex.lastIndex = 0
if(window.location.href.match(messengerUrlRegex)) {
  // Watch this node for additional children
  var locked = false
  // Create an observer instance linked to the callback function
  var observer = new MutationObserver(function(mutationsList, observer) {
    if (!locked) {
      lock = true
      replyWithEmoji()
      lock = false
    }
  })
  // Observe if a new user sends a message
  observer.observe(document.querySelector(WATCH_ROOT), {attributes: false, childList: true, subtree: false})
  // Observe if the same user sends a message
  observer.observe(document.querySelector(LAST_MESSAGE_BUNDLE), {attributes: false, childList: true, subtree: false})
}
