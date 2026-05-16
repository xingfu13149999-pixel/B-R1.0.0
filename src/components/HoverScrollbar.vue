<template>
  <el-scrollbar class="hover-scrollbar">
    <slot />
  </el-scrollbar>
</template>

<style scoped>
.hover-scrollbar {
  width: 100%;
  height: 100%;
}

.hover-scrollbar :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
  scrollbar-width: none;
}

.hover-scrollbar :deep(.el-scrollbar__wrap::-webkit-scrollbar) {
  display: none;
  width: 0;
  height: 0;
}

.hover-scrollbar :deep(.el-scrollbar__bar) {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.hover-scrollbar:hover :deep(.el-scrollbar__bar),
.hover-scrollbar :deep(.el-scrollbar__bar:hover),
.hover-scrollbar :deep(.el-scrollbar__bar:active) {
  opacity: 1;
}

.hover-scrollbar :deep(.el-scrollbar__bar.is-vertical) {
  width: var(--scrollbar-size);
  right: 0;
}

.hover-scrollbar :deep(.el-scrollbar__bar.is-horizontal) {
  height: var(--scrollbar-size);
  bottom: 0;
}

.hover-scrollbar :deep(.el-scrollbar__thumb) {
  background: var(--scrollbar-thumb);
  border-radius: 100px;
}
</style>
