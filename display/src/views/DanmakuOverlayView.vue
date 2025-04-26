<template>
  <div class="danmaku-overlay-view">
    <DanmakuOverlay 
      :visible="true" 
      :messages="danmakuStore.unprocessedMessages"
      :speed="danmakuStore.speed"
      @message-read="handleMessageRead"
    />
  </div>
</template>

<script>
import { useDanmakuStore } from '@/store/modules/danmaku';
import DanmakuOverlay from '@/components/Danmaku/DanmakuOverlay.vue';
import { ref, onMounted } from 'vue';

export default {
  name: 'DanmakuOverlayView',
  components: {
    DanmakuOverlay
  },
  setup() {
    const danmakuStore = useDanmakuStore();
    const isReady = ref(false);
    
    // 处理消息已读状态变化
    const handleMessageRead = (data) => {
      danmakuStore.updateMessageReadStatus(data.id, data.read);
    };
    
    onMounted(() => {
      // 设置一个延时让Electron有时间准备透明窗口
      setTimeout(() => {
        isReady.value = true;
        console.log('DanmakuOverlayView 已准备好');
      }, 500);
      
      // 添加测试弹幕
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          danmakuStore.addMessage({
            content: "这是一条测试弹幕 - 现在弹幕只会显示在顶部",
            bgColor: 'rgba(25, 118, 210, 0.85)'
          });
        }, 1000);
      }
    });
    
    return {
      danmakuStore,
      handleMessageRead,
      isReady
    };
  }
}
</script>

<style scoped>
.danmaku-overlay-view {
  width: 100%;
  height: 100%;
  /* 使背景完全透明 */
  background-color: transparent;
  pointer-events: none;
}

/* 全局样式：让文档背景透明 */
:global(body), :global(html) {
  background-color: transparent !important;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* 弹幕项目可以接收点击事件 */
:deep(.danmaku-item) {
  pointer-events: auto;
}
</style> 