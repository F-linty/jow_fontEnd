import { createApp } from 'vue'
import axios from 'axios'
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import './style.css'

// 让 axios 在组件里可以直接用（也方便后续统一封装）
window.$axios = axios

createApp(App)
  .use(router)
  .use(createPinia())
  .use(ElementPlus, { locale: zhCn })
  .mount('#app')
