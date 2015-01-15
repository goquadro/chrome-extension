Date.prototype.addHours = function(h) {
	this.setHours(this.getHours() + h);
	return this;
}

var apiEndpoint = 'https://api.goquadro.com/v1';
var meExpirationHours = 2;

var worker = {
	loginPage: function() {
		chrome.tabs.create({
			url: "popup.html"
		});
	},
	getToken: function(callback) {
		chrome.storage.sync.get('gqtoken', function(gqtoken) {
			if ($.isEmptyObject(gqtoken)) {
				worker.loginPage();
				return callback("Token not found", null);
			}
			return callback(null, gqtoken);
		});
	},
	refreshMe: function(callback) {
		worker.getToken(function(err, gqtoken) {
			if (err)
				return callback(err, null);
			$.ajax({
				type: "GET",
				url: apiEndpoint + '/me',
				headers: gqtoken,
				contentType: "application/json; charset=utf-8",
				processData: false,
				dataType: "json",
				success: function(data, status) {
					data.expires = Date.now().addHours(meExpirationHours);
					if (data.userID == "") {
						return callback("Invalid token", data);
					}
					chrome.storage.local.set({
						gqme: data
					}, function() {
						return callback(null, data);
					});
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					console.log("GET /me FAILED.");
					console.log("textStatus:", textStatus);
					console.log("errorThrown:", errorThrown);
					return callback(errorThrown, null);
				}
			});
		});
	},
	getMe: function(callback) {
		chrome.storage.local.get('gqme', function(me) {
			if ($.isEmptyObject(me) || me.expires < Date.now()) {
				worker.refreshMe(function(err, newMe) {
					return callback(err, newMe);
				});
			}
			return callback(null, me);
		});
	},
	loginPage: function() {
		chrome.tabs.create({
			url: "popup.html"
		});
	},
	push: function(tab, callback) {
		worker.getToken(function(err, gqtoken) {
			if (err)
				return callback(err, null);
			$.ajax({
				type: "POST",
				url: apiEndpoint + "/me/documents",
				headers: gqtoken,
				contentType: "application/json; charset=utf-8",
				data: JSON.stringify(tab),
				processData: false,
				success: function(data, status) {
					return callback(null, data);
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					return callback(errorThrown, textStatus);
				}
			});
		});
	},
	clearSyncStorage: function() {
		chrome.storage.sync.clear();
	}
}

chrome.browserAction.onClicked.addListener(function(tab) {
	var activeTab = {
		active: true,
		currentWindow: true
	}
	chrome.tabs.query(activeTab, function(tab) {
		worker.push(tab[0], function(err, data) {
			if (err)
				return console.log("Push failed:", err);
			console.log("Push successful");
		});
	})
});
