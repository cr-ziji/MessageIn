import { io } from 'socket.io-client'
import { ElMessage } from 'element-plus'
import store from '@/store'

// 配置Socket连接
const SOCKET_URL = process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000'
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
})

// 连接状态
const connectionStatus = {
  isConnected: false,
  isConnecting: false,
  error: null
}

// 初始化Socket连接
export const initSocketConnection = (token) => {
  if (connectionStatus.isConnected || connectionStatus.isConnecting) {
    return Promise.resolve()
  }

  connectionStatus.isConnecting = true
  
  // 设置认证token
  socket.auth = { token }
  
  return new Promise((resolve, reject) => {
    socket.connect()
    
    socket.on('connect', () => {
      console.log('Socket连接成功')
      connectionStatus.isConnected = true
      connectionStatus.isConnecting = false
      connectionStatus.error = null
      resolve()
    })
    
    socket.on('connect_error', (error) => {
      console.error('Socket连接失败:', error)
      connectionStatus.isConnected = false
      connectionStatus.isConnecting = false
      connectionStatus.error = error.message
      reject(error)
    })
    
    socket.on('disconnect', (reason) => {
      console.log('Socket断开连接:', reason)
      connectionStatus.isConnected = false
      
      // 如果是服务器主动断开，尝试重连
      if (reason === 'io server disconnect') {
        socket.connect()
      }
    })
    
    // 监听认证错误
    socket.on('auth_error', (error) => {
      console.error('Socket认证失败:', error)
      store.dispatch('auth/logout')
    })
  })
}

// 断开Socket连接
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect()
    connectionStatus.isConnected = false
  }
}

// 加入班级频道
export const joinClassChannel = (classId) => {
  if (!connectionStatus.isConnected) {
    return Promise.reject(new Error('Socket未连接'))
  }
  
  return new Promise((resolve) => {
    socket.emit('joinClass', { classId }, () => {
      console.log(`已加入班级频道: ${classId}`)
      resolve()
    })
  })
}

// 离开班级频道
export const leaveClassChannel = (classId) => {
  if (!connectionStatus.isConnected) {
    return Promise.resolve()
  }
  
  return new Promise((resolve) => {
    socket.emit('leaveClass', { classId }, () => {
      console.log(`已离开班级频道: ${classId}`)
      resolve()
    })
  })
}

// 发送消息确认
export const sendMessageAck = (messageId) => {
  if (!connectionStatus.isConnected) {
    return
  }
  
  socket.emit('messageAck', { messageId })
}

// 获取连接状态
export const getConnectionStatus = () => {
  return { ...connectionStatus }
}

// 导出socket实例和辅助方法
export { socket } 