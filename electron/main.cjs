const { app, BrowserWindow, shell, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let serverProcess = null;
let tray = null;
let isQuitting = false;

const PORT = 3001;

function isServerRunning(cb) {
  const req = http.get(`http://localhost:${PORT}/api/charts`, (res) => {
    cb(res.statusCode === 200);
  });
  req.on('error', () => cb(false));
  req.setTimeout(600, () => {
    req.destroy();
    cb(false);
  });
}

function startServer(cb) {
  isServerRunning((running) => {
    if (running) {
      console.log('Server is already running on port', PORT);
      return cb();
    }

    const distServerPath = path.join(__dirname, '../dist-server/index.cjs');
    const serverPath = path.join(__dirname, '../server/index.ts');
    const tsxPath = path.join(__dirname, '../node_modules/tsx/dist/cli.mjs');

    if (fs.existsSync(distServerPath)) {
      // Bundled standalone server: uses Electron's internal Node.js engine
      // Does not require Node.js or npm to be installed on any friend's computer!
      serverProcess = spawn(process.execPath, [distServerPath], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: PORT.toString(), ELECTRON_RUN_AS_NODE: '1' },
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      // Development fallback
      serverProcess = spawn('node', [tsxPath, serverPath], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: PORT.toString() },
        stdio: 'ignore',
        windowsHide: true,
      });

      serverProcess.on('error', () => {
        serverProcess = spawn(process.execPath, [tsxPath, serverPath], {
          cwd: path.join(__dirname, '..'),
          env: { ...process.env, PORT: PORT.toString(), ELECTRON_RUN_AS_NODE: '1' },
          stdio: 'ignore',
          windowsHide: true,
        });
      });
    }

    let retries = 0;
    const interval = setInterval(() => {
      retries++;
      isServerRunning((ok) => {
        if (ok || retries > 30) {
          clearInterval(interval);
          cb();
        }
      });
    }, 250);
  });
}

function createTray() {
  if (tray) return;
  const iconPath = path.join(__dirname, '../public/logo.ico');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'NotMusic Penceresini Göster',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Uygulamayı Tamamen Kapat',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('NotMusic — Arka Planda Çalıyor 🎵');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 620,
    title: 'NotMusic',
    icon: path.join(__dirname, '../public/logo.ico'),
    backgroundColor: '#09090d',
    show: false,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false, // Arka planda pencere kapalıyken bile sesin kesintisiz çalması için
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const loadUrl = () => {
    mainWindow.loadURL(`http://localhost:${PORT}`).catch(() => {
      setTimeout(loadUrl, 500);
    });
  };

  loadUrl();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Pencereyi çarpıdan (X) kapattığımızda uygulama durmaz, arka planda çalmaya devam eder!
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer(() => {
    createWindow();
    createTray();
  });

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {}
  }
});

app.on('window-all-closed', () => {
  if (isQuitting) {
    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch (e) {}
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});
