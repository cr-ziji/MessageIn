<template>
  <div class="danmaku-container" :class="{ paused: !isPlaying }">
    <div class="control-panel">
      <el-button 
        :icon="isPlaying ? 'Pause' : 'VideoPlay'" 
        circle
        @click="togglePlay"
        :type="isPlaying ? 'danger' : 'success'"
        class="control-btn"
      />
      <el-button 
        icon="Delete" 
        circle
        @click="clearScreen"
        class="control-btn"
      />
      <el-dropdown @command="handleDensityChange" trigger="click">
        <el-button circle icon="Setting" class="control-btn" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :command="1" :disabled="density === 1">弹幕密度: 低</el-dropdown-item>
            <el-dropdown-item :command="2" :disabled="density === 2">弹幕密度: 中</el-dropdown-item>
            <el-dropdown-item :command="3" :disabled="density === 3">弹幕密度: 高</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <div v-if="unreadCount > 0" class="unread-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </div>
    </div>
    
    <div class="danmaku-screen">
      <transition-group name="danmaku-item" tag="div">
        <div 
          v-for="message in activeMessages" 
          :key="message.id" 
          class="danmaku-item"
          :style="getDanmakuStyle(message)"
        >
          <span class="username" :style="{ color: getUsernameColor(message.sender?.id || 'default') }">
            {{ message.sender?.name || '用户' }}:
          </span>
          <span class="content">{{ message.content }}</span>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

export default {
  name: 'DanmakuScreen',
  props: {
    classId: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const store = useStore()
    const messageColors = ref({})
    const colorPool = [
      '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1',
      '#955251', '#B565A7', '#009B77', '#DD4124', '#D65076',
      '#45B8AC', '#EFC050', '#5B5EA6', '#9B2335', '#DFCFBE'
    ]

    // 计算属性
    const isPlaying = computed(() => store.getters['danmaku/isPlaying'])
    const activeMessages = computed(() => store.getters['danmaku/activeMessages'] || [])
    const unreadCount = computed(() => store.getters['danmaku/unreadCount'] || 0)
    const density = computed(() => store.getters['danmaku/density'] || 2)

    // 监听班级ID变化
    watch(() => props.classId, async (newClassId, oldClassId) => {
      if (newClassId) {
        await store.dispatch('danmaku/changeClass', newClassId)
        // 模拟数据 - 实际应用中应删除
        simulateMessages()
      }
    }, { immediate: true })

    // 模拟弹幕数据（测试用）
    const simulateMessages = () => {
      const demoMessages = [
        {
          id: 'msg1',
          content: '欢迎使用弹幕系统！',
          sender: { id: 'user1', name: '系统消息' },
          priority: 'important'
        },
        {
          id: 'msg2',
          content: '这是一条测试弹幕',
          sender: { id: 'user2', name: '测试用户' },
          priority: 'normal'
        },
        {
          id: 'msg3',
          content: '今天天气真不错！',
          sender: { id: 'user3', name: '张三' },
          priority: 'normal'
        }
      ]
      
      // 添加模拟消息
      demoMessages.forEach(msg => {
        store.dispatch('danmaku/receiveMessage', msg)
      })
      
      // 定时添加更多消息
      setTimeout(() => {
        store.dispatch('danmaku/receiveMessage', {
          id: 'msg4',
          content: '弹幕系统运行正常',
          sender: { id: 'user4', name: '李四' },
          priority: 'normal'
        })
      }, 2000)
    }

    // 获取用户名颜色
    const getUsernameColor = (userId) => {
      if (!messageColors.value[userId]) {
        // 为每个用户分配固定颜色
        const colorIndex = Object.keys(messageColors.value).length % colorPool.length
        messageColors.value[userId] = colorPool[colorIndex]
      }
      return messageColors.value[userId]
    }

    // 获取弹幕样式（位置、动画时间等）
    const getDanmakuStyle = (message) => {
      // 随机弹幕轨道（高度位置）
      const track = Math.floor(Math.random() * 10) + 1
      const top = track * 40 + 'px'
      
      // 随机动画持续时间（8-12秒）
      const duration = (Math.random() * 4 + 8) + 's'
      
      // 为了让每条弹幕动画区分开，使用弹幕ID作为随机种子
      const animationDelay = ((message.id.charCodeAt(0) || 0) % 5) * 0.1 + 's'
      
      return {
        top,
        '--duration': duration,
        '--delay': animationDelay
      }
    }

    // 播放/暂停弹幕
    const togglePlay = () => {
      if (isPlaying.value) {
        store.dispatch('danmaku/pauseMessages')
      } else {
        store.dispatch('danmaku/playMessages')
      }
    }

    // 清空屏幕上的弹幕
    const clearScreen = () => {
      store.commit('danmaku/SET_MESSAGES', [])
    }

    // 改变弹幕密度
    const handleDensityChange = (density) => {
      store.dispatch('danmaku/setDensity', density)
    }

    onMounted(() => {
      ElMessage.success('弹幕屏幕已准备就绪')
    })

    onUnmounted(() => {
      // 清理资源
    })

    return {
      isPlaying,
      activeMessages,
      unreadCount,
      density,
      getUsernameColor,
      getDanmakuStyle,
      togglePlay,
      clearScreen,
      handleDensityChange
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
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
}

.danmaku-container.paused .danmaku-item {
  animation-play-state: paused;
}

.control-panel {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 100;
  display: flex;
  gap: 10px;
}

.control-btn {
  opacity: 0.7;
  transition: opacity 0.3s;
}

.control-btn:hover {
  opacity: 1;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #f56c6c;
  color: white;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.danmaku-screen {
  position: relative;
  width: 100%;
  height: 100%;
}

.danmaku-item {
  position: absolute;
  white-space: nowrap;
  font-size: 24px;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 4px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  will-change: transform;
  animation: danmaku-move var(--duration, 10s) linear;
  animation-delay: var(--delay, 0s);
  right: -100%;
  transform: translateX(0);
}

.username {
  margin-right: 5px;
  font-weight: bold;
}

.content {
  word-break: keep-all;
}

@keyframes danmaku-move {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-200vw);
  }
}

/* 进入离开动画 */
.danmaku-item-enter-active,
.danmaku-item-leave-active {
  transition: opacity 0.5s ease;
}

.danmaku-item-enter-from,
.danmaku-item-leave-to {
  opacity: 0;
}
</style> 