function newToken(username, password, callback) {
  var credentials = {
    "username": username,
    "password": password
  }
  $.ajax({
    type: "POST",
    url: 'https://api.goquadro.com/v1/login',
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(credentials),
    processData: false,
    dataType: "json",
    success: function(data, status) {
      chrome.storage.sync.set(data, function callLoginCallback() {
        return callback(null, data);
      });
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      callback(errorThrown, null);
    }
  });
}

function loginFail() {
  console.log("Login failed.");
  $('#messagebox').empty();
  $('#messagebox').append('Login failed. Try arain.');
}

function loginSuccess() {
  console.log("Login succeeded.");
  $('#messagebox').empty();
  $('#messagebox').append('Login was successful! You can now safely close this tab.');
  chrome.tabs.getCurrent(function(tab) {
    chrome.tabs.remove(tab.id);
  });
}

$(document).ready(function() {
  $("form").submit(function(event) {
    formdata = $(this).serializeArray();
    newToken(formdata[0].value, formdata[1].value, function(err, data) {
      if (err)
        return loginFail();
      loginSuccess();
    });
    event.preventDefault();
  });
});
