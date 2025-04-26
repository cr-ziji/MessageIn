import axios from 'axios';
import { useDanmakuStore } from '@/stores/danmaku';
import { fetchWithProxy } from './corsProxy';

class MessageService {
  constructor() {
    this.apiBaseUrl = 'http://www.cyupeng.com/message';
    this.danmakuStore = null;
    this.pollingInterval = null;
    this.pollingDelay = 1000; // 1秒轮询一次，更快速地获取消息
    this.lastContentHash = null; // 用于跟踪最后一次消息内容，避免重复添加
    
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
  
  // 计算内容哈希，用于去重
  getContentHash(content) {
    // 简单的哈希算法，实际项目可使用更复杂的算法
    let hash = 0;
    if (!content) return hash;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash;
  }
  
  // 从文本中提取可能的消息内容
  extractContentFromText(text) {
    if (!text || typeof text !== 'string') {
      return null;
    }
    
    // 去除首尾空白
    const trimmed = text.trim();
    
    // 测试几种可能的格式
    
    // 1. 尝试作为JSON解析
    try {
      const json = JSON.parse(trimmed);
      if (json.content) {
        return json.content;
      }
      // 如果没有content字段但是有其他字段，可能整个对象就是有用信息
      return JSON.stringify(json);
    } catch (e) {
      // 不是有效的JSON，继续尝试
    }
    
    // 2. 尝试匹配类似 {'content':'大乐子'} 这样的格式
    const contentMatch = trimmed.match(/['"]content['"]:\s*['"](.+?)['"]/);
    if (contentMatch && contentMatch[1]) {
      return contentMatch[1];
    }
    
    // 3. 如果文本很短（小于100个字符），可能整个就是消息内容
    if (trimmed.length < 100) {
      return trimmed;
    }
    
    // 4. 否则尝试找到看起来像内容的部分
    const simpleContentMatch = trimmed.match(/{(.+?)}/);
    if (simpleContentMatch && simpleContentMatch[1]) {
      return simpleContentMatch[1];
    }
    
    // 5. 检查是否包含"大乐子"
    if (trimmed.includes('大乐子')) {
      return '大乐子';
    }
    
    // 如果以上都不匹配，返回原始文本
    return trimmed;
  }
  
  // 获取消息
  async fetchMessages() {
    try {
      // 使用CORS代理获取消息
      const response = await fetchWithProxy(this.apiBaseUrl);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      // 先获取原始文本
      const rawText = await response.text();
      console.log('API原始响应:', rawText);
      
      // 从原始文本中提取内容
      const content = this.extractContentFromText(rawText);
      console.log('提取的消息内容:', content);
      
      if (content) {
        // 计算内容哈希
        const contentHash = this.getContentHash(content);
        
        // 如果内容与上次不同，则处理新消息
        if (contentHash !== this.lastContentHash) {
          console.log('发现新消息:', content);
          this.lastContentHash = contentHash;
          this.processMessage(content);
        }
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