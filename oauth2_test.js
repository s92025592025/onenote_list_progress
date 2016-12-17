(function (){
	"use strict";

	window.onload = function (){
		var oauth_data = getJSON("oauth2Info.json");

		console.log(oauth_data);

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