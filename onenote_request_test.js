(function (){
	'use strict';

	const fs = require('file-system');
	const ONENOTE_ROOT = "https://www.onenote.com/api/v1.0/me/notes/";

	window.onload = function (){
		// run the methods
		getAllNoteBooks();
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
					+ "&client_id=" + JSON.parse(fs.readFileSync("oauth2Info.json")).client_id
					+ "&redirect_uri=" + JSON.parse(fs.readFileSync("oauth2Info.json")).redirect_uri
					+ "&refresh_token=" + JSON.parse(fs.readFileSync("token.json")).refresh_token);
	}

	// this will request for all the notebooks the user has
	function getAllNoteBooks () {
		var request = new XMLHttpRequest();
		request.open("GET", ONENOTE_ROOT + "notebooks", false);
		request.setRequestHeader("Authorization", 
				"Bearer " + JSON.parse(fs.readFileSync("token.json")).access_token);
		request.onload = function (){
			if(this.status == 200 || this.status == 0){
				// will be returned as a JSON text
				console.log(JSON.parse(this.responseText));
				// find the notebook I want, then show its section
				for(var i = 0; i < JSON.parse(this.responseText).value.length; i++){
					if(JSON.parse(this.responseText).value[i].name == 'Check Lists'){
						getAllSection(JSON.parse(this.responseText).value[i].id);
					}
				}
			}else if(this.status == 401){
				getAccessToken();
				getAllNoteBooks();
			}else{
				console.log(JSON.parse(this.responseText));
			}
		};

		request.send();
	}

	// get the list of all the sections in a notebook
	function getAllSection (notebookId){
		var request = new XMLHttpRequest();
		request.open("GET", ONENOTE_ROOT + "notebooks/" + notebookId + "/sections", false);
		request.setRequestHeader("Authorization", 
				"Bearer " + JSON.parse(fs.readFileSync("token.json")).access_token);
		request.onload = function (){
			if(this.status == 200 || this.status == 0){
				console.log(JSON.parse(this.responseText));
				for(var i = 0; i < JSON.parse(this.responseText).value.length; i++){
					if(JSON.parse(this.responseText).value[i].name == 'Groceries'){
						getAllPages(JSON.parse(this.responseText).value[i].id);
					}
				}
			}else if(this.status == 401){
				getAccessToken();
				getAllSection(notebookId);
			}else{
				console.log(this.status);
			}
		};

		request.send();
	}

	// get all the pages in the section
	function getAllPages (sectionId){
		var request = new XMLHttpRequest();
		request.open("GET", ONENOTE_ROOT + "sections/" + sectionId + "/pages", false);
		request.setRequestHeader("Authorization", 
				"Bearer " + JSON.parse(fs.readFileSync("token.json")).access_token);
		request.onload = function (){
			if(this.status == 200 || this.status == 0){
				console.log(JSON.parse(this.responseText));
				for(var i = 0; i < JSON.parse(this.responseText).value.length; i++){
					if(JSON.parse(this.responseText).value[i].title == "20161216 Grocery"){
						getPageDetail(JSON.parse(this.responseText).value[i].id);
					}
				}
			}else if(this.status == 401){
				getAccessToken();
				getAllPages(sectionId);
			}else{
				console.log(this.status);
			}
		};

		request.send();
	}

	// get the detailed informarion in the page
	function getPageDetail (pageId){
		var request = new XMLHttpRequest();
		request.open("GET", ONENOTE_ROOT + "pages/" + pageId + "/content?includeIDS=true");
		request.setRequestHeader("Authorization", 
				"Bearer " + JSON.parse(fs.readFileSync("token.json")).access_token);
		request.onload = function (){
			if(this.status == 200 || this.status == 0){
				console.log(this.responseText);
			}else if(this.status == 401){
				getAccessToken();
				getPageDetail(pageId);
			}else{
				console.log(this.status);
			}
		};

		request.send();
	}

	// NOTE: may put the "request" in single call
})();