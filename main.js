
  /* google apis - can specify scope in the first parameter, or just use the ones in the manifest
  chrome.identity.getAuthToken({'interactive': true}, function(token) {
    console.log(token);
  });
  */

var tokenFetcher = chrome.extension.getBackgroundPage().tokenFetcher;
var access_token = chrome.extension.getBackgroundPage().access_token;

var gh = (function() {
  'use strict';

  var signin_button;
  // var revoke_button;
  // var user_info_div;
  var User = {
    id:'',
    firstname:'',
    familyname:'',
    email:''
  };

  function xhrWithAuth(method, url, interactive, callback) {
    var retry = true;
    getToken();

    function getToken() {
      tokenFetcher.getToken(interactive, function(error, token) {
        if (error) {
          callback(error);
          return;
        }
        access_token = token;
        requestStart();
      });
    }

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      xhr.send();
    }

    function requestComplete() {
      if (this.status != 200 && retry) {
        retry = false;
        tokenFetcher.removeCachedToken(access_token);
        access_token = null;
        getToken();
      } else {
        callback(null, this.status, this.response);
      }
    }
  }

  function getAlbum(interactive,album) {
    xhrWithAuth('GET',
                'https://graph.facebook.com/v2.1/'+album.id+'/photos?access_token='+access_token,
                interactive,
                onAlbumFetched);
  }

  function getAlbums(interactive) {
    xhrWithAuth('GET',
                'https://graph.facebook.com/v2.1/me/albums?access_token='+access_token,
                interactive,
                onAlbumsFetched);
  }

  function getUserInfo(interactive) {
    xhrWithAuth('GET',
                'https://graph.facebook.com/me?access_token='+access_token,
                interactive,
                onUserInfoFetched);
  }

  // Functions updating the User Interface:

  function showButton(button) {
    button.style.display = 'inline';
    button.disabled = false;
  }

  function hideButton(button) {
    button.style.display = 'none';
  }

  function disableButton(button) {
    button.disabled = true;
  }


  function onAlbumFetched(error, status, response) {
    if (!error && status == 200) {
      var album = JSON.parse(response);
      console.log('album:',album);
      for(var i=0;i<album.data.length;i++) {
        var thisImage=album.data[i].images[0].source
        var img=document.createElement('img');
        img.src=thisImage;
        document.querySelector('body').appendChild(img);
      }
    } else {
      showButton(signin_button);
    }
  }

  function onAlbumsFetched(error, status, response) {
    if (!error && status == 200) {
      var albums = JSON.parse(response);
      for(var i=0;i<albums.data.length;i++) {
        var album=albums.data[i];
        getAlbum(true,album);
      }
      console.log('albums:',albums);
    } else {
      showButton(signin_button);
    }
  }

  function onUserInfoFetched(error, status, response) {
    if (!error && status == 200) {
      var user_info = JSON.parse(response);
      // console.log("Got the following user info: " + response);
      User.id = user_info.id;
      User.firstname = user_info.first_name;
      User.familyname = user_info.last_name;
      User.email = user_info.email;
      console.log(User);
      document.getElementById('user_info').innerHTML = 
      "<b>Hello " + User.firstname + " " + User.familyname + "</b><br>"
            + "Your email is: " + User.email + "</b><br>" + 
            "Link to your Facebook page is:" + user_info.link;
      hideButton(signin_button);
      showButton(document.querySelector('#getalbums'));
    } else {
      showButton(signin_button);
    }
  }

  function interactiveSignIn() {
    disableButton(signin_button);
    tokenFetcher.getToken(true, function(error, access_token) {
      if (error) {
        showButton(signin_button);
        console.log(error);
      } else {
        getUserInfo(true);
      }
    });
  }

  // function revokeToken() {
    // We are opening the web page that allows user to revoke their token.
    // window.open('https://github.com/settings/applications');
    // user_info_div.textContent = '';
    // hideButton(revoke_button);
    // showButton(signin_button);
  // }

  return {
    onload: function () {
      signin_button = document.querySelector('#signin');
      signin_button.onclick = interactiveSignIn;
      document.querySelector('#getalbums').addEventListener('click',function() {
        getAlbums(true);
      });

      // revoke_button = document.querySelector('#revoke');
      // revoke_button.onclick = revokeToken;
      // user_info_div = document.getElementById('user_info');
      // console.log(signin_button, revoke_button, user_info_div);
      showButton(signin_button);
      // getUserInfo(false);
    }
  };
})();

window.onload = gh.onload;
