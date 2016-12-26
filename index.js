/*
	Menu reference: http://electron.atom.io/docs/api/menu
*/

(function (){
	'use strict';

	const {BrowserWindow} = require('electron').remote;
	const fs = require('file-system');
	const ProgressBar = require('progressbar.js');

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
			showMisc();
		}
	};

	// pre: when user do have a section to store the checklist for today,
	//		the page title should contain only data in any format
	// post: show the progress of today in a circle progressbar
	function showToday(){}

	// pre: the sections the user specified to be tracked, title needs to
	// 		have any date format in []
	// post: show a list of progress in a linear progress bar
	function showMisc(){}
})();