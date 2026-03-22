import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const userProfile = ref(null)
  const modulePermissions = ref([])

  const setTokens = (token, refToken) => {
    localStorage.setItem('accessToken', token)
    localStorage.setItem('refreshToken', refToken)
  }

  const setProfile = (profile) => {
    userProfile.value = profile || null
    modulePermissions.value = Array.isArray(profile?.modulePermissions)
      ? profile.modulePermissions
      : []
    localStorage.setItem('userProfile', JSON.stringify(userProfile.value || {}))
    localStorage.setItem(
      'modulePermissions',
      JSON.stringify(modulePermissions.value),
    )
  }

  const hydrate = () => {
    try {
      const profile = JSON.parse(localStorage.getItem('userProfile') || 'null')
      const permissions = JSON.parse(
        localStorage.getItem('modulePermissions') || '[]',
      )
      userProfile.value = profile
      modulePermissions.value = Array.isArray(permissions) ? permissions : []
    } catch {
      userProfile.value = null
      modulePermissions.value = []
    }
  }

  /** 拥有 Role「system:admin」时视为系统管理员，等价于全部模块权限 */
  const isSystemAdmin = computed(
    () => userProfile.value?.isSystemAdmin === true,
  )

  const hasPermission = (key) => {
    if (!key) return true
    if (isSystemAdmin.value) return true
    if (!modulePermissions.value.length) return false
    return modulePermissions.value.includes(key)
  }

  const userName = computed(() => {
    return userProfile.value?.userName || userProfile.value?.account || '测试用户'
  })

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userProfile')
    localStorage.removeItem('modulePermissions')
    userProfile.value = null
    modulePermissions.value = []
  }

  return {
    userProfile,
    modulePermissions,
    isSystemAdmin,
    userName,
    setTokens,
    setProfile,
    hydrate,
    hasPermission,
    logout,
  }
})

