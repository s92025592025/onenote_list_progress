(function (){
	"use strict";

	window.onload = function (){
		var oauth_data = getJSON("oauth2Info.json");

		console.log(oauth_data);

	}

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