<!--
  访谈记录独立页（路由：/project/:projectId/interview-records，name: InterviewRecords）
  作用：在项目上下文中集中展示「访谈记录」列表（头部布局对齐授信报告：返回、标题图、指标、授信报告入口）。
  修改本页壳层与头部请改本文件；列表内容与交互见 components/ProjectInterviewRecords.vue。
-->
<template>
  <!-- 头部与授信报告 CreditReport 一致：credit-back-wrap + back-btn + back-icon（旋转） -->
  <div class="interview-records-page">
    <div class="content-panel">
      <header class="credit-header">
        <div class="credit-header-row">
          <div class="credit-back-wrap">
            <button type="button" class="back-btn" aria-label="返回" @click="goBackToProject">
              <img class="back-icon" :src="iconBack" alt="" width="32" height="32" />
            </button>
          </div>
          <div class="credit-heading-block">
            <div class="credit-title-icon-wrap" aria-hidden="true">
              <img class="credit-title-icon" :src="iconReportTitle" alt="" />
            </div>
            <div class="credit-heading-text">
              <h1 class="credit-title">{{ projectTitle }}</h1>
              <div class="credit-metrics">
                <span
                  v-for="(m, idx) in projectHeaderMetrics"
                  :key="m.label + idx"
                  class="credit-metric"
                  ><em class="credit-metric-label">{{ m.label }}</em
                  ><em
                    class="credit-metric-value"
                    :class="{ 'credit-metric-value--highlight': m.highlight }"
                    >{{ m.value }}</em
                  ></span
                >
              </div>
            </div>
          </div>
          <div class="credit-actions">
            <button type="button" class="credit-btn credit-btn--solid" @click="goCreditReport">授信报告</button>
          </div>
        </div>
      </header>

      <div class="credit-header-divider" />

      <div class="ir-main">
        <div class="ir-main__split">
          <aside class="ir-main__left">
            <ProjectInterviewRecords
              v-model:selected-record-id="selectedRecordId"
              :project-id="effectiveProjectId"
            />
          </aside>
          <div class="ir-main__right">
            <InterviewRecordDetailPanel :record="selectedRecord" @open-interview="openInterviewFromDetail" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { trackProjectNodeForDisplay, type CustomerTreeItem } from '@/views/home/mock/customerTree'
import { getProjectHeaderMetrics } from '@/views/home/mock/projectViewData'
import InterviewRecordDetailPanel from './components/InterviewRecordDetailPanel.vue'
import ProjectInterviewRecords from './components/ProjectInterviewRecords.vue'
import { getProjectInterviewRecord } from '@/views/home/utils/interviewRecordsStorage'
import iconBack from '@/assets/images/credit-report/icon-back.svg'
import iconReportTitle from '@/assets/images/credit-report/icon-report-title.svg'

const props = defineProps<{
  projectId?: string
}>()

const route = useRoute()
const router = useRouter()

const findCustomerName = inject<(id: string) => string>('findCustomerName', () => '')
const findProjectNode = inject<(id: string) => CustomerTreeItem | null>('findProjectNode', () => null)

function routeProjectId(): string {
  const p = route.params.projectId
  if (Array.isArray(p)) return p[0] ?? ''
  return typeof p === 'string' ? p : ''
}

const effectiveProjectId = computed(() => {
  const fromProp = props.projectId?.trim()
  if (fromProp) return fromProp
  return routeProjectId()
})

const projectTitle = computed(() => {
  const id = effectiveProjectId.value
  if (!id) return '项目详情'
  const name = findCustomerName(id)
  return name || '项目详情'
})

const projectHeaderMetrics = computed(() => {
  const id = effectiveProjectId.value || undefined
  const node = id ? findProjectNode(id) : null
  trackProjectNodeForDisplay(node)
  return getProjectHeaderMetrics(id, node)
})

function goBackToProject() {
  const id = effectiveProjectId.value
  if (id) {
    router.push({ name: 'HomeProject', params: { projectId: id } })
  } else {
    router.push({ name: 'Home' })
  }
}

function goCreditReport() {
  const id = effectiveProjectId.value
  if (id) {
    router.push({ name: 'CreditReport', params: { projectId: id } })
  }
}

function parseRecordIdFromQuery(): string | null {
  const q = route.query.recordId
  const val = Array.isArray(q) ? q[0] ?? '' : typeof q === 'string' ? q : ''
  return val || null
}

const selectedRecordId = ref<string | null>(parseRecordIdFromQuery())

