<template>
  <div class="login-page">
    <div
      class="login-visual"
      :style="{ backgroundImage: `url(${loginBgUrl})` }"
    >
      <div class="visual-overlay" />
      <div class="visual-title">月度采购系统</div>
    </div>

    <div class="login-panel">
      <el-card class="login-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="header-title">登录</span>
          </div>
        </template>

        <el-form :model="form" label-position="top">
          <el-form-item label="账号">
            <el-input
              v-model="form.account"
              placeholder="请输入账号"
              autocomplete="username"
            />
          </el-form-item>

          <el-form-item label="密码">
            <el-input
              v-model="form.passWord"
              placeholder="请输入密码"
              type="password"
              autocomplete="current-password"
              @keyup.enter="onLogin"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              class="login-btn"
              type="primary"
              :loading="loading"
              @click="onLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import http from '../api/http'
import { useAuthStore } from '../stores/auth'

import loginBgUrl from '../assets/login-bg.svg'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  account: '',
  passWord: '',
})

const loading = ref(false)

const resolveErrorMessage = (err) => {
  const respData = err?.response?.data
  const respMessage = respData?.message
  if (typeof respMessage === 'string' && respMessage.trim()) return respMessage
  if (respMessage && typeof respMessage === 'object') {
    if (typeof respMessage.message === 'string' && respMessage.message.trim()) {
      return respMessage.message
    }
  }
  if (typeof err?.message === 'string' && err.message.trim()) return err.message
  return '登录失败'
}

const onLogin = async () => {
  loading.value = true
  try {
    const res = await http.post('/users/login', form)
    const payload = res?.data
    if (payload?.code === 200 && Array.isArray(payload.data) && payload.data[0]) {
      const { token, refToken } = payload.data[0]
      authStore.setTokens(token, refToken)
      const meRes = await http.get('/users')
      const me = meRes?.data?.data?.[0]
      authStore.setProfile(me || null)
      router.push('/')
      return
    }
    throw new Error(payload?.message || '登录失败')
  } catch (e) {
    ElMessage.error(resolveErrorMessage(e))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 420px;
  background: var(--bg);
}

.login-visual {
  position: relative;
  overflow: hidden;
  background-color: #1a2433;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.visual-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    125deg,
    rgba(26, 36, 51, 0.82) 0%,
    rgba(44, 56, 74, 0.35) 55%,
    rgba(26, 36, 51, 0.25) 100%
  );
  pointer-events: none;
}

.visual-title {
  position: relative;
  z-index: 1;
  color: var(--nord4);
  font-weight: 800;
  font-size: 28px;
  padding: 60px;
  text-shadow: 0 2px 28px rgba(0, 0, 0, 0.35);
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--card-bg);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  color: var(--text);
  font-size: 18px;
  font-weight: 700;
}

.login-btn {
  width: 100%;
  background: var(--nord8) !important;
  border-color: var(--nord8) !important;
}

@media (max-width: 1024px) {
  .login-page {
    grid-template-columns: 1fr;
  }
  .login-visual {
    display: none;
  }
}
</style>

