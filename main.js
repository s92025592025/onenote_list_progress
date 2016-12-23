// import app and BrowserWindow from 'electron' package
const {app, BrowserWindow, ipcMain} = require('electron');
// import path
const path = require('path');
// import file-system
const fs = require("file-system");

// keep a global reference of BrowserWindow Object in case of
// getting cleaned by garbage collection
let win;

// pre: When the appliction is started
// post: Will Choose to open different window according to
//       whether the user has logged in his/her onenote account
//       before
function startWindow(){
  if(!fs.readFileSync("token.json").length){ // if never logged in
    win = new BrowserWindow({width: 800, height: 300});
    win.loadURL("file:///firstTimeLogin.html");
  }else{
    win = new BrowserWindow({width: 600, height: 800});
    win.loadURL("file:///index.html");
  }

  // open devtools
  //win.webContents.openDevTools();

  win.on('closed', function (){
    win = null;
  });
}

// ======= This block contains all things relate to ipc ========= //

// pre: when the main windows need to be changed
// post: change the main window to the page and the size renderer process
//       desire
ipcMain.on('redirect-main-win', function(e, url, width, height){
  win.loadURL(url);
  win.setSize(width, height);
  e.returnValue = "done";
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