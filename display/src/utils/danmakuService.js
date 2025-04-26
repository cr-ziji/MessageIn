import { useDanmakuStore } from '@/store/modules/danmaku';
import { defineStore } from 'pinia';

class DanmakuService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3秒
    this.danmakuStore = null;
    this.serverUrl = process.env.VUE_APP_WEBSOCKET_URL || 'ws://localhost:3000/danmaku';
    
    // 在构造函数中尝试初始化，但不一定成功，需要等到Vue应用挂载
    try {
      this.danmakuStore = useDanmakuStore();
      console.log('DanmakuService构造函数初始化danmakuStore成功');
    } catch (error) {
      console.warn('DanmakuService构造函数初始化danmakuStore失败，将在initialize中再次尝试', error);
    }
  }

  // 初始化服务
  initialize() {
    // 确保 danmakuStore 已初始化
    try {
      if (!this.danmakuStore) {
        this.danmakuStore = useDanmakuStore();
        console.log('DanmakuService.initialize成功初始化danmakuStore');
      }
      this.connect();
    } catch (error) {
      console.error('DanmakuService.initialize初始化失败', error);
    }
  }

  // 连接WebSocket服务器
  connect() {
    if (this.socket) {
      this.socket.close();
    }

    try {
      this.socket = new WebSocket(this.serverUrl);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.attemptReconnect();
    }
  }

  // 处理WebSocket打开连接
  handleOpen() {
    console.log('WebSocket连接已建立');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // 连接成功后发送身份验证消息
    this.sendMessage({
      type: 'auth',
      clientType: 'display',
      clientId: this.getClientId()
    });
  }

  // 处理接收到的消息
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      // 处理不同类型的消息
      switch (message.type) {
        case 'danmaku':
          this.processDanmakuMessage(message);
          break;
        case 'system':
          console.log('系统消息:', message.content);
          break;
        case 'auth_result':
          console.log('认证结果:', message.success ? '成功' : '失败');
          break;
        default:
          console.log('收到未知类型消息:', message);
      }
    } catch (error) {
      console.error('处理消息失败:', error);
    }
  }

  // 处理弹幕消息
  processDanmakuMessage(message) {
    // 确保 danmakuStore 已初始化
    if (!this.danmakuStore) {
      try {
        this.danmakuStore = useDanmakuStore();
        console.log('processDanmakuMessage中成功初始化danmakuStore');
      } catch (error) {
        console.error('processDanmakuMessage无法初始化danmakuStore:', error);
        return; // 如果初始化失败，直接返回
      }
    }
    
    if (message.content && this.danmakuStore) {
      try {
        // 添加到弹幕存储
        this.danmakuStore.addMessage({
          content: message.content,
          color: message.color || '#ffffff',
          fontSize: message.fontSize || 24,
          sender: message.sender,
          originalMessage: message
        });
        console.log('成功添加弹幕消息:', message.content);
      } catch (error) {
        console.error('添加弹幕消息失败:', error);
      }
    } else if (!this.danmakuStore) {
      console.error('danmakuStore未初始化，无法添加弹幕消息');
    }
  }

  // 处理WebSocket错误
  handleError(error) {
    console.error('WebSocket错误:', error);
    this.isConnected = false;
  }

  // 处理WebSocket关闭
  handleClose(event) {
    console.log(`WebSocket连接已关闭: ${event.code} ${event.reason}`);
    this.isConnected = false;
    
    if (event.code !== 1000) { // 非正常关闭
      this.attemptReconnect();
    }
  }

  // 尝试重新连接
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重新连接... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.log('达到最大重连次数，停止尝试');
    }
  }

  // 发送消息
  sendMessage(data) {
    if (this.isConnected && this.socket) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  // 关闭连接
  close() {
    if (this.socket) {
      this.socket.close(1000, 'Client closed connection');
      this.socket = null;
      this.isConnected = false;
    }
  }

  // 获取或生成客户端ID
  getClientId() {
    let clientId = localStorage.getItem('danmaku_client_id');
    
    if (!clientId) {
      clientId = 'display_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('danmaku_client_id', clientId);
    }
    
    return clientId;
  }

  // 添加模拟弹幕（用于开发测试）
  addMockDanmaku(content, options = {}) {
    if (process.env.NODE_ENV === 'development') {
      // 确保 danmakuStore 已初始化
      if (!this.danmakuStore) {
        try {
          this.danmakuStore = useDanmakuStore();
          console.log('开发环境中初始化danmakuStore成功');
        } catch (error) {
          console.error('无法初始化danmakuStore:', error);
          return false;
        }
      }
      
      try {
        const mockMessage = {
          content: content || '这是一条模拟弹幕',
          color: options.color || '#ffffff',
          fontSize: options.fontSize || 24,
          sender: options.sender || { name: '测试用户' }
        };
        
        console.log('添加模拟弹幕:', mockMessage);
        this.processDanmakuMessage(mockMessage);
        return true;
      } catch (error) {
        console.error('添加模拟弹幕失败:', error);
        return false;
      }
    }
    return false;
  }
}

// 创建单例
const danmakuService = new DanmakuService();

export default danmakuService; 