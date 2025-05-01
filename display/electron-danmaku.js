const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require('electron');
const path = require('path');
const url = require('url');

// 保持对窗口对象的全局引用，避免JavaScript对象被垃圾回收时窗口关闭
let mainWindow;
let danmakuWindow;
let tray = null;

// 设置开机自启动
function setAutoLaunch(enable) {
  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath,
      args: ['--hidden'] // 添加启动参数，用于标识是否隐藏主窗口
    });
  }
}

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
    icon: path.join(__dirname, 'icon.png'),
    show: false // 默认不显示主窗口
  });

  // 加载HTML文件
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // 创建系统托盘
  createTray();

  // 监听窗口最小化事件
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  // 监听窗口关闭事件
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

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

// 创建系统托盘
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
  
  // 双击托盘图标显示主窗口
  tray.on('double-click', () => {
    mainWindow.show();
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
    hasShadow: false, // 禁用阴影
    backgroundColor: '#00000000', // 完全透明的背景色
    opacity: 1.0, // 设置为完全不透明，由CSS控制内容的透明度
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js'),
      experimentalFeatures: true, // 启用实验性功能
    },
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: false,
    show: false,
    type: 'panel', // 添加panel类型以提高在某些系统上的置顶能力
    titleBarStyle: 'hidden', // 隐藏标题栏
    visualEffectState: 'active' // 在macOS上启用活动视觉效果
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
    // 确保窗口显示前再次设置背景透明
    danmakuWindow.setBackgroundColor('#00000000');
    
    // 在Windows上使用特殊API设置透明度
    if (process.platform === 'win32') {
      try {
        // 尝试使用Windows特有的DWM API设置透明度
        danmakuWindow.setOpacity(1.0);
      } catch (e) {
        console.error('设置Windows透明度失败:', e);
      }
    }
    
    danmakuWindow.show();
    
    // 添加调试代码，检查窗口是否成功创建和显示
    console.log('弹幕窗口已创建并显示');
    
    // 打开开发者工具用于调试
    // danmakuWindow.webContents.openDevTools({ mode: 'detach' });
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
      // 修改透明度控制逻辑
      const opacity = style.transparent ? 1.0 : 1.0; // 始终保持1.0以便背景透明
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
      
      // 更新窗口后重新设置始终置顶和点击穿透
      danmakuWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      danmakuWindow.setIgnoreMouseEvents(true, { forward: true });
      
      // 确保窗口背景仍然透明
      danmakuWindow.setBackgroundColor('#00000000');
    }
  }
});

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  // 强制启用开机自启动
  setAutoLaunch(true);
  
  // 创建窗口
  createWindow();
  
  // 创建完窗口后立即隐藏主窗口
  if (mainWindow) {
    mainWindow.hide();
  }
});

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