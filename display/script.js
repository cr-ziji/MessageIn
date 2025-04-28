const isElectron = () => {
  return window.navigator.userAgent.toLowerCase().indexOf('electron') > -1 || 
         typeof window.electronAPI !== 'undefined';
};

class DanmakuSystem {
  constructor() {
    this.apiUrl = 'http://www.cyupeng.com/message';
    this.pollingDelay = 1000;
    this.pollingInterval = null;
    this.lastContentHash = null;
    this.isRunning = true;
    this.danmakuArea = document.getElementById('danmakuArea');
    this.speed = 5;
    this.opacity = 0.8;
    this.isElectronMode = isElectron();
    this.externalWindow = null;
    this.messageCount = 0;
    this.isDebugMode = false;
    
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    this.speedRange = document.getElementById('speedRange');
    this.opacityRange = document.getElementById('opacityRange');
    this.topMostCheck = document.getElementById('topMostCheck');
    this.transparentCheck = document.getElementById('transparentCheck');
    this.debugPanel = document.getElementById('debugPanel');
    this.debugBtn = document.getElementById('debugBtn');
    
    if (this.isElectronMode) {
      document.body.classList.add('electron-active');
    }
    
    document.getElementById('toggleBtn').addEventListener('click', () => this.toggleRunning());
    document.getElementById('testBtn').addEventListener('click', () => this.sendTestDanmaku());
    document.getElementById('clearBtn').addEventListener('click', () => this.clearDanmaku());
    
    if (this.isElectronMode && document.getElementById('createExternalBtn')) {
      document.getElementById('createExternalBtn').addEventListener('click', () => this.createExternalWindow());
    }
    
    this.setupSpeedControl();
    
    this.opacityRange.addEventListener('input', (e) => {
      this.opacity = parseFloat(e.target.value) / 10;
      this.updateDanmakuOpacity();
      this.updateDebugInfo();
    });
    
    if (this.isElectronMode) {
      this.topMostCheck.addEventListener('change', (e) => {
        this.setAlwaysOnTop(e.target.checked);
      });
    }
    
    this.transparentCheck.addEventListener('change', (e) => {
      this.setTransparentBackground(e.target.checked);
    });
    
    this.debugBtn.addEventListener('click', () => {
      this.toggleDebugMode();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        this.toggleDebugMode();
      }
      
      if (e.ctrlKey && e.shiftKey && e.key === 'I' && this.isElectronMode && window.electronAPI) {
        window.electronAPI.toggleDevTools();
      }
    });
    
    this.initCorsProxy();
    this.initDebugInfo();
    this.startPolling();
    
