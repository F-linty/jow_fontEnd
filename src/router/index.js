import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import Home from '../pages/Home.vue'
import Orgs from '../pages/Orgs.vue'
import ProductTypes from '../pages/ProductTypes.vue'
import MaterialCategories from '../pages/MaterialCategories.vue'
import GraphMaterials from '../pages/GraphMaterials.vue'
import GraphNonMaterials from '../pages/GraphNonMaterials.vue'
import PurchasePlans from '../pages/PurchasePlans.vue'
import PurchaseAggregate from '../pages/PurchaseAggregate.vue'
import UserControls from '../pages/UserControls.vue'
import AppLayout from '../layout/AppLayout.vue'
import Placeholder from '../pages/Placeholder.vue'

const getAccessToken = () => {
  return localStorage.getItem('accessToken')
}

const getUserProfile = () => {
  try {
    return JSON.parse(localStorage.getItem('userProfile') || 'null')
  } catch {
    return null
  }
}

const hasModulePermission = (key) => {
  if (!key || key === 'home') return true
  const profile = getUserProfile()
  if (profile?.isSystemAdmin === true) return true
  try {
    const list = JSON.parse(localStorage.getItem('modulePermissions') || '[]')
    if (!Array.isArray(list) || !list.length) return false
    return list.includes(key)
  } catch {
    return false
  }
}

/** 面包屑项：有 to 的可点击跳转，末级一般不带 to */
const BREADCRUMB_HOME = [{ title: '首页' }]

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/',
    name: 'root',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: Home,
        meta: { breadcrumb: BREADCRUMB_HOME },
      },
      {
        path: 'orgs',
        name: 'orgs',
        component: Orgs,
        meta: {
          permission: 'orgs',
          breadcrumb: [
            { title: '首页', to: '/' },
            { title: '基础信息' },
            { title: '组织信息' },
          ],
        },
      },
      {
        path: 'product-types',
        name: 'productTypes',
        component: ProductTypes,
        meta: {
          permission: 'productTypes',
          breadcrumb: [
            { title: '首页', to: '/' },
            { title: '基础信息' },
            { title: '产品类型' },
          ],
        },
      },
      {
        path: 'material-categories',
        name: 'materialCategories',
        component: MaterialCategories,
        meta: {
          permission: 'materialCategories',
          breadcrumb: [
            { title: '首页', to: '/' },
            { title: '基础信息' },
            { title: '物料分类' },
          ],
        },
      },
      {
        path: 'graph-materials',
        name: 'graphMaterials',
        component: GraphMaterials,
        meta: {
          permission: 'graphMaterials',
          breadcrumb: [
            { title: '首页', to: '/' },
            { title: '图谱库' },
            { title: '物资图谱' },
          ],
        },
      },
      {
        path: 'graph-non-materials',
        name: 'graphNonMaterials',
        component: GraphNonMaterials,
        meta: {
          permission: 'graphNonMaterials',
          breadcrumb: [
            { title: '首页', to: '/' },
            { title: '图谱库' },
            { title: '非物资图谱' },
          ],
        },
      },
      {
        path: 'purchase-plans',
        name: 'purchasePlans',
        component: PurchasePlans,
        meta: {
          permission: 'purchasePlans',
          breadcrumb: [
            { title: '首页', to: '/' },
            { title: '月度采购' },
            { title: '月度采购计划提报' },
          ],
        },
      },
      {
        path: 'purchase-aggregate',
        name: 'purchaseAggregate',
        component: PurchaseAggregate,
        meta: {
          permission: 'purchaseAggregate',
          breadcrumb: [
            { title: '首页', to: '/' },
            { title: '月度采购' },
            { title: '月度采购聚合' },
          ],
        },
      },
      {
        path: 'user-controls',
        name: 'userControls',
        component: UserControls,
        meta: {
          permission: 'userControls',
          breadcrumb: [
            { title: '首页', to: '/' },
            { title: '系统设置' },
            { title: '人员管控' },
          ],
        },
      },
      // 预留：后续按规划继续补齐基础信息/图谱库/月度采购/系统设置等页面
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  if (to.path === '/login') {
    // 已登录则直接回首页
    if (getAccessToken()) return next('/')
    return next()
  }

  if (!getAccessToken()) return next('/login')
  const needPermission = to.meta?.permission
  if (!hasModulePermission(needPermission)) {
    return next('/')
  }
  return next()
})

export default router

