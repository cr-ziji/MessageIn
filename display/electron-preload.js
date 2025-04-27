const { contextBridge, ipcRenderer } = require('electron');

// 在window对象上暴露API给渲染进程使用
contextBridge.exposeInMainWorld('electronAPI', {
  // 设置窗口始终置顶
  setAlwaysOnTop: (value) => {
    ipcRenderer.send('set-always-on-top', value);
  },
  
  // 创建外部弹幕窗口
  createExternalWindow: () => {
    ipcRenderer.send('create-external-window');
  },
  
  // 更新弹幕窗口样式
  updateDanmakuStyle: (style) => {
    ipcRenderer.send('update-danmaku-style', style);
  },
  
  // 获取应用信息
  getAppInfo: () => {
    return {
      isElectron: true,
      version: process.env.npm_package_version || '1.0.0',
      platform: process.platform
    }
  }
}); 