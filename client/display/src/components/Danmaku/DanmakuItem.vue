<template>
  <div 
    :class="['danmaku-item', `priority-${message.priority}`, { 'is-read': message.isRead }]" 
    :style="style"
    @click="handleClick"
  >
    <div class="message-content">{{ message.content }}</div>
    <div class="message-meta">
      <span class="sender">{{ message.sender.name }}</span>
      <span class="time">{{ formatTime(message.createdAt) }}</span>
    </div>
    <div v-if="message.isRead" class="read-mark">
      <i class="el-icon-check"></i>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'DanmakuItem',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  emits: ['mark-read'],
  setup(props, { emit }) {
    // 随机位置计算
    const top = ref(Math.floor(Math.random() * 70) + 5) // 5% - 75% of screen height
    const speed = ref(Math.floor(Math.random() * 20) + 80) // 基础速度
    
    // 根据优先级调整速度
    const adjustedSpeed = computed(() => {
      if (props.message.priority === 'urgent') {
        return speed.value - 20 // 紧急消息更慢
      } else if (props.message.priority === 'important') {
        return speed.value - 10 // 重要消息稍慢
      }
      return speed.value
    })
    
    // 弹幕样式
    const style = computed(() => {
      return {
        top: `${top.value}%`,
        animationDuration: `${adjustedSpeed.value}s`
      }
    })
    
    // 时间格式化
    const formatTime = (timeString) => {
      const date = new Date(timeString)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 点击处理
    const handleClick = () => {
      if (!props.message.isRead) {
        emit('mark-read', props.message.id)
        ElMessage({
          message: '已确认阅读消息',
          type: 'success',
          duration: 1500
        })
      }
    }
    
    return {
      style,
      formatTime,
      handleClick
    }
  }
}
</script>

<style scoped>
.danmaku-item {
  position: absolute;
  right: -100%;
  pointer-events: auto;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 80%;
  animation: move linear;
  animation-fill-mode: forwards;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  white-space: pre-wrap;
  word-break: break-word;
}

.danmaku-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.danmaku-item.is-read {
  opacity: 0.7;
}

.priority-normal {
  background-color: rgba(255, 255, 255, 0.8);
  color: #333;
}

.priority-important {
  background-color: rgba(230, 162, 60, 0.8);
  color: #fff;
}

.priority-urgent {
  background-color: rgba(245, 108, 108, 0.8);
  color: #fff;
}

.message-content {
  font-size: 18px;
  margin-bottom: 4px;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  opacity: 0.8;
}

.read-mark {
  position: absolute;
  right: 10px;
  top: 10px;
  color: #67c23a;
  font-size: 18px;
}

@keyframes move {
  from {
    right: -100%;
  }
  to {
    right: 100%;
  }
}
</style> 