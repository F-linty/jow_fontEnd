<template>
  <el-container class="app-shell">
    <el-aside class="app-aside" :width="isCollapsed ? '64px' : '220px'">
      <div class="brand" aria-label="月度采购系统">
        <img class="brand-icon" :src="viteLogo" alt="" />
        <span v-if="!isCollapsed" class="brand-title">月度采购系统</span>
      </div>

      <div class="aside-menu-scroll">
        <el-menu
          class="app-menu"
          :default-active="activePath"
          :default-openeds="defaultOpeneds"
          mode="vertical"
          :collapse="isCollapsed"
          router
        >
        <el-menu-item index="/">
          <el-icon class="menu-icon">
            <HomeFilled />
          </el-icon>
          <span class="menu-text">首页</span>
        </el-menu-item>
        <el-sub-menu v-if="showBasicInfo" index="basicInfo">
          <template #title>
            <el-icon class="menu-icon">
              <Management />
            </el-icon>
            <span class="menu-text">基础信息</span>
          </template>
          <el-menu-item v-if="canAccess('orgs')" index="/orgs">
            <el-icon class="menu-icon">
              <Management />
            </el-icon>
            <span class="menu-text">组织信息</span>
          </el-menu-item>
          <el-menu-item v-if="canAccess('productTypes')" index="/product-types">
            <el-icon class="menu-icon">
              <DataBoard />
            </el-icon>
            <span class="menu-text">产品类型</span>
          </el-menu-item>
          <el-menu-item
            v-if="canAccess('materialCategories')"
            index="/material-categories"
          >
            <el-icon class="menu-icon">
              <Grid />
            </el-icon>
            <span class="menu-text">物料分类</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="showGraphLib" index="graphLib">
          <template #title>
            <el-icon class="menu-icon">
              <DataAnalysis />
            </el-icon>
            <span class="menu-text">图谱库</span>
          </template>
          <el-menu-item v-if="canAccess('graphMaterials')" index="/graph-materials">
            <el-icon class="menu-icon">
              <Ticket />
            </el-icon>
            <span class="menu-text">物资图谱</span>
          </el-menu-item>
          <el-menu-item
            v-if="canAccess('graphNonMaterials')"
            index="/graph-non-materials"
          >
            <el-icon class="menu-icon">
              <Tickets />
            </el-icon>
            <span class="menu-text">非物资图谱</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="showMonthlyPurchase" index="monthlyPurchase">
          <template #title>
            <el-icon class="menu-icon">
              <Connection />
            </el-icon>
            <span class="menu-text">月度采购</span>
          </template>
          <el-menu-item v-if="canAccess('purchasePlans')" index="/purchase-plans">
            <el-icon class="menu-icon">
              <Ticket />
            </el-icon>
            <span class="menu-text">月度采购计划提报</span>
          </el-menu-item>
          <el-menu-item
            v-if="canAccess('purchaseAggregate')"
            index="/purchase-aggregate"
          >
            <el-icon class="menu-icon">
              <DataBoard />
            </el-icon>
            <span class="menu-text">月度采购聚合</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="showSystemSettings" index="systemSettings">
          <template #title>
            <el-icon class="menu-icon">
              <Setting />
            </el-icon>
            <span class="menu-text">系统设置</span>
          </template>
          <el-menu-item v-if="canAccess('userControls')" index="/user-controls">
            <el-icon class="menu-icon">
              <User />
            </el-icon>
            <span class="menu-text">人员管控</span>
          </el-menu-item>
        </el-sub-menu>
        </el-menu>
      </div>

      <div class="aside-toggle">
        <el-button
          class="toggle-btn"
          text
          @click="isCollapsed = !isCollapsed"
        >
          <el-icon class="collapse-icon">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
        </el-button>
      </div>
    </el-aside>

    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-breadcrumb class="app-breadcrumb" separator="/">
            <el-breadcrumb-item
              v-for="(item, index) in breadcrumbItems"
              :key="index"
              :to="item.to"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-button text class="icon-btn" @click="toggleFullScreen">
            <el-icon>
              <FullScreen />
            </el-icon>
          </el-button>

          <button
            type="button"
            class="theme-switch-btn"
            :class="{ 'is-dark': isDark }"
            role="switch"
            :aria-checked="isDark"
            aria-label="切换主题"
            @click="toggleTheme"
          >
            <span class="theme-switch-track">
              <span class="theme-switch-icons">
                <Sunny class="theme-switch-icon theme-switch-icon--left" />
                <Moon class="theme-switch-icon theme-switch-icon--right" />
              </span>
              <span class="theme-switch-knob-row">
                <span class="theme-switch-knob" />
              </span>
            </span>
          </button>

          <el-dropdown class="user-dropdown" trigger="click">
            <span class="user-trigger">
              <el-icon>
                <UserFilled />
              </el-icon>
              <span class="user-name">{{ authStore.userName }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="logout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="app-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>

  <!-- 搜索功能已移除 -->
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import {
  Connection,
  DataAnalysis,
  DataBoard,
  Grid,
  HomeFilled,
  Management,
  Moon,
  Setting,
  Ticket,
  Tickets,
  User,
  UserFilled,
  FullScreen,
  Sunny,
  Fold,
  Expand,
} from '@element-plus/icons-vue'
import viteLogo from '../assets/vite.svg'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const isCollapsed = ref(false)

const activePath = computed(() => route.path)
const canAccess = (key) => authStore.hasPermission(key)
const showBasicInfo = computed(() =>
  ['orgs', 'productTypes', 'materialCategories'].some((key) => canAccess(key)),
)
const showGraphLib = computed(() =>
  ['graphMaterials', 'graphNonMaterials'].some((key) => canAccess(key)),
)
const showMonthlyPurchase = computed(() =>
  ['purchasePlans', 'purchaseAggregate'].some((key) => canAccess(key)),
)
const showSystemSettings = computed(() =>
  canAccess('userControls'),
)

onMounted(() => {
  authStore.hydrate()
  themeStore.initTheme()
})

const isDark = computed(() => themeStore.isDark)

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const defaultOpeneds = computed(() => {
  const p = route.path
  if (
    p === '/orgs' ||
    p === '/product-types' ||
    p === '/material-categories'
  )
    return ['basicInfo']
  if (p === '/graph-materials' || p === '/graph-non-materials')
    return ['graphLib']
  if (p === '/purchase-plans' || p === '/purchase-aggregate')
    return ['monthlyPurchase']
  if (p === '/user-controls')
    return ['systemSettings']
  return []
})

/** 从当前匹配路由取面包屑（与侧栏分组文案一致） */
const breadcrumbItems = computed(() => {
  const matched = route.matched
  for (let i = matched.length - 1; i >= 0; i--) {
    const bc = matched[i]?.meta?.breadcrumb
    if (Array.isArray(bc) && bc.length) return bc
  }
  return [{ title: '首页' }]
})

const toggleFullScreen = () => {
  const doc = document
  const el = doc.documentElement
  if (!doc.fullscreenElement) {
    el.requestFullscreen?.()
  } else {
    doc.exitFullscreen?.()
  }
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-shell {
  height: 100vh;
  width: 100%;
}

.app-aside {
  background: var(--nord0);
  color: var(--nord4);
  transition: width 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* 中间菜单区：占满剩余高度并可纵向滚动（子菜单全部展开时） */
.aside-menu-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* 隐藏滚动条，仍可滚轮/触控滚动 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.aside-menu-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.brand {
  flex-shrink: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  gap: 10px;
}

.brand-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}

.brand-title {
  font-weight: 700;
  color: var(--nord4);
  white-space: nowrap;
}

.app-menu {
  border-right: none;
  width: 100%;
  /* 使用 Element Plus Menu 推荐的 CSS 变量，避免默认主题色“脏” */
  --el-menu-bg-color: var(--nord0);
  --el-menu-text-color: var(--nord4);
  --el-menu-active-color: var(--nord4);
  --el-menu-hover-bg-color: rgba(129, 161, 193, 0.14);
  --el-menu-submenu-bg-color: var(--nord0);
  --el-menu-submenu-title-hover-bg-color: rgba(129, 161, 193, 0.12);
}

/* 菜单随内容增高，由外层 .aside-menu-scroll 滚动；内部 scrollbar 轨道一并隐藏 */
.app-menu :deep(.el-scrollbar) {
  height: auto !important;
}

.app-menu :deep(.el-scrollbar__bar) {
  display: none;
}

.app-menu :deep(.el-scrollbar__wrap) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.app-menu :deep(.el-scrollbar__wrap::-webkit-scrollbar) {
  width: 0;
  height: 0;
}

.menu-icon {
  margin-right: 8px;
  vertical-align: middle;
}

.menu-text {
  display: inline-block;
  white-space: nowrap;
}

:deep(.el-menu--collapse .menu-icon) {
  margin-right: 0;
}

:deep(.el-menu--collapse .menu-text) {
  display: none;
}

:deep(.el-menu--collapse .el-menu-item__content) {
  justify-content: center;
}

.aside-toggle {
  flex-shrink: 0;
  height: 48px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  border-top: 1px solid rgba(216, 222, 233, 0.10);
  padding-right: 10px;
}

.toggle-btn {
  color: var(--nord4) !important;
  display: flex;
  justify-content: flex-end;
  /* 让 hover 只覆盖图标附近的小区域 */
  width: 44px;
  min-width: 44px;
  padding: 0;
}

.collapse-icon {
  font-size: 18px;
}

.app-header {
  height: 64px;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid rgba(46, 52, 64, 0.10);
}

.app-breadcrumb {
  font-size: 14px;
}

.app-breadcrumb :deep(.el-breadcrumb__inner) {
  color: var(--text);
  font-weight: 500;
}

.app-breadcrumb :deep(.el-breadcrumb__inner.is-link:hover) {
  color: var(--el-color-primary);
}

.app-breadcrumb :deep(.el-breadcrumb__separator) {
  color: var(--text);
  opacity: 0.45;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-search {
  width: 280px;
}

.header-action {
  color: var(--text) !important;
  font-weight: 600;
}

.user-trigger {
  color: var(--text);
  font-weight: 600;
}

.app-main {
  background: var(--bg);
  padding: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-btn {
  color: var(--text) !important;
  font-weight: 700;
  height: 40px;
  width: 40px;
}

.theme-switch-btn {
  height: 34px;
  width: 56px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-switch-track {
  position: relative;
  width: 44px;
  height: 22px;
  border-radius: 999px;
  background: rgba(216, 222, 233, 0.22);
  border: 1px solid rgba(122, 147, 172, 0.35);
}

.theme-switch-icons {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  pointer-events: none;
}

.theme-switch-icon {
  width: 14px;
  height: 14px;
  transition: opacity 0.2s ease, transform 0.2s ease;
  color: rgba(241, 245, 249, 0.55);
}

.theme-switch-btn.is-dark .theme-switch-icon--left {
  opacity: 1;
  color: var(--nord8);
}

.theme-switch-btn.is-dark .theme-switch-icon--right {
  opacity: 0.45;
}

.theme-switch-btn:not(.is-dark) .theme-switch-icon--left {
  opacity: 0.45;
}

.theme-switch-btn:not(.is-dark) .theme-switch-icon--right {
  opacity: 1;
  color: var(--nord8);
}

.theme-switch-knob-row {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 1px;
  transition: transform 0.25s ease;
  transform: translateX(0);
}

.theme-switch-btn.is-dark .theme-switch-knob-row {
  /* 44px 轨道宽 - 18px 圆点宽 - 左右 1px padding */
  transform: translateX(24px);
}

.theme-switch-knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
}

.user-dropdown {
  cursor: pointer;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text);
  font-weight: 600;
}

.user-name {
  font-size: 14px;
}

.search-dialog-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  flex: 1;
}

.search-close {
  color: var(--text) !important;
}

.search-dialog-body {
  padding: 12px 0;
}

/* 搜索相关样式已移除 */
</style>

