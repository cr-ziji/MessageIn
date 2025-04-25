import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import store from './store'
import router from './router'

// 创建Vue应用实例
const app = createApp(App)

// 使用Vuex状态管理
app.use(store)

// 使用Vue Router
app.use(router)

// 使用Element Plus组件库
app.use(ElementPlus)

// 挂载应用
app.mount('#app') 