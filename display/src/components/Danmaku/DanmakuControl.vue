<template>
  <div class="danmaku-control" :class="{ expanded: isExpanded }">
    <div class="control-toggle" @click="toggleExpand">
      <el-tooltip content="弹幕控制" placement="left">
        <el-icon class="toggle-icon"><ChatDotRound /></el-icon>
      </el-tooltip>
    </div>
    
    <div class="control-panel" v-show="isExpanded">
      <h3 class="panel-title">弹幕控制</h3>
      
      <div class="control-item">
        <span class="label">弹幕显示</span>
        <el-switch 
          v-model="visible" 
          @change="toggleVisibility"
          active-color="#13ce66" 
          inactive-color="#ff4949"
        />
      </div>
      
      <div class="control-item">
        <span class="label">滚动速度</span>
        <el-slider 
          v-model="currentSpeed" 
          :min="1" 
          :max="10" 
          :step="1" 
          @change="changeSpeed"
        />
      </div>
      
      <div class="control-item">
        <span class="label">透明度</span>
        <el-slider 
          v-model="currentOpacity" 
          :min="20" 
          :max="100" 
          :step="5" 
          @change="changeOpacity"
        />
      </div>
      
      <div class="control-item" v-if="isElectron">
        <span class="label">独立窗口模式</span>
        <el-tooltip content="在屏幕顶部显示弹幕" placement="top">
          <el-switch 
            v-model="externalWindow" 
            @change="toggleExternalWindow"
            active-color="#13ce66" 
            inactive-color="#ff4949"
          />
        </el-tooltip>
      </div>
      
      <div class="control-actions">
        <el-button 
          type="danger" 
          size="small"
          @click="clearMessages"
        >清空弹幕</el-button>
        
        <el-button 
          type="primary" 
          size="small"
          @click="addDemoMessages"
        >测试弹幕</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import { ChatDotRound } from '@element-plus/icons-vue';
import { useDanmakuStore } from '@/stores/danmaku';
import { storeToRefs } from 'pinia';

export default defineComponent({
  name: 'DanmakuControl',
  components: {
    ChatDotRound
  },
  emits: [
    'toggle-visibility',
    'change-speed',
    'change-opacity',
    'clear-messages',
    'add-demo-messages',
    'toggle-external-window'
  ],
  setup(props, { emit }) {
    const danmakuStore = useDanmakuStore();
    const { isVisible, speed, opacity } = storeToRefs(danmakuStore);
    
    // 本地UI状态
    const isExpanded = ref(false);
    const isElectron = computed(() => window.electronAPI !== undefined);
    
    // 控制面板参数
    const visible = ref(isVisible.value);
    const currentSpeed = ref(speed.value);
    const currentOpacity = ref(opacity.value * 100);
    const externalWindow = ref(false);
    
    // 展开/折叠控制面板
    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value;
    };
    
    // 切换弹幕可见性
    const toggleVisibility = (newValue) => {
      emit('toggle-visibility', newValue);
    };
    
    // 改变滚动速度
    const changeSpeed = (newValue) => {
      emit('change-speed', newValue);
    };
    
    // 改变透明度
    const changeOpacity = (newValue) => {
      emit('change-opacity', newValue / 100);
    };
    
    // 切换外部窗口模式
    const toggleExternalWindow = (newValue) => {
      emit('toggle-external-window', newValue);
    };
    
    // 清空弹幕
    const clearMessages = () => {
      emit('clear-messages');
    };
    
    // 添加测试弹幕
    const addDemoMessages = () => {
      emit('add-demo-messages');
    };
    
    // 监听存储变化
    onMounted(() => {
      // 初始化UI状态与存储同步
      visible.value = isVisible.value;
      currentSpeed.value = speed.value;
      currentOpacity.value = opacity.value * 100;
    });
    
    return {
      isExpanded,
      isElectron,
      visible,
      currentSpeed,
      currentOpacity,
      externalWindow,
      toggleExpand,
      toggleVisibility,
      changeSpeed,
      changeOpacity,
      toggleExternalWindow,
      clearMessages,
      addDemoMessages
    };
  }
});
</script>

<style scoped>
.danmaku-control {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.control-toggle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.control-toggle:hover {
  transform: scale(1.05);
}

.toggle-icon {
  font-size: 24px;
  color: white;
}

.control-panel {
  margin-top: 10px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 280px;
}

.panel-title {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: var(--el-color-primary);
  text-align: center;
}

.control-item {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.control-actions {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
}
</style> 