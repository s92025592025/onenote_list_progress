/*
	Menu reference: http://electron.atom.io/docs/api/menu
*/

(function (){
	'use strict';
	const {BrowserWindow} = require('electron').remote;
	const fs = require('file-system');

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

		}
	};
})();