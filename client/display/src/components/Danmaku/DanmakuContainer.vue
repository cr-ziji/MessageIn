<template>
  <div class="danmaku-container">
    <div class="danmaku-stage">
      <transition-group name="danmaku" tag="div">
        <DanmakuItem
          v-for="message in activeMessages"
          :key="message.id"
          :message="message"
          @mark-read="markMessageAsRead"
        />
      </transition-group>
    </div>
    
    <div class="control-panel" v-if="showControls">
      <el-button 
        type="primary" 
        @click="togglePause" 
        :icon="isPaused ? 'el-icon-video-play' : 'el-icon-video-pause'"
        size="small"
      >
        {{ isPaused ? '继续' : '暂停' }}
      </el-button>
      <el-button 
        type="info" 
        @click="fetchHistoricalMessages" 
        :loading="isLoading"
        size="small"
        icon="el-icon-refresh"
      >
        加载历史消息
      </el-button>
      <el-button-group>
        <el-button 
          type="warning" 
          :disabled="!canAdjustDensity(-1)"
          @click="adjustDensity(-1)" 
          size="small"
          icon="el-icon-remove"
        >
          减少密度
        </el-button>
        <el-button 
          type="warning" 
          :disabled="!canAdjustDensity(1)"
          @click="adjustDensity(1)" 
          size="small" 
          icon="el-icon-plus"
        >
          增加密度
        </el-button>
      </el-button-group>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useStore } from 'vuex'
import DanmakuItem from './DanmakuItem.vue'
import { ElMessage } from 'element-plus'
import socket from '@/services/socket'

export default {
  name: 'DanmakuContainer',
  components: {
    DanmakuItem
  },
  props: {
    classId: {
      type: String,
      required: true
    },
    showControls: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const store = useStore()
    const messages = ref([])
    const isPaused = ref(false)
    const isLoading = ref(false)
    const maxVisibleMessages = ref(10) // 默认最大显示量
    
    // 活跃消息（当前显示）
    const activeMessages = computed(() => {
      if (isPaused.value) {
        return messages.value
      }
      
      // 按优先级和时间排序，并限制显示数量
      return [...messages.value]
        .sort((a, b) => {
          // 优先级比较
          const priorityOrder = { 'urgent': 0, 'important': 1, 'normal': 2 }
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority]
          }
          // 时间比较（新消息优先）
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
        .slice(0, maxVisibleMessages.value)
    })
    
    // 初始化消息数据
    const fetchMessages = async () => {
      try {
        isLoading.value = true
        const response = await store.dispatch('messages/fetchUnreadMessages', {
          classId: props.classId
        })
        messages.value = response.data || []
      } catch (error) {
        ElMessage.error('获取消息失败：' + error.message)
      } finally {
        isLoading.value = false
      }
    }
    
    // 获取历史消息
    const fetchHistoricalMessages = async () => {
      try {
        isLoading.value = true
        const response = await store.dispatch('messages/fetchHistoricalMessages', {
          classId: props.classId,
          limit: 20
        })
        
        // 合并消息并去重
        const newMessages = response.data || []
        const existingIds = new Set(messages.value.map(m => m.id))
        const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id))
        
        messages.value = [...messages.value, ...uniqueNewMessages]
        
        ElMessage.success(`已加载 ${uniqueNewMessages.length} 条历史消息`)
      } catch (error) {
        ElMessage.error('获取历史消息失败：' + error.message)
      } finally {
        isLoading.value = false
      }
    }
    
    // 标记消息为已读
    const markMessageAsRead = async (messageId) => {
      try {
        await store.dispatch('messages/markAsRead', { messageId })
        
        // 更新本地状态
        messages.value = messages.value.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, isRead: true }
          }
          return msg
        })
      } catch (error) {
        ElMessage.error('标记消息失败：' + error.message)
      }
    }
    
    // WebSocket 相关处理
    const setupWebsocket = () => {
      // 新消息处理
      socket.on('new-message', (message) => {
        // 检查消息是否已存在
        if (!messages.value.some(m => m.id === message.id)) {
          messages.value = [message, ...messages.value]
        }
      })
      
      // 消息过期处理
      socket.on('message-expired', (messageId) => {
        messages.value = messages.value.filter(m => m.id !== messageId)
      })
    }
    
    // 暂停/继续弹幕
    const togglePause = () => {
      isPaused.value = !isPaused.value
      ElMessage({
        message: isPaused.value ? '弹幕已暂停' : '弹幕已继续',
        type: 'info',
        duration: 1000
      })
    }
    
    // 调整弹幕密度
    const adjustDensity = (change) => {
      maxVisibleMessages.value += change
      ElMessage({
        message: `弹幕密度已调整为 ${maxVisibleMessages.value}`,
        type: 'info',
        duration: 1000
      })
    }
    
    // 检查是否可以调整密度
    const canAdjustDensity = (change) => {
      const newValue = maxVisibleMessages.value + change
      return newValue >= 1 && newValue <= 30 // 限制在1-30之间
    }
    
    // 组件挂载
    onMounted(() => {
      fetchMessages()
      setupWebsocket()
    })
    
    // 组件卸载前
    onBeforeUnmount(() => {
      socket.off('new-message')
      socket.off('message-expired')
    })
    
    // 监听班级ID变化
    watch(() => props.classId, (newId) => {
      if (newId) {
        messages.value = []
        fetchMessages()
      }
    })
    
    return {
      activeMessages,
      isLoading,
      isPaused,
      togglePause,
      fetchHistoricalMessages,
      markMessageAsRead,
      adjustDensity,
      canAdjustDensity
    }
  }
}
</script>

<style scoped>
.danmaku-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

.danmaku-stage {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.control-panel {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 8px;
  display: flex;
  gap: 10px;
}

/* 弹幕动画 */
.danmaku-enter-active,
.danmaku-leave-active {
  transition: opacity 0.5s ease;
}

.danmaku-enter-from {
  opacity: 0;
}

.danmaku-leave-to {
  opacity: 0;
}
</style> 