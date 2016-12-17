(function (){
	"use strict";

	window.onload = function (){
		var oauth_data = getJSON("oauth2Info.json");

		// probable solution for authentication: http://manos.im/blog/electron-oauth-with-github/

		window.location = "https://login.live.com/oauth20_authorize.srf"
							+ "?response_type=code"
							+ "&client_id=" + oauth_data.client_id
							+ "&redirect_uri=file://index.html"
							+ "&scope=office.onenote%20wl.signin%20wl.offline_access";
		/*
		var request = new XMLHttpRequest();
		request.onload = function (){
			console.log(this.responseText);
			console.log("finished");
		}

		request.onreadystatechange = function (){
			console.log(this.status);
		}

		request.open("GET", "https://login.live.com/oauth20_authorize.srf"
							+ "?response_type=code"
							+ "&client_id=" + oauth_data.client_id
							+ "&redirect_uri=https://login.live.com/oauth20_desktop.srf"
							+ "&scope=office.onenote%20wl.signin%20wl.offline_access"
							, false);

		request.send();
		*/
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
})();