<template>
  <div class="page-wrap">
    <el-card class="biz-card" shadow="never">
      <template #header>
        <div class="toolbar">
          <div class="left-actions">
            <el-button
              v-if="authStore.hasPermission('productTypesCreate')"
              type="primary"
              @click="openCreate()"
            >
              新增产品类型
            </el-button>
          </div>
          <div class="right-actions">
            <el-input
              v-model="keyword"
              placeholder="请输入产品类型名称"
              clearable
              style="width: 240px"
              @keyup.enter="fetchRows"
            />
            <el-button @click="fetchRows">查询</el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="rows"
        row-key="id"
        :tree-props="{ children: 'children' }"
        class="biz-table"
        empty-text="暂无数据"
      >
        <el-table-column prop="name" label="产品类型名称" min-width="260" />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="authStore.hasPermission('productTypesCreate')"
              type="primary"
              link
              @click="openCreate(row)"
            >
              新增子级
            </el-button>
            <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增产品类型' : '编辑产品类型'"
      width="520px"
    >
      <el-form label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="form.name" maxlength="50" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="父级">
          <el-select
            v-model="form.parentId"
            clearable
            placeholder="顶级"
            style="width: 100%"
          >
            <el-option
              v-for="item in parentOptions"
              :key="item.id"
              :label="item.label"
              :value="item.id"
              :disabled="dialogMode === 'edit' && currentRow && item.id === currentRow.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div v-if="dialogMode === 'edit' && currentRow" class="footer-left-actions">
          <el-button
            v-if="currentRow.status === 'ACTIVE'"
            type="danger"
            plain
            @click="handleDisable(currentRow)"
          >
            停用
          </el-button>
          <el-button
            v-else
            type="primary"
            plain
            @click="handleEnable(currentRow)"
          >
            启用
          </el-button>
          <el-button type="danger" plain @click="handleDelete(currentRow)">删除</el-button>
        </div>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '../api/http'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const rows = ref([])
const keyword = ref('')
const dialogVisible = ref(false)
const dialogMode = ref('create')
const currentRow = ref(null)
const form = ref({
  name: '',
  parentId: null,
  sort: 0,
})

const parentOptions = computed(() => {
  const list = []
  const walk = (nodes, depth = 0) => {
    nodes.forEach((node) => {
      list.push({
        id: node.id,
        label: `${'　'.repeat(depth)}${node.name}`,
      })
      if (node.children?.length) walk(node.children, depth + 1)
    })
  }
  walk(rows.value)
  return list
})

const resetForm = () => {
  form.value = {
    name: '',
    parentId: null,
    sort: 0,
  }
}

const openCreate = (parent = null) => {
  dialogMode.value = 'create'
  currentRow.value = null
  resetForm()
  if (parent?.id) form.value.parentId = parent.id
  dialogVisible.value = true
}

const openEdit = (row) => {
  dialogMode.value = 'edit'
  currentRow.value = row
  form.value = {
    name: row.name ?? '',
    parentId: row.parentId ?? null,
    sort: Number(row.sort ?? 0),
  }
  dialogVisible.value = true
}

const findNodeInTree = (nodes, id) => {
  if (!id || !Array.isArray(nodes)) return null
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNodeInTree(node.children, id)
    if (found) return found
  }
  return null
}

/** 刷新树后同步编辑弹窗中的行引用，否则停用/启用按钮状态不更新 */
const syncCurrentRowAfterFetch = (id) => {
  if (!id || !dialogVisible.value || dialogMode.value !== 'edit') return
  const fresh = findNodeInTree(rows.value, id)
  if (fresh) currentRow.value = fresh
}

const fetchRows = async () => {
  const res = await http.get('/product-types', {
    params: {
      tree: 1,
      keyword: keyword.value.trim() || undefined,
    },
  })
  if (res?.data?.code === 200) rows.value = res.data?.data?.items || []
  else rows.value = []
}

const submitForm = async () => {
  const name = form.value.name?.trim()
  if (!name) {
    ElMessage.warning('名称不能为空')
    return
  }

  const payload = {
    name,
    parentId:
      form.value.parentId === '' || form.value.parentId === undefined
        ? null
        : form.value.parentId,
    sort: Number(form.value.sort ?? 0),
  }

  try {
    if (dialogMode.value === 'create') {
      await http.post('/product-types', payload)
      ElMessage.success('创建成功')
    } else {
      await http.put(`/product-types/${currentRow.value.id}`, payload)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    await fetchRows()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '保存失败')
  }
}

const handleDisable = async (row) => {
  try {
    await ElMessageBox.confirm(`确认停用产品类型「${row.name}」及其子级吗？`, '提示', {
      type: 'warning',
    })
    await http.post(`/product-types/${row.id}/disable`)
    ElMessage.success('停用成功')
    await fetchRows()
    syncCurrentRowAfterFetch(row.id)
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error?.response?.data?.message || '停用失败')
  }
}

const handleEnable = async (row) => {
  try {
    await ElMessageBox.confirm(`确认启用产品类型「${row.name}」吗？`, '提示', {
      type: 'info',
    })
    await http.post(`/product-types/${row.id}/enable`)
    ElMessage.success('启用成功')
    await fetchRows()
    syncCurrentRowAfterFetch(row.id)
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error?.response?.data?.message || '启用失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认删除产品类型「${row.name}」及其子级吗？删除后不可恢复。`,
      '提示',
      { type: 'warning' },
    )
    await http.delete(`/product-types/${row.id}`)
    ElMessage.success('删除成功')
    dialogVisible.value = false
    currentRow.value = null
    await fetchRows()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(error?.response?.data?.message || '删除失败')
  }
}

fetchRows()
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

.footer-left-actions {
  float: left;
  display: inline-flex;
  gap: 8px;
}
</style>

