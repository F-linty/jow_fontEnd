<template>
  <div class="page-wrap">
    <el-card class="biz-card" shadow="never">
      <template #header>
        <div class="toolbar">
          <div class="left-actions">
            <el-button
              v-if="authStore.hasPermission('graphMaterialsCreate')"
              type="primary"
              @click="openCreate()"
            >
              新增物资图谱
            </el-button>
          </div>
          <div class="right-actions">
            <el-input
              v-model="keyword"
              placeholder="物资名称关键字"
              clearable
              style="width: 220px"
              @keyup.enter="fetchRows"
            />
            <el-tree-select
              v-model="productTypeId"
              clearable
              placeholder="产品类型"
              :data="productTypeOptions"
              :props="{ label: 'name', children: 'children' }"
              node-key="id"
              value-key="id"
              check-strictly
              style="width: 180px"
            />
            <el-tree-select
              v-model="materialCategoryId"
              clearable
              placeholder="物料分类"
              :data="materialCategoryOptions"
              :props="{ label: 'name', children: 'children' }"
              node-key="id"
              value-key="id"
              check-strictly
              style="width: 180px"
            />
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
        <el-table-column prop="itemName" label="商品名称" min-width="180" />
        <el-table-column prop="productTypeName" label="产品类型" min-width="140" />
        <el-table-column prop="materialCategoryName" label="物料分类" min-width="140" />
        <el-table-column prop="brand" label="商品品牌" min-width="120" />
        <el-table-column prop="spec" label="规格" min-width="120" />
        <el-table-column prop="unit" label="单位" width="90" />
        <el-table-column prop="unitPrice" label="采购单价" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
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
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增物资图谱' : '编辑物资图谱'"
      width="620px"
      append-to-body
      align-center
    >
      <el-form label-width="100px">
        <el-form-item label="产品类型" required>
          <el-tree-select
            v-model="form.productTypeId"
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
            v-model="form.materialCategoryId"
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
            :class="{ 'hide-upload-trigger': uploadFileList.length >= 1 }"
            action="#"
            :auto-upload="false"
            list-type="picture-card"
            accept="image/*"
            :limit="1"
            :file-list="uploadFileList"
            :on-change="handleImageChange"
            :on-remove="handleImageRemove"
            :on-exceed="handleImageExceed"
            :on-preview="handlePictureCardPreview"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="商品名称" required>
          <el-input v-model="form.itemName" maxlength="100" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品品牌" required>
          <el-input v-model="form.brand" maxlength="100" placeholder="可选" />
        </el-form-item>
        <el-form-item label="规格" required>
          <el-input v-model="form.spec" maxlength="100" placeholder="可选" />
        </el-form-item>
        <el-form-item label="单位" required>
          <el-input v-model="form.unit" maxlength="20" placeholder="可选" />
        </el-form-item>
        <el-form-item label="采购单价" required>
          <el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" required>
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

    <el-dialog v-model="previewVisible" title="图片预览" width="600px" append-to-body align-center>
      <img v-if="previewImageUrl" :src="previewImageUrl" style="width: 100%; display: block" alt="预览" />
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import http from '../api/http'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const productTypeId = ref()
const materialCategoryId = ref()
const productTypeOptions = ref([])
const materialCategoryOptions = ref([])

const dialogVisible = ref(false)
const dialogMode = ref('create')
const currentRow = ref(null)
const form = ref({
  itemName: '',
  itemImage: '',
  productTypeId: undefined,
  materialCategoryId: undefined,
  brand: '',
  spec: '',
  unit: '',
  unitPrice: null,
  status: 'ACTIVE',
})
const uploadFileList = ref([])
const previewVisible = ref(false)
const previewImageUrl = ref('')

const loadOptions = async () => {
  const [ptRes, mcRes] = await Promise.all([
    http.get('/product-types', { params: { tree: 1 } }),
    http.get('/material-categories', { params: { tree: 1 } }),
  ])
  productTypeOptions.value = ptRes?.data?.data?.items || []
  materialCategoryOptions.value = mcRes?.data?.data?.items || []
}

const fetchRows = async () => {
  const res = await http.get('/graph/materials', {
    params: {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      productTypeId: productTypeId.value || undefined,
      materialCategoryId: materialCategoryId.value || undefined,
    },
  })
  if (res?.data?.code === 200) {
    rows.value = (res.data?.data?.items || []).map((item) => ({
      ...item,
      itemImage: item.itemImage || '',
    }))
    total.value = res.data?.data?.total || 0
  } else {
    rows.value = []
    total.value = 0
  }
}

