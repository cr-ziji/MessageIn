const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const url = require('url');

// 保持对窗口对象的全局引用，避免JavaScript对象被垃圾回收时窗口关闭
let mainWindow;
let danmakuWindow;

// 创建主窗口
function createWindow() {
  // 获取屏幕尺寸
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js')
    },
    icon: path.join(__dirname, 'favicon.ico')
  });

  // 加载HTML文件
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // 打开开发者工具（可选）
  // mainWindow.webContents.openDevTools();

  // 主窗口加载完成后自动创建弹幕窗口
  mainWindow.webContents.on('did-finish-load', () => {
    // 延迟创建弹幕窗口，确保主窗口已完全加载
    setTimeout(() => {
      createDanmakuWindow();
    }, 500);
  });

  // 窗口关闭时触发
  mainWindow.on('closed', () => {
    // 取消引用 window 对象
    mainWindow = null;
    
    // 同时关闭弹幕窗口
    if (danmakuWindow) {
      danmakuWindow.close();
      danmakuWindow = null;
    }
  });
}

// 创建弹幕窗口
function createDanmakuWindow() {
  // 如果已经存在弹幕窗口则不再创建
  if (danmakuWindow) {
    danmakuWindow.show();
    return;
  }

  // 获取主显示器尺寸
  const { width } = screen.getPrimaryDisplay().workAreaSize;

  // 创建弹幕窗口
  danmakuWindow = new BrowserWindow({
    width: width,
    height: 50,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js')
    },
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: false,
    show: false,
    type: 'panel' // 添加panel类型以提高在某些系统上的置顶能力
  });

  // 加载弹幕专用模式的HTML
  danmakuWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
    search: '?mode=overlay'
  }));

  // 设置点击穿透
  danmakuWindow.setIgnoreMouseEvents(true, { forward: true });
  
  // 设置为在所有工作区可见（包括全屏应用）
  danmakuWindow.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});
  
  // 使用screen-saver级别确保最高置顶效果
  danmakuWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  
  // 设置不可全屏以防止在macOS上全屏时被其他应用遮挡
  danmakuWindow.setFullScreenable(false);

  // 窗口准备好后显示
  danmakuWindow.once('ready-to-show', () => {
    danmakuWindow.show();
  });

  // 窗口关闭时取消引用
  danmakuWindow.on('closed', () => {
    danmakuWindow = null;
  });
}

// 监听IPC消息
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

ipcMain.on('update-danmaku-style', (event, style) => {
  if (danmakuWindow) {
    if (style.transparent !== undefined) {
      danmakuWindow.setOpacity(style.transparent ? 1.0 : 0.9);
    }
    
    if (style.height !== undefined) {
      const { width } = screen.getPrimaryDisplay().workAreaSize;
      danmakuWindow.setBounds({
        width: width,
        height: style.height,
        x: 0,
        y: 0
      });
      
      // 更新窗口后重新设置始终置顶和点击穿透
      danmakuWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      danmakuWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  }
});

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 在 macOS 上，用户需要明确使用 Cmd + Q 退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，
  // 通常会在应用程序中重新创建一个窗口。
  if (mainWindow === null) {
    createWindow();
  }
}); 