import axios from 'axios'
import { getAuthHeader } from '@/utils/auth'

// 使用Vite环境变量
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// 获取未读消息
const getUnreadMessages = async (classId) => {
  return axios.get(`${API_URL}/messages/unread/${classId}`, { 
    headers: getAuthHeader() 
  })
}

// 获取历史消息
const getHistoryMessages = async (classId, page = 1, pageSize = 30) => {
  return axios.get(`${API_URL}/messages/history/${classId}`, {
    params: {
      page,
      limit: pageSize
    },
    headers: getAuthHeader()
  })
}

// 标记消息为已读
const markAsRead = async (messageIds) => {
  const payload = Array.isArray(messageIds) 
    ? { messageIds } 
    : { messageIds: [messageIds] }
  
  return axios.post(`${API_URL}/messages/read`, payload, {
    headers: getAuthHeader()
  })
}

// 获取消息统计数据
const getMessageStats = async (classId, timeRange = 'day') => {
  return axios.get(`${API_URL}/messages/stats/${classId}`, {
    params: { timeRange },
    headers: getAuthHeader()
  })
}

export default {
  getUnreadMessages,
  getHistoryMessages,
  markAsRead,
  getMessageStats
} 