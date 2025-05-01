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
    this.speed = 2;
    this.opacity = 0.8;
    this.isElectronMode = isElectron();
    this.externalWindow = null;
    this.messageCount = 0;
    this.isDebugMode = false;
    this.messageCache = new Map();
    this.cacheDuration = 3;
    this.processedMessages = new Set();

    const urlParams = new URLSearchParams(window.location.search);
    this.isOverlayMode = urlParams.get('mode') === 'overlay';

    if (this.isOverlayMode) {
      document.body.classList.add('transparent-mode');
      document.getElementById('mainContainer').classList.add('external-window-mode');
    }
    
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

    if (!this.isOverlayMode) {
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
    }
    
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
    const minDuration = 3; 
    const maxDuration = 15;

    const normalizedSpeed = (11 - this.speed) / 10;
    const duration = minDuration + (maxDuration - minDuration) * Math.pow(normalizedSpeed, 1.5);
    
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
    
    console.log('弹幕速度已更新:', duration.toFixed(2) + 's');
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
      
      const a = this.extractContentFromText(rawText);
      let responseObj;
      try {
        responseObj = JSON.parse(a);
      } catch (error) {
        console.error('解析API响应失败:', error);
        return;
      }

      if (responseObj.new && responseObj.new.content && responseObj.new.uuid) {
        this.processMessage(responseObj.new.content, responseObj.new.uuid);
        
        if (responseObj.back && responseObj.back.uuid) {
          if ($('#'+responseObj.back.uuid).length > 0) {
            $('#'+responseObj.back.uuid)[0].innerHTML = '此消息已撤回';
          }
        }
      }
      
      else if (Array.isArray(responseObj)) {
        for (const msg of responseObj) {
          if (msg.content && msg.uuid) {
            this.processMessage(msg.content, msg.uuid);
          }
        }
      }
      
      this.playFromCache();
      
    } catch (error) {
      console.error('获取消息失败:', error);
      this.updateStatus('获取消息失败', 'error');
    }
  }
  
  processMessage(content, uuid) {
    const contentHash = this.getContentHash(content + uuid);
    
    if (this.processedMessages.has(contentHash)) {
      return;
    }
    
    this.processedMessages.add(contentHash);
    
    if (!this.messageCache.has(uuid)) {
      this.messageCache.set(uuid, {
        content: content,
        playCount: 0
      });
    }
    
    this.addDanmaku(content, uuid, this.messageCache.get(uuid).playCount);
    this.messageCount++;
    this.updateDebugInfo();
    
    this.updateStatus('已收到新消息', 'success');
    
    const lastDanmaku = $('.danmaku-item').last()[0];
    lastDanmaku.textContent = content.length > 20 ? content.substring(0, 20) + '...' : content;
    
    $(lastDanmaku).attr('id', uuid);
    
    if (!lastDanmaku.querySelector('button')) {
      const button = document.createElement('button');
      button.title = "标记为已读";
      button.textContent = "✓";
      lastDanmaku.appendChild(button);
      
      $(button).on('click', function(e){
        e.stopPropagation();
        
        $.ajax('www.cyupeng.com/updata?uuid='+$(this).parent().attr('id'));
        const danmakuEl = $(this).parent()[0];
        
        const currentPosition = danmakuEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const currentX = (currentPosition.left / viewportWidth) * 100;
        
        danmakuEl.style.setProperty('--current-x', `${currentX}vw`);
        
        $(this).parent().addClass('ok');
        
        const uuid = $(this).parent().attr('id');
        if (uuid && window.danmakuSystem.messageCache.has(uuid)) {
          window.danmakuSystem.messageCache.delete(uuid);
        }
        
        $(this).css('display', 'none');
      });
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
  
  addDanmaku(content, uuid = null, playCount = 0) {
    const danmaku = document.createElement('div');
    danmaku.className = 'danmaku-item';
    danmaku.textContent = content;
    
    if (uuid) {
      danmaku.setAttribute('id', uuid);
      danmaku.setAttribute('data-play-count', playCount);
    }

    if (this.isOverlayMode) {
    } else {
      danmaku.style.fontSize = '18px';
    }

    danmaku.style.transform = 'translateX(100vw) translateZ(0)';
    danmaku.style.webkitFontSmoothing = 'antialiased';
    danmaku.style.backfaceVisibility = 'hidden';
    
    danmaku.addEventListener('click', () => {
      if (!danmaku.classList.contains('ok')) {
        const button = danmaku.querySelector('button');
        if (button) {
          button.click();
        } else {
          danmaku.classList.add('ok');
          const uuid = danmaku.getAttribute('id');
          if (uuid && this.messageCache.has(uuid)) {
            this.messageCache.delete(uuid);
          }
        }
      }
    });

    this.danmakuArea.appendChild(danmaku);
    
    danmaku.addEventListener('animationend', (event) => {
      if (event.animationName === 'danmaku-move' || event.animationName === 'danmaku-move-fast') {
        const uuid = danmaku.getAttribute('id');
        const playCount = parseInt(danmaku.getAttribute('data-play-count') || '0');
        
        if (danmaku.classList.contains('ok') || !uuid) {
          danmaku.remove();
          return;
        }
        
        if (playCount >= this.cacheDuration) {
          if (uuid && this.messageCache.has(uuid)) {
            this.messageCache.delete(uuid);
          }
          danmaku.remove();
        } else {
          danmaku.remove();
        }
      }
    });
  }
  
  sendTestDanmaku() {
    const testMessages = [
      'MessageIn测试消息',
    ];
    
    const randomIndex = Math.floor(Math.random() * testMessages.length);
    this.addDanmaku(testMessages[randomIndex]);
    this.messageCount++;
    this.updateDebugInfo();
  }
  
  playFromCache() {
    const maxConcurrentMessages = 3;
    let playedCount = 0;
    
    const visibleDanmaku = new Set();
    document.querySelectorAll('.danmaku-item').forEach(el => {
      const id = el.getAttribute('id');
      if (id) visibleDanmaku.add(id);
    });
    
    const pendingMessages = [];
    for (const [uuid, messageData] of this.messageCache.entries()) {
      if (!visibleDanmaku.has(uuid) && messageData.playCount < this.cacheDuration) {
        pendingMessages.push({ uuid, messageData });
      }
    }
    
    pendingMessages.sort(() => Math.random() - 0.5);
    
    for (const { uuid, messageData } of pendingMessages) {
      if (playedCount >= maxConcurrentMessages) break;
      
      if (document.getElementById(uuid)) continue;
      
      const newCount = messageData.playCount + 1;
      this.messageCache.set(uuid, {
        content: messageData.content,
        playCount: newCount
      });
      
      this.addDanmaku(messageData.content, uuid, newCount);
      
      const newDanmaku = document.getElementById(uuid);
      if (newDanmaku) {
        newDanmaku.textContent = messageData.content.length > 20 ? 
                                 messageData.content.substring(0, 20) + '...' : 
                                 messageData.content;
        
        if (!newDanmaku.querySelector('button')) {
          const button = document.createElement('button');
          button.title = "标记为已读";
          button.textContent = "✓";
          
          button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            $.ajax('www.cyupeng.com/updata?uuid=' + uuid);
            const danmakuEl = newDanmaku;
            
            const currentPosition = danmakuEl.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const currentX = (currentPosition.left / viewportWidth) * 100;
            
            danmakuEl.style.setProperty('--current-x', `${currentX}vw`);
            
            danmakuEl.classList.add('ok');
            
            if (uuid && window.danmakuSystem.messageCache.has(uuid)) {
              window.danmakuSystem.messageCache.delete(uuid);
            }
            
            button.style.display = 'none';
          });
          
          newDanmaku.appendChild(button);
        }
      }
      
      playedCount++;
    }
    
    for (const [uuid, messageData] of this.messageCache.entries()) {
      if (messageData.playCount >= this.cacheDuration) {
        this.messageCache.delete(uuid);
      }
    }
    
    const maxCacheSize = 50;
    if (this.messageCache.size > maxCacheSize) {
      const entries = Array.from(this.messageCache.entries());
      entries.sort((a, b) => a[1].playCount - b[1].playCount);
      
      const toDelete = entries.length - maxCacheSize;
      for (let i = 0; i < toDelete; i++) {
        this.messageCache.delete(entries[i][0]);
      }
    }
    
    if (this.processedMessages.size > 200) {
      const messages = Array.from(this.processedMessages);
      this.processedMessages = new Set(messages.slice(messages.length - 100));
    }
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
});

if (typeof window.electronAPI === 'undefined' && isElectron()) {
  window.electronAPI = {
    setAlwaysOnTop: (value) => console.log('需要实现 setAlwaysOnTop:', value),
    createExternalWindow: () => console.log('需要实现 createExternalWindow'),
    updateDanmakuStyle: (style) => console.log('需要实现 updateDanmakuStyle:', style),
    toggleDevTools: () => console.log('需要实现 toggleDevTools')
  };
}
