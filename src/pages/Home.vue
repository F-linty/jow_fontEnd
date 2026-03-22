<template>
  <div class="home-page">
    <el-card shadow="never" class="chart-panel status-flow-placeholder">
      <div class="status-flow-placeholder__body">
        <div class="status-flow-placeholder__title">状态流转(下个版本再做)</div>
      </div>
    </el-card>

    <div class="charts-toolbar">
      <span class="section-title">统计图表</span>
      <el-button text type="primary" @click="fetchOverview">刷新</el-button>
    </div>

    <div class="charts-row">
      <el-card class="chart-panel" shadow="never">
        <div class="chart-title">物资 / 非物资占比</div>
        <div ref="lineTypeChartEl" class="chart" />
      </el-card>
      <el-card class="chart-panel" shadow="never">
        <div class="chart-title">各组织计划数(Top12)</div>
        <div ref="orgChartEl" class="chart" />
      </el-card>
    </div>

    <el-card class="chart-panel chart-panel--wide" shadow="never">
      <div class="chart-title">近 6 个月物资 / 非物资</div>
      <div ref="trendChartEl" class="chart chart--wide" />
    </el-card>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import * as echarts from 'echarts'
import http from '../api/http'

const lineTypeChartEl = ref(null)
const orgChartEl = ref(null)
const trendChartEl = ref(null)

const lineTypeChart = shallowRef(null)
const orgChart = shallowRef(null)
const trendChart = shallowRef(null)

const lineTypeStats = ref({
  material: 0,
  nonMaterial: 0,
})
const monthLineTypeStats = ref([])
const orgStats = ref([])

function initChart(el) {
  if (!el) return null
  const existing = echarts.getInstanceByDom(el)
  if (existing) return existing
  return echarts.init(el)
}

function renderLineTypeChart() {
  const el = lineTypeChartEl.value
  if (!el) return
  const chart = initChart(el)
  lineTypeChart.value = chart
  const s = lineTypeStats.value
  const pieData = [
    { name: '物资', value: s.material },
    { name: '非物资', value: s.nonMaterial },
  ].filter((d) => d.value > 0)
  const sum = pieData.reduce((a, b) => a + b.value, 0)

  if (sum === 0) {
    chart.clear()
    chart.setOption({
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 400 },
      },
    })
    return
  }

  chart.setOption(
    {
      tooltip: { trigger: 'item', formatter: '{b}: {c} 条 ({d}%)' },
      legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 12 } },
      color: ['#3b82f6', '#f59e0b'],
      series: [
        {
          name: '计划条目',
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: '#fff' },
          label: { show: true, formatter: '{b}\n{c}' },
          data: pieData,
        },
      ],
    },
    { notMerge: true },
  )
}

const ORG_BAR_COLORS = [
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#ca8a04',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#64748b',
  '#06b6d4',
]

function renderOrgChart() {
  const el = orgChartEl.value
  if (!el) return
  const chart = initChart(el)
  orgChart.value = chart
  const slice = orgStats.value.slice(0, 12)
  if (!slice.length) {
    chart.clear()
    chart.setOption({
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 400 },
      },
    })
    return
  }

  const names = slice.map((o) => o.orgName)
  const counts = slice.map((o) => o.count)
  const barData = counts.map((value, i) => ({
    value,
    itemStyle: {
      color: ORG_BAR_COLORS[i % ORG_BAR_COLORS.length],
      borderRadius: [0, 4, 4, 0],
    },
  }))

  chart.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 12, right: 24, top: 16, bottom: 12, containLabel: true },
      xAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } } },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: { width: 100, overflow: 'truncate', ellipsis: '…' },
        inverse: true,
      },
      series: [
        {
          name: '计划数',
          type: 'bar',
          data: barData,
          barMaxWidth: 22,
        },
      ],
    },
    { notMerge: true },
  )
}

function renderTrendChart() {
  const el = trendChartEl.value
  if (!el) return
  const chart = initChart(el)
  trendChart.value = chart
  const rows = monthLineTypeStats.value
  const xData = rows.map((i) => i.month)
  const materialData = rows.map((i) => i.material)
  const nonMaterialData = rows.map((i) => i.nonMaterial)

  if (!xData.length) {
    chart.clear()
    chart.setOption({
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 400 },
      },
    })
    return
  }

  chart.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['物资', '非物资'],
        bottom: 4,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 12 },
      },
      grid: { left: 48, right: 16, top: 20, bottom: 44, containLabel: false },
      xAxis: {
        type: 'category',
        data: xData,
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } },
      },
      color: ['#3b82f6', '#f59e0b'],
      series: [
        {
          name: '物资',
          type: 'bar',
          data: materialData,
          barMaxWidth: 28,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
        {
          name: '非物资',
          type: 'bar',
          data: nonMaterialData,
          barMaxWidth: 28,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    },
    { notMerge: true },
  )
}

function renderAllCharts() {
  renderLineTypeChart()
  renderOrgChart()
  renderTrendChart()
  nextTick(() => {
    lineTypeChart.value?.resize()
    orgChart.value?.resize()
    trendChart.value?.resize()
  })
}

const fetchOverview = async () => {
  const res = await http.get('/home/overview')
  const payload = res?.data?.data || {}
  const lt = payload.lineTypeStats
  lineTypeStats.value = {
    material: Number(lt?.material ?? 0),
    nonMaterial: Number(lt?.nonMaterial ?? 0),
  }
  monthLineTypeStats.value = Array.isArray(payload.monthLineTypeStats)
    ? payload.monthLineTypeStats.map((row) => ({
        month: row.month,
        material: Number(row.material ?? 0),
        nonMaterial: Number(row.nonMaterial ?? 0),
      }))
    : []
  orgStats.value = payload.orgStats || []
  await nextTick()
  renderAllCharts()
}

function handleResize() {
  lineTypeChart.value?.resize()
  orgChart.value?.resize()
  trendChart.value?.resize()
}

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await fetchOverview()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineTypeChart.value?.dispose()
  orgChart.value?.dispose()
  trendChart.value?.dispose()
  lineTypeChart.value = null
  orgChart.value = null
  trendChart.value = null
})
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chart-panel {
  border-radius: 8px;
  background: var(--card-surface) !important;
  border-color: var(--border) !important;
}
.status-flow-placeholder__body {
  padding: 20px 16px;
  text-align: center;
}
.status-flow-placeholder__title {
  color: var(--text);
  font-weight: 600;
  font-size: 15px;
}
.section-title {
  color: var(--text);
  font-weight: 700;
}
.charts-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.charts-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.chart-title {
  color: var(--text);
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}
.chart {
  width: 100%;
  height: 280px;
}
.chart--wide {
  height: 300px;
}
@media (max-width: 960px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