const resetForm = () => {
  form.value = {
    itemName: '',
    itemImage: '',
    productTypeId: undefined,
    materialCategoryId: undefined,
    brand: '',
    spec: '',
    unit: '',
    unitPrice: null,
    status: 'ACTIVE',
  }
  uploadFileList.value = []
}

const openCreate = () => {
  dialogMode.value = 'create'
  currentRow.value = null
  resetForm()
  dialogVisible.value = true
}

const openEdit = (row) => {
  dialogMode.value = 'edit'
  currentRow.value = row
  form.value = {
    itemName: row.itemName ?? '',
    itemImage: row.itemImage ?? '',
    productTypeId: row.productTypeId,
    materialCategoryId: row.materialCategoryId,
    brand: row.brand ?? '',
    spec: row.spec ?? '',
    unit: row.unit ?? '',
    unitPrice: row.unitPrice ?? null,
    status: row.status ?? 'ACTIVE',
  }
  uploadFileList.value = row.itemImage
    ? [
        {
          name: 'image',
          url: row.itemImage,
        },
      ]
    : []
  dialogVisible.value = true
}

const handleImageChange = (uploadFile, uploadFiles) => {
  uploadFileList.value = uploadFiles.slice(-1)
  const raw = uploadFile?.raw
  if (!raw) return
  const reader = new FileReader()
  reader.onload = () => {
    form.value.itemImage = String(reader.result || '')
    uploadFileList.value = [
      {
        name: uploadFile.name || 'image',
        url: form.value.itemImage,
      },
    ]
  }
  reader.readAsDataURL(raw)
}

const handleImageRemove = () => {
  form.value.itemImage = ''
  uploadFileList.value = []
}

const handleImageExceed = () => {
  ElMessage.warning('只能上传一张图片')
}

const handlePictureCardPreview = (uploadFile) => {
  previewImageUrl.value = uploadFile?.url ?? form.value.itemImage ?? ''
  previewVisible.value = true
}

const submitForm = async () => {
  if (!form.value.itemImage?.trim()) {
    ElMessage.warning('商品图片不能为空')
    return
  }
  if (!form.value.itemName?.trim()) {
    ElMessage.warning('商品名称不能为空')
    return
  }
  if (!form.value.productTypeId) {
    ElMessage.warning('请选择产品类型')
    return
  }
  if (!form.value.materialCategoryId) {
    ElMessage.warning('请选择物料分类')
    return
  }
  if (!form.value.brand?.trim()) {
    ElMessage.warning('商品品牌不能为空')
    return
  }
  if (!form.value.spec?.trim()) {
    ElMessage.warning('规格不能为空')
    return
  }
  if (!form.value.unit?.trim()) {
    ElMessage.warning('单位不能为空')
    return
  }
  if (form.value.unitPrice === null || form.value.unitPrice === undefined) {
    ElMessage.warning('采购单价不能为空')
    return
  }
  if (!form.value.status) {
    ElMessage.warning('状态不能为空')
    return
  }

  const payload = {
    itemName: form.value.itemName.trim(),
    productTypeId: form.value.productTypeId,
    materialCategoryId: form.value.materialCategoryId,
    itemImage: form.value.itemImage?.trim() || null,
    brand: form.value.brand?.trim() || null,
    spec: form.value.spec?.trim() || null,
    unit: form.value.unit?.trim() || null,
    unitPrice: form.value.unitPrice ?? null,
    status: form.value.status,
  }
  if (dialogMode.value === 'create') {
    await http.post('/graph/materials', payload)
    ElMessage.success('创建成功')
  } else {
    await http.put(`/graph/materials/${currentRow.value.id}`, payload)
    ElMessage.success('更新成功')
  }
  dialogVisible.value = false
  await fetchRows()
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

onMounted(async () => {
  await loadOptions()
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

.item-image-uploader :deep(.el-upload--picture-card),
.item-image-uploader :deep(.el-upload-list__item) {
  width: 92px;
  height: 92px;
}

.item-image-uploader.hide-upload-trigger :deep(.el-upload--picture-card) {
  display: none;
}
</style>

