const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  createClassWindow: () => {
    ipcRenderer.send('create-class-window');
  },

  createPasswordWindow: (type) => {
    ipcRenderer.send('create-password-window', type);
  },

  createHistoryWindow: (sid) => {
    ipcRenderer.send('create-history-window', sid);
  },
  
  checkPassword: (check) => {
    if (check == true){
      ipcRenderer.send('create-class-window');
    }
  },
  
  checkQuit: (check) => {
    if (check == true){
      ipcRenderer.send('quit');
    }
  },

  testTransparentWindow: () => {
    console.log('调用测试透明背景API');
    ipcRenderer.send('test-transparent-window');
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

  refreshAllWindows: () => {
    ipcRenderer.send('refresh-all-windows');
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
  },
  
  setClassParam: (classParam) => {
    ipcRenderer.send('set-class-param', classParam);
  },
  
  changeClassParam: (callback) => {
    ipcRenderer.removeAllListeners('set-class-param');
    ipcRenderer.on('set-class-param', (event, classParam) => {
      callback(classParam);
    });
  },
  
  setSid: (sid) => {
    ipcRenderer.send('set-sid', sid);
  },
  
  changeSid: (callback, sid) => {
    ipcRenderer.removeAllListeners('set-sid');
    ipcRenderer.on('set-sid', (event, sid) => {
      callback(sid);
    });
  },

  toggleProcessProtection: (enabled) => {
    ipcRenderer.send('toggle-process-protection', enabled);
  },

  getProcessProtectionStatus: () => {
    ipcRenderer.send('get-process-protection-status');
  },

  onProcessProtectionStatus: (callback) => {
    ipcRenderer.removeAllListeners('process-protection-status');
    ipcRenderer.on('process-protection-status', (event, status) => {
      callback(status);
    });
  },

  forceQuit: () => {
    ipcRenderer.send('quit');
  },
}); 
