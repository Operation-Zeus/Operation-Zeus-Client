const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

// const menu = new Menu();
const template = [
  {
    label: 'Copy',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  },
  {
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.reload();
      }
    }
  },
  {
    label: 'Toggle Dev. Tools',
    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.webContents.toggleDevTools();
      }
    }
  }
];

const menu = Menu.buildFromTemplate(template);

$(document).on('contextmenu', function (e) {
  e.preventDefault();
  menu.popup(remote.getCurrentWindow());
});
