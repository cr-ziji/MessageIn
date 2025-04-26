<template>
  <div class="danmaku-only-view">
    <DanmakuOverlay />
  </div>
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue';
import DanmakuOverlay from '@/components/Danmaku/DanmakuOverlay.vue';
import { useDanmakuStore } from '@/stores/danmaku';

export default defineComponent({
  name: 'DanmakuOnlyView',
  components: {
    DanmakuOverlay
  },
  setup() {
    const danmakuStore = useDanmakuStore();
    const isElectron = ref(window.electronAPI !== undefined);
    
    onMounted(() => {
      // 确保弹幕可见
      danmakuStore.setVisibility(true);
      
      // 强制设置页面为透明
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.classList.add('transparent-bg');
      document.documentElement.classList.add('transparent-bg');
      
      // 设置为单行模式，控制高度
      if (isElectron.value) {
        const height = 50; // 设置为固定的较小高度
        window.electronAPI.updateDanmakuStyle({ height });
      }
    });
    
    return {};
  }
});
</script>

<style>
/* 全局样式覆盖 */
html, body {
  background-color: transparent !important;
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 50px;
  pointer-events: none !important; /* 确保点击穿透 */
}

.danmaku-only-view {
  width: 100%;
  height: 50px;
  overflow: hidden;
  background-color: transparent !important;
  pointer-events: none !important; /* 确保点击穿透 */
}

/* 确保所有背景元素隐藏 */
#app {
  background: none !important;
  background-color: transparent !important;
  pointer-events: none !important; /* 确保点击穿透 */
}

/* 隐藏所有不必要的背景元素 */
.background-animation,
.background-gradient,
.background-overlay {
  display: none !important;
}
</style> 