import api from '@/api'

const state = {
  messages: [], // 当前显示的弹幕消息
  unreadMessages: [], // 未读弹幕消息队列
  historyMessages: [], // 历史弹幕消息
  isPlaying: true, // 弹幕播放状态
  density: 2, // 弹幕密度 (1-低, 2-中, 3-高)
  currentClassId: null, // 当前班级ID
  hasMoreHistory: true, // 是否还有更多历史消息
  historyPage: 1, // 历史消息当前页码
  historyPageSize: 30, // 历史消息每页数量
  loadingHistory: false // 是否正在加载历史消息
}

const mutations = {
  SET_MESSAGES(state, messages) {
    state.messages = messages
  },
  ADD_MESSAGE(state, message) {
    // 添加新消息到当前显示的弹幕中
    state.messages.push(message)
    
    // 如果显示的消息过多，根据密度设置移除一些
    const maxMessages = state.density * 30 // 根据密度动态调整最大显示数量
    if (state.messages.length > maxMessages) {
      state.messages = state.messages.slice(-maxMessages)
    }
  },
  ADD_UNREAD_MESSAGE(state, message) {
    // 暂停状态下，将消息添加到未读队列
    state.unreadMessages.push(message)
  },
  CLEAR_UNREAD_MESSAGES(state) {
    state.unreadMessages = []
  },
  SET_UNREAD_MESSAGES(state, messages) {
    state.unreadMessages = messages
  },
  SET_HISTORY_MESSAGES(state, messages) {
    state.historyMessages = messages
  },
  APPEND_HISTORY_MESSAGES(state, messages) {
    state.historyMessages = [...state.historyMessages, ...messages]
  },
  SET_PLAYING(state, isPlaying) {
    state.isPlaying = isPlaying
  },
  SET_DENSITY(state, density) {
    state.density = density
  },
  SET_CURRENT_CLASS(state, classId) {
    state.currentClassId = classId
  },
  SET_HAS_MORE_HISTORY(state, hasMore) {
    state.hasMoreHistory = hasMore
  },
  INCREMENT_HISTORY_PAGE(state) {
    state.historyPage++
  },
  RESET_HISTORY_PAGE(state) {
    state.historyPage = 1
  },
  SET_LOADING_HISTORY(state, loading) {
    state.loadingHistory = loading
  },
  MARK_AS_READ(state, messageIds) {
    // 将消息标记为已读（从未读队列中移除）
    if (Array.isArray(messageIds)) {
      state.unreadMessages = state.unreadMessages.filter(
        msg => !messageIds.includes(msg.id)
      )
    } else {
      state.unreadMessages = state.unreadMessages.filter(
        msg => msg.id !== messageIds
      )
    }
  }
}

const actions = {
  // 从服务器获取未读消息
  async fetchUnreadMessages({ commit, state }) {
    if (!state.currentClassId) return

    try {
      const response = await api.message.getUnreadMessages(state.currentClassId)
      commit('SET_UNREAD_MESSAGES', response.data)
      return response.data
    } catch (error) {
      console.error('获取未读消息失败:', error)
      throw error
    }
  },
  
  // 从服务器加载历史消息
  async loadHistoryMessages({ commit, state }, { reset = false } = {}) {
    if (!state.currentClassId || (state.loadingHistory && !reset)) return

    try {
      commit('SET_LOADING_HISTORY', true)
      
      if (reset) {
        commit('RESET_HISTORY_PAGE')
      }
      
      const response = await api.message.getHistoryMessages(
        state.currentClassId, 
        state.historyPage, 
        state.historyPageSize
      )
      
      const messages = response.data.messages || []
      
      if (reset) {
        commit('SET_HISTORY_MESSAGES', messages)
      } else {
        commit('APPEND_HISTORY_MESSAGES', messages)
      }
      
      // 检查是否还有更多历史消息
      const hasMore = messages.length === state.historyPageSize
      commit('SET_HAS_MORE_HISTORY', hasMore)
      
      if (hasMore) {
        commit('INCREMENT_HISTORY_PAGE')
      }
      
      return messages
    } catch (error) {
      console.error('加载历史消息失败:', error)
      throw error
    } finally {
      commit('SET_LOADING_HISTORY', false)
    }
  },
  
  // 播放弹幕消息
  playMessages({ commit, state }) {
    commit('SET_PLAYING', true)
    
    // 将未读消息添加到显示中
    if (state.unreadMessages.length > 0) {
      const messagesToAdd = [...state.unreadMessages]
      messagesToAdd.forEach(message => {
        commit('ADD_MESSAGE', message)
      })
      commit('CLEAR_UNREAD_MESSAGES')
    }
  },
  
  // 暂停弹幕消息
  pauseMessages({ commit }) {
    commit('SET_PLAYING', false)
  },
  
  // 接收新消息
  receiveMessage({ commit, state }, message) {
    if (state.isPlaying) {
      // 播放状态下，直接添加到显示的弹幕中
      commit('ADD_MESSAGE', message)
    } else {
      // 暂停状态下，添加到未读队列
      commit('ADD_UNREAD_MESSAGE', message)
    }
  },
  
  // 设置弹幕密度
  setDensity({ commit }, density) {
    commit('SET_DENSITY', density)
  },
  
  // 切换班级
  async changeClass({ commit, dispatch }, classId) {
    commit('SET_CURRENT_CLASS', classId)
    commit('SET_MESSAGES', [])
    commit('SET_UNREAD_MESSAGES', [])
    commit('RESET_HISTORY_PAGE')
    commit('SET_HISTORY_MESSAGES', [])
    
    // 获取该班级的未读消息
    await dispatch('fetchUnreadMessages')
    
    // 加载该班级的历史消息
    await dispatch('loadHistoryMessages', { reset: true })
  },
  
  // 标记消息为已读
  async markAsRead({ commit }, messageIds) {
    try {
      await api.message.markAsRead(messageIds)
      commit('MARK_AS_READ', messageIds)
    } catch (error) {
      console.error('标记消息为已读失败:', error)
      throw error
    }
  }
}

const getters = {
  activeMessages: state => state.messages,
  unreadCount: state => state.unreadMessages.length,
  density: state => state.density,
  isPlaying: state => state.isPlaying,
  historyMessages: state => state.historyMessages,
  hasMoreHistory: state => state.hasMoreHistory,
  loadingHistory: state => state.loadingHistory,
  currentClassId: state => state.currentClassId
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
} 