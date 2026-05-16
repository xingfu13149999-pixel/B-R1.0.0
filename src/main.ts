/**
 * 前端入口：创建 Vue 应用，注册 Pinia、Element Plus、Vue Router 并挂载到 #app。
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/assets/font/fonts.css'
import '@/assets/styles/figma-interview-more-popper.css'
import './style.css'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(ElementPlus)
app.use(router)
app.mount('#app')
