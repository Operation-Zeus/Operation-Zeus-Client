const { app, BrowserWindow } = require('electron');

var Main = {};
var globalWindow = '';

app.on('ready', () => {
  createWindow('index.html');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (globalWindow === null) {
    createWindow('index.html');
  }
});

function createWindow(filename) {
  if (globalWindow) {
    throw new Error('A window is already open');
  }

  globalWindow = new BrowserWindow({
    frame: true,
    titleBarStyle: 'hidden',
    width: 800,
    height: 600,
    title: 'Operation Zeus',
    backgroundColor: '#222',
    autoHideMenuBar: true
  });

  globalWindow.setMovable(true);
  globalWindow.loadURL(`file://${__dirname}/html/build/${filename}`);
  globalWindow.on('closed', () => {
    globalWindow = null;
  });
}

Main.closeWindow = function () {
  globalWindow.close();
};

Main.hideWindow = function () {
  globalWindow.minimize();
};

module.exports = Main;
