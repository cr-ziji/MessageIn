<template>
  <div class="home">
    <DanmakuManager />
    
    <div class="home-content">
      <div class="welcome-section">
        <h1>MessageIn 显示端</h1>
        <p class="subtitle">实时消息显示系统</p>
      </div>
      
      <div class="info-section">
        <div class="info-card">
          <h2>当前正在获取来自API的消息</h2>
          <p>API地址: <code>http://www.cyupeng.com/message</code></p>
          <p>弹幕将自动显示在屏幕顶部</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, onBeforeUnmount } from 'vue';
import DanmakuManager from '@/components/Danmaku/DanmakuManager.vue';
import messageService from '@/utils/messageService';

export default defineComponent({
  name: 'Home',
  components: {
    DanmakuManager
  },
  setup() {
    onMounted(() => {
      console.log('首页组件挂载');
      // 初始化并启动消息服务
      messageService.initialize();
    });
    
    onBeforeUnmount(() => {
      // 停止消息服务
      messageService.destroy();
    });
    
    return {};
  }
});
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.home-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.welcome-section {
  margin-bottom: 3rem;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--color-primary);
}

.subtitle {
  font-size: 1.5rem;
  color: var(--color-text-secondary);
}

.info-section {
  width: 100%;
  max-width: 800px;
}

.info-card {
  background-color: var(--color-background-secondary);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

code {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
}
</style> 