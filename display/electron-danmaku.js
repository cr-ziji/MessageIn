const { app, BrowserWindow, ipcMain, screen, Tray, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const url = require('url');
const package = require('./package.json')
const version = 'v' + package.version
const serverUrl = package.serverUrl
const connectUrl = package.connectUrl
const { exec } = require('child_process');

const gotTheLock = app.requestSingleInstanceLock();
let isFocusCycling = false
let cycleCount = 0
const MAX_CYCLES = 6
let isUsingBackupSource = false;
let updateCheckInterval = null;

let processProtectionEnabled = true;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 10;
let processMonitorInterval = null;
let isShuttingDown = false;

let mainWindow;
let passwordWindow;
let classWindow;
let danmakuWindow;
let historyWindow;
let tray = null;

function enableProcessProtection() {
  if (process.platform === 'win32') {

    process.on('SIGTERM', handleProcessTermination);
    process.on('SIGINT', handleProcessTermination);
    process.on('SIGQUIT', handleProcessTermination);

    process.on('uncaughtException', handleUncaughtException);
    process.on('unhandledRejection', handleUnhandledRejection);

    startProcessMonitor();
  }
}

function handleProcessTermination(signal) {
  console.log(`收到终止信号: ${signal}`);
  if (!isShuttingDown && processProtectionEnabled) {
    console.log('检测到非法终止尝试，阻止退出...');
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
    if (passwordWindow) {
      passwordWindow.show();
      passwordWindow.focus();
    }
    return false;
  }
}

function handleUncaughtException(error) {
  console.error('未捕获的异常:', error);
  if (processProtectionEnabled && restartAttempts < MAX_RESTART_ATTEMPTS) {
    console.log('应用崩溃，尝试重启...');
    restartAttempts++;
    setTimeout(() => {
      app.relaunch();
      app.exit(0);
    }, 1000);
  }
}

function handleUnhandledRejection(reason, promise) {
  console.error('未处理的Promise拒绝:', reason);
  if (processProtectionEnabled && restartAttempts < MAX_RESTART_ATTEMPTS) {
    console.log('Promise错误，尝试重启...');
    restartAttempts++;
    setTimeout(() => {
      app.relaunch();
      app.exit(0);
    }, 1000);
  }
}

function startProcessMonitor() {
  if (processMonitorInterval) {
    clearInterval(processMonitorInterval);
  }
  
  processMonitorInterval = setInterval(() => {
    if (!processProtectionEnabled || isShuttingDown) {
      return;
    }

    if (!mainWindow || mainWindow.isDestroyed()) {
      console.log('检测到主窗口异常，尝试恢复...');
      if (restartAttempts < MAX_RESTART_ATTEMPTS) {
        restartAttempts++;
        setTimeout(() => {
          createWindow();
        }, 1000);
      }
    }

    if (!danmakuWindow || danmakuWindow.isDestroyed()) {
      console.log('检测到弹幕窗口异常，尝试恢复...');
      if (restartAttempts < MAX_RESTART_ATTEMPTS) {
        restartAttempts++;
        setTimeout(() => {
          createDanmakuWindow();
        }, 1000);
      }
    }
  }, 5000);
}

function stopProcessMonitor() {
  if (processMonitorInterval) {
    clearInterval(processMonitorInterval);
    processMonitorInterval = null;
  }
}

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
      slashes: true,
      search: '?version='+version+'&serverUrl='+serverUrl+'&connectUrl='+connectUrl
    }));

    createTray();

    mainWindow.once('ready-to-show', () => {
      mainWindow.hide();
    });

    mainWindow.on('minimize', (event) => {
      event.preventDefault();
      mainWindow.hide();
    });

    mainWindow.on('close', (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        mainWindow.hide();
        return false;
      }
    });

    mainWindow.webContents.on('did-finish-load', () => {
      setTimeout(() => {
        createDanmakuWindow();
      }, 500);
    });

    mainWindow.webContents.setWindowOpenHandler(details => {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          icon: path.join(__dirname, 'icon.png'),
        }
      };
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
      if (danmakuWindow) {
        danmakuWindow.close();
        danmakuWindow = null;
      }
    });

    mainWindow.on('crashed', () => {
      app.relaunch();
      app.exit(0);
    });

    mainWindow.webContents.on('render-process-gone', () => {
      app.relaunch();
      app.exit(0);
    });
  }

  function createTray() {
    const iconPath = path.join(__dirname, 'icon.png');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          if (mainWindow) mainWindow.show();
        }
      },
      {
        type: 'separator'
      },
      {
        label: '退出',
        click: () => {
          createPasswordWindow('quit');
        }
      }
    ]);

    tray.setToolTip('MessageIn');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow) mainWindow.show();
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
      search: '?mode=overlay&version=' + version+'&serverUrl='+serverUrl+'&connectUrl='+connectUrl
    }));

    danmakuWindow.setIgnoreMouseEvents(true, { forward: true });

    danmakuWindow.on('close', (event) => {
      if (processProtectionEnabled) {
        event.preventDefault();
        console.log('检测到弹幕窗口非法关闭尝试，阻止退出...');
        danmakuWindow.hide();

        setTimeout(() => {
          if (danmakuWindow) {
            danmakuWindow.show();
            danmakuWindow.focus();
          }
        }, 100);
        
        return false;
      }
    });

    danmakuWindow.on('crashed', () => {
      console.log('弹幕窗口崩溃，尝试恢复...');
      if (processProtectionEnabled && restartAttempts < MAX_RESTART_ATTEMPTS) {
        restartAttempts++;
        setTimeout(() => {
          createDanmakuWindow();
        }, 1000);
      }
    });

    danmakuWindow.webContents.on('render-process-gone', () => {
      console.log('弹幕窗口渲染进程异常，尝试恢复...');
      if (processProtectionEnabled && restartAttempts < MAX_RESTART_ATTEMPTS) {
        restartAttempts++;
        setTimeout(() => {
          createDanmakuWindow();
        }, 1000);
      }
    });

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

    });

    danmakuWindow.on('closed', () => {
      danmakuWindow = null;
    });
  }

  ipcMain.on('create-class-window', () => {
    if (classWindow){
      classWindow.show()
      return;
    }

    classWindow = new BrowserWindow({
      width: 500,
      height: 250,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'electron-preload.js')
      },
      icon: path.join(__dirname, 'icon.png'),
      show: false
    });

    classWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'input.html'),
      protocol: 'file:',
      slashes: true
    }));



    classWindow.setMenu(null);
    classWindow.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});
    classWindow.setAlwaysOnTop(true, 'screen-saver', 1);

    classWindow.on('blur', () => {
      if (!isFocusCycling) {
        startFocusCycle()
        shell.beep()
      }
      if (classWindow) classWindow.flashFrame(true); // 启动任务栏闪烁
    });

    function startFocusCycle() {
      isFocusCycling = true
      cycleCount = 0
      performFocusCycle()
    }

    function performFocusCycle() {
      if (cycleCount >= MAX_CYCLES) {
        isFocusCycling = false
        if (classWindow) classWindow.flashFrame(false); // 停止闪烁
        return
      }

      if (classWindow) classWindow.blur()

      setTimeout(() => {
        if (classWindow) classWindow.focus()
        cycleCount++
        setTimeout(performFocusCycle, 50)
      }, 50)
    }

    classWindow.once('ready-to-show', () => {
      classWindow.show();
    });

    classWindow.on('closed', () => {
      classWindow = null;
    });
  });

  ipcMain.on('create-password-window', (event, type) => {
    createPasswordWindow(type)
  });

  ipcMain.on('create-history-window', (event, sid) => {
    if (historyWindow){
      historyWindow.show()
      return;
    }

    historyWindow = new BrowserWindow({
      width: 700,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'electron-preload.js')
      },
      icon: path.join(__dirname, 'icon.png'),
      show: false
    });

    historyWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'history.html'),
      protocol: 'file:',
      slashes: true,
      search: '?sid='+sid+'&url='+serverUrl
    }));

    historyWindow.setMenu(null);
    historyWindow.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});

    historyWindow.once('ready-to-show', () => {
      historyWindow.show();
    });

    historyWindow.on('closed', () => {
      historyWindow = null;
    });
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

  ipcMain.on('refresh-all-windows', () => {
    if (danmakuWindow) {
      danmakuWindow.reload();
    }
    if (passwordWindow) {
      passwordWindow.reload();
    }
    if (classWindow) {
      classWindow.reload();
    }
    if (historyWindow) {
      historyWindow.reload();
    }
    if (mainWindow) {
      mainWindow.reload();
    }
    
    setTimeout(() => {
      if (!danmakuWindow) {
        createDanmakuWindow();
      }
    }, 500);
  });

  ipcMain.on('set-api-url', (event, url) => {
    if (danmakuWindow && danmakuWindow.webContents) {
      danmakuWindow.webContents.send('api-url-changed', url);
    }
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('api-url-changed', url);
    }
  });

  ipcMain.on('set-class-param', (event, classParam) => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('set-class-param', classParam);
    }
    if (danmakuWindow && danmakuWindow.webContents) {
      danmakuWindow.webContents.send('set-class-param', classParam);
    }
  });

  ipcMain.on('set-sid', (event, sid) => {
    if (historyWindow && historyWindow.webContents) {
      historyWindow.webContents.send('set-sid', sid);
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

  ipcMain.on('quit', () => {
    if (processProtectionEnabled) {
      console.log('收到合法退出请求，关闭进程保护...');
      processProtectionEnabled = false;
      isShuttingDown = true;
      stopProcessMonitor();

      if (mainWindow) {
        mainWindow.destroy();
      }
      if (passwordWindow) {
        passwordWindow.destroy();
      }
      if (danmakuWindow) {
        danmakuWindow.destroy();
      }
      if (classWindow) {
        classWindow.destroy();
      }
      if (historyWindow) {
        historyWindow.destroy();
      }

      setTimeout(() => {
        app.quit();
      }, 500);
    }
  });

  ipcMain.on('toggle-process-protection', (event, enabled) => {
    processProtectionEnabled = enabled;
    console.log(`进程保护已${enabled ? '启用' : '禁用'}`);
    
    if (enabled) {
      startProcessMonitor();
    } else {
      stopProcessMonitor();
    }
  });

  ipcMain.on('get-process-protection-status', (event) => {
    event.reply('process-protection-status', {
      enabled: processProtectionEnabled,
      restartAttempts: restartAttempts,
      maxRestartAttempts: MAX_RESTART_ATTEMPTS
    });
  });

  function startUpdateCheck() {
    if (updateCheckInterval) {
      clearInterval(updateCheckInterval);
    }

    updateCheckInterval = setInterval(() => {
      checkForUpdates();
    }, 10 * 60 * 1000); // 10分钟检查一次
  }

  function checkForUpdates() {
    if (isUsingBackupSource) {
      // 使用备用源
      autoUpdater.setFeedURL({
        "provider": "github",
        "owner": "cyrilguocode",
        "repo": "MessageIn",
        "releaseType": "release"
      });
      console.log('使用备用源检查更新');
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-status', {
          status: 'restart',
          message: '使用备用源检查更新'
        });
      }
    } else {
      // 使用主源
      autoUpdater.setFeedURL({
        "provider": "generic",
        "url": "http://" + serverUrl + "/download/"
      });
      console.log('使用主源检查更新');
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-status', {
          status: 'restart',
          message: '使用主源检查更新'
        });
      }
    }

    autoUpdater.checkForUpdates();
  }

  app.on('ready', () => {
    // 自动启动守护服务（仅主进程直接运行时执行，防止递归）
    if (!process.env.__daemon && process.argv[1] && !process.argv[1].includes('process-protection.js')) {
      exec('node process-protection.js --run', { cwd: __dirname });
    }

    setAutoLaunch(true);
    createWindow();
    autoUpdater.allowInsecure = true;
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.disableWebInstaller = false;
    autoUpdater.autoDownload = false;
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', {
        status: 'update-checking',
        message: '检查更新中'
      });
    }
    autoUpdater.checkForUpdates();
    startUpdateCheck();
    enableProcessProtection();
  });

  function downloadUpdate() {
    autoUpdater.downloadUpdate().catch(err => {
      console.error('下载更新失败:', err);
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-status', {
          status: 'error',
          message: '下载更新失败'
        });
      }
    });
  }

  function createPasswordWindow(mode){
    if (passwordWindow){
      passwordWindow.show()
      return;
    }

    passwordWindow = new BrowserWindow({
      width: 500,
      height: 250,
      resizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'electron-preload.js')
      },
      icon: path.join(__dirname, 'icon.png'),
      show: false
    });


    passwordWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'password.html'),
      protocol: 'file:',
      slashes: true,
      search: '?mode='+mode+'&url='+serverUrl
    }));

    passwordWindow.setMenu(null);
    passwordWindow.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});
    passwordWindow.setAlwaysOnTop(true, 'screen-saver', 1);

    // 监听窗口失焦
    passwordWindow.on('blur', () => {
      if (!isFocusCycling) {
        startFocusCycle()
        shell.beep()
      }
      if (passwordWindow) passwordWindow.flashFrame(true); // 启动任务栏闪烁
    });

    function startFocusCycle() {
      isFocusCycling = true
      cycleCount = 0
      performFocusCycle()
    }

    function performFocusCycle() {
      if (cycleCount >= MAX_CYCLES) {
        isFocusCycling = false
        if (passwordWindow) passwordWindow.flashFrame(false); // 停止闪烁
        return
      }

      if (passwordWindow) passwordWindow.blur()

      setTimeout(() => {
        if (passwordWindow) passwordWindow.focus()
        cycleCount++
        setTimeout(performFocusCycle, 50)
      }, 50)
    }

    passwordWindow.once('ready-to-show', () => {
      passwordWindow.show();
    });

    passwordWindow.on('closed', () => {
      passwordWindow = null;
    });
  }

  autoUpdater.on('update-available', () => {
    downloadUpdate();
    console.log('发现新版本，开始下载...');
    if (updateCheckInterval) {
      clearInterval(updateCheckInterval);
    }
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', {
        status: 'update-available',
        message: '发现新版本，开始下载...'
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    console.log('没有可用更新');
    isUsingBackupSource = 0;
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
        message: '检查更新失败'
      });
    }

    // 开始尝试备用源
    if (!isUsingBackupSource){
        isUsingBackupSource = !isUsingBackupSource;
        console.log('开始尝试备用源');
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('update-status', {
            status: 'restart',
            message: '开始尝试备用源'
          });
        }
        checkForUpdates()
    }
    else{
        isUsingBackupSource = !isUsingBackupSource;
        console.log('检查更新失败');
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('update-status', {
            status: 'error',
            message: '主源和备用源更新均失败'
          });
        }
    }
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

  function shutdown() {
    isShuttingDown = true;
    stopProcessMonitor();
    if (mainWindow) {
      mainWindow.hide();
    }
    if (passwordWindow) {
      passwordWindow.hide();
    }
    if (danmakuWindow) {
      danmakuWindow.hide();
    }
    if (classWindow) {
      classWindow.hide();
    }
    if (historyWindow) {
      historyWindow.hide();
    }
    setTimeout(() => {
      app.quit();
    }, 1000);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('SIGQUIT', shutdown);
}
