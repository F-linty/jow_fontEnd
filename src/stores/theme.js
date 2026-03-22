import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref('light')
  const inited = ref(false)

  const isDark = computed(() => theme.value === 'dark')

  const applyTheme = (next) => {
    theme.value = next
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
  }

  const initTheme = () => {
    if (inited.value) return

    const saved = localStorage.getItem('theme')
    const next =
      saved === 'light' || saved === 'dark'
        ? saved
        : window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'

    applyTheme(next)
    inited.value = true
  }

  const toggleTheme = () => {
    applyTheme(isDark.value ? 'light' : 'dark')
  }

  return {
    theme,
    isDark,
    initTheme,
    applyTheme,
    toggleTheme,
  }
})

