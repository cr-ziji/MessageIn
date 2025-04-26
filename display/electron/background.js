'use strict'

const { app, protocol, BrowserWindow, screen, ipcMain } = require('electron')
const { createProtocol } = require('vue-cli-plugin-electron-builder/lib')
const installExtension = require('electron-devtools-installer').default
const { VUEJS3_DEVTOOLS } = require('electron-devtools-installer')
const path = require('path')

const isDevelopment = process.env.NODE_ENV !== 'production'

// 保持window对象的全局引用，避免JavaScript对象被垃圾回收时窗口关闭
let win
// 添加一个透明弹幕窗口引用
let danmakuWin

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

// 创建主窗口
async function createWindow() {
  // 获取屏幕尺寸
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  // 创建浏览器窗口
  win = new BrowserWindow({
    width: Math.min(1600, width),
    height: Math.min(900, height),
    webPreferences: {
      // 禁用渲染进程中的Node.js集成，改为使用preload.js
      nodeIntegration: false,
      contextIsolation: true,
      // 添加预加载脚本
      preload: path.join(__dirname, 'preload.js'),
      // 禁用web安全性，允许跨域请求
      webSecurity: false
    },
    // 启动时显示
    show: false,
    // 启用窗口的阴影
    hasShadow: true,
    // 窗口背景色
    backgroundColor: '#121212',
    // 设置应用图标
    icon: path.join(__dirname, '../public/favicon.png')
  })

  // 禁用同源策略，允许跨域请求
  win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
  });

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Headers': ['*'],
        ...details.responseHeaders,
      },
    });
  });

  // 窗口准备好后显示，避免白屏
  win.once('ready-to-show', () => {
    win.show()
    // 创建弹幕窗口
    setTimeout(() => {
      createDanmakuWindow()
    }, 1000)
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // 如果在开发环境，加载开发服务器URL
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // 加载 index.html 并确保使用哈希路由
    win.loadURL('app://./index.html/#/')
  }

  win.on('closed', () => {
    win = null
    // 关闭弹幕窗口
    if (danmakuWin) {
      danmakuWin.close()
      danmakuWin = null
    }
  })
}

// 创建透明弹幕窗口
async function createDanmakuWindow() {
  // 获取主显示器尺寸
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  console.log('创建弹幕窗口...');
  // 创建透明窗口
  danmakuWin = new BrowserWindow({
    width: width, // 使用整个屏幕宽度
    height: 40, // 调整为单行弹幕高度
    x: 0,
    y: 0,
    frame: false, // 无边框
    transparent: true, // 透明背景
    alwaysOnTop: true, // 始终置顶
    skipTaskbar: true, // 不在任务栏显示
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundColor: '#00000000', // 确保背景透明
      devTools: false, // 只在开发环境启用调试工具
      webSecurity: false // 禁用web安全性，允许跨域请求
    },
    // 窗口设置
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: false, // 使窗口不接收键盘焦点
    show: false, // 先不显示，等待准备好后再显示
    hasShadow: false, // 确保没有阴影
  });

  // 设置透明窗口允许跨域请求
  danmakuWin.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
  });

  danmakuWin.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Headers': ['*'],
        ...details.responseHeaders,
      },
    });
  });

  // 设置窗口级别为最高级别，确保始终保持在最顶层
  if (process.platform === 'win32') {
    // Windows平台设置
    danmakuWin.setAlwaysOnTop(true, 'screen-saver', 1);
    // 设置完全点击穿透
    danmakuWin.setIgnoreMouseEvents(true, { forward: true });
  } else if (process.platform === 'darwin') {
    // macOS平台设置
    danmakuWin.setAlwaysOnTop(true, 'screen-saver', 1);
    danmakuWin.setIgnoreMouseEvents(true, { forward: true });
  } else {
    // Linux平台设置
    danmakuWin.setAlwaysOnTop(true, 'screen-saver');
    danmakuWin.setIgnoreMouseEvents(true, { forward: true });
  }

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // 加载开发服务器URL
    await danmakuWin.loadURL(`${process.env.WEBPACK_DEV_SERVER_URL}#/danmaku-only`);
    console.log('弹幕窗口URL已加载:', `${process.env.WEBPACK_DEV_SERVER_URL}#/danmaku-only`);
  } else {
    // 加载生产环境URL
    await danmakuWin.loadURL('app://./index.html#/danmaku-only');
    console.log('弹幕窗口URL已加载: app://./index.html#/danmaku-only');
  }

  // 窗口准备好后显示
  danmakuWin.once('ready-to-show', () => {
    console.log('弹幕窗口准备显示');
    danmakuWin.show();
  });

  // 禁用调试工具，仅在开发环境中需要时才打开
  if (isDevelopment && false) { // 设置为false禁用调试工具
    danmakuWin.webContents.openDevTools({ mode: 'detach' });
  }
}

// 监听来自渲染进程的弹幕控制指令
ipcMain.on('toggle-danmaku-overlay', (event, visible) => {
  console.log('收到切换弹幕窗口指令:', visible);
  if (danmakuWin) {
    if (visible) {
      danmakuWin.show();
    } else {
      danmakuWin.hide();
    }
  }
});

// 更新弹幕窗口样式
ipcMain.on('update-danmaku-style', (event, style) => {
  console.log('更新弹幕样式:', style);
  if (danmakuWin && style) {
    // 如果有高度信息，则调整窗口高度
    if (style.height) {
      const { width } = screen.getPrimaryDisplay().workAreaSize;
      danmakuWin.setBounds({ 
        width: width, 
        height: style.height, 
        x: 0, 
        y: 0 
      });
    }
  }
});

// 在应用程序初始化完成并准备创建浏览器窗口时调用此方法
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST && false) { // 设置为false禁用Vue Devtools
    // 安装Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools 安装失败:', e.toString())
    }
  }
  createWindow()
})

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上应用程序和菜单栏保持活跃状态直到用户使用Cmd + Q明确退出
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // 在macOS上，当点击dock图标且没有其他窗口打开时，通常会重新创建应用程序窗口
  if (win === null) {
    createWindow()
  }
})

// 在开发模式下，根据父进程的请求处理退出
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
} 