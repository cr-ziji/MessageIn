const { app, BrowserWindow, ipcMain, screen, Tray, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
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

    mainWindow.setMenu(null);

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

      //danmakuWindow.webContents.openDevTools({ mode: 'detach' });

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

  ipcMain.on('disable-dev-tools', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.closeDevTools();
    }
    if (danmakuWindow && !danmakuWindow.isDestroyed()) {
      danmakuWindow.webContents.closeDevTools();
    }
  });

  ipcMain.on('toggle-dev-tools', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    }
  });

  ipcMain.on('danmaku-command', (event, command) => {
    if (danmakuWindow && danmakuWindow.webContents) {
      danmakuWindow.webContents.send('danmaku-command', command);
    }
  });

  ipcMain.on('open-external', (event, url) => {
    if (url) shell.openExternal(url);
  });

  app.on('ready', () => {
    setAutoLaunch(true);

    createWindow();

    if (mainWindow) {
      mainWindow.hide();
    }
    autoUpdater.allowInsecure = true;
    autoUpdater.disableWebInstaller = false
    autoUpdater.autoDownload = false //这个必须写成false，写成true时，会报没权限更新
    autoUpdater.checkForUpdatesAndNotify();
  });

  function downloadUpdate() {
    autoUpdater.downloadUpdate().catch(err => {
      console.error('下载更新失败:', err);
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-status', {
          status: 'error',
          message: '下载更新失败: ' + err.message
        });
      }
    });
  }

  autoUpdater.on('update-available', () => {
    downloadUpdate();
    console.log('发现新版本，开始下载...');
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', {
        status: 'update-available',
        message: '发现新版本，开始下载...'
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    console.log('没有可用更新');
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', {
        status: 'update-not-available',
        message: '没有可用更新'
      });
    }
  });

  autoUpdater.on("error", (error) => {
    console.log('检查更新失败', error);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', {
        status: 'error',
        message: '检查更新失败: ' + error.message
      });
    }
    // 设置备用源
    autoUpdater.setFeedURL({
      "provider": "github",
      "owner": "cyrilguocode",
      "repo": "MessageIn",
      "releaseType": "release"  
    });
    console.log('开始尝试备用源');
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', {
        status: 'restart',
        message: '开始尝试备用源'
      });
    }
    autoUpdater.checkForUpdates(); // 确保在这里调用
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('新版本下载完成，将退出并安装。');
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', {
        status: 'update-downloaded',
        message: '新版本下载完成，将退出并安装'
      });
    }
    app.isQuiting = true;
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const message = `下载进度: ${Math.round(progressObj.percent)}%`;
    console.log(message);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', {
        status: 'download-progress',
        message: message,
        percent: progressObj.percent
      });
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