(function(){

  chrome.runtime.onMessage.addListener(function(message,sender,sendResponse) {
    console.log('CS:fromeventpage:',message);
    if (message.type==='accesstoken') {
      console.log('CS:received accesstoken');
      document.dispatchEvent(
        new CustomEvent('fromeventpage', {detail:message})
      );
    }
    sendResponse('received, thanks');
  });

  // relay all messages to event page
  document.addEventListener('toeventpage',function(e) {
    var message = {
      type: e.detail.type,
      data: e.detail.data
    };
    console.log('CS:toeventpage:',message);
    chrome.runtime.sendMessage(message);
  });

})();
