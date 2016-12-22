(function (){
	'use strict';

	const fs = require('file-system');

	window.onload = function (){
		// run the methods
	}

	// pre: whenever the api request gave a 401 status
	// post: request a new access token by refresh token
	function getAccessToken (){
		var request = new XMLHttpRequest();
		request.open("POST", "https://login.live.com/oauth20_token.srf", false);
		request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		request.onload = function() {
			if(this.status == 200 || this.status == 0){
				fs.writeFileSync("token.json", this.responseText);
			}else{
				console.log(this.status);
			}
		};

		request.send("grant_type=refresh_token"
					+ "&client_id=" + JSON.parse(fs.readFileSync("oauth20_token.json")).client_id
					+ "&redirect_uri=" + JSON.parse(fs.readFileSync("oauth20_token.json")).redirect_uri
					+ "&refresh_token=" + JSON.parse(fs.readFileSync("token.json")).refresh_token);
	}

	// this will request for all the notebooks the user has
	function getAllNoteBooks () {
		var request = new XMLHttpRequest();
		request.open("GET", "", false);
	}
})();