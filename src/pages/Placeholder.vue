<template>
  <div class="placeholder">
    <el-card class="placeholder-card" shadow="never">
      <template #header>
        <div class="card-title">页面占位</div>
      </template>
      <div class="card-body">该模块尚未实现，后续按 `flow/demo.md` 继续生成。</div>
    </el-card>
  </div>
</template>

<script setup>
// 占位页：只用于保证路由结构可跑通
</script>

<style scoped>
.placeholder {
  padding: 20px;
}

.placeholder-card {
  border-color: var(--border) !important;
  background: var(--card-surface) !important;
}

.placeholder-card :deep(.el-card__header) {
  background: transparent !important;
  border-bottom: 1px solid var(--border) !important;
}

.placeholder-card :deep(.el-card__body) {
  background: transparent !important;
}

.card-title {
  color: var(--text);
  font-weight: 600;
}

.card-body {
  color: var(--text);
  opacity: 0.8;
}
</style>

