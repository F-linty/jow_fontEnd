<template>
  <div class="page-wrap">
    <el-card class="biz-card" shadow="never">
      <template #header>
        <div class="toolbar">
          <div class="left-actions">
            <el-input
              v-model="accountKeyword"
              placeholder="账号关键字"
              clearable
              style="width: 220px"
              @keyup.enter="fetchRows"
            />
            <el-select v-model="orgId" clearable placeholder="组织" style="width: 180px">
              <el-option v-for="item in orgOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-button @click="fetchRows">查询</el-button>
          </div>
          <div class="right-actions">
            <el-button type="primary" @click="openCreate">新增用户</el-button>
          </div>
        </div>
      </template>

      <el-table :data="rows" class="biz-table" empty-text="暂无数据">
        <el-table-column prop="account" label="账号" min-width="160" />
        <el-table-column prop="userName" label="姓名" min-width="140" />
        <el-table-column prop="orgName" label="组织" min-width="160" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="模块权限" min-width="220">
          <template #default="{ row }">
            <span>{{ formatPermissionText(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-button
              v-if="!row.isSystemAdmin"
              type="primary"
              link
              @click="openPermission(row)"
            >
              权限
            </el-button>
            <el-button type="danger" link @click="handleDeleteUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增用户' : '编辑用户'" width="560px">
      <el-form label-width="90px">
        <el-form-item label="账号">
          <el-input v-model="form.account" :disabled="dialogMode === 'edit'" maxlength="50" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.passWord" maxlength="50" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.userName" maxlength="50" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="组织">
          <el-select v-model="form.orgId" clearable placeholder="请选择组织" style="width: 100%">
            <el-option v-for="item in orgOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="停用" value="INACTIVE" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialogVisible" title="模块权限配置" width="560px">
      <el-form label-width="0">
        <el-form-item>
          <el-tree
            ref="permissionTreeRef"
            class="permission-tree"
            :data="MODULE_PERMISSION_CASCADER_OPTIONS"
            node-key="value"
            show-checkbox
            check-strictly
            check-on-click-node
            default-expand-all
            :props="{ label: 'label', children: 'children' }"
            @check-change="onPermissionCategoryCheckChange"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPermission">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '../api/http'
import {
  MODULE_PERMISSION_CASCADER_OPTIONS,
  MODULE_PERMISSION_CATEGORY_KEYS,
  MODULE_PERMISSION_LABEL_MAP,
  MODULE_PERMISSION_OPTIONS,
} from '../constants/module-permissions'

const rows = ref([])
const orgOptions = ref([])
const accountKeyword = ref('')
const orgId = ref()

const dialogVisible = ref(false)
const dialogMode = ref('create')
const currentRow = ref(null)
const permissionDialogVisible = ref(false)
const permissionTarget = ref(null)
const permissionTreeRef = ref(null)
const form = ref({
  account: '',
  passWord: '',
  userName: '',
  orgId: undefined,
  status: 'ACTIVE',
})
const permissionForm = ref({
  modulePermissions: [],
})

/** 勾选一级分组（基础信息/图谱库等）时批量联动子树，避免与 check-strictly 子项递归冲突 */
const permissionCategoryCascadeLock = ref(false)

const permissionValidKeySet = computed(
  () => new Set(MODULE_PERMISSION_OPTIONS.map((o) => o.key)),
)

const collectPermissionKeysUnderNodes = (nodes) => {
  const set = permissionValidKeySet.value
  const out = []
  for (const n of nodes || []) {
    if (set.has(n.value)) out.push(n.value)
    if (n.children?.length) out.push(...collectPermissionKeysUnderNodes(n.children))
  }
  return out
}

const onPermissionCategoryCheckChange = (data, checked) => {
  if (permissionCategoryCascadeLock.value) return
  const key = data?.value
  if (!key || !MODULE_PERMISSION_CATEGORY_KEYS.has(key)) return

  const tree = permissionTreeRef.value
  const group = MODULE_PERMISSION_CASCADER_OPTIONS.find((g) => g.value === key)
  if (!tree || !group?.children?.length) return

  const keys = collectPermissionKeysUnderNodes(group.children)
  if (!keys.length) return

  permissionCategoryCascadeLock.value = true
  nextTick(() => {
    keys.forEach((k) => {
      tree.setChecked(k, checked, false)
    })
    nextTick(() => {
      permissionCategoryCascadeLock.value = false
    })
  })
}

const permissionCount = computed(() => MODULE_PERMISSION_OPTIONS.length)
const formatPermissionText = (row) => {
  if (row?.isSystemAdmin) return '全部模块'
  const list = Array.isArray(row?.modulePermissions) ? row.modulePermissions : []
  if (!list.length) return '未分配模块'
  if (list.length === MODULE_PERMISSION_OPTIONS.length) return '全部模块'
  return list.map((key) => MODULE_PERMISSION_LABEL_MAP[key] || key).join('、')
}

const loadOrgs = async () => {
  const res = await http.get('/orgs', { params: { tree: 0 } })
  orgOptions.value = res?.data?.data?.items || []
}

const fetchRows = async () => {
  const res = await http.get('/settings/users', {
    params: {
      account: accountKeyword.value.trim() || undefined,
      orgId: orgId.value || undefined,
    },
  })
  rows.value = res?.data?.data?.items || []
}

const openCreate = () => {
  dialogMode.value = 'create'
  currentRow.value = null
  form.value = {
    account: '',
    passWord: '',
    userName: '',
    orgId: undefined,
    status: 'ACTIVE',
  }
  dialogVisible.value = true
}

const openEdit = (row) => {
  dialogMode.value = 'edit'
  currentRow.value = row
  form.value = {
    account: row.account,
    passWord: '',
    userName: row.userName || '',
    orgId: row.orgId || undefined,
    status: row.status || 'ACTIVE',
  }
  dialogVisible.value = true
}

const openPermission = (row) => {
  permissionTarget.value = row
  const list = Array.isArray(row.modulePermissions) ? row.modulePermissions : []
  const allKeys = MODULE_PERMISSION_OPTIONS.map((o) => o.key)
  // 空数组 = 未分配，勿全选；仅当后端已存满全部 key 时才与「全选」一致
  const keysToCheck =
    list.length === permissionCount.value ? allKeys : list
  permissionForm.value = {
    modulePermissions: keysToCheck,
  }
  permissionDialogVisible.value = true
  nextTick(() => {
    permissionTreeRef.value?.setCheckedKeys(keysToCheck)
  })
}

const submitForm = async () => {
  if (!form.value.account?.trim()) {
    ElMessage.warning('账号不能为空')
    return
  }
  if (dialogMode.value === 'create' && !form.value.passWord?.trim()) {
    ElMessage.warning('密码不能为空')
    return
  }

  try {
    if (dialogMode.value === 'create') {
      await http.post('/settings/users', {
        account: form.value.account.trim(),
        passWord: form.value.passWord.trim(),
        userName: form.value.userName?.trim() || null,
        orgId: form.value.orgId || null,
        status: form.value.status,
      })
      ElMessage.success('创建成功')
    } else {
      const payload = {
        userName: form.value.userName?.trim() || null,
        orgId: form.value.orgId || null,
        status: form.value.status,
      }
      if (form.value.passWord?.trim()) payload.passWord = form.value.passWord.trim()
      await http.put(`/settings/users/${currentRow.value.id}`, payload)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    await fetchRows()
  } catch {
    // 4xx 错误文案由 http 拦截器统一 ElMessage.error 展示
  }
}

const handleDeleteUser = async (row) => {
  if (!row?.id) return
  try {
    await ElMessageBox.confirm(
      `确定删除用户「${row.account}」吗？删除后不可恢复。`,
      '删除用户',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
    await http.delete(`/settings/users/${row.id}`)
    ElMessage.success('已删除')
    await fetchRows()
  } catch (e) {
    if (e === 'cancel') return
    ElMessage.error(e?.response?.data?.message || '删除失败')
  }
}

const submitPermission = async () => {
  if (!permissionTarget.value?.id) return
  const validKeys = new Set(MODULE_PERMISSION_OPTIONS.map((o) => o.key))
  const allKeys = MODULE_PERMISSION_OPTIONS.map((o) => o.key)
  const raw = permissionTreeRef.value?.getCheckedKeys(false) || []
  const checked = raw.filter((k) => validKeys.has(k))
  try {
    await http.put(`/settings/users/${permissionTarget.value.id}`, {
      modulePermissions:
        checked.length === permissionCount.value
          ? allKeys
          : checked,
    })
    ElMessage.success('权限更新成功')
    permissionDialogVisible.value = false
    await fetchRows()
  } catch {
    // 错误由 http 拦截器提示
  }
}

onMounted(async () => {
  await loadOrgs()
  await fetchRows()
})
</script>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.biz-card {
  background: var(--card-surface) !important;
  border-color: var(--border) !important;
}
.biz-card :deep(.el-card__header),
.biz-card :deep(.el-card__body) {
  background: transparent !important;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.left-actions,
.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.biz-table {
  --el-fill-color-blank: transparent;
  --el-table-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-expanded-cell-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(122, 147, 172, 0.08);
  --el-table-border-color: rgba(122, 147, 172, 0.18);
}

.permission-tree {
  width: 100%;
  border: none;
  border-radius: 0;
  padding: 0;
  max-height: 420px;
  overflow: auto;
  scrollbar-width: none;
}

.permission-tree::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>

