<template>
  <div class="page-wrap">
    <el-card class="biz-card" shadow="never">
      <template #header>
        <div class="toolbar">
          <div class="left-actions">
            <el-date-picker
              v-model="monthValue"
              type="month"
              value-format="YYYY-MM"
              placeholder="选择月份"
              style="width: 160px"
            />
            <el-select
              v-model="orgId"
              clearable
              placeholder="组织"
              style="width: 200px"
            >
              <el-option
                v-for="item in orgOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
            <el-input
              v-model="planIdKeyword"
              placeholder="月度采购计划单号筛选"
              style="width: 200px"
              clearable
            />
            <el-select
              v-model="lineType"
              clearable
              placeholder="清单类型"
              style="width: 180px"
            >
              <el-option label="图谱" :value="'MATERIAL'" />
              <el-option label="非图谱" :value="'NON_MATERIAL'" />
            </el-select>
            <el-button @click="queryAggregate">查询</el-button>
            <el-button type="primary" @click="archiveAggregate">存档</el-button>
            <el-button @click="openHistoryDialog">历史聚合</el-button>
          </div>
        </div>
      </template>

      <div v-if="aggregate" class="sheet-wrap">
        <div class="section-title">月度采购聚合基本信息</div>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="月度采购计划单号">
            {{ aggregate.sourcePlan?.id || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="需求组织">{{ aggregate.org?.name || currentOrgName }}</el-descriptions-item>
          <el-descriptions-item label="提交人">
            {{ aggregate.sourcePlan?.createdBy || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="收货地址">
            {{ aggregate.sourcePlan?.shippingAddress || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(aggregate.sourcePlan?.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="showMaterialTable" class="section-title mt12">图谱物料清单</div>
        <el-table v-if="showMaterialTable" :data="materialLines" class="biz-table" empty-text="暂无图谱明细">
          <el-table-column label="序号" width="70" align="center">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column prop="productType.name" label="产品类型" min-width="140">
            <template #default="{ row }">{{ row.productType?.name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="materialCategory.name" label="物料分类" min-width="140">
            <template #default="{ row }">{{ row.materialCategory?.name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="itemName" label="商品名称" min-width="140" />
          <el-table-column prop="brand" label="商品品牌" min-width="120" />
          <el-table-column prop="spec" label="规格" min-width="120" />
          <el-table-column prop="unit" label="单位" width="100" />
          <el-table-column prop="demandQty" label="需求数量" width="120">
            <template #default="{ row }">{{ formatNumber(row.demandQty) }}</template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="采购单价" width="120">
            <template #default="{ row }">{{ formatNumber(row.unitPrice) }}</template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="140">
            <template #default="{ row }">{{ formatNumber(calcLineSubtotal(row)) }}</template>
          </el-table-column>
          <el-table-column prop="total" label="合计" width="140">
            <template #default="{ row }">{{ formatNumber(calcLineTotal(row)) }}</template>
          </el-table-column>
          <template #append>
            <div class="sum-row">
              合计：数量 {{ formatNumber(materialSummary.demandQty) }}，合计
              {{ formatNumber(materialSummary.total) }}
            </div>
          </template>
        </el-table>

        <div v-if="showNonMaterialTable" class="section-title mt12">非图谱物料清单</div>
        <el-table
          v-if="showNonMaterialTable"
          :data="nonMaterialLines"
          class="biz-table"
          empty-text="暂无非图谱明细"
        >
          <el-table-column label="序号" width="70" align="center">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column prop="productType.name" label="产品类型" min-width="140">
            <template #default="{ row }">{{ row.productType?.name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="materialCategory.name" label="物料分类" min-width="140">
            <template #default="{ row }">{{ row.materialCategory?.name || '-' }}</template>
          </el-table-column>
          <el-table-column prop="itemName" label="商品名称" min-width="140" />
          <el-table-column prop="brand" label="商品品牌" min-width="120" />
          <el-table-column prop="spec" label="规格" min-width="120" />
          <el-table-column prop="unit" label="单位" width="100" />
          <el-table-column prop="demandQty" label="需求数量" width="120">
            <template #default="{ row }">{{ formatNumber(row.demandQty) }}</template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="预估单价" width="120">
            <template #default="{ row }">{{ formatNumber(row.unitPrice) }}</template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="140">
            <template #default="{ row }">{{ formatNumber(calcLineSubtotal(row)) }}</template>
          </el-table-column>
          <el-table-column prop="total" label="合计" width="140">
            <template #default="{ row }">{{ formatNumber(calcLineTotal(row)) }}</template>
          </el-table-column>
          <template #append>
            <div class="sum-row">
              合计：数量 {{ formatNumber(nonMaterialSummary.demandQty) }}，合计
              {{ formatNumber(nonMaterialSummary.total) }}
            </div>
          </template>
        </el-table>
      </div>
      <el-empty v-else description="暂无聚合明细" class="mt12" />
    </el-card>

    <el-dialog v-model="historyVisible" title="历史聚合记录" width="760px" append-to-body align-center>
      <el-table :data="historyRows" class="biz-table" empty-text="暂无历史聚合记录">
        <el-table-column prop="planId" label="月度采购计划单号" width="160" />
        <el-table-column prop="month" label="月份" width="110" />
        <el-table-column prop="orgName" label="组织" min-width="120" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">{{ statusTextMap[row.status] || row.status }}</template>
        </el-table-column>
        <el-table-column label="聚合时间" min-width="160">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="useHistoryAggregate(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="historyTotal"
          :page-size="historyPageSize"
          :current-page="historyPage"
          @current-change="handleHistoryPageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import http from '../api/http'

const monthValue = ref(new Date().toISOString().slice(0, 7))
const orgId = ref()
const planIdKeyword = ref('')
const selectedAggregateId = ref('')
const lineType = ref('')
const orgOptions = ref([])
const aggregate = ref(null)
const historyVisible = ref(false)
const historyRows = ref([])
const historyTotal = ref(0)
const historyPage = ref(1)
const historyPageSize = ref(10)

const statusTextMap = {
  INIT: '未执行',
  RUNNING: '执行中',
  DONE: '已完成',
  FAILED: '失败',
}

const formatNumber = (v) => {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

const calcLineSubtotal = (line) => {
  const qty = Number(line?.demandQty ?? 0)
  const unitPrice = Number(line?.unitPrice ?? 0)
  return qty * unitPrice
}

const calcLineTotal = (line) => {
  if (line?.total !== null && line?.total !== undefined) return Number(line.total ?? 0)
  return calcLineSubtotal(line)
}

const formatDateTime = (v) => {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const materialLines = computed(() =>
  (aggregate.value?.sourcePlanLines || []).filter((line) => line.lineType === 'MATERIAL'),
)

const nonMaterialLines = computed(() =>
  (aggregate.value?.sourcePlanLines || []).filter((line) => line.lineType === 'NON_MATERIAL'),
)

const calcSummary = (lines) =>
  lines.reduce(
    (acc, line) => ({
      demandQty: acc.demandQty + Number(line.demandQty ?? 0),
      subtotal: acc.subtotal + calcLineSubtotal(line),
      total: acc.total + calcLineTotal(line),
    }),
    { demandQty: 0, subtotal: 0, total: 0 },
  )

const materialSummary = computed(() => calcSummary(materialLines.value))
const nonMaterialSummary = computed(() => calcSummary(nonMaterialLines.value))
const showMaterialTable = computed(() => !lineType.value || lineType.value === 'MATERIAL')
const showNonMaterialTable = computed(() => !lineType.value || lineType.value === 'NON_MATERIAL')

const currentOrgName = computed(() => {
  const hit = orgOptions.value.find((item) => item.id === orgId.value)
  return hit?.name || '-'
})

const loadOrgOptions = async () => {
  const res = await http.get('/orgs', { params: { tree: 0 } })
  orgOptions.value = res?.data?.data?.items || []
  if (!orgId.value && orgOptions.value.length) {
    orgId.value = orgOptions.value[0].id
  }
}

const fetchAggregate = async () => {
  if (!orgId.value) {
    ElMessage.warning('请先选择组织')
    return
  }

  const params = { orgId: orgId.value }
  if (planIdKeyword.value) params.planId = planIdKeyword.value
  if (selectedAggregateId.value) params.aggregateId = selectedAggregateId.value
  if (lineType.value) params.lineType = lineType.value

  const res = await http.get(`/purchases/${monthValue.value}/aggregate`, { params })
  aggregate.value = res?.data?.data?.[0] || null
}

const queryAggregate = async () => {
  await fetchAggregate()
}

const archiveAggregate = async () => {
  if (!orgId.value) {
    ElMessage.warning('请先选择组织')
    return
  }
  await http.post(`/purchases/${monthValue.value}/aggregate`, {
    orgId: orgId.value,
  })
  ElMessage.success('存档成功')
  await fetchAggregate()
}

const fetchHistory = async () => {
  if (!orgId.value) {
    historyRows.value = []
    historyTotal.value = 0
    return
  }
  const res = await http.get(`/purchases/${monthValue.value}/aggregate/history`, {
    params: {
      orgId: orgId.value,
      page: historyPage.value,
      pageSize: historyPageSize.value,
    },
  })
  historyRows.value = res?.data?.data?.items || []
  historyTotal.value = res?.data?.data?.total || 0
}

const openHistoryDialog = async () => {
  if (!orgId.value) {
    ElMessage.warning('请先选择组织')
    return
  }
  historyPage.value = 1
  await fetchHistory()
  historyVisible.value = true
}

const handleHistoryPageChange = async (p) => {
  historyPage.value = p
  await fetchHistory()
}

const useHistoryAggregate = async (row) => {
  selectedAggregateId.value = String(row?.id || '')
  planIdKeyword.value = String(row?.planId || '')
  historyVisible.value = false
  await fetchAggregate()
}

watch([monthValue, orgId, lineType, planIdKeyword], () => {
  selectedAggregateId.value = ''
})

onMounted(async () => {
  await loadOrgOptions()
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
.left-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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
.sheet-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.section-title {
  margin: 8px 0;
  padding: 8px 12px;
  text-align: center;
  font-weight: 600;
  border: 1px solid rgba(122, 147, 172, 0.18);
  border-bottom: none;
  background: rgba(122, 147, 172, 0.08);
}
.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
.sum-row {
  padding: 10px 12px;
  font-weight: 600;
  border-top: 1px solid rgba(122, 147, 172, 0.18);
}
.mt12 {
  margin-top: 12px;
}
</style>

