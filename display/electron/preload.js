// 预加载脚本，用于在渲染进程中安全地暴露Node.js API
const { contextBridge, ipcRenderer } = require('electron')

// 在window对象上暴露API给渲染进程使用
contextBridge.exposeInMainWorld('electron', {
  // 发送消息到主进程
  send: (channel, data) => {
    // 白名单channels
    const validChannels = ['message-event', 'app-event', 'update-danmaku-region']
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  // 从主进程接收消息
  receive: (channel, func) => {
    const validChannels = ['message-reply', 'app-update']
    if (validChannels.includes(channel)) {
      // 删除旧监听器以避免内存泄漏
      ipcRenderer.removeAllListeners(channel)
      // 添加新监听器
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  }
})

// 向渲染进程暴露API
contextBridge.exposeInMainWorld('electronAPI', {
  // 弹幕控制
  toggleDanmakuOverlay: (visible) => ipcRenderer.send('toggle-danmaku-overlay', visible),
  
  // 更新弹幕区域
  updateDanmakuRegion: (region) => ipcRenderer.send('update-danmaku-region', region),
  
  // 应用信息
  getAppInfo: () => {
    return {
      isElectron: true,
      version: process.env.npm_package_version || '1.0.0',
      platform: process.platform
    }
  }
}) 