/** localStorage 更新后 Vue 不会自动失效本 computed，需随 pd-interview-record-saved 强制重读 */
const recordRefreshKey = ref(0)

const selectedRecord = computed(() => {
  recordRefreshKey.value
  const pid = effectiveProjectId.value
  const rid = selectedRecordId.value
  if (!pid || !rid) return null
  return getProjectInterviewRecord(pid, rid)
})

function onInterviewRecordSaved(ev: Event) {
  const d = (ev as CustomEvent<{ projectId?: string }>).detail
  if (d?.projectId && d.projectId === effectiveProjectId.value) recordRefreshKey.value++
}

onMounted(() => {
  window.addEventListener('pd-interview-record-saved', onInterviewRecordSaved)
})
onUnmounted(() => {
  window.removeEventListener('pd-interview-record-saved', onInterviewRecordSaved)
})

watch(
  () => effectiveProjectId.value,
  (newPid, oldPid) => {
    if (newPid !== oldPid) selectedRecordId.value = null
  }
)

watch(
  () => selectedRecordId.value,
  rid => {
    const q = { ...route.query }
    if (rid) q.recordId = rid
    else delete q.recordId
    router.replace({ ...route, query: q })
  }
)

function openInterviewFromDetail() {
  const id = effectiveProjectId.value
  const rid = selectedRecordId.value
  if (!id || !rid) return
  router.push({ name: 'Interview', query: { nodeId: id, recordId: rid } })
}
</script>

<style scoped>
.interview-records-page {
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
  box-shadow: 0 3px 10px rgba(36, 31, 164, 0.1);
}

/* —— 以下与 CreditReport.vue 授信报告头部返回区一致 —— */
.credit-header {
  flex-shrink: 0;
}

.credit-header-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 25px;
}

.credit-back-wrap {
  flex-shrink: 0;
  width: 32px;
  height: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.credit-heading-block {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
}

.credit-heading-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 10px;
  margin-top: 7px;
}

.back-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.back-icon {
  display: block;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  object-fit: contain;
  transform: rotate(90deg);
}

.credit-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #21243d;
  letter-spacing: 0.48px;
  line-height: normal;
}

.credit-actions {
  display: flex;
  gap: 14px;
  flex-shrink: 0;
  align-self: flex-start;
  padding-top: 0;
}

.credit-btn {
  height: 36px;
  min-width: 120px;
  padding: 0 12px;
  border-radius: 3px;
  font-size: 14px;
  cursor: pointer;
  box-sizing: border-box;
  font-family: inherit;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.credit-btn--solid {
  border: none;
  background: #2036ca;
  color: #fff;
}

.credit-btn--solid:hover {
  background: #1a2ba8;
}

.credit-metrics {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-size: 16px;
  line-height: 1.75;
  letter-spacing: 0.32px;
}

.credit-metric {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.credit-metric-label {
  font-style: normal;
  color: #21243d;
}

.credit-metric-value {
  font-style: normal;
  color: #2036ca;
}

.credit-metric-value--highlight {
  color: #00baad;
}

.credit-header-divider {
  width: 100%;
  height: 0;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin: 16px 0 16px;
}

/* 与 CreditReport 授信报告 Figma「项目图标」1:12504 一致 */
.credit-title-icon-wrap {
  flex-shrink: 0;
  width: 86px;
  height: 86px;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.credit-title-icon {
  width: 64px;
  height: 58px;
  aspect-ratio: 64 / 58;
  object-fit: contain;
  object-position: center;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 2.8px rgba(0, 83, 255, 0.3));
}

.ir-main {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Figma 1:12557：左栏约 440px + 间距 + 右栏自适应；竖线见节点 1:13177「分离-横」 */
.ir-main__split {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 24px;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.ir-main__left {
  flex: 0 0 440px;
  width: 440px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  /* Figma：左栏内容区宽约 416px，竖线 1:13177 在 x≈801，列表与线之间约 23px */
  padding-right: 23px;
  /* 与 credit-header-divider 一致的浅灰竖线，画在栏宽最右侧 */
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.06);
}

.ir-main__right {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1100px) {
  .ir-main__split {
    flex-direction: column;
    overflow-y: auto;
  }

  .ir-main__left {
    flex: none;
    width: 100%;
    max-width: 100%;
    box-shadow: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    padding-right: 0;
    padding-bottom: 16px;
    margin-bottom: 8px;
  }
}
</style>
