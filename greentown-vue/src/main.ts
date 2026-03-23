import './styles/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

try {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  app.mount('#app')
} catch (error) {
  console.error('Failed to initialize app:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>应用加载失败</h1>
      <p>错误信息: ${error}</p>
      <p>请尝试刷新页面或使用其他浏览器</p>
    </div>
  `
}
