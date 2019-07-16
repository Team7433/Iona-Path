'use strict';

// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu} = require('electron')
const ipcMain = require('electron').ipcMain
var path = require('path')
const fs = require('fs')

require('electron-reload')(__dirname, {ignored: /ExampleProject|[\/\\]\./});

const APP_ICON = path.join(__dirname, './assets/Icons', 'Icon');

const iconPath = () => {
	return APP_ICON + (process.platform === 'win32' ? '.ico' : '.icns');
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
function createWindow () {
  // Create the browser window.
  //mainWindow = new BrowserWindow({width: 800, height: 600});
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    icon: iconPath(),
    webPreferences: {
      nodeIntegration: true
    },
    offscreen: true
  })

  // and load the index.html of the app.
  //mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
    console.log('closed');
  })

  mainWindow.on('close', function () { 
    mainWindow.webContents.send('closing');
    console.log('closing');
  })

  mainWindow.on('resize', () => {
    mainWindow.webContents.send('resize')
  })

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('resize')
  })

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('resize')
  })
  mainWindow.webContents.on('paint', (event, dirty, image) => {
    updateBitmap(dirty, image.getBitmap())
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const template = [
  // { role: 'appMenu' }
  ...(process.platform === 'darwin' ? [{
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      {
        label:'New Path',
        click() {
          mainWindow.webContents.send('menu-new-path');
          console.log('new Path');
        },
        accelerator: 'CmdOrCtrl+N'
      },
      {
        label:'New Window',
        click() {
          mainWindow.webContents.send('menu-new-window');
          console.log('new window');
        },
        accelerator: 'CmdOrCtrl+Shift+N'
      },
      {type:'separator'},
      {
        label:'Open Project',
        click() {
          mainWindow.webContents.send('menu-open-project');
          console.log('new window');
        },
        accelerator: 'CmdOrCtrl+O'
      },
      {
        label:'Open Recent',
        id: 'recent',
        type: 'submenu',
        submenu: [
          { label: "No Recent Files"},
          { type: 'separator'},
          { label: "Clear Recent Files",},
        ],
        accelerator: 'CmdOrCtrl+O'
      },
      {type:'separator'},
      {
        label:'Save',
        click() {
          mainWindow.webContents.send('menu-Save');
          console.log('saved');
        },
        accelerator: 'CmdOrCtrl+S'
      },
      {type:'separator'},
      {
        label:'Export',
        click() {
          mainWindow.webContents.send('menu-Export');
          console.log('Export');
        },
        accelerator: 'CmdOrCtrl+E'
      },
      {
        label:'Export Path',
        click() {
          mainWindow.webContents.send('menu-Export-Path');
          console.log('Export Path');
        },
        accelerator: 'CmdOrCtrl+Shift+E'
      },
      {type:'separator'},
      {
        label:'Export To Robot',
        click() {
          mainWindow.webContents.send('menu-Robot');
          console.log('Robot');
        },
        accelerator: 'CmdOrCtrl+D'
      },
      {
        label:'Export Path To Robot',
        click() {
          mainWindow.webContents.send('menu-Robot-Path');
          console.log('Robot Path');
        },
        accelerator: 'CmdOrCtrl+Shift+D'
      },
      {type:'separator'},
      process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
    ]
  },
  { role: 'editMenu' },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(process.platform === 'darwin' ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternalSync('https://electronjs.org') }
      }
    ]
  }
]

function UpdateRecents() { 
  var userDataPath = app.getPath('userData') + "/user/";
  if (fs.existsSync(userDataPath + "settings.json")) {
    fs.readFile(userDataPath + "settings.json", (err, data) => {
      if (err) console.log(err);

      var settingsData = JSON.parse(data);

      var recentsMenu = [];

      //add each recent project to the menu
      settingsData.recents.forEach(project => {
        recentsMenu.push({
          label: project.name,
          click() {
            mainWindow.webContents.send("open-recent", project.directory);
            console.log("open Recent " + project.name);
          }
        })
      }); 

      //added other stuff
      recentsMenu.push({ type: 'separator' })
      recentsMenu.push({ label: "Clear Recent Files"})
      
      //put that into the template
      template[1].submenu[4].submenu = recentsMenu;

      //update Template
      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    })
  }
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

UpdateRecents();

ipcMain.on('get-user-path', (event, arg) => {
  event.returnValue = app.getPath('userData');
})

ipcMain.on('update-recents', (event) => {
  UpdateRecents();
})