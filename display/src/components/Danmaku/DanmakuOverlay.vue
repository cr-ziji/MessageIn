<template>
  <div class="danmaku-overlay" v-if="store.isVisible">
    <div class="danmaku-lane">
      <template v-for="message in activeLaneMessages(0)" :key="message.id">
        <div 
          class="danmaku-item" 
          :style="computeMessageStyle(message)" 
          :data-id="message.id"
        >
          <div class="danmaku-content" :style="{ color: message.color || '#ffffff' }">
            {{ message.content }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useDanmakuStore } from '@/stores/danmaku';

export default {
  name: 'DanmakuOverlay',
  setup() {
    const store = useDanmakuStore();
    
    // 弹幕轨道配置 - 单行模式
    const laneHeight = ref(40); // 单行高度
    // 活动消息列表
    const activeMessages = ref([]);
    const laneMessages = ref([[]]);
    
    // 计算弹幕动画持续时间，基于速度设置（1-10，10最慢）
    const animationDuration = computed(() => {
      // 将速度值(1-10)转换为动画时间(5-15秒)
      return 5 + (store.speed - 1) * (10 / 9);
    });
    
    // 获取指定轨道的消息 - 单行模式只使用第一条轨道
    const activeLaneMessages = () => {
      return laneMessages.value[0] || [];
    };
    
    // 计算弹幕样式
    const computeMessageStyle = (message) => {
      return {
        animationDuration: `${animationDuration.value}s`,
        backgroundColor: message.bgColor || 'rgba(0, 0, 0, 0.75)',
        opacity: message.opacity || 0.85,
        fontSize: `${message.fontSize || 18}px`
      };
    };
    
    // 处理新消息
    const processNewMessages = () => {
      // 获取未处理的新消息
      const unprocessedMessages = store.messages.filter(message => 
        !activeMessages.value.some(active => active.id === message.id)
      );
      
      // 为每条消息分配位置并添加到活动消息中
      unprocessedMessages.forEach(message => {
        const processedMessage = {
          ...message,
          laneIndex: 0, // 单行模式固定为第一行
          createdAt: new Date()
        };
        
        // 添加到活动消息和对应轨道
        activeMessages.value.push(processedMessage);
        laneMessages.value[0].push(processedMessage);
        
        // 设置消息超时移除
        setTimeout(() => {
          removeMessage(processedMessage.id);
        }, animationDuration.value * 1000 + 500); // 动画时间 + 额外缓冲
      });
    };
    
    // 移除消息
    const removeMessage = (id) => {
      // 从活动消息中移除
      const msgIndex = activeMessages.value.findIndex(msg => msg.id === id);
      if (msgIndex !== -1) {
        activeMessages.value.splice(msgIndex, 1);
        
        // 从轨道中移除
        const laneMsgIndex = laneMessages.value[0].findIndex(msg => msg.id === id);
        if (laneMsgIndex !== -1) {
          laneMessages.value[0].splice(laneMsgIndex, 1);
        }
      }
    };
    
    onMounted(() => {
      // 初始化消息处理
      processNewMessages();
      
      // 设置定时器，定期处理新消息
      const messageProcessor = setInterval(() => {
        processNewMessages();
      }, 1000);
      
      // 清理函数
      onBeforeUnmount(() => {
        clearInterval(messageProcessor);
      });
    });
    
    // 监听消息变化
    watch(() => store.messages.length, () => {
      processNewMessages();
    });
    
    return {
      store,
      laneHeight,
      activeLaneMessages,
      computeMessageStyle
    };
  }
}
</script>

<style scoped>
.danmaku-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 40px; /* 单行高度 */
  pointer-events: none; /* 确保点击穿透 */
  z-index: 9999;
  overflow: hidden;
  background-color: transparent !important;
}

.danmaku-lane {
  position: absolute;
  width: 100%;
  height: 40px;
  overflow: visible;
  pointer-events: none; /* 确保点击穿透 */
}

.danmaku-item {
  position: absolute;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  transform: translateX(100vw);
  will-change: transform;
  animation: danmaku-move 8s linear forwards;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.75);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 32px;
  top: 4px;
  pointer-events: none; /* 确保点击穿透 */
}

.danmaku-content {
  font-size: 18px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  color: #ffffff;
  pointer-events: none; /* 确保点击穿透 */
}

@keyframes danmaku-move {
  from {
    transform: translateX(100vw);
  }
  to {
    transform: translateX(-100%);
  }
}
</style> 