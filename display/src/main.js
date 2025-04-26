import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/styles/main.css'

console.log('正在初始化Vue应用...')

// 创建Vue应用实例
const app = createApp(App)

// 使用插件
app.use(router)
app.use(store)
app.use(ElementPlus)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue全局错误:', err)
  console.error('错误信息:', info)
}

// 挂载应用
app.mount('#app')

console.log('Vue应用挂载完成') 