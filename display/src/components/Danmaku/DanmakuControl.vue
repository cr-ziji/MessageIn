<template>
  <div class="danmaku-control">
    <el-popover
      placement="bottom"
      :width="240"
      trigger="click"
      v-model:visible="popoverVisible"
    >
      <template #reference>
        <el-button 
          type="primary" 
          circle 
          class="danmaku-toggle-btn"
          :class="{ 'is-active': isVisible }"
        >
          <el-badge :value="unreadCount" :hidden="unreadCount === 0">
            <el-icon>
              <Message v-if="isVisible" />
              <ChatDotSquare v-else />
            </el-icon>
          </el-badge>
        </el-button>
      </template>
      
      <div class="danmaku-settings">
        <h4>弹幕设置</h4>
        
        <div class="setting-item">
          <span>弹幕显示</span>
          <el-switch
            v-model="isVisible"
            active-color="#1976d2"
            inactive-color="#ff4949"
          />
        </div>
        
        <div class="setting-item" v-if="isElectron">
          <span>置顶显示</span>
          <el-switch
            v-model="isOverlayEnabled"
            active-color="#1976d2"
            inactive-color="#ff4949"
          />
        </div>
        
        <div class="setting-item">
          <span>滚动速度</span>
          <el-slider
            v-model="speed"
            :min="5"
            :max="20"
            :step="1"
            :marks="{5: '快', 10: '中', 15: '慢', 20: '很慢'}"
            color="#1976d2"
          />
        </div>
        
        <div class="setting-item">
          <span>透明度</span>
          <el-slider
            v-model="opacity"
            :min="50"
            :max="100"
            :step="5"
            :format-tooltip="formatOpacity"
            color="#1976d2"
          />
        </div>
        
        <div class="setting-item">
          <span>特效</span>
          <el-select v-model="effect" size="small" style="width: 100px;">
            <el-option label="普通" value="normal" />
            <el-option label="发光" value="glow" />
            <el-option label="霓虹" value="neon" />
          </el-select>
        </div>
        
        <!-- 添加消息统计 -->
        <div class="messages-stats">
          <div class="stat-item">
            <span class="stat-label">未读消息：</span>
            <span class="stat-value">{{ unreadCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已读消息：</span>
            <span class="stat-value">{{ readCount }}</span>
          </div>
        </div>
        
        <div class="setting-actions">
          <el-button 
            type="primary" 
            size="small" 
            @click="clearAllMessages"
          >清空弹幕</el-button>
          
          <el-button 
            type="primary" 
            size="small" 
            @click="addDemoMessage"
            :disabled="!isVisible"
          >测试弹幕</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script>
import { useDanmakuStore } from '@/store/modules/danmaku';
import { ref, computed, onMounted, watch } from 'vue';
import { Message, ChatDotSquare } from '@element-plus/icons-vue';

export default {
  name: 'DanmakuControl',
  components: {
    Message,
    ChatDotSquare
  },
  setup() {
    const danmakuStore = useDanmakuStore();
    const popoverVisible = ref(false);
    
    // 检测是否在Electron环境中
    const isElectron = computed(() => {
      return window.electronAPI !== undefined;
    });
    
    // 使用computed创建双向绑定
    const isVisible = computed({
      get: () => danmakuStore.isVisible,
      set: (value) => danmakuStore.setVisibility(value)
    });
    
    const speed = computed({
      get: () => danmakuStore.speed,
      set: (value) => danmakuStore.setSpeed(value)
    });
    
    // 覆盖层启用状态
    const isOverlayEnabled = ref(true);
    
    // 弹幕透明度
    const opacity = ref(85);
    const formatOpacity = (val) => `${val}%`;
    
    // 弹幕特效
    const effect = ref('normal');
    
    // 当显示状态或覆盖层状态变化时，通知Electron
    watch([isVisible, isOverlayEnabled], ([visible, overlay]) => {
      if (isElectron.value) {
        // 仅当两者都为true时，显示覆盖层窗口
        window.electronAPI.toggleDanmakuOverlay(visible && overlay);
      }
    }, { immediate: true });
    
    // 获取未读和已读消息计数
    const unreadCount = computed(() => danmakuStore.unreadMessagesCount);
    const readCount = computed(() => danmakuStore.readMessagesCount);
    
    // 清空所有弹幕消息
    const clearAllMessages = () => {
      danmakuStore.clearMessages();
      popoverVisible.value = false;
    };
    
    // 添加测试弹幕
    const addDemoMessage = () => {
      const messages = [
        "这是一条测试弹幕消息",
        "MessageIn弹幕显示系统",
        "单行顶部显示更清晰",
        "Hello, 弹幕世界!",
        "弹幕显示在最上层"
      ];
      
      const message = messages[Math.floor(Math.random() * messages.length)];
      const colors = [
        'rgba(25, 118, 210, 0.85)',
        'rgba(33, 150, 243, 0.85)',
        'rgba(66, 165, 245, 0.85)',
        'rgba(13, 71, 161, 0.85)',
        'rgba(21, 101, 192, 0.85)'
      ];
      
      danmakuStore.addMessage({
        content: message,
        bgColor: colors[Math.floor(Math.random() * colors.length)],
        fontSize: 16,
        effect: effect.value,
        opacity: opacity.value / 100
      });
      
      popoverVisible.value = false;
    };
    
    // 组件挂载后自动添加测试弹幕
    onMounted(() => {
      // 在Electron环境中初始化覆盖层状态
      if (isElectron.value) {
        window.electronAPI.toggleDanmakuOverlay(isVisible.value && isOverlayEnabled.value);
      }
    });
    
    return {
      isVisible,
      speed,
      unreadCount,
      readCount,
      clearAllMessages,
      isElectron,
      isOverlayEnabled,
      opacity,
      formatOpacity,
      effect,
      popoverVisible,
      addDemoMessage
    };
  }
}
</script>

<style scoped>
.danmaku-control {
  position: fixed;
  right: 20px;
  top: 20px;
  z-index: 10000;
}

.danmaku-toggle-btn {
  box-shadow: 0 2px 12px rgba(33, 150, 243, 0.3);
  background-color: #1976d2;
  border-color: #1976d2;
  transition: all 0.3s ease;
}

.danmaku-toggle-btn.is-active {
  background-color: #1565c0;
  transform: rotate(360deg);
  transition: all 0.5s ease;
}

.danmaku-toggle-btn:hover {
  transform: scale(1.1);
}

.danmaku-settings {
  padding: 16px;
  border-radius: 8px;
}

.danmaku-settings h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #1976d2;
  font-size: 16px;
  text-align: center;
  border-bottom: 1px solid #e3f2fd;
  padding-bottom: 10px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.setting-item span {
  font-size: 14px;
  color: #37474f;
}

/* 添加消息统计样式 */
.messages-stats {
  background-color: #e3f2fd;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-size: 13px;
  color: #37474f;
}

.stat-value {
  font-weight: bold;
  color: #1976d2;
}

.setting-actions {
  display: flex;
  justify-content: space-between;
}

/* 深色主题调整 */
@media (prefers-color-scheme: dark) {
  .danmaku-settings {
    background-color: #1e1e1e;
  }
  
  .danmaku-settings h4 {
    color: #64b5f6;
    border-bottom-color: #333;
  }
  
  .setting-item span {
    color: #e0e0e0;
  }
  
  .messages-stats {
    background-color: #333;
  }
  
  .stat-label {
    color: #e0e0e0;
  }
  
  .stat-value {
    color: #64b5f6;
  }
}
</style> 