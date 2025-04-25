import axios from 'axios'
import { getAuthHeader } from '@/utils/auth'

// 使用Vite环境变量
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// 获取班级列表
const getClasses = async () => {
  return axios.get(`${API_URL}/classes`, { 
    headers: getAuthHeader() 
  })
}

// 获取班级详情
const getClassById = async (classId) => {
  return axios.get(`${API_URL}/classes/${classId}`, { 
    headers: getAuthHeader() 
  })
}

// 获取可显示弹幕的班级列表
const getDisplayClasses = async () => {
  return axios.get(`${API_URL}/classes/display`, { 
    headers: getAuthHeader() 
  })
}

export default {
  getClasses,
  getClassById,
  getDisplayClasses
} 