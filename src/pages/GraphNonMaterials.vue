<template>
  <div class="page-wrap">
    <el-card class="biz-card" shadow="never">
      <template #header>
        <div class="toolbar">
          <div class="left-actions">
            <span class="title-tip">非物资图谱</span>
          </div>
          <div class="right-actions">
            <el-input
              v-model="keyword"
              placeholder="非物资名称关键字"
              clearable
              style="width: 220px"
              @keyup.enter="fetchRows"
            />
            <el-select
              v-model="orgId"
              clearable
              placeholder="组织"
              style="width: 180px"
            >
              <el-option
                v-for="item in orgOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
            <el-select
              v-model="adopted"
              clearable
              placeholder="采纳状态"
              style="width: 140px"
            >
              <el-option label="已采纳" value="true" />
              <el-option label="未采纳" value="false" />
            </el-select>
            <el-button @click="fetchRows">查询</el-button>
          </div>
        </div>
      </template>

      <el-table :data="rows" class="biz-table" empty-text="暂无数据">
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.itemImage"
              :src="row.itemImage"
              fit="cover"
              style="width: 36px; height: 36px; border-radius: 6px"
              :preview-src-list="[row.itemImage]"
              preview-teleported
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="itemName" label="名称" min-width="170" />
        <el-table-column prop="orgName" label="组织" min-width="120" />
        <el-table-column prop="productTypeName" label="产品类型" min-width="120" />
        <el-table-column prop="materialCategoryName" label="物料分类" min-width="120" />
        <el-table-column prop="brand" label="品牌" min-width="120" />
        <el-table-column prop="spec" label="规格" min-width="120" />
        <el-table-column prop="unit" label="单位" width="90" />
        <el-table-column label="采纳" width="140">
          <template #default="{ row }">
            <el-select
              :model-value="row.adopted ? 'true' : 'false'"
              :loading="!!adoptedUpdatingMap[row.id]"
              :class="row.adopted ? 'adopted-select is-adopted' : 'adopted-select is-unadopted'"
              style="width: 110px"
              @change="(v) => handleAdoptedChange(row, v)"
            >
              <el-option label="已采纳" value="true" />
              <el-option label="未采纳" value="false" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" min-width="120" />
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import http from '../api/http'

const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const orgId = ref()
const adopted = ref()
const orgOptions = ref([])
const adoptedUpdatingMap = ref({})

const loadOrgOptions = async () => {
  const res = await http.get('/orgs', { params: { tree: 0 } })
  orgOptions.value = res?.data?.data?.items || []
}

const fetchRows = async () => {
  const res = await http.get('/graph/non-materials', {
    params: {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      orgId: orgId.value || undefined,
      adopted: adopted.value || undefined,
    },
  })
  if (res?.data?.code === 200) {
    rows.value = res.data?.data?.items || []
    total.value = res.data?.data?.total || 0
  } else {
    rows.value = []
    total.value = 0
  }
}

const handleSizeChange = async (size) => {
  pageSize.value = size
  page.value = 1
  await fetchRows()
}

const handleCurrentChange = async (p) => {
  page.value = p
  await fetchRows()
}

const handleAdoptedChange = async (row, value) => {
  if (!row?.id) return
  const nextAdopted = value === 'true'
  const prevAdopted = !!row.adopted
  row.adopted = nextAdopted
  adoptedUpdatingMap.value[row.id] = true
  try {
    await http.post(`/graph/non-materials/${row.id}/adopted`, {
      adopted: nextAdopted,
    })
    ElMessage.success('采纳状态已更新')
  } catch (error) {
    row.adopted = prevAdopted
    ElMessage.error(error?.response?.data?.message || '采纳状态更新失败')
  } finally {
    adoptedUpdatingMap.value[row.id] = false
  }
}

onMounted(async () => {
  await loadOrgOptions()
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

.title-tip {
  color: var(--text);
  font-weight: 600;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
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

.adopted-select :deep(.el-input__wrapper),
.adopted-select :deep(.el-select__wrapper) {
  border-width: 1px;
  border-style: solid;
}

.adopted-select.is-adopted :deep(.el-input__wrapper),
.adopted-select.is-adopted :deep(.el-select__wrapper) {
  border-color: #67c23a !important;
}

.adopted-select.is-adopted :deep(.el-input__inner),
.adopted-select.is-adopted :deep(.el-select__selected-item) {
  color: #67c23a !important;
}

.adopted-select.is-unadopted :deep(.el-input__wrapper),
.adopted-select.is-unadopted :deep(.el-select__wrapper) {
  border-color: #f56c6c !important;
}

.adopted-select.is-unadopted :deep(.el-input__inner),
.adopted-select.is-unadopted :deep(.el-select__selected-item) {
  color: #f56c6c !important;
}
</style>

