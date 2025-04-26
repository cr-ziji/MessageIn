<template>
  <div class="danmaku-manager">
    <!-- 弹幕覆盖层 -->
    <DanmakuOverlay 
      :visible="danmakuStore.isVisible" 
      :messages="danmakuStore.unprocessedMessages"
      :speed="danmakuStore.speed"
      @message-read="handleMessageRead"
    />
    
    <!-- 弹幕控制按钮 -->
    <DanmakuControl />
  </div>
</template>

<script>
import { useDanmakuStore } from '@/store/modules/danmaku';
import DanmakuOverlay from './DanmakuOverlay.vue';
import DanmakuControl from './DanmakuControl.vue';
import { ref, onMounted, watch } from 'vue';

export default {
  name: 'DanmakuManager',
  components: {
    DanmakuOverlay,
    DanmakuControl
  },
  setup() {
    const danmakuStore = useDanmakuStore();
    const isElectron = ref(window.electronAPI !== undefined);
    
    // 处理消息的已读状态变化
    const handleMessageRead = (data) => {
      danmakuStore.updateMessageReadStatus(data.id, data.read);
      
      // 如果标记为已读，可以在这里执行其他操作
      if (data.read) {
        // 例如：记录已读状态、同步到服务器等
        console.log(`消息 ${data.id} 已标记为已读`);
      }
    };
    
    // 监控弹幕可见性，在Electron环境中通知主进程
    watch(() => danmakuStore.isVisible, (visible) => {
      if (isElectron.value) {
        window.electronAPI.toggleDanmakuOverlay(visible);
      }
    });
    
    // 在Electron环境中，组件挂载时通知主进程弹幕的可见性
    onMounted(() => {
      if (isElectron.value) {
        window.electronAPI.toggleDanmakuOverlay(danmakuStore.isVisible);
      }
      
      // 定时添加测试弹幕
      if (process.env.NODE_ENV === 'development') {
        // 每隔5秒添加一条随机测试弹幕
        const messages = [
          "这是顶部单行弹幕测试"
        ];
        
        const colors = [
          'rgba(25, 118, 210, 0.85)',
          'rgba(33, 150, 243, 0.85)',
          'rgba(66, 165, 245, 0.85)',
          'rgba(13, 71, 161, 0.85)',
          'rgba(21, 101, 192, 0.85)'
        ];
        
        let index = 0;
        setInterval(() => {
          if (danmakuStore.isVisible && index < messages.length) {
            danmakuStore.addMessage({
              content: messages[index],
              bgColor: colors[index % colors.length]
            });
            index = (index + 1) % messages.length;
          }
        }, 5000);
      }
    });
    
    return {
      danmakuStore,
      handleMessageRead,
      isElectron
    };
  }
}
</script>

<style scoped>
.danmaku-manager {
  /* 这个组件不需要特殊样式，它只是一个容器 */
}
</style> 