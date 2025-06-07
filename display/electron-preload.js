const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAlwaysOnTop: (value) => {
    ipcRenderer.send('set-always-on-top', value);
  },

  createExternalWindow: () => {
    ipcRenderer.send('create-external-window');
  },

  testTransparentWindow: () => {
    console.log('调用测试透明背景API');
    ipcRenderer.send('test-transparent-window');
  },

  updateDanmakuStyle: (style) => {
    ipcRenderer.send('update-danmaku-style', style);
  },

  setApiUrl: (url) => {
    ipcRenderer.send('set-api-url', url);
  },

  onApiUrlChange: (callback) => {
    ipcRenderer.removeAllListeners('api-url-changed');
    ipcRenderer.on('api-url-changed', (event, url) => {
      callback(url);
    });
  },

  getAppInfo: () => {
    return {
      isElectron: true,
      version: process.env.npm_package_version || '1.0.0',
      platform: process.platform
    }
  },

  minimizeToTray: () => {
    ipcRenderer.send('minimize-to-tray');
  },

  showMainWindow: () => {
    ipcRenderer.send('show-main-window');
  },

  handleDanmakuMouseEvent: (type, isOverDanmaku) => {
    ipcRenderer.send('danmaku-mouse-event', { type, isOverDanmaku });
  },

  onUpdateStatus: (callback) => {
    ipcRenderer.removeAllListeners('update-status');
    ipcRenderer.on('update-status', (event, status) => {
      callback(status);
    });
  },

  toggleDevTools: () => {
    ipcRenderer.send('toggle-dev-tools');
  },

  sendDanmakuCommand: (command) => {
    ipcRenderer.send('danmaku-command', command);
  },

  openExternal: (url) => {
    ipcRenderer.send('open-external', url);
  },

  onDanmakuCommand: (callback) => {
    ipcRenderer.removeAllListeners('danmaku-command');
    ipcRenderer.on('danmaku-command', (event, command) => {
      callback(command);
    });
  }
}); 