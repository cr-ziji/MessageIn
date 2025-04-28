const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAlwaysOnTop: (value) => {
    ipcRenderer.send('set-always-on-top', value);
  },

  createExternalWindow: () => {
    ipcRenderer.send('create-external-window');
  },

  updateDanmakuStyle: (style) => {
    ipcRenderer.send('update-danmaku-style', style);
  },

  getAppInfo: () => {
    return {
      isElectron: true,
      version: process.env.npm_package_version || '1.0.0',
      platform: process.platform
    }
  }
}); 