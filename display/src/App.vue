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
import { defineComponent, onMounted, onBeforeUnmount } from 'vue';
import { useDanmakuStore } from '@/store/modules/danmaku';
import DanmakuManager from '@/components/Danmaku/DanmakuManager.vue';
import danmakuService from '@/utils/danmakuService';

export default defineComponent({
  name: 'App',
  components: {
    DanmakuManager
  },
  setup() {
    const danmakuStore = useDanmakuStore();
    
    // 初始化弹幕服务
    const initializeDanmakuService = () => {
      try {
        console.log('初始化弹幕服务...');
        
        // 仅在生产环境尝试连接WebSocket
        if (process.env.NODE_ENV === 'production') {
          danmakuService.initialize();
        } else {
          console.log('开发环境：弹幕服务使用模拟数据');
          // 确保初始化已完成
          danmakuService.initialize();
          
          // 开发环境下添加一些测试弹幕
          setTimeout(() => {
            try {
              danmakuService.addMockDanmaku('欢迎使用MessageIn弹幕功能', { color: '#ff7777' });
              
              setTimeout(() => {
                danmakuService.addMockDanmaku('您可以发送实时消息到显示端', { color: '#77ff77' });
              }, 3000);
              
              setTimeout(() => {
                danmakuService.addMockDanmaku('消息将在顶部以弹幕形式滚动显示', { color: '#7777ff' });
              }, 6000);
            } catch (error) {
              console.error('添加测试弹幕失败:', error);
            }
          }, 2000);
        }
      } catch (error) {
        console.error('初始化弹幕服务失败:', error);
      }
    };

    onMounted(() => {
      console.log('App组件已挂载');
      // 在组件挂载后初始化
      initializeDanmakuService();
    });

    onBeforeUnmount(() => {
      // 组件卸载前关闭WebSocket连接
      danmakuService.close();
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