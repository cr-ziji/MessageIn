// 令牌存储键名
const TOKEN_KEY = 'message_in_token'

/**
 * 保存认证令牌到本地存储
 * @param {string} token JWT令牌
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 从本地存储获取认证令牌
 * @returns {string|null} JWT令牌或null
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 从本地存储移除认证令牌
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 解析JWT令牌获取用户信息
 * @returns {Object|null} 用户信息或null
 */
export const parseToken = () => {
  const token = getToken()
  if (!token) return null
  
  try {
    // JWT令牌结构为：header.payload.signature
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join('')
    )
    
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('解析令牌失败:', error)
    return null
  }
}

/**
 * 获取带认证令牌的请求头
 * @returns {Object} 请求头对象
 */
export const getAuthHeader = () => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * 检查用户是否已认证
 * @returns {boolean} 是否已认证
 */
export const isAuthenticated = () => {
  const token = getToken()
  if (!token) return false
  
  // 简单验证令牌是否过期
  const payload = parseToken()
  if (!payload || !payload.exp) return false
  
  // 检查令牌是否过期
  const expirationTime = payload.exp * 1000 // 转换为毫秒
  return Date.now() < expirationTime
}