/*
	Menu reference: http://electron.atom.io/docs/api/menu
*/

(function (){
	'use strict';

	const {BrowserWindow} = require('electron').remote;
	const fs = require('file-system');
	const ProgressBar = require('progressbar.js');
	const ONENOTE_ROOT = 'https://www.onenote.com/api/v1.0/me/notes/';

	window.onload = function (){
		if(!JSON.parse(fs.readFileSync('notebooks.json')).today_progress){
			// show settings page
			var settingWin = new BrowserWindow({width: 600, height: 800, maximizable: false,
        	                                    minimizable: false, darkTheme: true, show: false});
		    var loadingWin = new BrowserWindow({width: 300, height:100, maximizable: false,
		                                        minimizable: false, frame: false, alwaysOnTop: true});
		    loadingWin.loadURL('file:///loading.html');
		    settingWin.setMenu(null);
		    settingWin.loadURL("file:///Settings.html");
		    settingWin.webContents.openDevTools();

		    settingWin.on('ready-to-show', function (){
		      loadingWin.close();
		      settingWin.show();
		      loadingWin = null;
		    });

		    settingWin.on('closed', function (){
		      settingWin = null;
		    });
		}else{
			showToday();
		}
	};

	// pre: when user do have a section to store the checklist for today,
	//		the page title should contain only data in any format
	// post: create a new task bar
	function showToday(){
		var todayProgress = new ProgressBar.Circle('#today_progressbar', {
			color: '#aaa',
			trailColor: '#9D9E9E',
			strokeWidth: 8,
			trailWidth: 1,
			easing: 'easeInOut',
			duration: 1400,
			text: {
				autoStyleContainer: false
			},
			from: {color: '#94D0FF', width: 2},
			to: {color: '#008FFF', width: 8},
			step: function (state, circle){
				circle.path.setAttribute('stroke', state.color);
    			circle.path.setAttribute('stroke-width', state.width);
    			circle.setText(Math.round(circle.value() * 1000) / 10 + "%");
			}
		});

		todayProgress.text.style.fontFamily = 'Helvetica, sans-serif';
		todayProgress.text.style.fontSize = '60pt';
		todayProgress.animate(0.0);

		onenoteRequest('sections/' 
						+ JSON.parse(fs.readFileSync('notebooks.json')).today_progress
						+ "/pages", updateProgress);

		function updateProgress(sectionPages, progressBar = todayProgress){
			for(var i = 0; i < JSON.parse(sectionPages).value.length; i++){
				if(Date.parse(JSON.parse(sectionPages).value[i].title) 
					&& (new Date(JSON.parse(sectionPages).value[i].title)) - (new Date("2016/12/07")) 
						<= (1000 * 60 * 60 * 24)){
					onenoteRequest('pages/' + JSON.parse(sectionPages).value[i].id, function (content) {
						var parser = new DOMParser();
						var dom = parser.parseFromString(content, 'text/html');
						progressBar.animate(dom.querySelectorAll('p["data-tag"="to-do:complete"]').length 
											/ (dom.querySelectorAll('p["data-tag"="to-do"]').length 
												+ dom.querySelectorAll('p["data-tag"="to-do:complete"]').length));
					});
				}
			}
		}
	}

	// pre: the sections the user specified to be tracked, title needs to
	// 		have any date format in []
	// post: show a list of progress in a linear progress bar
	function showMisc(json){}

	// pre: path should only vaild request path specifed in onenote api,
	//		should also pass in a funciton as nextStep that will be executed
	//		onload, the function should all take only a json as parameter
	// post: execute specifed process
	function onenoteRequest(path, nextStep){
		var request = new XMLHttpRequest();
		request.open("GET", ONENOTE_ROOT + path, true);
		request.setRequestHeader("Authorization", 
				"Bearer " + JSON.parse(fs.readFileSync("token.json")).access_token);

		request.onload = function (){
			if(this.status == 200 || this.status == 0){
				nextStep(this.responseText);
			}else if(this.status = 401){
				getNewAccess(path, nextStep);
			}else{
				console.log(this.status);
				console.log(JSON.parse(this.responseText));
			}
		}

		request.send();
	}

	// pre: when the access token has expired. Should pass in the path to later
	//		re-request and the function to nextStep for post request action
	// post: will get a new token and re-execute previous onenoteRequest
	function getNewAccess(path, nextStep){
		var request = new XMLHttpRequest();
		request.open("POST", "https://login.live.com/oauth20_token.srf", true);
		request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		request.onload = function (){
			if(this.status == 200 || this.status == 0){
				fs.writeFileSync('token.json', this.responseText);
				onenoteRequest(path, nextStep);
			}else{
				console.log(this.status);
				console.log(JSON.parse(this.responseText));
			}
		};

		request.send("grant_type=refresh_token"
					+ "&client_id=" + JSON.parse(fs.readFileSync("oauth2Info.json")).client_id
					+ "&redirect_uri=" + JSON.parse(fs.readFileSync("oauth2Info.json")).redirect_uri
					+ "&refresh_token=" + JSON.parse(fs.readFileSync("token.json")).refresh_token);
	}
})();