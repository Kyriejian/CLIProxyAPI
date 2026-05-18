import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell } from 'electron';
import path from 'path';
import { fork, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let proxyProcess: ChildProcess | null = null;

const PROXY_PORT = 18765;
const isDev = !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'AI Proxy Manager',
    icon: path.join(__dirname, '../public/logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: true,
    backgroundColor: '#0f1117',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray(): void {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Window', click: () => mainWindow?.show() },
    { type: 'separator' },
    {
      label: `Proxy: localhost:${PROXY_PORT}`,
      enabled: false,
    },
    { type: 'separator' },
    { label: 'Open Dashboard', click: () => {
      mainWindow?.show();
      mainWindow?.webContents.send('navigate', 'dashboard');
    }},
    { label: 'Open in Browser', click: () => {
      shell.openExternal(`http://localhost:${PROXY_PORT}`);
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => {
      stopProxy();
      app.exit(0);
    }},
  ]);

  tray.setToolTip('AI Proxy Manager');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow?.show());
}

function startProxy(): void {
  if (proxyProcess) return;

  const proxyScript = path.join(__dirname, '../proxy/start.js');
  proxyProcess = fork(proxyScript, [], {
    env: { ...process.env, PROXY_PORT: String(PROXY_PORT) },
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

  proxyProcess.on('message', (msg: unknown) => {
    mainWindow?.webContents.send('proxy-message', msg);
  });

  proxyProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`[proxy] ${data.toString().trim()}`);
  });

  proxyProcess.stderr?.on('data', (data: Buffer) => {
    console.error(`[proxy:err] ${data.toString().trim()}`);
  });

  proxyProcess.on('exit', (code) => {
    console.log(`Proxy process exited with code ${code}`);
    proxyProcess = null;
    mainWindow?.webContents.send('proxy-status', 'stopped');
  });
}

function stopProxy(): void {
  if (proxyProcess) {
    proxyProcess.kill('SIGTERM');
    proxyProcess = null;
  }
}

// IPC handlers
ipcMain.handle('proxy:start', () => {
  startProxy();
  return { success: true };
});

ipcMain.handle('proxy:stop', () => {
  stopProxy();
  return { success: true };
});

ipcMain.handle('proxy:status', () => {
  return { running: proxyProcess !== null, port: PROXY_PORT };
});

ipcMain.handle('app:version', () => {
  return app.getVersion();
});

ipcMain.handle('app:platform', () => {
  return process.platform;
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  startProxy();
});

app.on('window-all-closed', () => {
  // Keep running in tray on macOS
  if (process.platform !== 'darwin') {
    // Don't quit, keep in tray
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  stopProxy();
  tray?.destroy();
});
