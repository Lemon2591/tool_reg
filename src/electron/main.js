import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('preload path:', preloadPath);
  console.log('preload exists:', require('fs').existsSync(preloadPath));
  const win = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL('http://localhost:5173/');
  win.webContents.openDevTools();
}

app
  .whenReady()
  .then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  })
  .catch((err) => {
    console.error('Failed to create window:', err);
    process.exit(1);
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
