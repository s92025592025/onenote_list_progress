(function (){
	'use strict';

	const fs = require('file-system');
	const ONENOTE_ROOT = 'https://www.onenote.com/api/v1.0/me/notes/';

	window.onload = function (){
		loadNotebookList();
	};

	// pre: when the Settings.html is fully loaded
	// post: display a list of notebooks and their sections under "Notebooks to Track"
	//		 section
	function loadNotebookList() {
		var notebookJson = onenoteJSON("notebooks");
		var notebook_listDOM = document.getElementById('notebook-list');

		for(var i = 0; i < notebookJson.value.length; i++){
			var doms = sectionLists(notebookJson.value[i].id,
								   	notebookJson.value[i].name,
								  	onenoteJSON('notebooks/' 
								   				+ notebookJson.value[i].id 
								   				+ '/sections'));
			for(var s = 0; s < doms.length; s++){
				notebook_listDOM.append(doms[i]);
			}
		}
	}

	// pre: when a notebook is actually in the account
	// post: return a array of dom
	function sectionLists(id, name, sectionJson){
		var panel_heading = document.createElement('div');
		var panel_title = document.createElement('h3');
		var a = document.createElement('a');
		var section = document.createElement('div');
		var list = document.createElement('ul');

		// next step, input the attributes
	}

	// pre: when have token, and trying to request for notebook and
	//		section data only
	// post: return the lists of notebook and section in JSON format
	function onenoteJSON (path){
		var json = '';
		var request = new XMLHttpRequest();
		request.open("GET", ONENOTE_ROOT + path, false);
		request.setRequestHeader("Authorization", 
				"Bearer " + JSON.parse(fs.readFileSync("token.json")).access_token);
		request.onload = function (){
			if(this.status == 200 || this.status == 0){
				json = JSON.parse(this.responseText);
			}else if(this.status == 401){
				getAccessToken();
				json = onenoteJSON(path);
			}else{
				console.log(this.status);
				console.log(JSON.parse(this.responseText));
			}
		};

		request.send();

		return json;
	}

	// pre: when any request returns a 401 unauthorize
	// post: gets a new access token by refresh token
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
					+ "&client_id=" + JSON.parse(fs.readFileSync("oauth2Info.json")).client_id
					+ "&redirect_uri=" + JSON.parse(fs.readFileSync("oauth2Info.json")).redirect_uri
					+ "&refresh_token=" + JSON.parse(fs.readFileSync("token.json")).refresh_token);
	}
})();