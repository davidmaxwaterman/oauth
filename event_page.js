/**
 * Listens for the app launching, then creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */

// Listens for the app launching then creates the window
chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined,function() {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
              urlEquals: 'http://localhost:8000/index.html'
            }
          })
        ],
        actions: [ new chrome.declarativeContent.ShowPageAction() ]
      }
    ]);
  });
});

chrome.pageAction.onClicked.addListener(function(tab) {
  if (tab.url.indexOf('chrome-devtools://') === -1 ) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.executeScript(null, {file: "rehostPage.js"}, function(result) {
        if (chrome.runtime.lastError) {
          console.log('EP:error executing content script:',chrome.runtime.lastError.message);
        }
      });
    });
  }
});

chrome.runtime.onMessage.addListener(function(message,sender) {
  switch (message.type) {
    case 'gettoken':
      var service = message.data.service;
      switch (service) {
        case 'facebook':
          getToken(true);
          break;
        case 'google':
          break;
        default:
          console.log(new Error('EP:gettoken:unknown service'));
          break;
      }
      break;
    case ('removecachedtoken'):
      var token = message.data.token;
      break;
  }
});

var access_token;

var clientId = $CLIENT_ID
var clientSecret = $CLIENT_SECRET;
var redirectUri = 'https://' + chrome.runtime.id +
                  '.chromiumapp.org/provider_cb';
var redirectRe = new RegExp(redirectUri + '[#\?](.*)');
access_token = null;

function getToken (interactive) {
  // In case we already have an access_token cached, simply return it.
  if (access_token) {
    setAccessToken(access_token);
    return;
  }

  var options = {
    'interactive': interactive,
    // url:'https://graph.facebook.com/oauth/access_token?client_id=' + clientId +
    url:'https://www.facebook.com/dialog/oauth?' +
        'client_id=' + clientId +
        '&response_type=token' +
        '&access_type=online' +
        '&scope=' + ['user_photos','public_profile'].join(',') +
        '&redirect_uri=' + encodeURIComponent(redirectUri)
  }

  chrome.identity.launchWebAuthFlow(options, function(redirectUri) {
    if (chrome.runtime.lastError) {
      console.log(new Error(chrome.runtime.lastError.message));
      return;
    }

    // Upon success the response is appended to redirectUri, e.g.
    // https://{app_id}.chromiumapp.org/provider_cb#access_token={value}
    //     &refresh_token={value}
    // or:
    // https://{app_id}.chromiumapp.org/provider_cb#code={value}
    var matches = redirectUri.match(redirectRe);
    if (matches && matches.length > 1)
      handleProviderResponse(parseRedirectFragment(matches[1]));
    else
      console.log(new Error('Invalid redirect URI'));
  });

  function parseRedirectFragment (fragment) {
    var pairs = fragment.split(/&/);
    var values = {};

    pairs.forEach(function(pair) {
      var nameval = pair.split(/=/);
      values[nameval[0].replace(/^#/,'')] = nameval[1];
    });

    return values;
  }

  function handleProviderResponse (values) {
    if (values.hasOwnProperty('access_token'))
      setAccessToken(values.access_token);
    else if (values.hasOwnProperty('code'))
      exchangeCodeForToken(values.code);
    else console.log(new Error('Neither access_token nor code avialable.'));
  };

  function exchangeCodeForToken (code) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET',
             // 'https://www.facebook.com/dialog/oauth?'+
             'https://graph.facebook.com/content-push/access_token?' +
             'client_id=' + clientId +
             '&client_secret=' + clientSecret +
             '&redirect_uri=' + redirectUri +
             '&code=' + code);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onload = function () {
      if (this.status === 200) {
        var response = JSON.parse('"'+this.responseText+'"');
        response = response.substring(0,response.indexOf('&'));
        setAccessToken(response);
        access_token = response;
      }
    };
    xhr.send();
  };

  function setAccessToken (token) {
    access_token = token;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var message = {
        type:'accesstoken',
        data: {
          token:token
        }
      };
      console.log('EP:sending message:',message);
      chrome.tabs.sendMessage(tabs[0].id, message,
        function(response) {
          console.log(response);
        }
      );
    });
  };
};

var removeCachedToken = function (token_to_remove) {
  if (access_token == token_to_remove)
    access_token = null;
};
