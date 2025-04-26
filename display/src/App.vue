<template>
  <div id="app">
    <!-- 背景元素 -->
    <div class="background-animation"></div>
    <div class="background-gradient"></div>
    <div class="background-overlay"></div>
    
    <!-- 路由视图 -->
    <router-view />
    
    <!-- 弹幕管理器 -->
    <DanmakuManager />
  </div>
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount, watch } from 'vue';
import { useDanmakuStore } from '@/stores/danmaku';
import DanmakuManager from '@/components/Danmaku/DanmakuManager.vue';
import messageService from '@/utils/messageService';
import { useRoute } from 'vue-router';

export default defineComponent({
  name: 'App',
  components: {
    DanmakuManager
  },
  setup() {
    const danmakuStore = useDanmakuStore();
    const route = useRoute();
    
    // 设置透明背景（用于弹幕模式）
    const setupTransparentMode = () => {
      const isDanmakuMode = route.path === '/danmaku-only';
      
      if (isDanmakuMode) {
        // 添加透明背景类
        document.documentElement.classList.add('transparent-bg');
        document.body.classList.add('transparent-bg');
      } else {
        // 移除透明背景类
        document.documentElement.classList.remove('transparent-bg');
        document.body.classList.remove('transparent-bg');
      }
    };

    onMounted(() => {
      console.log('App组件已挂载');
      // 在组件挂载后初始化
      setupTransparentMode();
      
      // 初始化消息服务
      if (!route.path.includes('danmaku-only')) {
        messageService.initialize();
      }
    });

    // 监听路由变化，更新透明模式
    watch(() => route.path, (newPath) => {
      setupTransparentMode();
      
      // 路由切换时处理消息服务
      if (newPath.includes('danmaku-only')) {
        // 在弹幕专用页面停止消息轮询
        messageService.stopPolling();
      } else {
        // 在其他页面启动消息轮询
        messageService.initialize();
      }
    });

    onBeforeUnmount(() => {
      // 组件卸载前关闭消息服务
      messageService.destroy();
    });

    return {
      danmakuStore
    };
  }
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #ffffff;
  background-color: #121212;
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 美化背景样式 */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -3;
  opacity: 0.2;
  background: linear-gradient(125deg, #1976d2, #42a5f5, #0d47a1, #1565c0);
  background-size: 400% 400%;
  animation: gradient-animation 15s ease infinite;
}

.background-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  background: radial-gradient(circle at center, rgba(25, 118, 210, 0.5) 0%, rgba(13, 71, 161, 0.7) 70%, rgba(0, 0, 0, 0.8) 100%);
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></svg>');
  background-size: 20px 20px;
}

@keyframes gradient-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style> 