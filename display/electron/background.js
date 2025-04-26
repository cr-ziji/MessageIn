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
      preload: path.join(__dirname, 'preload.js')
    },
    // 启动时显示
    show: false,
    // 启用窗口的阴影
    hasShadow: true,
    // 窗口背景色
    backgroundColor: '#121212'
  })

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
    // 加载 index.html
    win.loadURL('app://./index.html')
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
  // 获取屏幕尺寸
  const { width, height } = screen.getPrimaryDisplay().bounds

  try {
    console.log('创建弹幕窗口...')
    // 创建透明窗口
    danmakuWin = new BrowserWindow({
      width: width,
      height: 60, // 弹幕区域高度(仅顶部)
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
        // 允许透明度
        backgroundColor: '#00000000'
      },
      // 窗口设置
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      focusable: false, // 使窗口不接收键盘焦点
      show: false,
      // 使整个窗口背景透明
      backgroundColor: '#00000000',
      // 确保没有阴影
      hasShadow: false
    })

    // 在Windows上设置为工具窗口，确保在切换应用时依然保持在最前面
    if (process.platform === 'win32') {
      // 设置为工具窗口（总在最前）
      danmakuWin.setAlwaysOnTop(true, 'screen-saver')
      // 设置为穿透类型模式
      danmakuWin.setIgnoreMouseEvents(true, { forward: true })
    }
    
    // 在MacOS上设置窗口级别为最高
    if (process.platform === 'darwin') {
      danmakuWin.setAlwaysOnTop(true, 'screen-saver')
      danmakuWin.setIgnoreMouseEvents(true, { forward: true })
    }

    // 允许点击穿透，但弹幕区域可以接收点击
    setDanmakuClickRegion({ width: 0, height: 0 }); // 初始化为完全穿透

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // 加载弹幕组件URL（开发环境）
      await danmakuWin.loadURL(`${process.env.WEBPACK_DEV_SERVER_URL}#/danmaku-overlay`)
      console.log('弹幕窗口URL已加载:', `${process.env.WEBPACK_DEV_SERVER_URL}#/danmaku-overlay`)
    } else {
      // 加载弹幕组件（生产环境）
      await danmakuWin.loadURL('app://./index.html#/danmaku-overlay')
      console.log('弹幕窗口URL已加载: app://./index.html#/danmaku-overlay')
    }

    // 窗口准备好后显示
    danmakuWin.once('ready-to-show', () => {
      console.log('弹幕窗口准备显示')
      danmakuWin.show()
    })
    
    // 调试用
    if (isDevelopment) {
      danmakuWin.webContents.openDevTools({ mode: 'detach' })
    }
  } catch (error) {
    console.error('创建弹幕窗口失败:', error)
  }
}

// 设置弹幕窗口点击区域
function setDanmakuClickRegion(region) {
  if (!danmakuWin) return;
  
  try {
    // 设置只有弹幕区域可以点击，其他区域点击穿透
    danmakuWin.setIgnoreMouseEvents(true, { forward: true })
  } catch (error) {
    console.error('设置弹幕点击区域失败:', error)
  }
}

// 监听渲染进程的弹幕区域变更
ipcMain.on('update-danmaku-region', (event, region) => {
  setDanmakuClickRegion(region)
})

// 在应用程序初始化完成并准备创建浏览器窗口时调用此方法
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
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

// 监听来自渲染进程的弹幕控制指令
ipcMain.on('toggle-danmaku-overlay', (event, visible) => {
  console.log('收到切换弹幕窗口指令:', visible)
  if (danmakuWin) {
    if (visible) {
      danmakuWin.show()
    } else {
      danmakuWin.hide()
    }
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