// import app and BrowserWindow from 'electron' package
const {app, BrowserWindow} = require('electrion');
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
  if(!fs.readFileSync("token.json").length){

  }else{
    
  }
}