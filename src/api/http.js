import axios from 'axios'
import { ElMessage } from 'element-plus'

const http = axios.create({
  baseURL: "https://jowbackend-production.up.railway.app/",
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status
    if (status === 403) {
      const msg =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : '') ||
        '无权访问'
      ElMessage.warning(msg)
      return Promise.reject(error)
    }
    if (status === 401) {
      // 登录页需要保留后端原始错误（如“密码错误/用户不存在”），交由页面提示
      if (window.location.pathname === '/login') {
        return Promise.reject(error)
      }

      // token 失效：统一清理并跳转登录，避免各页面出现 “Uncaught (in promise) AxiosError”
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userProfile')
      localStorage.removeItem('modulePermissions')

      ElMessage.warning('登录已过期，请重新登录')
      setTimeout(() => {
        window.location.href = '/login'
      }, 800)

      return Promise.resolve({
        data: { code: 401, message: '登录失效', data: [] },
        status: 401,
      })
    }

    // 其它 4xx（如 400 业务校验、409 冲突）：统一弹出后端 message，登录页 401 已在上方单独处理
    if (status >= 400 && status < 500) {
      const d = error?.response?.data
      let msg = ''
      if (typeof d?.message === 'string' && d.message.trim()) {
        msg = d.message.trim()
      } else if (d?.message && typeof d.message === 'object' && typeof d.message.message === 'string') {
        msg = d.message.message.trim()
      }
      if (msg) {
        ElMessage.error(msg)
      }
    }

    return Promise.reject(error)
  },
)

export default http

