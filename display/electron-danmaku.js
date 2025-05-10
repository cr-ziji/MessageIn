const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require('electron');
const path = require('path');
const url = require('url');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  let mainWindow;
  let danmakuWindow;
  let tray = null;

  function setAutoLaunch(enable) {
    if (process.platform === 'win32') {
      app.setLoginItemSettings({
        openAtLogin: enable,
        path: process.execPath,
        args: ['--hidden']
      });
    }
  }

  function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'electron-preload.js')
      },
      icon: path.join(__dirname, 'icon.png'),
      show: false 
    });

    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }));

    createTray();

    mainWindow.on('minimize', (event) => {
      event.preventDefault();
      mainWindow.hide();
    });

    mainWindow.on('close', (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        mainWindow.hide();
      }
      return false;
    });

    mainWindow.webContents.on('did-finish-load', () => {
      setTimeout(() => {
        createDanmakuWindow();
      }, 500);
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
      if (danmakuWindow) {
        danmakuWindow.close();
        danmakuWindow = null;
      }
    });
  }

  function createTray() {
    const iconPath = path.join(__dirname, 'icon.png');
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          mainWindow.show();
        }
      },
      {
        type: 'separator'
      },
      {
        label: '退出',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setToolTip('MessageIn');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      mainWindow.show();
    });
  }

  function createDanmakuWindow() {
    if (danmakuWindow) {
      danmakuWindow.show();
      return;
    }

    const { width } = screen.getPrimaryDisplay().workAreaSize;

    danmakuWindow = new BrowserWindow({
      width: width,
      height: 50,
      x: 0,
      y: 0,
      frame: false,
      transparent: true,
      hasShadow: false,
      backgroundColor: '#00000000',
      opacity: 1.0,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'electron-preload.js'),
        experimentalFeatures: true,
      },
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      focusable: true,
      show: false,
      type: 'panel',
      titleBarStyle: 'hidden',
      visualEffectState: 'active',
    });

    danmakuWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
      search: '?mode=overlay'
    }));

    danmakuWindow.setIgnoreMouseEvents(true, { forward: true });
    
    ipcMain.on('danmaku-mouse-event', (event, { type, isOverDanmaku }) => {
      if (danmakuWindow) {
        if (type === 'mouseover') {
          danmakuWindow.setIgnoreMouseEvents(false);
        } else if (type === 'mouseout') {
          danmakuWindow.setIgnoreMouseEvents(true, { forward: true });
        }
      }
    });
    
    danmakuWindow.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});

    danmakuWindow.setAlwaysOnTop(true, 'screen-saver', 1);

    danmakuWindow.setFullScreenable(false);

    danmakuWindow.once('ready-to-show', () => {
      danmakuWindow.setBackgroundColor('#00000000');

      if (process.platform === 'win32') {
        try {
          danmakuWindow.setOpacity(1.0);
        } catch (e) {
          console.error('设置Windows透明度失败:', e);
        }
      }
      
      danmakuWindow.show();

      console.log('弹幕窗口已创建并显示');

      danmakuWindow.webContents.openDevTools({ mode: 'detach' });

    });

    danmakuWindow.on('closed', () => {
      danmakuWindow = null;
    });
  }

  ipcMain.on('set-always-on-top', (event, value) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(value);
    }
  });

  ipcMain.on('create-external-window', () => {
    if (!danmakuWindow) {
      createDanmakuWindow();
    } else {
      danmakuWindow.show();
    }
  });

  ipcMain.on('minimize-to-tray', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  ipcMain.on('show-main-window', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  ipcMain.on('update-danmaku-style', (event, style) => {
    if (danmakuWindow) {
      if (style.transparent !== undefined) {
        const opacity = style.transparent ? 1.0 : 1.0;
        danmakuWindow.setOpacity(opacity);
        console.log('设置弹幕窗口透明度:', opacity);
      }
      
      if (style.height !== undefined) {
        const { width } = screen.getPrimaryDisplay().workAreaSize;
        danmakuWindow.setBounds({
          width: width,
          height: style.height,
          x: 0,
          y: 0
        });

        danmakuWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        danmakuWindow.setIgnoreMouseEvents(true, { forward: true });

        danmakuWindow.setBackgroundColor('#00000000');
      }
    }
  });

  ipcMain.on('set-api-url', (event, url) => {
    if (danmakuWindow && danmakuWindow.webContents) {
      danmakuWindow.webContents.send('api-url-changed', url);
    }
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('api-url-changed', url);
    }
  });

  app.whenReady().then(() => {
    setAutoLaunch(true);

    createWindow();

    if (mainWindow) {
      mainWindow.hide();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
} 