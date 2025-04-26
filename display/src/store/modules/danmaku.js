import { defineStore } from 'pinia'

// 使用defineStore创建弹幕消息存储
export const useDanmakuStore = defineStore('danmaku', {
  state: () => ({
    messages: [], // 弹幕消息列表
    isVisible: true, // 是否显示弹幕
    speed: 10, // 弹幕速度(秒)
    maxMessages: 50, // 最大保存消息数量
    readMessages: [] // 已读消息ID列表
  }),
  
  actions: {
    // 添加新弹幕消息
    addMessage(message) {
      // 确保消息有必要的属性
      const newMessage = {
        id: `danmaku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: message.content || '空消息',
        bgColor: message.bgColor || '#2196f3', // 更改为蓝色背景
        fontSize: message.fontSize || 16, // 调整默认字体大小
        ...message,
        read: false, // 初始未读状态
        timestamp: new Date()
      };
      
      this.messages.push(newMessage);
      
      // 限制消息数量
      if (this.messages.length > this.maxMessages) {
        this.messages = this.messages.slice(-this.maxMessages);
      }
      
      return newMessage.id;
    },
    
    // 批量添加弹幕消息
    addMessages(messages) {
      if (Array.isArray(messages)) {
        messages.forEach(msg => this.addMessage(msg));
      }
    },
    
    // 移除消息
    removeMessage(id) {
      const index = this.messages.findIndex(m => m.id === id);
      if (index !== -1) {
        this.messages.splice(index, 1);
      }
    },
    
    // 更新消息的已读状态
    updateMessageReadStatus(id, isRead) {
      // 更新消息数组中的状态
      const message = this.messages.find(m => m.id === id);
      if (message) {
        message.read = isRead;
        
        // 如果已读，添加到已读列表
        if (isRead && !this.readMessages.includes(id)) {
          this.readMessages.push(id);
        } else if (!isRead) {
          // 如果标记为未读，从已读列表中移除
          const readIndex = this.readMessages.indexOf(id);
          if (readIndex !== -1) {
            this.readMessages.splice(readIndex, 1);
          }
        }
      }
    },
    
    // 清空所有消息
    clearMessages() {
      this.messages = [];
      this.readMessages = [];
    },
    
    // 设置弹幕可见性
    setVisibility(isVisible) {
      this.isVisible = isVisible;
    },
    
    // 设置弹幕速度
    setSpeed(speed) {
      if (typeof speed === 'number' && speed > 0) {
        this.speed = speed;
      }
    }
  },
  
  getters: {
    // 获取最新的弹幕消息
    latestMessages: (state) => {
      return [...state.messages].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
    },
    
    // 获取未处理的消息
    unprocessedMessages: (state) => {
      return state.messages.filter(msg => !msg.processed);
    },
    
    // 获取已读消息数量
    readMessagesCount: (state) => {
      return state.readMessages.length;
    },
    
    // 获取未读消息数量
    unreadMessagesCount: (state) => {
      return state.messages.filter(msg => !msg.read).length;
    }
  }
}) 