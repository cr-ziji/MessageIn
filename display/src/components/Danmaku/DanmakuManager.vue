<template>
  <div class="danmaku-manager">
    <!-- 弹幕覆盖层 -->
    <DanmakuOverlay v-if="!externalWindowActive" />
    
    <!-- 弹幕控制按钮 -->
    <DanmakuControl 
      @toggle-visibility="toggleVisibility"
      @change-speed="changeSpeed"
      @change-opacity="changeOpacity"
      @clear-messages="clearMessages"
      @add-demo-messages="addDemoMessages"
      @toggle-external-window="toggleExternalWindow"
    />
    
    <!-- 外部窗口状态显示 -->
    <div v-if="externalWindowActive && isElectron" class="external-window-indicator">
      <el-alert
        title="弹幕在独立窗口中显示中"
        type="success"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>弹幕已经在独立窗口中显示，可以通过控制面板调整设置。</p>
          <el-button size="small" @click="toggleExternalWindow(false)">关闭独立窗口</el-button>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted, ref } from 'vue';
import DanmakuOverlay from './DanmakuOverlay.vue';
import DanmakuControl from './DanmakuControl.vue';
import { useDanmakuStore } from '@/stores/danmaku';
import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

export default defineComponent({
  name: 'DanmakuManager',
  components: {
    DanmakuOverlay,
    DanmakuControl
  },
  setup() {
    const danmakuStore = useDanmakuStore();
    const { isVisible } = storeToRefs(danmakuStore);
    const isElectron = computed(() => window.electronAPI !== undefined);
    const externalWindowActive = ref(false);
    
    // 切换弹幕可见性
    const toggleVisibility = (visible) => {
      danmakuStore.setVisibility(visible);
      
      // 如果有外部窗口，同步更新
      if (externalWindowActive.value && isElectron.value) {
        window.electronAPI.toggleDanmakuOverlay(visible);
      }
    };
    
    // 更改滚动速度
    const changeSpeed = (newSpeed) => {
      danmakuStore.setSpeed(newSpeed);
    };
    
    // 更改透明度
    const changeOpacity = (newOpacity) => {
      danmakuStore.setOpacity(newOpacity);
    };
    
    // 清除所有消息
    const clearMessages = () => {
      danmakuStore.clearMessages();
    };
    
    // 添加演示消息
    const addDemoMessages = () => {
      const demoMessages = [
        {
          id: uuidv4(),
          content: '欢迎使用弹幕系统！',
          bgColor: 'rgba(25, 118, 210, 0.85)'
        },
        {
          id: uuidv4(),
          content: '您可以调整弹幕的速度和透明度',
          bgColor: 'rgba(211, 47, 47, 0.85)'
        },
        {
          id: uuidv4(),
          content: '点击右下角按钮可以控制弹幕',
          bgColor: 'rgba(56, 142, 60, 0.85)'
        }
      ];
      
      demoMessages.forEach(msg => danmakuStore.addMessage(msg));
    };
    
    // 切换外部弹幕窗口
    const toggleExternalWindow = (active) => {
      if (!isElectron.value) return;
      
      externalWindowActive.value = active;
      window.electronAPI.toggleDanmakuOverlay(active);
      
      // 如果启用外部窗口，发送消息
      if (active) {
        // 稍后发送一条测试消息
        setTimeout(() => {
          danmakuStore.addMessage({
            id: uuidv4(),
            content: '独立弹幕窗口已启动',
            bgColor: 'rgba(25, 118, 210, 0.85)'
          });
        }, 1000);
      }
    };
    
    // 组件挂载时初始化
    onMounted(() => {
      // 自动添加一条欢迎消息
      setTimeout(() => {
        danmakuStore.addMessage({
          id: uuidv4(),
          content: '弹幕系统已启动',
          bgColor: 'rgba(25, 118, 210, 0.85)'
        });
      }, 1000);
    });
    
    return {
      toggleVisibility,
      changeSpeed,
      changeOpacity,
      clearMessages,
      addDemoMessages,
      toggleExternalWindow,
      externalWindowActive,
      isElectron
    };
  }
});
</script>

<style scoped>
.danmaku-manager {
  position: relative;
  z-index: 9990;
}

.external-window-indicator {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 500px;
  z-index: 9995;
}
</style> 