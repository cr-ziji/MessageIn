import { createPinia } from 'pinia'

// 导入模块（这样可以在任何地方直接使用）
import { useDanmakuStore } from './modules/danmaku'

// 创建并导出pinia实例
const store = createPinia()

export default store

// 导出各个存储模块，方便直接导入使用
export {
  useDanmakuStore
} 