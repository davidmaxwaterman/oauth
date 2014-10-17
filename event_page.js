/**
 * Listens for the app launching, then creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.runtime.onInstalled.addListener(function() {
  chrome.identity.getAuthToken({'interactive': true}, function(token) {
    console.log(token);
  });
});
