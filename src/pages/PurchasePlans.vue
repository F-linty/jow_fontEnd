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
              @change="handleMonthChange"
            />
            <el-input
              v-model="keyword"
              clearable
              placeholder="计划名称关键词"
              style="width: 220px"
              @keyup.enter="fetchRows"
            />
            <el-button @click="fetchRows">查询</el-button>
          </div>
          <div class="right-actions">
            <el-button type="primary" @click="openCreate">提报计划</el-button>
          </div>
        </div>
      </template>

      <el-table :data="rows" class="biz-table" empty-text="暂无数据">
        <el-table-column prop="month" label="月份" width="100" />
        <el-table-column prop="orgName" label="组织" min-width="140" />
        <el-table-column prop="planName" label="计划名称" min-width="160" />
        <el-table-column prop="shippingAddress" label="收货地址" min-width="160" show-overflow-tooltip />
        <el-table-column prop="lineCount" label="条目数" width="90" />
        <el-table-column prop="createdBy" label="创建人" width="110" />
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
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

    <el-dialog
      v-model="createVisible"
      title="月度采购计划提报"
      width="720px"
      append-to-body
      align-center
    >
      <el-form label-width="100px">
        <el-form-item label="组织">
          <el-input :model-value="currentUserOrgName" disabled placeholder="-" />
        </el-form-item>
        <el-form-item label="计划名称" required>
          <el-input v-model="createForm.planName" maxlength="100" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="收货地址" required>
          <div class="address-fields">
            <el-cascader
              v-model="createForm.regionCodes"
              :options="regionData"
              clearable
              filterable
              placeholder="请选择省 / 市 / 区"
              style="width: 100%"
              class="address-cascader"
            />
            <el-input
              v-model="createForm.addressDetail"
              type="textarea"
              :rows="2"
              maxlength="400"
              show-word-limit
              placeholder="详细地址（街道、门牌号、楼层等）"
            />
          </div>
        </el-form-item>
        <el-form-item label="采购明细" required>
          <div class="selected-lines-wrap">
            <div class="line-action-row">
              <el-button type="primary" plain size="small" @click="openMaterialPicker">
                从物资图谱选择
              </el-button>
              <el-button type="primary" plain size="small" @click="openNonMaterialDialog">
                新增不在物资图谱
              </el-button>
            </div>
            <el-table :data="selectedLines" class="biz-table mt8" empty-text="暂未添加商品" max-height="240">
              <el-table-column label="来源" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.lineType === 'NON_MATERIAL' ? 'warning' : 'success'">
                    {{ row.lineType === 'NON_MATERIAL' ? '非图谱' : '图谱' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="商品图片" width="90">
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
              <el-table-column prop="itemName" label="名称" min-width="120" />
              <el-table-column prop="brand" label="品牌" width="90" />
              <el-table-column prop="spec" label="规格" width="90" />
              <el-table-column prop="unit" label="单位" width="70" />
              <el-table-column label="数量" width="100">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.demandQty"
                    :min="0.01"
                    :precision="2"
                    size="small"
                    controls-position="right"
                    style="width: 100%"
                  />
                </template>
              </el-table-column>
              <el-table-column label="单价" width="90">
                <template #default="{ row }">
                  {{ formatPrice(row.estimatedUnitPrice ?? row.unitPrice) }}
                </template>
              </el-table-column>
              <el-table-column label="合计" width="100">
                <template #default="{ row }">
                  {{ formatPrice((row.demandQty || 0) * (Number(row.estimatedUnitPrice ?? row.unitPrice) || 0)) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" fixed="right">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="removeSelectedLine($index)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="materialPickerVisible"
      title="从物资图谱选择商品"
      width="800px"
      append-to-body
      align-center
      @closed="materialPickerKeyword = ''"
    >
      <div class="material-picker-toolbar">
        <el-input
          v-model="materialPickerKeyword"
          placeholder="商品名称搜索"
          clearable
          style="width: 200px"
          @keyup.enter="fetchMaterialOptions"
        />
        <el-tree-select
          v-model="materialPickerProductTypeId"
          clearable
          placeholder="产品类型"
          :data="productTypeOptions"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          value-key="id"
          check-strictly
          style="width: 160px"
        />
        <el-tree-select
          v-model="materialPickerCategoryId"
          clearable
          placeholder="物料分类"
          :data="materialCategoryOptions"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          value-key="id"
          check-strictly
          style="width: 160px"
        />
        <el-button type="primary" @click="fetchMaterialOptions">查询</el-button>
      </div>
      <el-table
        ref="materialPickerTableRef"
        :data="materialOptions"
        class="biz-table mt12"
        max-height="320"
        empty-text="暂无数据"
        @selection-change="handleMaterialSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="itemName" label="商品名称" min-width="140" />
        <el-table-column prop="productTypeName" label="产品类型" width="100" />
        <el-table-column prop="materialCategoryName" label="物料分类" width="100" />
        <el-table-column prop="brand" label="品牌" width="90" />
        <el-table-column prop="spec" label="规格" width="80" />
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="unitPrice" label="采购单价" width="90">
          <template #default="{ row }">
            {{ formatPrice(row.unitPrice) }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="materialPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddMaterials">添加选中</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="nonMaterialDialogVisible"
      title="新增不在物资图谱"
      width="620px"
      append-to-body
      align-center
    >
      <el-form label-width="100px">
        <el-form-item label="产品类型" required>
          <el-tree-select
            v-model="nonMaterialForm.productTypeId"
            placeholder="请选择"
            :data="productTypeOptions"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            value-key="id"
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="物料分类" required>
          <el-tree-select
            v-model="nonMaterialForm.materialCategoryId"
            placeholder="请选择"
            :data="materialCategoryOptions"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            value-key="id"
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="商品图片" required>
          <el-upload
            class="item-image-uploader"
            :class="{ 'hide-upload-trigger': nonMaterialUploadFileList.length >= 1 }"
            action="#"
            :auto-upload="false"
            list-type="picture-card"
            accept="image/*"
            :limit="1"
            :file-list="nonMaterialUploadFileList"
            :on-change="handleNonMaterialImageChange"
            :on-remove="handleNonMaterialImageRemove"
            :on-exceed="handleNonMaterialImageExceed"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="商品名称" required>
          <el-input v-model="nonMaterialForm.itemName" maxlength="100" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品品牌" required>
          <el-input v-model="nonMaterialForm.brand" maxlength="100" placeholder="可选" />
        </el-form-item>
        <el-form-item label="规格" required>
          <el-input v-model="nonMaterialForm.spec" maxlength="100" placeholder="可选" />
        </el-form-item>
        <el-form-item label="单位" required>
          <el-input v-model="nonMaterialForm.unit" maxlength="20" placeholder="可选" />
        </el-form-item>
        <el-form-item label="预估单价" required>
          <el-input-number
            v-model="nonMaterialForm.estimatedUnitPrice"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nonMaterialDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddNonMaterial">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="采购计划详情" width="820px">
      <el-descriptions :column="3" border v-if="detailPlan">
        <el-descriptions-item label="计划ID">{{ detailPlan.id }}</el-descriptions-item>
        <el-descriptions-item label="月份">{{ detailPlan.month }}</el-descriptions-item>
        <el-descriptions-item label="组织">{{ detailPlan.org?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计划名称">{{ detailPlan.planName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="3">
          {{ detailPlan.shippingAddress || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ detailPlan.createdBy?.account || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailPlan?.lines || []" class="biz-table mt12" empty-text="无明细">
        <el-table-column label="来源" width="90">
          <template #default="{ row }">
            <el-tag :type="row.lineType === 'NON_MATERIAL' ? 'warning' : 'success'">
              {{ row.lineType === 'NON_MATERIAL' ? '非图谱' : '图谱' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="商品图片" width="90">
          <template #default="{ row }">
            <el-image
              v-if="detailLineImage(row)"
              :src="detailLineImage(row)"
              fit="cover"
              style="width: 36px; height: 36px; border-radius: 6px"
              :preview-src-list="[detailLineImage(row)]"
              preview-teleported
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="itemName" label="名称" min-width="160" />
        <el-table-column prop="brand" label="品牌" min-width="100" />
        <el-table-column prop="spec" label="规格" min-width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="demandQty" label="数量" width="100" />
        <el-table-column prop="unitPrice" label="单价" width="100" />
        <el-table-column prop="total" label="合计" width="120" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { regionData, codeToText } from 'element-china-area-data'
import http from '../api/http'

const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const monthValue = ref(new Date().toISOString().slice(0, 7))
const keyword = ref('')
const orgOptions = ref([])

const authStore = useAuthStore()
const createVisible = ref(false)
const createForm = ref({
  planName: '',
  regionCodes: [],
  addressDetail: '',
})
const selectedLines = ref([])

const materialPickerVisible = ref(false)
const materialPickerKeyword = ref('')
const materialPickerProductTypeId = ref()
const materialPickerCategoryId = ref()
const materialOptions = ref([])
const materialPickerTableRef = ref(null)
const materialPickerSelected = ref([])
const productTypeOptions = ref([])
const materialCategoryOptions = ref([])
const nonMaterialDialogVisible = ref(false)
const nonMaterialForm = ref({
  productTypeId: undefined,
  materialCategoryId: undefined,
  itemImage: '',
  itemName: '',
  brand: '',
  spec: '',
  unit: '',
  estimatedUnitPrice: null,
})
const nonMaterialUploadFileList = ref([])

const currentUserOrgName = computed(() => {
  const orgId = authStore.userProfile?.orgId
  if (!orgId) return '-'
  const org = orgOptions.value.find((o) => o.id === orgId)
  return org?.name ?? '-'
})

const detailVisible = ref(false)
const detailPlan = ref(null)

const detailLineImage = (row) => {
  if (!row) return ''
  if (row.lineType === 'NON_MATERIAL') return row.itemImage || ''
  return row.materialItem?.itemImage || ''
}

const formatPrice = (v) => {
  if (v == null || v === '' || Number.isNaN(Number(v))) return '-'
  return Number(v).toFixed(2)
}

const loadOrgOptions = async () => {
  const res = await http.get('/orgs', { params: { tree: 0 } })
  orgOptions.value = res?.data?.data?.items || []
}

const loadProductTypeAndCategory = async () => {
  const [ptRes, mcRes] = await Promise.all([
    http.get('/product-types', { params: { tree: 1 } }),
    http.get('/material-categories', { params: { tree: 1 } }),
  ])
  productTypeOptions.value = ptRes?.data?.data?.items || []
  materialCategoryOptions.value = mcRes?.data?.data?.items || []
}

const fetchMaterialOptions = async () => {
  const res = await http.get('/graph/materials', {
    params: {
      page: 1,
      pageSize: 100,
      keyword: materialPickerKeyword.value?.trim() || undefined,
      productTypeId: materialPickerProductTypeId.value || undefined,
      materialCategoryId: materialPickerCategoryId.value || undefined,
    },
  })
  materialOptions.value = res?.data?.data?.items || []
}

const openMaterialPicker = async () => {
  await loadProductTypeAndCategory()
  materialPickerKeyword.value = ''
  materialPickerProductTypeId.value = undefined
  materialPickerCategoryId.value = undefined
  materialPickerVisible.value = true
  await fetchMaterialOptions()
}

const handleMaterialSelectionChange = (rows) => {
  materialPickerSelected.value = rows || []
}

const confirmAddMaterials = () => {
  const ids = new Set(selectedLines.value.map((l) => l.materialItemId))
  for (const row of materialPickerSelected.value) {
    if (ids.has(row.id)) continue
    ids.add(row.id)
    selectedLines.value.push({
      lineType: 'MATERIAL',
      materialItemId: row.id,
      productTypeId: row.productTypeId,
      materialCategoryId: row.materialCategoryId,
      itemImage: row.itemImage || '',
      itemName: row.itemName || '',
      brand: row.brand || '',
      spec: row.spec || '',
      unit: row.unit || '',
      unitPrice: row.unitPrice ?? 0,
      estimatedUnitPrice: row.unitPrice ?? 0,
      demandQty: 1,
    })
  }
  materialPickerVisible.value = false
}

const resetNonMaterialForm = () => {
  nonMaterialForm.value = {
    productTypeId: undefined,
    materialCategoryId: undefined,
    itemImage: '',
    itemName: '',
    brand: '',
    spec: '',
    unit: '',
    estimatedUnitPrice: null,
  }
  nonMaterialUploadFileList.value = []
}

const openNonMaterialDialog = async () => {
  await loadProductTypeAndCategory()
  resetNonMaterialForm()
  nonMaterialDialogVisible.value = true
}

const handleNonMaterialImageChange = (uploadFile, uploadFiles) => {
  nonMaterialUploadFileList.value = uploadFiles.slice(-1)
  const raw = uploadFile?.raw
  if (!raw) return
  const reader = new FileReader()
  reader.onload = () => {
    nonMaterialForm.value.itemImage = String(reader.result || '')
    nonMaterialUploadFileList.value = [
      {
        name: uploadFile.name || 'image',
        url: nonMaterialForm.value.itemImage,
      },
    ]
  }
  reader.readAsDataURL(raw)
}

const handleNonMaterialImageRemove = () => {
  nonMaterialForm.value.itemImage = ''
  nonMaterialUploadFileList.value = []
}

const handleNonMaterialImageExceed = () => {
  ElMessage.warning('只能上传一张图片')
}

const confirmAddNonMaterial = () => {
  if (!nonMaterialForm.value.productTypeId) {
    ElMessage.warning('请选择产品类型')
    return
  }
  if (!nonMaterialForm.value.materialCategoryId) {
    ElMessage.warning('请选择物料分类')
    return
  }
  if (!nonMaterialForm.value.itemImage?.trim()) {
    ElMessage.warning('商品图片不能为空')
    return
  }
  if (!nonMaterialForm.value.itemName?.trim()) {
    ElMessage.warning('商品名称不能为空')
    return
  }
  if (!nonMaterialForm.value.brand?.trim()) {
    ElMessage.warning('商品品牌不能为空')
    return
  }
  if (!nonMaterialForm.value.spec?.trim()) {
    ElMessage.warning('规格不能为空')
    return
  }
  if (!nonMaterialForm.value.unit?.trim()) {
    ElMessage.warning('单位不能为空')
    return
  }
  if (
    nonMaterialForm.value.estimatedUnitPrice === null ||
    nonMaterialForm.value.estimatedUnitPrice === undefined
  ) {
    ElMessage.warning('预估单价不能为空')
    return
  }

  selectedLines.value.push({
    lineType: 'NON_MATERIAL',
    materialItemId: undefined,
    productTypeId: nonMaterialForm.value.productTypeId,
    materialCategoryId: nonMaterialForm.value.materialCategoryId,
    itemImage: nonMaterialForm.value.itemImage,
    itemName: nonMaterialForm.value.itemName.trim(),
    brand: nonMaterialForm.value.brand.trim(),
    spec: nonMaterialForm.value.spec.trim(),
    unit: nonMaterialForm.value.unit.trim(),
    unitPrice: Number(nonMaterialForm.value.estimatedUnitPrice) || 0,
    estimatedUnitPrice: Number(nonMaterialForm.value.estimatedUnitPrice) || 0,
    demandQty: 1,
  })

  nonMaterialDialogVisible.value = false
}

const removeSelectedLine = (index) => {
  selectedLines.value.splice(index, 1)
}

const fetchRows = async () => {
  const res = await http.get(`/purchases/${monthValue.value}/plans`, {
    params: {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
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

const openCreate = () => {
  const orgId = authStore.userProfile?.orgId
  if (!orgId) {
    ElMessage.warning('您未分配组织，无法提报计划')
    return
  }
  createForm.value = { planName: '', regionCodes: [], addressDetail: '' }
  selectedLines.value = []
  createVisible.value = true
}

const submitCreate = async () => {
  const orgId = authStore.userProfile?.orgId
  if (!orgId) {
    ElMessage.warning('您未分配组织，无法提报计划')
    return
  }
  if (!createForm.value.planName?.trim()) {
    ElMessage.warning('计划名称不能为空')
    return
  }
  const codes = createForm.value.regionCodes
  if (!Array.isArray(codes) || codes.length < 3) {
    ElMessage.warning('请选择完整的省 / 市 / 区（选到最后一级）')
    return
  }
  if (!createForm.value.addressDetail?.trim()) {
    ElMessage.warning('请填写详细地址')
    return
  }
  const regionText = codes.map((c) => codeToText[c]).filter(Boolean).join('')
  const detailText = createForm.value.addressDetail.trim()
  const shippingAddress = `${regionText}${detailText}`.slice(0, 500)
  const month = new Date().toISOString().slice(0, 7)

  const lines = selectedLines.value
    .filter((l) => Number(l.demandQty) > 0)
    .map((l) => {
      const qty = Number(l.demandQty) || 0
      const price = Number(l.estimatedUnitPrice ?? l.unitPrice) || 0
      return {
        lineType: l.lineType || 'MATERIAL',
        materialItemId: l.materialItemId,
        productTypeId: l.productTypeId,
        materialCategoryId: l.materialCategoryId,
        itemName: l.itemName?.trim() || null,
        itemImage: l.itemImage?.trim() || null,
        brand: l.brand?.trim() || null,
        spec: l.spec?.trim() || null,
        unit: l.unit?.trim() || null,
        demandQty: qty,
        unitPrice: Number(l.estimatedUnitPrice ?? l.unitPrice) || 0,
        subtotal: qty * price,
        total: qty * price,
      }
    })
  if (!lines.length) {
    ElMessage.warning('采购明细不能为空')
    return
  }

  try {
    await http.post(`/purchases/${month}/plans`, {
      orgId,
      planName: createForm.value.planName?.trim() || null,
      shippingAddress,
      lines,
    })
    ElMessage.success('提报成功')
    createVisible.value = false
    monthValue.value = month
    await fetchRows()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '提报失败')
  }
}

const openDetail = async (row) => {
  const res = await http.get(`/purchases/${row.month}/plans/${row.id}`)
  detailPlan.value = res?.data?.data?.[0] || null
  detailVisible.value = true
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

const handleMonthChange = async () => {
  page.value = 1
  await fetchRows()
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
.left-actions,
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
.mt8 {
  margin-top: 8px;
}
.mt12 {
  margin-top: 12px;
}
.selected-lines-wrap {
  width: 100%;
}
.line-action-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.item-image-uploader :deep(.el-upload--picture-card),
.item-image-uploader :deep(.el-upload-list__item) {
  width: 92px;
  height: 92px;
}
.item-image-uploader.hide-upload-trigger :deep(.el-upload--picture-card) {
  display: none;
}
.material-picker-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.address-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
</style>