    this.updateStatus('连接中...', 'connecting');
  }
  
  setupSpeedControl() {
    this.speedRange.value = this.speed;
    
    this.speedRange.addEventListener('input', (e) => {
      this.speed = parseInt(e.target.value);
      this.updateDanmakuSpeed();
      this.updateDebugInfo();
    });
    
    this.updateDanmakuSpeed();
  }
  
  initDebugInfo() {
    if (document.getElementById('debugApiUrl')) {
      document.getElementById('debugApiUrl').textContent = this.apiUrl;
    }
    if (document.getElementById('speedValue')) {
      document.getElementById('speedValue').textContent = this.speed;
    }
    if (document.getElementById('opacityValue')) {
      document.getElementById('opacityValue').textContent = this.opacity;
    }
  }
  
  updateDebugInfo() {
    if (document.getElementById('speedValue')) {
      document.getElementById('speedValue').textContent = this.speed;
    }
    if (document.getElementById('opacityValue')) {
      document.getElementById('opacityValue').textContent = this.opacity;
    }
    if (document.getElementById('messageCount')) {
      document.getElementById('messageCount').textContent = this.messageCount;
    }
  }
  
  toggleDebugMode() {
    this.isDebugMode = !this.isDebugMode;
    if (this.isDebugMode) {
      this.debugPanel.classList.add('active');
      this.debugBtn.textContent = '关闭调试';
    } else {
      this.debugPanel.classList.remove('active');
      this.debugBtn.textContent = '调试';
    }
  }
  
  updateStatus(text, status = 'success') {
    this.statusText.textContent = text;
    this.statusDot.className = 'status-dot' + (status === 'error' ? ' error' : '');
    
    if (document.getElementById('debugStatus')) {
      document.getElementById('debugStatus').textContent = text;
    }
  }
  
  initCorsProxy() {
    this.corsProxies = [
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://cors-proxy.fringe.zone/',
      'https://thingproxy.freeboard.io/fetch/'
    ];
  }
  
  startPolling() {
    this.fetchMessages();
    
    this.pollingInterval = setInterval(() => {
      this.fetchMessages();
    }, this.pollingDelay);
    
    console.log('已启动消息轮询，间隔:', this.pollingDelay, 'ms');
    this.updateStatus('已连接', 'success');
  }
  
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('已停止消息轮询');
      this.updateStatus('已暂停', 'error');
    }
  }
  
  toggleRunning() {
    this.isRunning = !this.isRunning;
    const toggleBtn = document.getElementById('toggleBtn');
    
    if (this.isRunning) {
      toggleBtn.textContent = '暂停弹幕';
      this.startPolling();
    } else {
      toggleBtn.textContent = '恢复弹幕';
      this.stopPolling();
    }
  }
  
  updateDanmakuSpeed() {
    const duration = 5 + (this.speed - 1) * (10 / 9);
    
    let style = document.getElementById('danmakuSpeedStyle');
    if (!style) {
      style = document.createElement('style');
      style.id = 'danmakuSpeedStyle';
      document.head.appendChild(style);
    }
    
    style.textContent = `
      .danmaku-item {
        animation-duration: ${duration}s !important;
      }
    `;
    
    console.log('弹幕速度已更新:', duration + 's');
  }
  
  updateDanmakuOpacity() {
    let style = document.getElementById('danmakuOpacityStyle');
    if (!style) {
      style = document.createElement('style');
      style.id = 'danmakuOpacityStyle';
      document.head.appendChild(style);
    }
    
    style.textContent = `
      .danmaku-item {
        background-color: rgba(0, 0, 0, ${this.opacity}) !important;
      }
    `;
  }
  
  setTransparentBackground(isTransparent) {
    if (isTransparent) {
      document.body.classList.add('transparent-mode');
    } else {
      document.body.classList.remove('transparent-mode');
    }
    
    if (this.isElectronMode && window.electronAPI) {
      window.electronAPI.updateDanmakuStyle({ transparent: isTransparent });
    }
  }
  
  setAlwaysOnTop(isTopMost) {
    if (this.isElectronMode && window.electronAPI) {
      window.electronAPI.setAlwaysOnTop(isTopMost);
    }
  }
  
  createExternalWindow() {
    if (this.isElectronMode && window.electronAPI) {
      window.electronAPI.createExternalWindow();
    }
  }
  
  clearDanmaku() {
    while (this.danmakuArea.firstChild) {
      this.danmakuArea.removeChild(this.danmakuArea.firstChild);
    }
  }
  
  async fetchMessages() {
    try {
      const response = await this.fetchWithProxy(this.apiUrl);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const rawText = await response.text();
      console.log('API原始响应:', rawText);
      
      const content = this.extractContentFromText(rawText);
      console.log('提取的消息内容:', content);
      
      if (content) {
        const contentHash = this.getContentHash(content);
        
        if (contentHash !== this.lastContentHash) {
          console.log('发现新消息:', content);
          this.lastContentHash = contentHash;
          this.addDanmaku(content);
          this.messageCount++;
          this.updateDebugInfo();
          
          if (document.getElementById('lastMessage')) {
            document.getElementById('lastMessage').textContent = 
              content.length > 20 ? content.substring(0, 20) + '...' : content;
          }
          
          this.updateStatus('已收到新消息', 'success');
        }
      }
    } catch (error) {
      console.error('获取消息失败:', error);
      this.updateStatus('获取消息失败', 'error');
    }
  }
  
  async fetchWithProxy(url) {
    if (this.isElectronMode) {
      try {
        console.log('Electron环境直接请求:', url);
        
        const directResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': '*/*'
          }
        });
        
        if (directResponse.ok) {
          console.log('直接请求成功');
          return directResponse;
        }
      } catch (error) {
        console.warn('Electron直接请求失败，将尝试代理:', error);
      }
    }
    
    try {
      console.log('尝试直接请求:', url);
      
      const directResponse = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': '*/*'
        }
      });
      
      if (directResponse.ok) {
        console.log('直接请求成功');
        return directResponse;
      }
    } catch (error) {
      console.warn('直接请求失败，将尝试代理:', error);
    }
    
    let lastError;
    
    for (const proxy of this.corsProxies) {
      try {
        const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
        console.log('尝试使用代理:', proxyUrl);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': '*/*'
          }
        });
        
        if (response.ok) {
          console.log('使用代理成功:', proxy);
          return response;
        } else {
          console.warn(`代理 ${proxy} 返回非200状态码:`, response.status);
        }
      } catch (error) {
        console.warn(`代理 ${proxy} 请求失败:`, error);
        lastError = error;
      }
    }
    
    console.error('所有尝试均失败');
    throw lastError || new Error('无法获取数据：所有请求方式均失败');
  }
  
  extractContentFromText(text) {
    if (!text || typeof text !== 'string') {
      return null;
    }
    
    const trimmed = text.trim();
    
    try {
      const json = JSON.parse(trimmed);
      if (json.content) {
        return json.content;
      }
      if (json.message) {
        return json.message;
      }
      return JSON.stringify(json);
    } catch (e) {
    }
    
    const contentMatch = trimmed.match(/['"]content['"]:\s*['"](.+?)['"]/);
    if (contentMatch && contentMatch[1]) {
      return contentMatch[1];
    }
    
    if (trimmed.length < 100) {
      return trimmed;
    }
    
    const simpleContentMatch = trimmed.match(/{(.+?)}/);
    if (simpleContentMatch && simpleContentMatch[1]) {
      return simpleContentMatch[1];
    }
    
    if (trimmed.includes('大乐子')) {
      return '大乐子';
    }
    
    return trimmed;
  }
  
  getContentHash(content) {
    let hash = 0;
    if (!content) return hash;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
  
  addDanmaku(content) {
    const danmaku = document.createElement('div');
    danmaku.className = 'danmaku-item';
    danmaku.textContent = content;
    
    danmaku.style.color = this.getRandomColor();
    danmaku.style.fontSize = `${18 + Math.floor(Math.random() * 4) * 2}px`;
    
    this.danmakuArea.appendChild(danmaku);
    
    danmaku.addEventListener('animationend', () => {
      danmaku.remove();
    });
  }
  
  sendTestDanmaku() {
    const testMessages = [
      'MessageIn测试消息',
      '欢迎使用MessageIn显示端',
      '实时消息系统已启动',
      '这是一条测试消息',
      '这是一条长一点的MessageIn测试消息，用于测试显示效果'
    ];
    
    const randomIndex = Math.floor(Math.random() * testMessages.length);
    this.addDanmaku(testMessages[randomIndex]);
    this.messageCount++;
    this.updateDebugInfo();
  }
  
  getRandomColor() {
    const colors = [
      '#ffffff',
      '#ff4757',
      '#2ed573',
      '#1e90ff',
      '#f1c40f',
      '#e84393',
      '#00cec9'
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

class ElectronBridge {
  constructor() {
    this.isElectron = isElectron();
    
    if (this.isElectron && window.electronAPI) {
      console.log('Electron API 可用');
    } else {
      console.log('非Electron环境或API不可用');
    }
  }
  
  setAlwaysOnTop(value) {
    if (this.isElectron && window.electronAPI && window.electronAPI.setAlwaysOnTop) {
      window.electronAPI.setAlwaysOnTop(value);
    } else {
      console.log('模拟设置始终置顶:', value);
    }
  }
  
  createExternalWindow() {
    if (this.isElectron && window.electronAPI && window.electronAPI.createExternalWindow) {
      window.electronAPI.createExternalWindow();
    } else {
      alert('此功能仅在Electron环境中可用');
    }
  }
  
  updateDanmakuStyle(style) {
    if (this.isElectron && window.electronAPI && window.electronAPI.updateDanmakuStyle) {
      window.electronAPI.updateDanmakuStyle(style);
    } else {
      console.log('模拟更新弹幕样式:', style);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.electronBridge = new ElectronBridge();
  window.danmakuSystem = new DanmakuSystem();
  
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  
  if (mode === 'external' || mode === 'overlay') {
    document.getElementById('mainContainer').classList.add('external-window-mode');
    document.body.classList.add('transparent-mode');
  }
});

if (typeof window.electronAPI === 'undefined' && isElectron()) {
  window.electronAPI = {
    setAlwaysOnTop: (value) => console.log('需要实现 setAlwaysOnTop:', value),
    createExternalWindow: () => console.log('需要实现 createExternalWindow'),
    updateDanmakuStyle: (style) => console.log('需要实现 updateDanmakuStyle:', style),
    toggleDevTools: () => console.log('需要实现 toggleDevTools')
  };
}