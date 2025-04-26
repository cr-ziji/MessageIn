import { createRouter, createWebHashHistory } from 'vue-router'

// 导入视图组件
const Home = () => import('@/views/Home.vue')
const MessageDisplay = () => import('@/views/MessageDisplay.vue')
const NotFound = () => import('@/views/NotFound.vue')
const DanmakuOverlayView = () => import('@/views/DanmakuOverlayView.vue')
const DanmakuOnlyView = () => import('@/views/DanmakuOnlyView.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页 - MessageIn显示端'
    }
  },
  {
    path: '/message/:id',
    name: 'MessageDisplay',
    component: MessageDisplay,
    props: true,
    meta: {
      title: '消息展示 - MessageIn显示端'
    }
  },
  {
    path: '/danmaku-overlay',
    name: 'DanmakuOverlay',
    component: DanmakuOverlayView,
    meta: {
      title: '弹幕覆盖层 - MessageIn'
    }
  },
  {
    path: '/danmaku-only',
    name: 'DanmakuOnly',
    component: DanmakuOnlyView,
    meta: {
      title: '弹幕显示 - 独立窗口'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '页面未找到 - MessageIn显示端'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 全局前置守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || 'MessageIn显示端'
  next()
})

export default router 