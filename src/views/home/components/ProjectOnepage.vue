<!--
  项目详情正文区块（由 ProjectHome 引用）
  作用：展示「项目概览」与「风险评估」两块卡片及字段（侧栏 projectDetail 优先，其次 mock/BY_ID）。
  修改表格字段、进度条、风险文案样式请改本文件。
-->
<template>
  <!-- Figma 1:8824 项目二级页：项目概览 + 风险评估 -->
  <div class="project-onepage">
    <!-- 项目概览 -->
    <section class="project-section" aria-labelledby="project-overview-title">
      <div class="section-head">
        <h2 id="project-overview-title" class="section-title">项目概览</h2>
        <img class="section-underline" :src="iconOnepageUnderline" alt="" />
      </div>
      <div class="project-card">
        <div class="project-card-inner">
          <!-- 第1行：申报方式 | 综合授信额度(敞口+缓释) | 敞口额度 | 缓释额度 -->
          <div class="overview-row overview-row--1">
            <div v-for="f in projectOverview.row1" :key="f.label" class="field-block">
              <span class="field-label">{{ f.label }}</span>
              <span class="field-value">{{ f.value }}</span>
            </div>
          </div>
          <!-- 第2行：担保方式 | 授信期限 | 授信方式（与第1行第2/3/4列网格左对齐；第4列留空） -->
          <div class="overview-row overview-row--2">
            <div v-for="f in projectOverview.row2" :key="f.label" class="field-block">
              <span class="field-label">{{ f.label }}</span>
              <span class="field-value">{{ f.value }}</span>
            </div>
          </div>
          <!-- 第3行：管理要求（多行文本） -->
          <div class="overview-row overview-row--full">
            <div class="field-block field-block--multiline">
              <span class="field-label">{{ projectOverview.managementLabel }}</span>
              <div class="field-value--multiline">
                <p v-for="(line, i) in projectOverview.managementLines" :key="i">{{ line }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 风险评估 -->
    <section class="project-section" aria-labelledby="project-risk-title">
      <div class="section-head section-head--risk">
        <div class="section-title-row">
          <h2 id="project-risk-title" class="section-title">风险评估</h2>
          <span class="section-hint">（仅供参考）</span>
        </div>
        <img class="section-underline" :src="iconOnepageUnderline" alt="" />
      </div>
      <div class="project-card project-card--risk">
        <div class="project-card-inner">
          <!-- 第1行：风险等级 | 尽调进度(%)+进度条 | 资产负债率(%)+进度条 -->
          <div class="risk-row risk-row--top">
            <!-- 风险等级 -->
            <div class="field-block field-block--risk-level">
              <span class="field-label">{{ riskAssessment.riskLevel.label }}</span>
              <span class="field-value field-value--level">{{ riskAssessment.riskLevel.value }}</span>
            </div>
            <!-- 尽调进度（与项目概览第 2 列对齐；百分比在进度条右侧） -->
            <div class="field-block field-block--progress">
              <span class="field-label">{{ riskAssessment.dueDiligence.label }}</span>
              <div class="progress-line">
                <div class="progress-track">
                  <div
                    class="progress-fill progress-fill--blue"
                    :style="{ width: riskAssessment.dueDiligence.percent }"
                  />
                </div>
                <span class="field-value field-value--percent">{{ riskAssessment.dueDiligence.percent }}</span>
              </div>
            </div>
            <!-- 资产负债率（跨 3–4 列，与尽调进度同为 220px 进度条宽度） -->
            <div class="field-block field-block--progress field-block--risk-asset">
              <span class="field-label">{{ riskAssessment.assetLiability.label }}</span>
              <div class="progress-line">
                <div class="progress-track">
                  <div
                    class="progress-fill progress-fill--cyan"
                    :style="{ width: riskAssessment.assetLiability.percent }"
                  />
                </div>
                <span class="field-value field-value--percent">{{ riskAssessment.assetLiability.percent }}</span>
              </div>
            </div>
          </div>
          <!-- 第2行：风险提示（多行文本） -->
          <div class="risk-row risk-row--full">
            <div class="field-block field-block--multiline">
              <span class="field-label">{{ riskAssessment.riskHint.label }}</span>
              <div class="field-value--multiline">
                <p v-for="(line, i) in riskAssessment.riskHint.lines" :key="i">{{ line }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import { trackProjectNodeForDisplay, type CustomerTreeItem } from '@/views/home/mock/customerTree'
import { resolveProjectOverview, resolveProjectRisk } from '@/views/home/mock/projectViewData'
import iconOnepageUnderline from '@/assets/images/home/icon-onepage-underline.svg'

const props = defineProps<{
  /** 由 ProjectHome 传入（路由 props），优先于 useRoute 避免返回后无 projectId */
  projectId?: string
}>()

const route = useRoute()

const findProjectNode = inject<(id: string) => CustomerTreeItem | null>('findProjectNode', () => null)

const resolvedProjectId = computed(() => {
  const fromProp = props.projectId?.trim()
  if (fromProp) return fromProp
  const p = route.params.projectId
  if (Array.isArray(p)) return p[0] ?? ''
  return typeof p === 'string' ? p : ''
})

const projectOverview = computed(() => {
  const id = resolvedProjectId.value || undefined
  const node = id ? findProjectNode(id) : null
  trackProjectNodeForDisplay(node)
  return resolveProjectOverview(id, node)
})

const riskAssessment = computed(() => {
  const id = resolvedProjectId.value || undefined
  const node = id ? findProjectNode(id) : null
  trackProjectNodeForDisplay(node)
  return resolveProjectRisk(id, node)
})
</script>

<style scoped>
/* ===== 整体容器 ===== */
.project-onepage {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.project-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

/* ===== 标题区 ===== */
.section-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.section-title-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #2036ca;
  letter-spacing: 0.4px;
  line-height: normal;
}

.section-hint {
  font-size: 14px;
  font-weight: 400;
  color: #2036ca;
  letter-spacing: 0.28px;
  line-height: normal;
}

.section-underline {
  width: 55px;
  height: 6px;
  object-fit: contain;
  object-position: left center;
  margin-top: 2px;
}

/* ===== 卡片 ===== */
.project-card {
  width: 100%;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 3px 10px 0 rgba(36, 31, 164, 0.1);
}

.project-card-inner {
  padding: 20px 48px 20px;
  box-sizing: border-box;
}

/* ===== 项目概览：两行共用同一套列宽，保证纵向对齐 ===== */
.overview-row {
  display: grid;
  padding: 6px 0;
  box-sizing: border-box;
  justify-content: start;
  column-gap: 66px;
  row-gap: 12px;
}

.overview-row--1 {
  grid-template-columns: repeat(4, 1fr);
  padding-bottom: 25px;
}

.overview-row--2 {
  /* 与第 1 行相同四列：第 2 列=授信期限对齐「综合授信额度」；第 3 列=授信方式对齐「敞口额度」 */
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(1, 1fr);
  row-gap: 14px;
  padding-bottom: 25px;
}

.overview-row--full {
  grid-template-columns: 1fr;
  row-gap: 0;
  padding-top: 0;
}

/* ===== 风险评估行 ===== */
.risk-row {
  display: grid;
  padding: 10px 0;
  box-sizing: border-box;
  align-items: start;
}

.risk-row--top {
  /* 与项目概览：风险等级/尽调进度/资产负债率 与 第1/2/3列对齐，第4列空 */
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(1, 1fr);
  column-gap: 66px;
  row-gap: 12px;
  padding-bottom: 25px;
}

.risk-row--full {
  grid-template-columns: 1fr;
  row-gap: 0;
  padding-top: 0;
}

/* ===== 字段块 ===== */
.field-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  min-width: 0;
}

.field-label {
  font-size: 16px;
  font-weight: 400;
  color: #a6a6a6;
  letter-spacing: 0.32px;
  line-height: normal;
  white-space: nowrap;
}

.field-value {
  font-size: 16px;
  font-weight: 500;
  color: #21243d;
  letter-spacing: 0.32px;
  line-height: normal;
  margin-top: 12px;
  white-space: nowrap;
}

.field-value--percent {
  margin-top: 0;
}

/* ===== 多行文本字段 ===== */
.field-block--multiline {
  width: 100%;
}

.field-block--progress {
  min-width: 0;
}

/* 第 3 列仅 165px，220px 进度条需占用第 4 列剩余宽 */
.field-block--risk-asset {
  grid-column: 3 / 5;
}

.field-value--multiline {
  font-size: 16px;
  font-weight: 500;
  color: #21243d;
  letter-spacing: 0.32px;
  line-height: normal;
  margin-top: 12px;
}

.field-value--multiline p {
  margin: 0 0 0.35em;
}

.field-value--multiline p:last-child {
  margin-bottom: 0;
}

/* ===== 风险评估：进度条 + 百分比（紧挨，百分比在右侧） ===== */
.progress-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  width: 100%;
  min-width: 0;
}

