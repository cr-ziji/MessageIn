import { io } from 'socket.io-client'
import { getToken } from '@/utils/auth'
import store from '@/store'

// Socket.io实例
let socket = null

/**
 * 初始化WebSocket连接
 * @param {string} classId 班级ID
 * @returns {SocketIOClient.Socket} Socket实例
 */
export const initSocket = (classId) => {
  const token = getToken()
  if (!token) {
    console.error('未授权，无法建立WebSocket连接')
    return null
  }

  // WebSocket服务URL
  const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000'
  
  // 关闭先前的连接
  if (socket) {
    socket.disconnect()
  }
  
  // 建立新连接
  socket = io(WS_URL, {
    query: {
      token,
      classId
    },
    transports: ['websocket']
  })
  
  // 连接事件
  socket.on('connect', () => {
    console.log('WebSocket连接已建立')
  })
  
  // 断开连接事件
  socket.on('disconnect', (reason) => {
    console.log('WebSocket连接已断开:', reason)
  })
  
  // 连接错误事件
  socket.on('connect_error', (error) => {
    console.error('WebSocket连接错误:', error)
    store.dispatch('addNotification', {
      type: 'error',
      message: '实时连接失败，请检查网络后重试',
      duration: 5000
    })
  })
  
  // 连接超时事件
  socket.on('connect_timeout', () => {
    console.error('WebSocket连接超时')
  })
  
  // 新消息事件
  socket.on('new_message', (message) => {
    console.log('收到新消息:', message)
    store.dispatch('danmaku/receiveMessage', message)
  })
  
  // 消息过期事件
  socket.on('message_expired', ({ messageId }) => {
    console.log('消息已过期:', messageId)
    // 可以在这里处理消息过期的逻辑
  })
  
  // 消息已读更新事件
  socket.on('message_read_update', ({ messageId, readCount }) => {
    console.log(`消息 ${messageId} 已被 ${readCount} 人阅读`)
    // 可以在这里更新消息的阅读状态
  })
  
  return socket
}

/**
 * 获取当前WebSocket实例
 * @returns {SocketIOClient.Socket|null} Socket实例
 */
export const getSocket = () => {
  return socket
}

/**
 * 断开WebSocket连接
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
} 