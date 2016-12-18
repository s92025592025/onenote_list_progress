(function (){
	"use strict";

	// must put "remote" behind require in order to work in 
	// renderer(non-main) process
	const {BrowserWindow} = require('electron').remote;

	window.onload = function (){
		var oauth_data = getJSON("oauth2Info.json");

		authPage();
	}


	// pre: file should be a local json file path in String
	// post: returns a json object from the file
	function getJSON (file){
		var json_file = new XMLHttpRequest();
		var json_data = "";
		json_file.onload = function (){
			json_data = JSON.parse(this.responseText);
		}
		json_file.open("GET", file, false);
		json_file.send();

		return json_data;
	}

	// should be showing the authentication window and allow user to login
	function authPage (){
		// create new window to show authentication login
		var authWin = new BrowserWindow({width: 800, height: 600, show: false,
						'node-integration': false, alwaysOnTop: true, frame: false});

		authWin.loadURL("https://login.live.com/oauth20_authorize.srf"
						+ "?response_type=code"
						+ "&client_id=" + getJSON("oauth2Info.json").client_id
						+ "&redirect_uri=https://login.live.com/oauth20_desktop.srf"
						+ "&scope=office.onenote%20wl.signin%20wl.offline_access");
		authWin.show();

		// pre: url should be the url that the authWin has navigated to
		// post: process the input url, find token or error returned in the
		// 		 url
		function authHandler(url){
			var authReg = /^https:\/\/login\.live\.com\/oauth20_desktop\.srf\?code=\S+$/;
			var codeReg = /code=\S+/;
			if(authReg.test(url)){
				console.log(url);
				console.log(codeReg.exec(url));
				authWin.destroy();
			}
		}

		authWin.webContents.on('did-navigate', function (e, url){
			authHandler(url);
		});
	}
})();