.progress-line .field-value {
  flex-shrink: 0;
}

.progress-track {
  position: relative;
  width: 220px;
  flex-shrink: 0;
  height: 10px;
  border-radius: 100px;
  background: #d9d8d8;
  overflow: hidden;
  box-sizing: border-box;
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 100px;
}

.progress-fill--blue {
  background: linear-gradient(90deg, #34a5e1 0%, #2036ca 100%);
}

.progress-fill--cyan {
  background: linear-gradient(90deg, #5fc7ff 0%, #2036ca 100%);
}

/* ===== 响应式：窄屏自动折行 ===== */
@media (max-width: 1200px) {
  .overview-row--1 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 20px;
  }

  .overview-row--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 20px;
  }

  .risk-row--top {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 20px;
    gap: 0 32px;
  }

  .field-block--risk-asset {
    grid-column: auto;
  }

  .progress-track {
    width: 220px;
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .overview-row--1,
  .overview-row--2,
  .risk-row--top {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 16px;
  }

  .field-block--risk-asset {
    grid-column: auto;
  }

  .overview-row--1 .field-value,
  .overview-row--2 .field-value {
    white-space: normal;
  }

  .progress-line {
    flex-wrap: wrap;
    gap: 8px;
  }

  .progress-track {
    width: min(220px, 100%);
  }
}
</style>
