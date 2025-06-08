const isElectron = () => {
  return window.navigator.userAgent.toLowerCase().indexOf('electron') > -1 ||
    typeof window.electronAPI !== 'undefined';
};

class DanmakuSystem {
  constructor() {
    this.classParam = localStorage.getItem('classParam') ? localStorage.getItem('classParam') : null;
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
    this.socketUrl = 'http://www.cyupeng.com';
    this.socket = null;
    this.verificationDialog = document.getElementById('verificationDialog');
    this.verificationTitle = document.getElementById('verificationTitle');
    this.verificationInput = document.getElementById('verificationInput');
    this.verificationError = document.getElementById('verificationError');
    this.submitVerification = document.getElementById('submitVerification');
    this.skipVerification = document.getElementById('skipVerification');

    const urlParams = new URLSearchParams(window.location.search);
    this.isOverlayMode = urlParams.get('mode') === 'overlay';

    if (this.isOverlayMode) {
      document.body.classList.add('transparent-mode');
      document.getElementById('mainContainer').classList.add('external-window-mode');
      document.body.style.height = '40px';
      document.body.style.overflow = 'hidden';
      document.body.style.background = 'transparent';
      document.body.style.pointerEvents = 'none';
      const danmakuArea = document.getElementById('danmakuArea');
      if (danmakuArea) {
        danmakuArea.style.pointerEvents = 'none';
      }
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
      if (window.electronAPI && window.electronAPI.disableDevTools) {
        window.electronAPI.disableDevTools();
      }

      if (window.electronAPI && window.electronAPI.onShowVerification) {
        window.electronAPI.onShowVerification((type) => {
          this.showVerificationDialog(type);
        });
      }
    }

    if (!this.isOverlayMode) {
      document.getElementById('toggleBtn').addEventListener('click', () => {
        this.toggleRunning();
        if (this.isElectronMode && window.electronAPI) {
          window.electronAPI.sendDanmakuCommand && window.electronAPI.sendDanmakuCommand({ type: 'toggle', value: this.isRunning });
        }
      });
      document.getElementById('changeBtn').addEventListener('click', () => {
        this.changeClass();
        if (this.isElectronMode && window.electronAPI) {
          window.electronAPI.sendDanmakuCommand && window.electronAPI.sendDanmakuCommand({ type: 'change'});
        }
      });
      document.getElementById('testBtn').addEventListener('click', () => {
        this.sendTestDanmaku();
        if (this.isElectronMode && window.electronAPI) {
          window.electronAPI.sendDanmakuCommand && window.electronAPI.sendDanmakuCommand({ type: 'test' });
        }
      });
      document.getElementById('clearBtn').addEventListener('click', () => {
        this.clearDanmaku();
        if (this.isElectronMode && window.electronAPI) {
          window.electronAPI.sendDanmakuCommand && window.electronAPI.sendDanmakuCommand({ type: 'clear' });
        }
      });

      if (this.isElectronMode && document.getElementById('createExternalBtn')) {
        document.getElementById('createExternalBtn').addEventListener('click', () => this.createExternalWindow());
      }

      this.setupSpeedControl();
      this.setupOpacityControl();

      const helpBtn = document.getElementById('helpBtn');
      if (helpBtn) {
        helpBtn.addEventListener('click', () => {
          const helpUrl = this.socketUrl + '/help?name=02_学生端帮助文档.md';
          if (this.isElectronMode && window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal(helpUrl);
          } else {
            window.open(helpUrl, '_blank');
          }
        });
      }

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

    if (!this.classParam) {
      this.showVerificationDialog();
    } else {
      this.startConnection();
    }

    this.updateSocketUrlDisplay();

    if (this.isElectronMode && window.electronAPI && window.electronAPI.onUpdateStatus) {
      window.electronAPI.onUpdateStatus((status) => {
        console.log('收到更新状态:', status);
        if (status.status === 'error') {
          this.updateStatus('更新错误: ' + status.message, 'error');
        } else if (status.status === 'update-available') {
          this.updateStatus('发现新版本，正在下载...', 'success');
        } else if (status.status === 'update-not-available') {
          this.updateStatus('已是最新版本', 'success');
        } else if (status.status === 'update-downloaded') {
          this.updateStatus('更新已下载，即将安装', 'success');
        } else if (status.status === 'download-progress') {
          this.updateStatus('下载进度: ' + Math.round(status.percent) + '%', 'success');
        } else if (status.status === 'restart') {
          this.updateStatus('开始尝试备用源', 'success');
        }
      });
    }
	
	if (this.isElectronMode && window.electronAPI && window.electronAPI.changeClassParam) {
	  window.electronAPI.changeClassParam((classParam) => {
	    console.log('收到班级更改:', classParam);
	    this.classParam = classParam;
		this.startConnection()
	  });
	}

    if (this.isOverlayMode && this.isElectronMode && window.electronAPI && window.electronAPI.onDanmakuCommand) {
      window.electronAPI.onDanmakuCommand((command) => {
        console.log('[overlay] 收到 danmaku-command:', command);
        this.handleDanmakuCommand(command);
      });
    }
  }

  setupSpeedControl() {
    this.speedRange.value = this.speed;

    this.speedRange.addEventListener('input', (e) => {
      this.speed = parseInt(e.target.value);
      this.updateDanmakuSpeed();
      this.updateDebugInfo();
      if (this.isElectronMode && window.electronAPI) {
        window.electronAPI.sendDanmakuCommand && window.electronAPI.sendDanmakuCommand({ type: 'speed', value: this.speed });
      }
    });

    this.updateDanmakuSpeed();
  }

  setupOpacityControl() {
    this.opacityRange.addEventListener('input', (e) => {
      this.opacity = parseFloat(e.target.value) / 10;
      this.updateDanmakuOpacity();
      if (this.isElectronMode && window.electronAPI) {
        window.electronAPI.sendDanmakuCommand && window.electronAPI.sendDanmakuCommand({ type: 'opacity', value: this.opacity });
      }
    });
  }

  initDebugInfo() {
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
    if (status === 'error') {
      this.addDanmaku('连接状态：' + text);
    }
    if (status === 'reconnect') {
      this.addDanmaku('连接状态：' + text);
    }
  }

  showVerificationDialog(type = 'class') {
    this.verificationDialog.style.display = 'flex';
    this.verificationTitle.textContent = type === 'class' ? '请输入班级验证码' : 
                                       type === 'verify' ? '请输入管理密码' : 
                                       '请输入管理密码';
    this.verificationInput.value = '';
    this.verificationError.style.display = 'none';
    
    this.submitVerification.onclick = () => {
      const value = this.verificationInput.value.trim();
      if (!value) {
        alert('请输入验证码');
        return;
      }
      
      if (type === 'class') {
        const classlist = ['初一一班', '初一二班', '初一三班', '初一四班', '初一五班', '初一六班', '初一通知', '初二一班', '初二二班', '初二三班', '初二四班', '初二通知', '初三一班', '初三二班', '初三三班', '初三联培班', '初三通知', '高一一班', '高一二班', '高一三班', '高一通知', '高二一班', '高二二班', '高二三班', '高二四班', '高二通知', '高三一班', '高三二班', '高三三班', '高三四班', '高三通知', '全校通知'];
        if (classlist.includes(value)) {
          localStorage.setItem('classParam', value);
          this.classParam = value;
          this.verificationDialog.style.display = 'none';
          this.startConnection();
          
          if (this.isElectronMode && window.electronAPI) {
            if (window.electronAPI.recreateDanmakuWindow) {
              window.electronAPI.recreateDanmakuWindow();
            }
          }
        } else {
          this.verificationError.style.display = 'block';
          this.verificationError.textContent = '无效的班级验证码，请重新输入';
        }
      } else {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://www.cyupeng.com/password', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.result) {
                  this.verificationDialog.style.display = 'none';
                  if (window.electronAPI) {
                    if (type === 'verify') {
                      window.electronAPI.checkQuit(true);
                    } else {
                      window.electronAPI.checkPassword(true);
                    }
                  }
                } else {
                  this.verificationError.style.display = 'block';
                  this.verificationError.textContent = '管理密码错误，请重新输入';
                }
              } catch (e) {
                console.error('解析响应失败:', e);
                alert('服务器响应格式错误');
              }
            } else {
              console.error('请求失败:', xhr.status, xhr.statusText);
              alert('请求失败: ' + xhr.status);
            }
          }
        };
        
        xhr.onerror = () => {
          console.error('网络错误');
          alert('网络连接失败');
        };
        
        try {
          xhr.send(JSON.stringify({password: value}));
        } catch (e) {
          console.error('发送请求失败:', e);
          alert('发送请求失败');
        }
      }
    };
    
    this.skipVerification.onclick = () => {
      this.verificationDialog.style.display = 'none';
    };

    this.verificationInput.onkeypress = (e) => {
      if (e.key === 'Enter') {
        this.submitVerification.click();
      }
    };
  }

  startConnection() {
    if (!this.classParam) {
      console.error('未设置班级验证码');
      this.updateStatus('未设置班级验证码', 'error');
      return;
    }

    try {
      this.socket = io.connect(this.socketUrl, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        autoConnect: true,
        randomizationFactor: 0.5
      });

      this.updateSocketUrlDisplay();

      this.socket.on('connect', () => {
        console.log('WebSocket连接成功');
        const encoder = new TextEncoder();
        this.socket.emit('init', {
          class: encoder.encode(this.classParam)
        });
        this.updateStatus('已连接', 'success');
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('WebSocket重连成功');
        if (this.timer != null) this.updateStatus('重连成功', 'reconnect');
        clearTimeout(this.timer);
        this.timer = null;
      });

      this.socket.on('new', (data) => {
        console.log('收到新消息:', data);
        if (data.class1 === this.classParam) {
          const message = data.name + ': ' + data.content;
          this.processMessage(message, data.uuid);
          this.playFromCache();
        }
      });

      this.socket.on('back', (data) => {
        console.log('收到撤回消息:', data);
        if (data.class1 === this.classParam) {
          if (this.messageCache.has(data.uuid)) {
            this.messageCache.set(data.uuid, { content: '此消息已撤回', playCount: this.messageCache.get(data.uuid).playCount });
          }
          document.querySelectorAll('.danmaku-item').forEach(el => {
            if (el.id === data.uuid) {
              el.textContent = '此消息已撤回';
              if (!el.querySelector('button')) {
                const button = document.createElement('button');
                button.title = "标记为已读";
                button.textContent = "✓";
                button.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const uuid = el.id;
                  if (this.socket) {
                    const classParam = this.classParam;
                    if (!classParam) {
                      console.error('classParam为空，无法发送已读请求');
                      return;
                    }
                    this.socket.emit('isread', {
                      class: encoder.encode(classParam),
                      uuid: uuid
                    });
                  }
                  const danmakuEl = el;
                  const currentPosition = danmakuEl.getBoundingClientRect();
                  const viewportWidth = window.innerWidth;
                  const currentX = (currentPosition.left / viewportWidth) * 100;
                  danmakuEl.style.setProperty('--current-x', `${currentX}vw`);
                  danmakuEl.style.transform = `translateX(${currentX}vw) translateZ(0)`;
                  danmakuEl.classList.add('ok');
                  if (uuid && this.messageCache.has(uuid)) {
                    this.messageCache.delete(uuid);
                  }
                  button.style.display = 'none';
                });
                el.appendChild(button);
              }
            }
          });
        }
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket连接断开');
        this.updateStatus('连接已断开', 'error');
      });

    } catch (error) {
      console.error('启动连接时发生错误:', error);
      this.updateStatus('连接错误', 'error');
    }
  }

  toggleRunning() {
    this.isRunning = !this.isRunning;
    const toggleBtn = document.getElementById('toggleBtn');

    if (this.isRunning) {
      toggleBtn.textContent = '暂停弹幕';
      if (!this.socket || !this.socket.connected) {
		this.socket.connect();
      }
    } else {
      toggleBtn.textContent = '恢复弹幕';
      if (this.socket) {
        this.socket.disconnect();
      }
    }
  }

  changeClass() {
    this.showVerificationDialog('class');
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
        pointer-events: auto;
      }
    `;
  }

  setTransparentBackground(isTransparent) {
    if (isTransparent) {
      document.body.classList.add('transparent-mode');
      document.body.style.background = 'transparent';
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.classList.remove('transparent-mode');
      document.body.style.background = '';
      document.body.style.pointerEvents = 'auto';
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

  processMessage(content, uuid) {
    try {
      if (!this.danmakuArea) {
        console.error('弹幕区域不存在');
        return;
      }

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

      const lastDanmaku = document.querySelector('.danmaku-item:last-child');
      if (lastDanmaku) {
        lastDanmaku.id = uuid;

        if (!lastDanmaku.querySelector('button')) {
          const button = document.createElement('button');
          button.title = "标记为已读";
          button.textContent = "✓";
          lastDanmaku.appendChild(button);

          button.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.socket) {
              const classParam = this.classParam;
              if (!classParam) {
                console.error('classParam为空，无法发送已读请求');
                return;
              }
              const encoder = new TextEncoder();
              this.socket.emit('isread', {
                class: encoder.encode(classParam),
                uuid: uuid
              });
            }

            const danmakuEl = lastDanmaku;
            const currentPosition = danmakuEl.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const currentX = (currentPosition.left / viewportWidth) * 100;

            danmakuEl.style.setProperty('--current-x', `${currentX}vw`);
            danmakuEl.style.transform = `translateX(${currentX}vw) translateZ(0)`;

            lastDanmaku.classList.add('ok');

            if (this.messageCache.has(uuid)) {
              this.messageCache.delete(uuid);
            }

            button.style.display = 'none';
          });
        }
      }
    } catch (error) {
      console.error('处理消息时发生错误:', error);
    }
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
    try {
      if (!this.danmakuArea) {
        console.error('弹幕区域不存在');
        return;
      }

      const danmaku = document.createElement('div');
      danmaku.className = 'danmaku-item';
      danmaku.textContent = content.replace(/✓$/, '');

      if (uuid) {
        danmaku.id = uuid;
        danmaku.setAttribute('data-play-count', playCount);
      }

      if (this.isOverlayMode) {
        this.danmakuArea.style.pointerEvents = 'auto';
        danmaku.addEventListener('mouseleave', (e) => {
          e.stopPropagation();
          if (window.electronAPI) {
            window.electronAPI.handleDanmakuMouseEvent('mouseout', false);
          }
        });
        danmaku.addEventListener('mouseenter', (e) => {
          e.stopPropagation();
          if (window.electronAPI) {
            window.electronAPI.handleDanmakuMouseEvent('mouseover', true);
          }
        });
      }

      danmaku.style.transform = 'translateX(100vw) translateZ(0)';
      danmaku.style.webkitFontSmoothing = 'antialiased';
      danmaku.style.backfaceVisibility = 'hidden';

      if (!danmaku.querySelector('button')) {
        const button = document.createElement('button');
        button.title = "标记为已读";
        button.textContent = "✓";
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const uuid = danmaku.id;
          if (this.socket) {
            const classParam = this.classParam;
            if (!classParam) {
              console.error('classParam为空，无法发送已读请求');
              return;
            }
            const encoder = new TextEncoder();
            this.socket.emit('isread', {
              class: encoder.encode(classParam),
              uuid: uuid
            });
          }
          const danmakuEl = danmaku;
          const currentPosition = danmakuEl.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const currentX = (currentPosition.left / viewportWidth) * 100;
          danmakuEl.style.setProperty('--current-x', `${currentX}vw`);
          danmakuEl.style.transform = `translateX(${currentX}vw) translateZ(0)`;
          danmakuEl.classList.add('ok');
          if (uuid && this.messageCache.has(uuid)) {
            this.messageCache.delete(uuid);
          }
          button.style.display = 'none';
        });
        danmaku.appendChild(button);
      }

      danmaku.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!danmaku.classList.contains('ok')) {
          const button = danmaku.querySelector('button');
          if (button) {
            button.click();
          } else {
            danmaku.classList.add('ok');
            const uuid = danmaku.id;
            if (uuid && this.messageCache.has(uuid)) {
              this.messageCache.delete(uuid);
            }
          }
        }
      });

      this.danmakuArea.appendChild(danmaku);

      danmaku.addEventListener('animationend', (event) => {
        if (event.animationName === 'danmaku-move' || event.animationName === 'danmaku-move-fast') {
          const uuid = danmaku.id;
          let playCount = parseInt(danmaku.getAttribute('data-play-count') || '0');

          if (window.electronAPI) {
            window.electronAPI.handleDanmakuMouseEvent('mouseout', false);
          }
          if (danmaku.classList.contains('ok') || !uuid) {
            danmaku.remove();
            return;
          }

          playCount++;
          if (playCount < this.cacheDuration) {
            this.addDanmaku(this.messageCache.get(uuid)?.content || danmaku.textContent, uuid, playCount);
          } else {
            if (uuid && this.messageCache.has(uuid)) {
              this.messageCache.delete(uuid);
            }
          }
          danmaku.remove();
        }
      });
    } catch (error) {
      console.error('添加弹幕时发生错误:', error);
    }
  }

  sendTestDanmaku() {
    const testMessages = [
      'MessageIn测试消息',
    ];

    const randomIndex = Math.floor(Math.random() * testMessages.length);
    this.addDanmaku(testMessages[randomIndex]);
    // this.messageCount++;
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

      const showContent = messageData.content === '此消息已撤回' ? '此消息已撤回' : messageData.content;
      this.addDanmaku(showContent, uuid, newCount);

      const newDanmaku = document.getElementById(uuid);
      if (newDanmaku) {

        if (!newDanmaku.querySelector('button')) {
          const button = document.createElement('button');
          button.title = "标记为已读";
          button.textContent = "✓";

          button.addEventListener('click', (e) => {
            e.stopPropagation();
            const uuid = newDanmaku.getAttribute('id');
            const classParam = window.danmakuSystem.classParam;
            if (!uuid || !classParam) {
              console.error('uuid或classParam为空，无法发送已读请求');
              return;
            }
            window.danmakuSystem.socket.emit('isread', {
              class: encodeURIComponent(classParam),
              uuid: uuid
            });
            const danmakuEl = newDanmaku;
            const currentPosition = danmakuEl.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const currentX = (currentPosition.left / viewportWidth) * 100;
            danmakuEl.style.setProperty('--current-x', `${currentX}vw`);
            danmakuEl.style.transform = `translateX(${currentX}vw) translateZ(0)`;
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

  updateSocketUrlDisplay() {
    const el = document.getElementById('apiUrlDisplay');
    if (el) {
      el.textContent = this.socketUrl;
    }
  }

  handleDanmakuCommand(command) {
    console.log('[overlay] handleDanmakuCommand:', command);
    if (!command || typeof command !== 'object') return;
    switch (command.type) {
      case 'toggle':
        if (typeof command.value === 'boolean') {
          this.isRunning = command.value;
          if (this.isRunning) {
            this.socket.connect();
          } else if (this.socket) {
            this.socket.disconnect();
          }
        }
        break;
      case 'clear':
        this.clearDanmaku();
        break;
      case 'test':
        this.sendTestDanmaku && this.sendTestDanmaku();
        break;
      case 'speed':
        if (typeof command.value === 'number') {
          this.speed = command.value;
          this.updateDanmakuSpeed && this.updateDanmakuSpeed();
        }
        break;
      case 'opacity':
        if (typeof command.value === 'number') {
          this.opacity = command.value;
          this.updateDanmakuOpacity && this.updateDanmakuOpacity();
        }
        break;
      default:
        break;
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

  toggleDevTools() {
    if (this.isElectron && window.electronAPI && window.electronAPI.toggleDevTools) {
      window.electronAPI.toggleDevTools();
    } else {
      console.log('模拟切换开发者工具');
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
    toggleDevTools: () => console.log('需要实现 toggleDevTools'),
    showMainWindow: () => console.log('需要实现 showMainWindow'),
    setApiUrl: (url) => console.log('需要实现 setApiUrl:', url)
  };
}
 
