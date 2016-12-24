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
		var notebook_listDOM = document.getElementById('notebook-track');

		for(var i = 0; i < notebookJson.value.length; i++){
			var doms = sectionLists(notebookJson.value[i].id,
								   	notebookJson.value[i].name,
								  	onenoteJSON('notebooks/' 
								   				+ notebookJson.value[i].id 
								   				+ '/sections'));
			var notebook_list = createFullElement('div', {class: 'panel notebook-list'})
			for(var s = 0; s < doms.length; s++){
				notebook_list.appendChild(doms[s]);
			}
			notebook_listDOM.appendChild(notebook_list);
		}
	}

	// pre: when a notebook is actually in the account
	// post: return a array of dom
	function sectionLists(id, name, sectionJson){
		var panel_heading = createFullElement('div', {class: 'panel-heading'});
		var panel_title = createFullElement('h3', {class: 'panel-title'});
		var a = createFullElement('a', {href: "#" + name.replace(/\s/g, "_"), "data-toggle": 'collapse'});
		var section = createFullElement('div', {id: name.replace(/\s/g, "_"), class: 'sections'});
		var list = createFullElement('ul', {class: 'list list-group'});

		// DOMs in panel-heading
		a.appendChild(createFullElement('span', {class: 'glyphicon glyphicon-book'}));
		a.appendChild(document.createTextNode(" " + name));
		panel_title.appendChild(a);
		panel_heading.appendChild(panel_title);

		// DOMs in section
		for(var i = 0; i < sectionJson.value.length; i++){
			var li = createFullElement('li', {class: 'list-group-item', 
											  id   : sectionJson.value[i].id});
			var span = createFullElement('span', {class: 'glyphicon glyphicon-tag'});
			var div = document.createElement('div');
			var radioBtn = createFullElement('input', {type : 'radio', 
											 		   name : 'today',
													   value: sectionJson.value[i].id});
			var checkBox = createFullElement('input', {type : 'checkbox',
													 name : 'track',
													 value: sectionJson.value[i].id});
			// DOMs in li > div
			div.appendChild(radioBtn);
			div.appendChild(document.createTextNode("Today "));
			div.appendChild(checkBox);
			div.appendChild(document.createTextNode("Track"))

			// DOMs in li
			li.appendChild(span);
			li.appendChild(document.createTextNode(sectionJson.value[i].name));
			li.appendChild(div);

			// DOMs in ul
			list.appendChild(li);
		}

		// DOMs in section
		section.appendChild(list);

		return [panel_heading, section];
	}

	// pre: when needed to create a HTML element
	// post: create a HTML DOM of tag, and set up attribute mentioned,
	//		 in attr(js object)
	function createFullElement(tag, attr){
		var dom = document.createElement(tag);

		for(var key in attr){
			if(attr.hasOwnProperty(key)){
				dom.setAttribute(key, attr[key]);
			}
		}

		return dom;
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