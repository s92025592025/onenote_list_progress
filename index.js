/*
	Menu reference: http://electron.atom.io/docs/api/menu
*/

(function (){
	const {BrowserWindow, Menu} = require('electron').remote;
	const {ipcRenderer} = require('electron');
	const remote = require('electron').remote;
	const fs = require('file-system');
	const ProgressBar = require('progressbar.js');
	const ONENOTE_ROOT = 'https://www.onenote.com/api/v1.0/me/notes/';

	window.onload = function (){
		console.log(JSON.parse(fs.readFileSync('notebooks.json')).refresh_time * 60 * 1000);
		document.getElementById('refresh-btn').onclick = function() {
			remote.getCurrentWindow().reload();
			console.log('reloaded');
		};

		document.getElementById('logout-btn').onclick = logout;

		if(!JSON.parse(fs.readFileSync('notebooks.json')).today_progress){
		      ipcRenderer.send('show-menu-win', 'Settings');
		}else{
			// this actually shows everything
			showToday();
		}
	};

	// pre: when user do have a section to store the checklist for today,
	//		the page title should contain only data in any format
	// post: shows the progress bar of today and misc when start up, and updates both
	//		 in a certain time period
	function showToday(){
		// progress bar for today
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

		var today = new Date();
		today.setMonth(today.getMonth() - 3);
		onenoteRequest('sections/' 
						+ JSON.parse(fs.readFileSync('notebooks.json')).today_progress
						+ "/pages"
						+ '?filter=lastModifiedTime%20ge%20'
						+ today.getFullYear() + '-' 
						+ ("0" + today.getMonth()).substring(("0" + today.getMonth()).length - 2, ("0" + today.getMonth()).length) + '-' 
						+ ("0" + today.getDate()).substring(("0" + today.getMonth()).length - 2, ("0" + today.getMonth()).length)
						, updateProgress);

		var timer;
		// show progress bars for today
		var misc = showMisc();

		// update both progressbars in a certain time interval
		timer = setInterval(function (){
				// update today's progress bar
				onenoteRequest('sections/' 
							+ JSON.parse(fs.readFileSync('notebooks.json')).today_progress
							+ "/pages"
							+ '?filter=lastModifiedTime%20ge%20'
							+ today.getFullYear() + '-' 
							+ ("0" + today.getMonth()).substring(("0" + today.getMonth()).length - 2, ("0" + today.getMonth()).length) + '-' 
							+ ("0" + today.getDate()).substring(("0" + today.getMonth()).length - 2, ("0" + today.getMonth()).length)
							, updateProgress);
				// update misc's progress bar
				for(var i = 0; i < JSON.parse(fs.readFileSync('notebooks.json')).misc_progress.length; i++){
					onenoteRequest('sections/' 
									+ JSON.parse(fs.readFileSync('notebooks.json')).misc_progress[i] 
									+ '/pages?filter=lastModifiedTime%20ge%20'
									+ today.getFullYear() + '-' 
									+ ("0" + today.getMonth()).substring(("0" + today.getMonth()).length - 2, ("0" + today.getMonth()).length) + '-' 
									+ ("0" + today.getDate()).substring(("0" + today.getMonth()).length - 2, ("0" + today.getMonth()).length)
									, misc.updateTracks);
				}
			}, JSON.parse(fs.readFileSync('notebooks.json')).refresh_time * 60 * 1000);

		// pre: when the program is started or time to update. sectionPages should pass a json file that contains
		//		pages data in the "today" section, progress should be only refer to the progress bar showing today's
		//		progress by default
		// post: finds if there is any check list for today and update the percentage on the progress bar
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
				// TO-DO
				// do something different if there is nothing today
				progressBar.animate(0);
			}
		}
	}

	// pre: the sections the user specified to be tracked, title needs to
	// 		have any date format in []
	// post: show a list of progress in a linear progress bar
	function showMisc(){
		var bars = [];

		// scan through the sections that specified to be tracked in settings, and pass down to updateTracks
		// to keep the latest version of pages to be show as progress bar
		for(var i = 0; i < JSON.parse(fs.readFileSync('notebooks.json')).misc_progress.length; i++){
			var today  = new Date();
			today.setMonth(today.getMonth() - 3);
			onenoteRequest('sections/' 
							+ JSON.parse(fs.readFileSync('notebooks.json')).misc_progress[i] 
							+ '/pages?filter=lastModifiedTime%20ge%20'
							+ today.getFullYear() + '-' 
							+ ("0" + today.getMonth()).substring(("0" + today.getMonth()).length - 2, ("0" + today.getMonth()).length) + '-' 
							+ ("0" + today.getDate()).substring(("0" + today.getMonth()).length - 2, ("0" + today.getMonth()).length)
							, updateTracks);
		}

		// pre: pages should pass in a list of pages lastmodified within 3 months in a section in terms of a JSON
		// post: update an array of objects of misc check lists that should be tracked, then pass down to update bar
		function updateTracks(pages){
			pages = JSON.parse(pages);
			for(var i = 0; i < pages.value.length; i++){
				var day = /\[.+\]/.exec(pages.value[i].title);
				var period = /\[.+~.+\]/.exec(pages.value[i].title);
				// breaks down to "a day", or "a tie period"
				if(day && !period && new Date(day[0].substring(1, day[0].length - 1))){
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
					if(checkInPeriod(period[0]) && checkKey(bars, 'id', pages.value[i].id) < 0){
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

		// pre: when the list of tracking check lists are updated
		// post: update the proress bar percetage
		function updateBar(){
			document.getElementById('misc_progress').style.height = (60 + bars.length * 60) + "px";
			for(var i = 0; i < bars.length; i++){
				if(bars[i].bar == "" && bars[i].div == ""){
					bars[i].div = document.createElement('div');
					bars[i].div.innerHTML = '<h4>' + bars[i].title + '</h4>'
					bars[i].div.id = 'bar' + i;
					bars[i].div.class = 'bar';
					document.getElementById('misc-progressbar').appendChild(bars[i].div);
					bars[i].bar = new ProgressBar.Line('#bar' + i, {
						strokeWidth: 3,
						easing: 'easeInOut',
						duration: 1000,
						color: '#878787',
						trailWidth: 1,
						trailColor: '#999',
						text:{
							style:{
								position: 'absolute',
								right: '5px',
								top: '0px',
								'font-size': '18pt'
							}
						},
						from: {color: '#EBD9FF'},
						to: {color: "#A550FF"},
						step: function (state, bar){
							bar.path.setAttribute('stroke', state.color);
							bar.setText(Math.round(bar.value() * 1000) / 10 + "%")
						}
					});
				}
			}

			bars.forEach(function (obj){
				onenoteRequest('pages/' + obj.id + '/content', function (content, progressBar = obj.bar){
					var parser = new DOMParser();
					var dom = parser.parseFromString(content, 'text/html');
					if(dom){
						progressBar.animate(dom.querySelectorAll('[data-tag="to-do:completed"]').length / dom.querySelectorAll('[data-tag]').length);
					}
				});
			});
		}

		return {
			updateTracks: updateTracks
		};
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

	// pre: when the user clicked the logout button
	// post: logs out the user, cleans out user data
	function logout(){
		var request = new XMLHttpRequest();
		request.open("GET", 'https://login.live.com/oauth20_logout.srf'
							+ '?client_id='+ JSON.parse(fs.readFileSync('oauth2Info.json')).client_id
							+ '&redirect_uri=' + JSON.parse(fs.readFileSync('oauth2Info.json')).redirect_uri
							, false);
		request.onload = function (){
			if(this.status == 200 || this.status == 0){
				ipcRenderer.send('clear-all-data');
			}else{
				console.log(this.status);
				console.log(this.responseText);
			}
		}

		request.send();
	}
})();