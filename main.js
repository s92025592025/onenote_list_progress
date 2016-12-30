// import app and BrowserWindow from 'electron' package
const {app, BrowserWindow, ipcMain, Menu} = require('electron');
// import path
const path = require('path');
// import file-system
const fs = require("file-system");

// keep a global reference of BrowserWindow Object in case of
// getting cleaned by garbage collection
let win;

const menuTemplate = [
  {
    label: 'Settings',
    click() {
      var settingWin = new BrowserWindow({parent: win, width: 600, height: 800, maximizable: false,
                                          minimizable: false, darkTheme: true, show: false});
      var loadingWin = new BrowserWindow({width: 300, height:100, maximizable: false,
                                          minimizable: false, frame: false, alwaysOnTop: true});
      loadingWin.loadURL('file://' + __dirname + '/loading.html');
      settingWin.setMenu(null);
      settingWin.loadURL("file://" + __dirname +"/Settings.html");
      settingWin.webContents.openDevTools();

      settingWin.on('ready-to-show', function (){
        loadingWin.close();
        settingWin.show();
        loadingWin = null;
      });

      settingWin.on('close', function (){
        settingWin.getParentWindow().reload();
      });

      settingWin.on('closed', function (){
        settingWin = null;
      });
    }
  },
  {
    label: 'About',
    submenu: [
      {
        label: 'About this project',
        click() { 
          require('electron').shell.openExternal('https://github.com/s92025592025/onenote_list_progress');
        }
      }
    ]
  }
  ];

// pre: When the appliction is started
// post: Will Choose to open different window according to
//       whether the user has logged in his/her onenote account
//       before
function startWindow(){
  if(!originalFs.readFileSync(__dirname + "/token.json").length){ // if never logged in
    win = new BrowserWindow({width: 800, height: 300});
    win.setMenu(null);
    win.loadURL("file://" + __dirname + "/firstTimeLogin.html");
  }else{
    win = new BrowserWindow({width: 600, height: 800, resizable: false});
    win.setMenu(null);
    win.setMenu(Menu.buildFromTemplate(menuTemplate));
    win.loadURL("file://" + __dirname + "/index.html");
  }

  // open devtools
  win.webContents.openDevTools();

  win.on('closed', function (){
    win = null;
  });
}

// ======= This block contains all things relate to ipc ========= //

// pre: when the main windows need to be changed
// post: change the main window to the page and the size renderer process
//       desire
ipcMain.on('redirect-main-win', function(e, url, width, height){
  win.setMenu(Menu.buildFromTemplate(menuTemplate));
  win.loadURL(url);
  win.setSize(width, height);
  win.setResizable(false);
  e.returnValue = "done";
});


// pre: when want to open a window that belongs to manu item from rendering process
// pre: find the label that matches the passed in label and execute it
ipcMain.on('show-menu-win', function(e, label){
  for(var i = 0; i < menuTemplate.length; i++){
    if(menuTemplate[i].label == label){
      menuTemplate[i].click();
    }
  }
});

// pre: when need to clean all data and prompt uses to re-login
// post: clean all the token and notebook data
ipcMain.on('clear-all-data', function (e){
  originalFs.writeFileSync(__dirname + '/token.json', "");
  var notebooks = JSON.parse(originalFs.readFileSync(__dirname + '/notebooks.json'));
  notebooks.today_progress = "";
  notebooks.misc_progress = "";
  originalFs.writeFileSync(__dirname + '/notebooks.json', JSON.stringify(notebooks));

  win.loadURL('file://' + __dirname + '/firstTimeLogin.html');
  win.setMenu(null);
  win.setSize(800, 300);
  win.setResizable(true);
});

// ======= This block contains all things relate to ipc ========= //


// ======= This block contains all things relate to app ========= //

// show the first window when the electorn app is ready
app.on('ready', startWindow);

app.on('window-all-closed', function (){
  // process.platform: from Node.js, will return the platform the
  //                    program is currently running
  if(process.platform !== 'darwin'){ // if the platform is not mac
    // kill the app upon the windows are all closed
    app.quit();
  } // or do nothing(typical macOS behavior)
});

app.on('active', function (){
  // this is for mac, if it is activcatived from thew dock, 
  // show the starting screen again
  if(win === null){
    startWindow();
  }
});

// ======= This block contains all things relate to app ========= //