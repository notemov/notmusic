const { app, BrowserWindow, shell, Tray, Menu, powerSaveBlocker, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

// ARKA PLANDA KESİNTİSİZ ÇALMA AYARLARI (Arka plan kısıtlamalarını devre dışı bırak)
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Fixed app name & userData path so dev and prod instances share the single-instance lock
app.name = 'NotMusic';
try {
  app.setPath('userData', path.join(app.getPath('appData'), 'NotMusic'));
} catch (e) {}

const PORT = 3001;

// SINGLE INSTANCE LOCK - Prevents running multiple copies of NotMusic
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  try {
    http.get(`http://localhost:${PORT}/api/focus-window`, () => {
      app.exit(0);
    }).on('error', () => {
      app.exit(0);
    });
    setTimeout(() => app.exit(0), 100);
  } catch (e) {
    app.exit(0);
  }
  return;
}

let mainWindow = null;
let serverProcess = null;
let tray = null;
let isQuitting = false;

function bringWindowToFront() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.setSkipTaskbar(false);
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.setAlwaysOnTop(false);
}

// Global helper for in-process server to focus window
global.focusNotMusicWindow = bringWindowToFront;

app.on('second-instance', () => {
  // If someone tried to run a second instance, bring our existing window to focus!
  bringWindowToFront();
});

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
      // In-process server execution: 100% reliable, zero external child process issues!
      try {
        require(distServerPath);
        console.log('Internal server running on port', PORT);
        let retries = 0;
        const interval = setInterval(() => {
          retries++;
          isServerRunning((ok) => {
            if (ok || retries > 30) {
              clearInterval(interval);
              cb();
            }
          });
        }, 150);
        return;
      } catch (err) {
        console.error('Failed to load internal server:', err);
      }
    }

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
      label: 'NotMusic Penceresini Aç',
      click: () => {
        bringWindowToFront();
      },
    },
    {
      label: 'Oynat / Duraklat ⏯',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('media:togglePlay');
          mainWindow.webContents.executeJavaScript(`
            if (typeof window._togglePlay === 'function') window._togglePlay();
          `).catch(() => {});
        }
      },
    },
    {
      label: 'Sonraki Şarkı ⏭',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('media:playNext');
          mainWindow.webContents.executeJavaScript(`
            if (typeof window._playNext === 'function') window._playNext();
          `).catch(() => {});
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
      bringWindowToFront();
    }
  });

  tray.on('double-click', () => {
    bringWindowToFront();
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
      preload: path.join(__dirname, 'preload.cjs'),
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
    // Embedded player veya platform kartlarından tarayıcıda YouTube açılmasını engelle
    if (/youtube\.com|youtu\.be|music\.youtube\.com/i.test(url)) {
      return { action: 'deny' };
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Sayfayı hızlıca yenilemek için Ctrl+R ve F5 desteği
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control && input.key.toLowerCase() === 'r') || input.key === 'F5') {
      mainWindow.reload();
      event.preventDefault();
    }
  });

  // Simge durumuna küçültüldüğünde arka plan sesinin kesintisiz devamını garanti et
  mainWindow.on('minimize', () => {
    mainWindow.webContents.executeJavaScript(`
      if (typeof window._resumePlayback === 'function') window._resumePlayback();
    `).catch(() => {});
  });

  // Pencere gizlendiğinde de sesin devamını tetikle
  mainWindow.on('hide', () => {
    mainWindow.webContents.executeJavaScript(`
      if (typeof window._resumePlayback === 'function') window._resumePlayback();
    `).catch(() => {});
  });

  let balloonShown = false;
  // Çarpıdan (X) tıklandığında müzik kesilmeden arka planda çalmaya devam eder, pencere gizlenir
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (!balloonShown && tray) {
        balloonShown = true;
        try {
          tray.displayBalloon({
            title: 'NotMusic — Arka Planda Çalıyor 🎵',
            content: 'Pencere kapatıldı ama müziğiniz kesintisiz çalmaya devam ediyor.',
          });
        } catch (e) {}
      }
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.on('media:togglePlay', () => {
  if (mainWindow) {
    mainWindow.webContents.send('media:togglePlay');
    mainWindow.webContents.executeJavaScript(`
      if (typeof window._togglePlay === 'function') window._togglePlay();
    `).catch(() => {});
  }
});

ipcMain.on('media:playNext', () => {
  if (mainWindow) {
    mainWindow.webContents.send('media:playNext');
    mainWindow.webContents.executeJavaScript(`
      if (typeof window._playNext === 'function') window._playNext();
    `).catch(() => {});
  }
});

ipcMain.on('media:playPrevious', () => {
  if (mainWindow) {
    mainWindow.webContents.send('media:playPrevious');
    mainWindow.webContents.executeJavaScript(`
      if (typeof window._playPrevious === 'function') window._playPrevious();
    `).catch(() => {});
  }
});

ipcMain.on('app:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('app:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('app:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

app.whenReady().then(() => {
  // Arka planda Windows'un ses/uygulamayı askıya almasını engelle
  try {
    powerSaveBlocker.start('prevent-app-suspension');
  } catch (e) {}

  // Register Global Media Shortcuts
  try {
    globalShortcut.register('MediaPlayPause', () => {
      if (mainWindow) {
        mainWindow.webContents.send('media:togglePlay');
        mainWindow.webContents.executeJavaScript(`
          if (typeof window._togglePlay === 'function') window._togglePlay();
        `).catch(() => {});
      }
    });

    globalShortcut.register('MediaNextTrack', () => {
      if (mainWindow) {
        mainWindow.webContents.send('media:playNext');
        mainWindow.webContents.executeJavaScript(`
          if (typeof window._playNext === 'function') window._playNext();
        `).catch(() => {});
      }
    });

    globalShortcut.register('MediaPreviousTrack', () => {
      if (mainWindow) {
        mainWindow.webContents.send('media:playPrevious');
        mainWindow.webContents.executeJavaScript(`
          if (typeof window._playPrevious === 'function') window._playPrevious();
        `).catch(() => {});
      }
    });
  } catch (err) {
    console.error('Failed to register global shortcuts:', err);
  }

  isServerRunning((running) => {
    if (running) {
      console.log('Server is already running on port', PORT, '- reusing running server.');
      createWindow();
      createTray();
      return;
    }

    startServer(() => {
      createWindow();
      createTray();
    });
  });

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
  isQuitting = true;
  if (tray) {
    try { tray.destroy(); } catch (e) {}
    tray = null;
  }
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {}
  }
});

app.on('window-all-closed', () => {
  if (isQuitting) {
    if (tray) {
      try { tray.destroy(); } catch (e) {}
      tray = null;
    }
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
