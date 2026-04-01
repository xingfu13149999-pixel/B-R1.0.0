<template>
  <div class="home-page">
    <div class="content-panel">
      <!-- Figma 1:9325 项目页头部：项目名称 + 指标 + 访谈/授信 -->
      <div class="content-header">
        <div class="company-header company-header--project">
          <div class="company-icon">
            <img class="company-logo-img" :src="companyLogo" alt="" />
          </div>
          <div class="company-info">
            <h1 class="company-name">{{ projectTitle }}</h1>
            <div class="company-metrics">
              <span class="metric"
                ><em class="metric-label">授信总额</em><em class="metric-value">1.2亿</em></span
              >
              <span class="metric"
                ><em class="metric-label">敞口额度</em><em class="metric-value">0.5亿</em></span
              >
              <span class="metric"
                ><em class="metric-label">信用评级</em><em class="metric-value">A</em></span
              >
              <span class="metric"
                ><em class="metric-label">担保方式</em
                ><em class="metric-value metric-value--green">保证担保</em></span
              >
            </div>
          </div>
          <div class="project-header-actions">
            <button type="button" class="project-action-btn project-action-btn--outline">访谈记录</button>
            <button type="button" class="project-action-btn project-action-btn--solid">授信报告</button>
          </div>
        </div>
      </div>

      <!-- Figma 1:9324 区域：头部与主内容分隔；无客户首页「一页纸 / 公司资料」分栏 -->
      <div class="content-header-divider content-header-divider--project" />

      <!-- Figma 内容区 p-[10px]、全宽单列：项目概览 + 风险评估（见 ProjectOnepage） -->
      <div class="project-main">
        <ProjectOnepage />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import ProjectOnepage from './components/ProjectOnepage.vue'
import companyLogo from '@/assets/images/home/company-logo.png'

const route = useRoute()
/** 由 AdminLayout 根据左侧树数据解析，与路由 projectId 解耦 */
const findCustomerName = inject<(id: string) => string>('findCustomerName', () => '')
const projectTitle = computed(() => {
  const id = route.params.projectId as string | undefined
  if (!id) return '项目详情'
  const name = findCustomerName(id)
  return name || '项目详情'
})
</script>

<style scoped>
/* Figma 1:8824 项目二级页：顶栏 + 全宽滚动主内容，无「一页纸 / 公司资料」侧栏 */
/* https://www.figma.com/design/4JIDtt55wvWXtsAX8nrBC5/%E6%B5%A6%E7%94%B5?node-id=1-8824 */

.home-page {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: transparent;
  padding: 13px 30px 30px 12px;
}

.content-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  min-height: 0;
  max-height: 100%;
  box-sizing: border-box;
  padding: 20px 24px;
  overflow: hidden;
  background: linear-gradient(180deg, #eef2ff 0%, #f5f7ff 40%, #f5f7ff 30%);
  border-radius: 10px;
  box-shadow: 0 0 20px hwb(226 28% 19% / 0.15);
}

.content-header {
  flex-shrink: 0;
  margin-bottom: 0;
}

.content-header-divider {
  width: 100%;
  height: 0;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  margin: 28px 0 20px 0;
}

.content-header-divider--project {
  margin: 20px 0 16px 0;
}

.project-main {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  overflow-x: hidden;
  overflow-y: auto;
}

.company-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 0;
  min-height: 86px;
}

.company-header--project {
  flex-wrap: wrap;
  justify-content: flex-start;
}

.project-header-actions {
  display: flex;
  gap: 14px;
  flex-shrink: 0;
  margin-left: auto;
  align-items: flex-start;
  padding-top: 4px;
}

.project-action-btn {
  width: 120px;
  height: 36px;
  border-radius: 5px;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  box-sizing: border-box;
}

.project-action-btn--outline {
  border: 1px solid #2036ca;
  background: #fff;
  color: #2036ca;
}

.project-action-btn--solid {
  border: none;
  background: #2036ca;
  color: #fff;
}

.project-action-btn--outline:hover {
  background: #f5f7ff;
}

.project-action-btn--solid:hover {
  background: #1a2ba8;
}

.company-icon {
  width: 86px;
  height: 86px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8px;
  box-sizing: border-box;
}

.company-logo-img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  display: block;
}

.company-info {
  flex: 1;
  min-width: 0;
}

.company-name {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #21243d;
  line-height: 1.3;
  letter-spacing: 0.48px;
}

.company-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  padding: 10px 0 0;
  font-size: 16px;
  line-height: 1.75;
  letter-spacing: 0.32px;
}

.company-metrics .metric {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.company-metrics .metric-label {
  font-style: normal;
  color: #21243d;
}

.company-metrics .metric-value {
  font-style: normal;
  color: #2036ca;
}

.company-metrics .metric-value--green {
  color: #00baad;
}
</style>
