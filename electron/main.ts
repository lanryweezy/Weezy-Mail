import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import fetch from 'node-fetch';
import url from 'url';

let mainWindow: BrowserWindow | null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // This needs to be adjusted for the new `dist-electron` and `dist` structure
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();
});

ipcMain.on('start-google-auth', async (event) => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/google');
    const { authorizationUrl } = await response.json();

    let authWindow = new BrowserWindow({
      width: 500,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    authWindow.loadURL(authorizationUrl);

    const { webContents } = authWindow;

    webContents.on('will-redirect', (event, newUrl) => {
        const parsedUrl = url.parse(newUrl, true);
        if (parsedUrl.pathname === '/api/auth/google/callback') {
            const authCode = parsedUrl.query.code as string;
            if (authCode && mainWindow) {
                mainWindow.webContents.send('google-auth-code', authCode);
                authWindow.close();
            }
        }
    });

    authWindow.on('closed', () => {
      // @ts-ignore
      authWindow = null;
    });

  } catch (error: any) {
    console.error('Failed to start Google auth flow:', error);
    mainWindow?.webContents.send('google-auth-error', error.message);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
