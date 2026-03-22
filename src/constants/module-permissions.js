/** 一级分组节点，仅用于树展示，不参与权限存储 */
export const MODULE_PERMISSION_CATEGORY_KEYS = new Set([
  'basicInfo',
  'graphLib',
  'monthlyPurchase',
  'systemSettings',
])

/**
 * 递归收集可分配权限（含中间节点如「组织信息」与叶子如「新增组织」）
 */
function collectPermissionOptions(nodes) {
  const out = []
  for (const n of nodes) {
    if (MODULE_PERMISSION_CATEGORY_KEYS.has(n.value)) {
      if (n.children?.length) out.push(...collectPermissionOptions(n.children))
      continue
    }
    out.push({
      key: n.value,
      label: n.label,
    })
    if (n.children?.length) out.push(...collectPermissionOptions(n.children))
  }
  return out
}

export const MODULE_PERMISSION_CASCADER_OPTIONS = [
  {
    value: 'basicInfo',
    label: '基础信息',
    children: [
      {
        value: 'orgs',
        label: '组织信息',
        children: [{ value: 'orgsCreate', label: '新增组织' }],
      },
      {
        value: 'productTypes',
        label: '产品类型',
        children: [{ value: 'productTypesCreate', label: '新增产品类型' }],
      },
      {
        value: 'materialCategories',
        label: '物料分类',
        children: [{ value: 'materialCategoriesCreate', label: '新增物料分类' }],
      },
    ],
  },
  {
    value: 'graphLib',
    label: '图谱库',
    children: [
      {
        value: 'graphMaterials',
        label: '物资图谱',
        children: [{ value: 'graphMaterialsCreate', label: '新增物资图谱' }],
      },
      { value: 'graphNonMaterials', label: '非物资图谱' },
    ],
  },
  {
    value: 'monthlyPurchase',
    label: '月度采购',
    children: [
      { value: 'purchasePlans', label: '月度采购计划提报' },
      { value: 'purchaseAggregate', label: '月度采购聚合' },
    ],
  },
  {
    value: 'systemSettings',
    label: '系统设置',
    children: [{ value: 'userControls', label: '人员管控' }],
  },
]

export const MODULE_PERMISSION_OPTIONS = collectPermissionOptions(
  MODULE_PERMISSION_CASCADER_OPTIONS,
)

/** 与后端「新增用户默认权限」一致：无「新增」子权限、无非物资图谱、无采购聚合、无人员管控 */
export const NEW_USER_DEFAULT_EXCLUDED_KEYS = new Set([
  'orgsCreate',
  'productTypesCreate',
  'materialCategoriesCreate',
  'graphMaterialsCreate',
  'graphNonMaterials',
  'purchaseAggregate',
  'userControls',
])

export const DEFAULT_NEW_USER_MODULE_PERMISSION_KEYS =
  MODULE_PERMISSION_OPTIONS.map((o) => o.key).filter(
    (k) => !NEW_USER_DEFAULT_EXCLUDED_KEYS.has(k),
  )

export const MODULE_PERMISSION_LABEL_MAP = MODULE_PERMISSION_OPTIONS.reduce(
  (acc, item) => {
    acc[item.key] = item.label
    return acc
  },
  {
    /** 后端存在但当前权限树未展示，默认新用户会分配 */
    orgControls: '组织管控',
  },
)
