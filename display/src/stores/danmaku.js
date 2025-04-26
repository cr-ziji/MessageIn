import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 弹幕管理存储库
 * 负责管理弹幕相关的状态和设置
 */
export const useDanmakuStore = defineStore('danmaku', () => {
  // 弹幕可见性状态
  const isVisible = ref(true)
  // 弹幕滚动速度 (1-10，1最快，10最慢)
  const speed = ref(5) 
  // 弹幕透明度 (0.2-1.0)
  const opacity = ref(0.8)
  
  // 弹幕消息列表
  const messages = ref([])
  // 已读消息ID列表
  const readMessageIds = ref(new Set())
  
  /**
   * 设置弹幕可见性
   * @param {boolean} visibility - 是否可见
   */
  function setVisibility(visibility) {
    isVisible.value = visibility
  }
  
  /**
   * 设置弹幕滚动速度
   * @param {number} newSpeed - 滚动速度值
   */
  function setSpeed(newSpeed) {
    speed.value = newSpeed
  }
  
  /**
   * 设置弹幕透明度
   * @param {number} newOpacity - 透明度值 (0-1)
   */
  function setOpacity(newOpacity) {
    opacity.value = newOpacity
  }
  
  /**
   * 添加一条新的弹幕消息
   * @param {Object} message - 消息对象
   */
  function addMessage(message) {
    // 生成唯一ID
    const id = Date.now() + '-' + Math.floor(Math.random() * 1000)
    const timestamp = new Date().toISOString()
    
    // 添加消息到列表
    messages.value.push({
      id,
      timestamp,
      ...message,
      opacity: message.opacity || opacity.value
    })
    
    // 限制消息数量 (最多保留50条)
    if (messages.value.length > 50) {
      messages.value = messages.value.slice(-50)
    }
  }
  
  /**
   * 批量添加弹幕消息
   * @param {Array} newMessages - 消息对象数组
   */
  function addMessages(newMessages) {
    newMessages.forEach(msg => addMessage(msg))
  }
  
  /**
   * 清空所有弹幕消息
   */
  function clearMessages() {
    messages.value = []
    readMessageIds.value = new Set()
  }
  
  /**
   * 添加测试弹幕消息
   */
  function addDemoMessages() {
    const demoTexts = [
      "这是一条测试弹幕消息",
      "弹幕显示系统",
      "Hello, 弹幕世界!",
      "弹幕消息测试"
    ]
    
    const colors = [
      'rgba(25, 118, 210, 0.85)',
      'rgba(211, 47, 47, 0.85)',
      'rgba(56, 142, 60, 0.85)',
      'rgba(33, 150, 243, 0.85)'
    ]
    
    // 随机生成5条测试弹幕
    for (let i = 0; i < 5; i++) {
      const textIndex = Math.floor(Math.random() * demoTexts.length)
      const colorIndex = Math.floor(Math.random() * colors.length)
      
      addMessage({
        content: demoTexts[textIndex],
        bgColor: colors[colorIndex],
        fontSize: 16 + Math.floor(Math.random() * 4) * 2, // 16, 18, 20, 22
      })
    }
  }
  
  return {
    // 状态
    isVisible,
    speed,
    opacity,
    messages,
    readMessageIds,
    
    // 方法
    setVisibility,
    setSpeed,
    setOpacity,
    addMessage,
    addMessages,
    clearMessages,
    addDemoMessages
  }
}) 