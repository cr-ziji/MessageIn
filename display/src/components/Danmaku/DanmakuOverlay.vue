<template>
  <div class="danmaku-overlay" v-if="visible">
    <div class="danmaku-container">
      <transition-group name="danmaku-item" tag="div">
        <div 
          v-for="message in activeMessages" 
          :key="message.id" 
          class="danmaku-item"
          :style="{ 
            animationDuration: `${animationDuration}s`,
            backgroundColor: message.bgColor || '#1976d2',
            left: `${message.position || 100}%`
          }"
          @animationend="onAnimationEnd(message)"
        >
          <div class="danmaku-content">
            {{ message.content }}
          </div>
          <div class="danmaku-actions">
            <el-checkbox 
              v-model="message.read" 
              @change="markAsRead(message)"
              class="read-checkbox"
              size="small"
            >
              已读
            </el-checkbox>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DanmakuOverlay',
  props: {
    visible: {
      type: Boolean,
      default: true
    },
    messages: {
      type: Array,
      default: () => []
    },
    speed: {
      type: Number,
      default: 10 // 动画持续时间（秒）
    }
  },
  data() {
    return {
      activeMessages: [],
      laneHeight: 50, // 单行弹幕高度
      maxActiveDanmaku: 10 // 最大同时显示的弹幕数量
    }
  },
  computed: {
    animationDuration() {
      return this.speed;
    }
  },
  watch: {
    messages: {
      handler(newMessages) {
        if (newMessages && newMessages.length) {
          this.processNewMessages(newMessages);
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    processNewMessages(messages) {
      // 限制活动弹幕数量，避免性能问题
      if (this.activeMessages.length >= this.maxActiveDanmaku) {
        return;
      }
      
      // 为每条消息分配位置并添加到活动消息中
      messages.forEach(message => {
        if (!message.processed) {
          const processedMessage = {
            ...message,
            processed: true,
            read: false,
            position: this.getRandomPosition(),
            bgColor: message.bgColor || this.getRandomColor(),
            createdAt: new Date(),
            animationCompleted: false
          };
          
          this.activeMessages.push(processedMessage);
        }
      });
    },
    
    getRandomPosition() {
      // 随机左侧初始位置，确保弹幕不重叠
      return 100 + Math.floor(Math.random() * 20);
    },
    
    getRandomColor() {
      // 提供一组预定义的蓝白色调背景色
      const colors = [
        'rgba(25, 118, 210, 0.85)', // 深蓝色
        'rgba(33, 150, 243, 0.85)', // 蓝色
        'rgba(66, 165, 245, 0.85)', // 浅蓝色
        'rgba(100, 181, 246, 0.85)', // 更浅的蓝色
        'rgba(13, 71, 161, 0.85)', // 深靛蓝色
        'rgba(21, 101, 192, 0.85)'  // 深天蓝色
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    
    removeMessage(id) {
      const index = this.activeMessages.findIndex(msg => msg.id === id);
      if (index !== -1) {
        this.activeMessages.splice(index, 1);
      }
    },
    
    markAsRead(message) {
      // 触发事件，通知父组件消息已读状态变化
      this.$emit('message-read', {
        id: message.id,
        read: message.read
      });
    },
    
    onAnimationEnd(message) {
      // 弹幕动画结束（完全离开屏幕）
      message.animationCompleted = true;
      
      // 设置延迟以确保完全离开屏幕后再移除
      setTimeout(() => {
        // 如果已读，多保留一段时间
        if (message.read) {
          setTimeout(() => {
            this.removeMessage(message.id);
          }, 5000); // 已读消息再等待5秒
        } else {
          this.removeMessage(message.id);
        }
      }, 500); // 额外缓冲500ms
    }
  }
}
</script>

<style scoped>
.danmaku-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 50px; /* 单排弹幕高度 */
  z-index: 9999;
  pointer-events: none; /* 默认不接收点击事件，以便点击穿透 */
  overflow: hidden;
}

.danmaku-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.danmaku-item {
  position: absolute;
  display: flex;
  align-items: center;
  top: 5px; /* 固定在顶部 */
  background-color: rgba(25, 118, 210, 0.85); /* 默认蓝色背景，增加透明度 */
  color: #ffffff;
  border-radius: 24px; /* 圆角矩形 */
  padding: 4px 16px 4px 16px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(33, 150, 243, 0.3); /* 优化阴影效果 */
  will-change: transform; /* 优化动画性能 */
  animation: danmakuMoveHorizontal linear;
  animation-fill-mode: forwards;
  transform: translateZ(0);
  white-space: nowrap; /* 确保内容不换行 */
  pointer-events: auto; /* 弹幕本身可以接收点击事件 */
  max-width: 60%; /* 限制最大宽度 */
  min-width: min-content; /* 根据内容设置最小宽度 */
  border: 1px solid rgba(255, 255, 255, 0.3); /* 增强白色边框效果 */
  backdrop-filter: blur(8px); /* 毛玻璃效果 */
  background-image: linear-gradient(45deg, 
                     rgba(255, 255, 255, 0.15) 25%, 
                     transparent 25%, 
                     transparent 50%, 
                     rgba(255, 255, 255, 0.15) 50%, 
                     rgba(255, 255, 255, 0.15) 75%, 
                     transparent 75%, 
                     transparent); /* 条纹渐变效果 */
  background-size: 30px 30px; /* 条纹大小 */
  height: 40px; /* 固定高度 */
}

.danmaku-content {
  margin-right: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 255, 255, 0.3); /* 文字阴影效果 */
}

.danmaku-actions {
  margin-left: auto;
  flex-shrink: 0;
}

.read-checkbox {
  font-size: 0.8rem;
  color: #fff;
}

.read-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #ffffff;
  border-color: #ffffff;
}

.read-checkbox :deep(.el-checkbox__inner::after) {
  border-color: #1976d2; /* 勾选的颜色改为深蓝色 */
}

@keyframes danmakuMoveHorizontal {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-200%);
  }
}

/* 进入和离开动画 */
.danmaku-item-enter-active {
  transition: all 0.5s ease;
}

.danmaku-item-leave-active {
  transition: all 0.5s ease;
}

.danmaku-item-enter-from {
  opacity: 0;
  transform: translateX(5%) scale(0.9);
}

.danmaku-item-leave-to {
  opacity: 0;
}

/* 增加弹幕发光效果 */
.danmaku-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 24px;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 70%
  );
  filter: blur(4px);
  opacity: 0.7;
  z-index: -1;
}
</style> 