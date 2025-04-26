/**
 * Electron API 钩子函数
 * 封装Electron API调用，确保在不同环境下的兼容性
 */
import { ref, computed } from 'vue';

export function useElectronAPI() {
  // 检查是否在Electron环境中
  const isElectron = computed(() => window.electronAPI !== undefined);
  
  /**
   * 切换弹幕覆盖层的可见性
   * @param {boolean} visible - 是否可见
   */
  const toggleDanmakuOverlay = (visible) => {
    if (isElectron.value) {
      window.electronAPI.toggleDanmakuOverlay(visible);
    }
  };
  
  /**
   * 通知主进程弹幕被点击
   * @param {boolean} isClickOnDanmaku - 是否点击在弹幕上
   */
  const notifyDanmakuClicked = (isClickOnDanmaku) => {
    if (isElectron.value) {
      window.electronAPI.notifyDanmakuClicked(isClickOnDanmaku);
    }
  };
  
  /**
   * 更新弹幕区域的交互状态
   * @param {Object} region - 区域信息
   */
  const updateDanmakuRegion = (region) => {
    if (isElectron.value) {
      window.electronAPI.updateDanmakuRegion(region);
    }
  };
  
  /**
   * 获取应用信息
   * @returns {Object} 应用信息，包括版本、平台等
   */
  const getAppInfo = () => {
    if (isElectron.value) {
      return window.electronAPI.getAppInfo();
    }
    
    // 非Electron环境下的默认值
    return {
      isElectron: false,
      version: process.env.VUE_APP_VERSION || '1.0.0',
      platform: 'web'
    };
  };
  
  /**
   * 发送鼠标事件到主进程
   * @param {Object} eventData - 鼠标事件数据
   */
  const sendMouseEvent = (eventData) => {
    if (isElectron.value) {
      window.electronAPI.sendMouseEvent(eventData);
    }
  };
  
  return {
    isElectron,
    toggleDanmakuOverlay,
    notifyDanmakuClicked,
    updateDanmakuRegion,
    getAppInfo,
    sendMouseEvent
  };
} 