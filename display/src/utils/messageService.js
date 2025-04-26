import axios from 'axios';
import { useDanmakuStore } from '@/stores/danmaku';

class MessageService {
  constructor() {
    this.apiBaseUrl = 'http://www.cyupeng.com/message';
    this.danmakuStore = null;
    this.pollingInterval = null;
    this.pollingDelay = 2000; // 2秒轮询一次，确保及时获取消息
    
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
      console.log('开始请求API:', this.apiBaseUrl);
      
      let responseData;
      
      // 检查是否在Electron环境中
      if (window.electronAPI && window.electronAPI.httpGet) {
        // 使用Electron的net模块进行请求
        try {
          responseData = await window.electronAPI.httpGet(this.apiBaseUrl);
          console.log('Electron API响应数据:', responseData);
        } catch (electronError) {
          console.error('Electron HTTP请求失败:', electronError);
          // 如果Electron请求失败，回退到普通请求
          const response = await axios.get(this.apiBaseUrl);
          responseData = response.data;
        }
      } else {
        // 普通浏览器环境
        const response = await axios.get(this.apiBaseUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          // 添加时间戳防止缓存
          params: {
            t: new Date().getTime()
          }
        });
        responseData = response.data;
        console.log('Axios响应数据:', responseData);
      }
      
      // 处理响应数据
      let messageContent = '';
      
      if (responseData) {
        // 处理不同可能的响应格式
        if (typeof responseData === 'string') {
          messageContent = responseData;
        } else if (responseData.content) {
          messageContent = responseData.content;
        } else {
          messageContent = JSON.stringify(responseData);
        }
      }
      
      if (messageContent) {
        console.log('处理消息内容:', messageContent);
        this.processMessage(messageContent);
      }
    } catch (error) {
      console.error('获取消息最终失败:', error);
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
      id: Date.now() + '-' + Math.floor(Math.random() * 1000),
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