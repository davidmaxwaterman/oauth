(function(){

  // just relay messages between web app and background page
  chrome.runtime.onMessage.addListener(function(message,sender,sendResponse) {
    document.dispatchEvent(
      new CustomEvent('fromeventpage', {detail:message})
    );
    sendResponse('received, thanks');
  });

})();
