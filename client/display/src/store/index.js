import { createStore } from 'vuex'
import danmaku from './modules/danmaku'

// 创建store实例
const store = createStore({
  modules: {
    danmaku // 弹幕模块
  },
  // 全局状态
  state: {
    appReady: false,
    currentUser: null,
    appTheme: localStorage.getItem('theme') || 'light',
    systemNotifications: []
  },
  // 修改状态的同步方法
  mutations: {
    SET_APP_READY(state, isReady) {
      state.appReady = isReady
    },
    SET_CURRENT_USER(state, user) {
      state.currentUser = user
    },
    SET_APP_THEME(state, theme) {
      state.appTheme = theme
      localStorage.setItem('theme', theme)
    },
    ADD_SYSTEM_NOTIFICATION(state, notification) {
      state.systemNotifications.push({
        ...notification,
        id: Date.now(),
        read: false
      })
    },
    MARK_NOTIFICATION_READ(state, notificationId) {
      const notification = state.systemNotifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    },
    CLEAR_NOTIFICATIONS(state) {
      state.systemNotifications = []
    }
  },
  // 可以包含异步操作的方法
  actions: {
    initializeApp({ commit, dispatch }) {
      // 应用初始化逻辑
      return new Promise((resolve) => {
        // 加载用户信息
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          commit('SET_CURRENT_USER', JSON.parse(savedUser))
        }
        
        // 设置应用为就绪状态
        commit('SET_APP_READY', true)
        resolve()
      })
    },
    setTheme({ commit }, theme) {
      commit('SET_APP_THEME', theme)
      // 更新DOM以反映主题变化
      document.documentElement.setAttribute('data-theme', theme)
    },
    logout({ commit }) {
      // 清除用户状态和本地存储
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      commit('SET_CURRENT_USER', null)
    },
    addNotification({ commit }, notification) {
      commit('ADD_SYSTEM_NOTIFICATION', notification)
      
      // 如果设置了自动关闭
      if (notification.autoClose !== false) {
        setTimeout(() => {
          commit('MARK_NOTIFICATION_READ', notification.id)
        }, notification.duration || 5000)
      }
    }
  },
  // 计算属性
  getters: {
    isAuthenticated: state => !!state.currentUser,
    currentUserRole: state => state.currentUser ? state.currentUser.role : null,
    unreadNotifications: state => state.systemNotifications.filter(n => !n.read),
    currentTheme: state => state.appTheme
  }
})

export default store 