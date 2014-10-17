/**
 * Listens for the app launching, then creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.runtime.onInstalled.addListener(function() {
  chrome.windows.create(
    {
      url: 'index.html',
      type: 'popup',
      width: 800,
      height: 600
    }
  );
});
