import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 消息管理存储库
 * 负责管理系统消息的状态
 */
export const useMessageStore = defineStore('message', () => {
  // 消息列表
  const messages = ref([]);
  // 最大消息数量限制
  const maxMessages = ref(100);
  
  // 计算属性：最新消息（按时间降序排列）
  const latestMessages = computed(() => {
    return [...messages.value].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  });
  
  /**
   * 添加一条新消息
   * @param {Object} message - 消息对象
   */
  const addMessage = (message) => {
    const newMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...message
    };
    
    messages.value.push(newMessage);
    
    // 限制消息数量
    if (messages.value.length > maxMessages.value) {
      messages.value = messages.value.slice(-maxMessages.value);
    }
    
    return newMessage.id;
  };
  
  /**
   * 删除消息
   * @param {string} messageId - 消息ID
   */
  const removeMessage = (messageId) => {
    const index = messages.value.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      messages.value.splice(index, 1);
    }
  };
  
  /**
   * 清空所有消息
   */
  const clearMessages = () => {
    messages.value = [];
  };
  
  return {
    messages,
    latestMessages,
    addMessage,
    removeMessage,
    clearMessages
  };
}); 