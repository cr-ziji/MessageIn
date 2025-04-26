import axios from 'axios';
import { useDanmakuStore } from '@/stores/danmaku';

class MessageService {
  constructor() {
    this.apiBaseUrl = 'http://www.cyupeng.com/message';
    this.danmakuStore = null;
    this.pollingInterval = null;
    this.pollingDelay = 2000; // 2秒轮询一次，加快刷新率
    this.lastMessageTime = 0; // 上次消息时间戳
    this.useSimulatedData = true; // 使用模拟数据模式
    
    try {
      this.danmakuStore = useDanmakuStore();
      console.log('MessageService构造函数初始化danmakuStore成功');
    } catch (error) {
      console.warn('MessageService构造函数初始化danmakuStore失败，将在initialize中再次尝试', error);
    }
  }
  
  // 初始化服务
  initialize() {
    if (!this.danmakuStore) {
      try {
        this.danmakuStore = useDanmakuStore();
        console.log('MessageService重新初始化danmakuStore成功');
      } catch (error) {
        console.error('MessageService无法初始化danmakuStore', error);
        return false;
      }
    }
    
    // 启动轮询
    this.startPolling();
    return true;
  }
  
  // 启动轮询
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // 立即执行一次
    this.fetchMessages();
    
    // 设置定时器
    this.pollingInterval = setInterval(() => {
      this.fetchMessages();
    }, this.pollingDelay);
    
    console.log('已启动消息轮询，间隔:', this.pollingDelay, 'ms');
  }
  
  // 停止轮询
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('已停止消息轮询');
    }
  }
  
  // 获取消息
  async fetchMessages() {
    try {
      let messageContent = '';
      
      if (this.useSimulatedData) {
        // 使用模拟数据替代HTTP请求，以避免CORS问题
        const now = Date.now();
        // 每5秒生成一次消息
        if (now - this.lastMessageTime > 5000) {
          this.lastMessageTime = now;
          messageContent = '大乐子';
          console.log('模拟数据:', { content: messageContent });
        }
      } else {
        // 正常的HTTP请求方式 - 由于CORS问题可能会失败
        try {
          const response = await axios.get(this.apiBaseUrl);
          console.log('获取到原始消息:', response.data);
          
          // 检查响应格式并提取消息内容
          if (response.data) {
            // 处理可能的不同响应格式
            if (typeof response.data === 'string') {
              // 直接是字符串
              messageContent = response.data;
            } else if (response.data.content) {
              // 如果是 { content: "消息内容" } 格式
              if (response.data.content === 'string') {
                // 如果内容就是字符串 "string"，可能是示例格式，我们改用"大乐子"
                messageContent = '大乐子';
              } else {
                // 正常使用content字段的值
                messageContent = response.data.content;
              }
            } else {
              // 尝试将整个响应转为字符串作为消息内容
              messageContent = JSON.stringify(response.data);
            }
          }
        } catch (error) {
          console.error('HTTP请求失败，将使用模拟数据:', error);
          // 当HTTP请求失败时，切换到模拟数据模式
          this.useSimulatedData = true;
          messageContent = '大乐子'; // 使用固定内容
        }
      }
      
      console.log('处理后的消息内容:', messageContent);
      
      if (messageContent) {
        // 将消息添加到弹幕存储
        this.processMessage(messageContent);
      }
    } catch (error) {
      console.error('获取消息失败:', error);
    }
  }
  
  // 处理消息内容
  processMessage(content) {
    if (!this.danmakuStore) {
      console.error('弹幕存储未初始化，无法处理消息');
      return;
    }
    
    // 创建一个新的弹幕消息
    const message = {
      content: content,
      color: this.getRandomColor(),
      fontSize: 18 + Math.floor(Math.random() * 4) * 2, // 随机字体大小: 18, 20, 22, 24
      timestamp: new Date().toISOString()
    };
    
    // 添加到弹幕存储
    this.danmakuStore.addMessage(message);
    console.log('已添加弹幕消息:', message);
  }
  
  // 生成随机颜色
  getRandomColor() {
    const colors = [
      '#ffffff', // 白色
      '#ff4757', // 红色
      '#2ed573', // 绿色
      '#1e90ff', // 蓝色
      '#f1c40f', // 黄色
      '#e84393', // 粉色
      '#00cec9'  // 青色
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // 销毁服务
  destroy() {
    this.stopPolling();
  }
}

// 创建单例
const messageService = new MessageService();
export default messageService; 