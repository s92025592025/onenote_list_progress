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
			//showToday();
			showMisc();
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
						+ "/pages"
						+ '?filter=lastModifiedTime%20ge%20'
						+ new Date().getFullYear() + '-' + (new Date().getMonth() + 11) % 12 + '-' + 29
						, updateProgress);

		var timer;

		timer = setInterval(function (){
			onenoteRequest('sections/' 
						+ JSON.parse(fs.readFileSync('notebooks.json')).today_progress
						+ "/pages", updateProgress);
			}, JSON.parse(fs.readFileSync('notebooks.json').refresh_time * 60 * 1000));

		function updateProgress(sectionPages, progressBar = todayProgress){
			var flag = true;
			for(var i = 0; i < JSON.parse(sectionPages).value.length; i++){
				if(Date.parse(JSON.parse(sectionPages).value[i].title) 
					&& Math.abs(new Date(JSON.parse(sectionPages).value[i].title.trim()) - (new Date())) <= 1000 * 60 * 60 * 24){
					flag = false;
					onenoteRequest('pages/' + JSON.parse(sectionPages).value[i].id + '/content', function (content) {
						var parser = new DOMParser();
						var dom = parser.parseFromString(content, 'text/html');
						progressBar.animate(dom.querySelectorAll('[data-tag="to-do:completed"]').length / dom.querySelectorAll('[data-tag]').length);
					});
				}
			}

			if(flag){
				// do something different if there is nothing today
			}
		}
	}

	// pre: the sections the user specified to be tracked, title needs to
	// 		have any date format in []
	// post: show a list of progress in a linear progress bar
	function showMisc(){
		console.log('started');
		var bars = [];

		for(var i = 0; i < JSON.parse(fs.readFileSync('notebooks.json')).misc_progress.length; i++){
			console.log('update notebooks');
			var today  = new Date();
			today.setMonth(today.getMonth() - 3);
			onenoteRequest('sections/' 
							+ JSON.parse(fs.readFileSync('notebooks.json')).misc_progress[i] 
							+ '/pages'//?filter=lastModifiedTime%20ge%20'
							//+ '2014-05-05T07:00:00Z'//+ today.getFullYear() + '-' + today.getMonth() + '-' + today.getDate() + "T07:00:00Z"
							, updateTracks);
		}

		function updateTracks(pages){
			console.log('updateTracks');
			pages = JSON.parse(pages);
			for(var i = 0; i < pages.value.length; i++){
				var day = /\[.+\]/.exec(pages.value[i].title);
				var period = /\[.+~.+\]/.exec(pages.value[i].title);
				if(day && new Date(day[0].substring(1, day[0].length - 1))){
					if(Math.abs(new Date(day[0].substring(1, day[0].length - 1)) - new Date()) 
					< 1000 * 60 * 60 * 24){
						if(checkKey(bars, 'id', pages.value[i].id) < 0){
							bars.push({
								id: pages.value[i].id,
								title: pages.value[i].title,
								bar: "",
								div: ""
							});
						}
					}else{
						if(checkKey(bars, 'id', pages.value[i].id) >= 0){
							bars[checkKey(bars, 'id', pages.value[i].id)].div.parentNode
							.removeChild(bars[checkKey(bars, 'id', pages.value[i].id)].div);
							bars.splice(checkKey(bars, 'id', pages.value[i].id), 1);
						}
					}
				}else if(period){
					if(checkInPeriod(period[0]) && bars.checkKey(bars, 'id', pages.value[i].id) < 0){
						bars.push({
								id: pages.value[i].id,
								title: pages.value[i].title,
								bar: "",
								div: ""
							});
					}else if(!checkInPeriod(period[0]) && checkKey(bars, 'id', pages.value[i].id) >= 0){
						bars[checkKey(bars, 'id', pages.value[i].id)].div.parentNode
							.removeChild(bars[checkKey(bars, 'id', pages.value[i].id)].div);
							bars.splice(checkKey(bars, 'id', pages.value[i].id), 1);
					}
				}
			}

			updateBar();
		}

		function updateBar(){
			console.log('updateBar');
			for(var i = 0; i < bars.length; i++){
				if(bars[i].bar == "" && bars[i].div == ""){
					bars[i].div = document.createElement('div');
					bars[i].div.innerHTML = '<h4>' + bars[i].title + '</h4>'
					bars[i].div.id = 'bar' + i;
					bars[i].div.class = 'bar';
					document.getElementById('misc-progressbar').appendChild(bars[i].div);
					bars[i].bar = new ProgressBar.Line('#bar' + i, {
						strokeWidth: 6,
						easing: 'easeInOut',
						duration: 1000,
						color: '#878787',
						trailWidth: 1,
						from: {color: '#D6AFFF'},
						to: {color: "#7C00FF"},
						step: function (state, bar){
							bar.path.setAttribute('stroke', state.color);
						}
					});
				}
			}

			for(var i = 0; i < bars.length; i++){
				console.log(i);
				var bari = i;
				onenoteRequest('pages/' + bars[i].id + '/content', function (content, index = bari, progressBar = bars){
					var parser = new DOMParser();
					var dom = parser.parseFromString(content, 'text/html');
					console.log(index);
					progressBar[index].bar.animate(dom.querySelectorAll('[data-tag="to-do:completed"]').length / dom.querySelectorAll('[data-tag]').length);
				});
			}
		}
	}

	// pre: should pass in array of object
	// post: find if the array has a object has a value in a specific key
	function checkKey (array, key, value){
		for(var i = 0; i < array.length; i++){
			if(array[i][key] == value){
				return i;
			}
		}

		return -1;
	}

	// pre: pass in an interval of time in the format of [start~end]
	// post: return true if today is within the range, false when not
	function checkInPeriod(period){
		var start = /\[.+~/.exec(period)[0];
		var end = /~.+\]/.exec(period)[0];

		return new Date() - new Date(start.substring(1, start.length - 1)) > 0 
				&& new Date(end.substring(1, end.length - 1) + " 23:59:59") - new Date() > 0;
	}

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
			}else if(this.status == 401){
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