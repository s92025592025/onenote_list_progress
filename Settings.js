(function (){
	'use strict';

	const {dialog} = require('electron').remote;
	const fs = require('file-system');
	const originalFs = require('original-fs');
	const remote = require('electron').remote;
	const ONENOTE_ROOT = 'https://www.onenote.com/api/v1.0/me/notes/';

	window.onload = function (){
		loadNotebookList();
		for(var i = 0; i < document.querySelectorAll('#refresh-time option').length; i++){
			if(document.querySelectorAll('#refresh-time option')[i].value 
				== JSON.parse(originalFs.readFileSync(__dirname + '/notebooks.json')).refresh_time){
				document.querySelectorAll('#refresh-time option')[i].setAttribute('selected', 'selected');
			}
		}
		document.getElementById('apply').onclick = getSettings;
		document.getElementById('cancel').onclick = function (){
			remote.getCurrentWindow().close();
		};
		document.getElementById('comfirm').onclick = function (){
			getSettings();
			remote.getCurrentWindow().close();
		};
	};

	window.onbeforeunload = function (e){
		if(!JSON.parse(originalFs.readFileSync(__dirname + '/notebooks.json')).today_progress.trim()){
			dialog.showMessageBox(remote.getCurrentWindow(), {title: "Oops!", buttons:[], type: "warning", 
							      message: "Please at least select one for today"});
		}
	};

	// pre: when the user pressed 'comfirm' or 'apply'
	// post: will save the user configured settings in
	//		 notebooks.json
	function getSettings (){
		var todays = document.querySelectorAll('input[name="today"]');
		var tracks = document.querySelectorAll('input[name="track"]');
		var refresh_times = document.querySelectorAll('#refresh-time option')
		var trackIds = [];

		var settings = JSON.parse(originalFs.readFileSync(__dirname + "/notebooks.json"));

		for(var i = 0; i < todays.length; i++){
			if(todays[i].checked){
				settings.today_progress = todays[i].value;
			}

			if(tracks[i].checked){
				trackIds.push(tracks[i].value);
			}
		}

		for(var i = 0; i < refresh_times.length; i++){
			if(refresh_times[i].selected){
				settings.refresh_time = refresh_times[i].value;
			}
		}

		settings.misc_progress = trackIds;

		originalFs.writeFileSync(__dirname + "/notebooks.json", JSON.stringify(settings));
	}

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

	// pre: should pass in the notebook id as id, notebook name as name
	//		and the json of all section details in the notebook
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
			// refer to past selected config
			if(JSON.parse(originalFs.readFileSync(__dirname + "/notebooks.json")).today_progress == sectionJson.value[i].id){
				radioBtn.setAttribute("checked", "checked");
			}

			if(JSON.parse(originalFs.readFileSync(__dirname + "/notebooks.json")).misc_progress.includes(sectionJson.value[i].id)){
				checkBox.setAttribute("checked", "checked");
			}

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
	//		section data only, and shoudl pass in the path that specified
	//		in onenote api
	// post: return the lists of notebook and section in JSON format
	function onenoteJSON (path){
		var json = '';
		var request = new XMLHttpRequest();
		request.open("GET", ONENOTE_ROOT + path, false);
		console.log('tag1');
		request.setRequestHeader("Authorization", 
				"Bearer " + JSON.parse(originalFs.readFileSync(__dirname + "/token.json")).access_token);
		console.log('tag2');
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
				originalFs.writeFileSync(__dirname + "/token.json", this.responseText);
			}else{
				console.log(this.status);
			}
		};

		request.send("grant_type=refresh_token"
					+ "&client_id=" + JSON.parse(fs.readFileSync(__dirname + "/oauth2Info.json")).client_id
					+ "&redirect_uri=" + JSON.parse(fs.readFileSync(__dirname + "/oauth2Info.json")).redirect_uri
					+ "&refresh_token=" + JSON.parse(originalFs.readFileSync(__dirname + "/token.json")).refresh_token);
	}
})();