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

		// clean authWin object when the window is closed
		authWin.on('closed', function (){
			authWin = null;
		});

		// get the url whenever the page is changed
		authWin.webContents.on('did-navigate', function (e, url){
			authHandler(url);
		});
	}

	// pre: code should be obtained from authPage()
	// post: get the access and refresh token json file and save it
	function getAccessToken(code){
		var request = new XMLHttpRequest();

		request.open("POST", "https://login.live.com/oauth20_token.srf");
		request.onreadystatechange = function (){
			console.log(this.status);
		}
		request.onload = function (){
			
		}

		request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		request.send("grant_type=authorization_code"
					+ "&client_id=" + getJSON("oauth2Info.json").client_id
					+ "&client_secret=" + getJSON("oauth2Info.json").client_secret
					+ "&" + code
					+ "&redirect_uri=" + getJSON("oauth2Info.json").redirect_uri);

	}

})();