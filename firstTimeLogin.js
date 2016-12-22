(function (){
	'use strict';
	 const fs = require('file-system');
	 const {BrowserWindow} = require('electron').remote;

	 window.onload = function (){
	 	document.getElementById("login").onclick = startLoginProcess;
	 };

	 // pre: when the user clicked the login button
	 // post: send the user to authentication page
	 function startLoginProcess (){
	 	var authWin = new BrowserWindow({width: 800, 
	 									 height: 600, 
	 									 frame: false,
	 									 resizable: false,
	 									 alwaysOnTop: true,
	 									 show: false});

	 	authWin.loadURL("https://login.live.com/oauth20_authorize.srf"
	 					+ "?response_type=code"
	 					+ "&client_id=" + JSON.parse(fs.readFileSync("oauth2Info.json")).client_id
	 					+ "&redirect_uri=" + JSON.parse(fs.readFileSync("oauth2Info.json")).redirect_uri
	 					+ "&scope=" + JSON.parse(fs.readFileSync("oauth2Info.json")).scope);

	 	authWin.show();

	 	// pre: when the authWin has navigated to other pages
	 	// post: analysis the passed url to find code for further authorization
	 	function filterURL (url){
	 		var codeRex = /code=[0-9a-zA-Z\-]+/;
	 		console.log(codeRex.test(url));
	 		if(codeRex.test(url)){
	 			// start authentication process
	 			console.log(codeRex.exec(url)[0]);
	 			getTokenInfo(codeRex.exec(url)[0], authWin);
	 		}
	 	}

	 	// when the auth page has changed location
	 	authWin.webContents.on('did-navigate', function (e, url){
	 		// filter the url
	 		filterURL(url);
	 	});

	 	// when the authWin is closed, clean authWin
	 	authWin.on('closed', function (){
	 		authWin = null;
	 	});
	 }

	 // pre: should be processed after code was received
	 // post: get token, save as json, and guide user to next step
	 function getTokenInfo (code, authWin){
	 	var request = new XMLHttpRequest();
	 	request.open("POST", "https://login.live.com/oauth20_token.srf", false);
	 	request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	 	request.onreadystatechange = function (){
	 		console.log(this.status);
	 	};
	 	request.onload = function (){
	 		// save the json file to token.json if there is no connection
	 		// error
	 		if(this.status == 200 || this.status == 0){
	 			fs.writeFile("token.json", this.responseText, function (e){
	 				if(e){
	 					console.log(e);
	 				}
	 			});
	 			// close auth window
	 			authWin.destroy();
	 			// find the title of the page that should be redirect after authentication
	 			for(var i = 0; i < BrowserWindow.getAllWindows(); i++){
	 				if(BrowserWindow.getAllWindows()[i].webContents.getTitle().trim().toUpperCase()
	 					== 'Login Onenote'.toUpperCase()){
	 					BrowserWindow.getAllWindows()[i].loadURL('file:///index.html');
	 				}
	 			}
	 		}else{
	 			console.log(JSON.parse(this.responseText));
	 		}
	 	};

	 	request.send("grant_type=authorization_code"
	 				+ "&client_id=" + JSON.parse(fs.readFileSync("oauth2Info.json")).client_id
	 				+ "&" + code
	 				+ "&redirect_uri=" + JSON.parse(fs.readFileSync("oauth2Info.json")).redirect_uri);
	 }
})();