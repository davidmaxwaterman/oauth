(function(){

  // just relay messages between web app and background page
  chrome.runtime.onMessage.addListener(function(message,sender,sendResponse) {
    document.dispatchEvent(
      new CustomEvent('fromeventpage', {detail:message})
    );
    sendResponse('received, thanks');
  });

  // relay all messages to event page
  document.addEventListener('toeventpage',function(e) {
    var message = e.detail;
    chrome.runtime.sendMessage(message);
  });

})();
