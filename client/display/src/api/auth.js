import axios from 'axios'
import { setToken, removeToken, getAuthHeader } from '@/utils/auth'

// 使用Vite环境变量
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// 用户登录
const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/auth/login`, credentials)
  
  if (response.data && response.data.token) {
    setToken(response.data.token)
  }
  
  return response
}

// 登出
const logout = () => {
  removeToken()
}

// 获取当前登录用户信息
const getCurrentUser = async () => {
  return axios.get(`${API_URL}/auth/me`, { 
    headers: getAuthHeader() 
  })
}

// 验证令牌有效性
const verifyToken = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/verify`, { 
      headers: getAuthHeader() 
    })
    return response.data.valid
  } catch (error) {
    return false
  }
}

export default {
  login,
  logout,
  getCurrentUser,
  verifyToken
} 