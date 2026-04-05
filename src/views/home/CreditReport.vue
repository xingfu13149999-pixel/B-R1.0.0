<!--
  授信报告页（路由：/project/:projectId/credit-report，name: CreditReport）
  作用：左侧目录树 + 进度条 + 右侧可编辑正文与格式工具栏；数据来自 mock/creditReportMock，支持导出见 utils/exportReport。
-->
<template>
  <!-- Figma 授信报告 https://www.figma.com/design/4JIDtt55wvWXtsAX8nrBC5?node-id=1-11998 -->
  <div class="credit-page">
    <div class="content-panel">
      <header class="credit-header">
        <!-- Figma 1:12503 / 1:12495：返回与 86px 图标区垂直居中；标题+指标与图标同列；操作按钮顶对齐 -->
        <div class="credit-header-row">
          <div class="credit-back-wrap">
            <button type="button" class="back-btn" aria-label="返回" @click="goBack">
              <img class="back-icon" :src="iconBack" alt="" width="32" height="32" />
            </button>
          </div>
          <div class="credit-heading-block">
            <div class="credit-title-icon-wrap" aria-hidden="true">
              <img class="credit-title-icon" :src="iconReportTitle" alt="" />
            </div>
            <div class="credit-heading-text">
              <h1 class="credit-title">{{ displayTitle }}</h1>
              <div class="credit-metrics">
                <span
                  v-for="(m, idx) in doc.metrics"
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
            <button type="button" class="credit-btn credit-btn--outline">
              <img class="credit-btn-icon" :src="iconUpload" alt="" width="14" height="14" />
              上报至信贷系统
            </button>
            <button type="button" class="credit-btn credit-btn--solid" @click="downloadReport">
              <img class="credit-btn-icon" :src="iconDownloadPrimary" alt="" width="15" height="14" />
              下载报告
            </button>
          </div>
        </div>
      </header>

      <div class="credit-header-divider" />

      <div class="credit-main">
        <!-- 左侧目录 -->
        <aside class="credit-toc-panel">
          <div class="toc-head">
            <span class="toc-head-title">目录</span>
          </div>
          <!-- Figma 1:12320：浅蓝底条 + 5px 灰轨 + 渐变填充 + 10px/12px 文案 -->
          <div class="toc-progress-strip">
            <span class="toc-progress-label">整体进度</span>
            <div class="toc-progress-bar-wrap" aria-hidden="true">
              <div class="toc-progress-track" />
              <div class="toc-progress-fill" :style="{ width: progressPercent + '%' }" />
            </div>
            <span class="toc-progress-num">{{ progressPercent }}%</span>
          </div>
          <nav class="toc-tree" aria-label="报告目录">
            <CreditReportTocTree
              v-for="node in doc.toc"
              :key="node.id"
              :node="node"
              :depth="0"
              :expanded="expanded"
              :active-toc-id="activeTocId"
              @toggle="toggleNode"
              @scroll="scrollToToc"
            />
          </nav>
        </aside>

        <div class="credit-toc-gutter" aria-hidden="true" />

        <!-- 右侧内容 -->
        <section class="credit-content-panel">
          <div class="content-head">
            <span class="content-head-title">内容</span>
          </div>
          <CreditReportFormatToolbar
              :format-state="currentFormatState"
              @formatted="onToolbarFormatted"
              @selection-change="onSelectionChange"
            />
          <div ref="articleRef" class="credit-article" tabindex="-1">
            <article
              v-for="sec in doc.sections"
              :id="'credit-' + sec.id"
              :key="sec.id"
              class="credit-section"
            >
              <h2
                :ref="el => (titleRefs[sec.id] = el as HTMLElement)"
                class="credit-section-title credit-section-title--editable"
                contenteditable="true"
                spellcheck="false"
                :data-section-id="sec.id"
                @input="onTitleInput(sec.id)"
                @focus="activeSectionId = sec.id"
                @selection-change="onSelectionChange"
              >{{ sectionTitles[sec.id] ?? sec.title }}</h2>
              <CreditReportSectionBody
                :ref="el => setBodyRef(sec.id, el)"
                :section-id="sec.id"
                :model-value="sectionBodies[sec.id] ?? ''"
                @update:model-value="v => (sectionBodies[sec.id] = v)"
                @focus="activeSectionId = sec.id"
                @selection-change="onSelectionChange"
              />
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance
} from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import CreditReportFormatToolbar from '@/views/home/components/CreditReportFormatToolbar.vue'
import CreditReportSectionBody from '@/views/home/components/CreditReportSectionBody.vue'
import CreditReportTocTree from '@/views/home/components/CreditReportTocItem.vue'
import { getFormatState, type FormatState } from '@/views/home/composables/useTextFormat'
import { downloadCreditReportAsWord } from '@/views/home/utils/exportReport'
import {
  getCreditReportDoc,
  tocToSectionId,
  type CreditReportTocItem
} from '@/views/home/mock/creditReportMock'
import iconBack from '@/assets/images/credit-report/icon-back.svg'
import iconUpload from '@/assets/images/credit-report/icon-upload.svg'
import iconDownloadPrimary from '@/assets/images/credit-report/icon-download-primary.svg'
import iconReportTitle from '@/assets/images/credit-report/icon-report-title.svg'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const findCustomerName = inject<(id: string) => string>('findCustomerName', () => '')

/** 与 Vue Router 对 params 的类型一致（可能为 string | string[]） */
function routeProjectId(): string {
  const p = route.params.projectId
  if (Array.isArray(p)) return p[0] ?? ''
  return typeof p === 'string' ? p : ''
}

const props = defineProps<{
  /** 路由 props: true 注入，与 params 同步 */
  projectId?: string
}>()

const projectId = computed(() => {
  const fromProp = props.projectId?.trim()
  if (fromProp) return fromProp
  return routeProjectId()
})

const doc = computed(() => getCreditReportDoc(projectId.value))

/** 与左侧树、mock 一致：优先 mock 报告名，否则回退树节点名 */
const displayTitle = computed(() => {
  const d = doc.value
  if (d.reportTitle && d.reportTitle !== '授信尽职调查报告') return d.reportTitle
  const name = findCustomerName(projectId.value)
  return name || d.reportTitle
})

const articleRef = ref<HTMLElement | null>(null)

/** 正文 HTML（可编辑；切换项目时从 mock 重置） */
const sectionBodies = ref<Record<string, string>>({})
const sectionTitles = ref<Record<string, string>>({})
const activeSectionId = ref<string>('')
const bodyRefs = ref<Record<string, InstanceType<typeof CreditReportSectionBody> | null>>({})
/** 标题元素 refs（用于同步内容） */
const titleRefs = ref<Record<string, HTMLElement | null>>({})

/** 当前格式状态，用于同步工具栏按钮 */
const currentFormatState = ref<FormatState>({
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrike: false,
  isBulletList: false,
  isNumberList: false,
  fontSize: null,
  fontFamily: null,
  foreColor: null,
  backColor: null,
  blockType: null
})

function onSelectionChange() {
  currentFormatState.value = getFormatState()
}

function onTitleInput(sectionId: string) {
  const el = titleRefs.value[sectionId]
  if (el) {
    sectionTitles.value = { ...sectionTitles.value, [sectionId]: el.textContent ?? '' }
  }
}

function setBodyRef(id: string, el: Element | ComponentPublicInstance | null) {
  if (!el) {
    delete bodyRefs.value[id]
    return
  }
  bodyRefs.value[id] = el as InstanceType<typeof CreditReportSectionBody>
}

watch(
  projectId,
  () => {
    const d = getCreditReportDoc(projectId.value)
    sectionBodies.value = Object.fromEntries(d.sections.map(s => [s.id, s.bodyHtml]))
    sectionTitles.value = Object.fromEntries(d.sections.map(s => [s.id, s.title]))
    activeSectionId.value = d.sections[0]?.id ?? ''
  },
  { immediate: true }
)

function onToolbarFormatted() {
  nextTick(() => {
    const sel = window.getSelection()
    let node: Node | null = sel?.anchorNode ?? null
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        // 检查是否是标题可编辑区域
        if (el.classList?.contains('credit-section-title--editable')) {
          const sid = el.dataset.sectionId
          if (sid) {
            sectionTitles.value = { ...sectionTitles.value, [sid]: el.textContent ?? '' }
          }
          return
        }
        // 检查是否是正文可编辑区域
        if (el.classList?.contains('credit-section-body--editable')) {
          const sid = el.dataset.sectionId
          if (sid) {
            syncSectionHtmlFromDom(sid)
          }
          return
        }
      }
      node = node.parentNode
    }
    const sid = activeSectionId.value
    if (sid) {
      syncSectionHtmlFromDom(sid)
    }
  })
}

function syncSectionHtmlFromDom(sectionId: string) {
  const comp = bodyRefs.value[sectionId]
  const root = comp?.getRoot()
  if (!root) return
  sectionBodies.value = { ...sectionBodies.value, [sectionId]: root.innerHTML }
}

function collectCurrentSections() {
  const nextBodies = { ...sectionBodies.value }
  const nextTitles = { ...sectionTitles.value }

  doc.value.sections.forEach(section => {
    const titleEl = titleRefs.value[section.id]
    const title = titleEl?.textContent?.trim()
    const root = bodyRefs.value[section.id]?.getRoot()

    if (title) nextTitles[section.id] = title
    if (root) nextBodies[section.id] = root.innerHTML
  })

  sectionBodies.value = nextBodies
  sectionTitles.value = nextTitles

  return doc.value.sections.map(section => ({
    ...section,
    title: nextTitles[section.id] || section.title,
    bodyHtml: nextBodies[section.id] ?? section.bodyHtml
  }))
}

const expanded = ref<Record<string, boolean>>({
  'toc-basic': true,
  'toc-part1': true
})

function toggleNode(node: CreditReportTocItem) {
  if (node.children?.length) {
    expanded.value = { ...expanded.value, [node.id]: !expanded.value[node.id] }
  } else {
    scrollToToc(node.id)
  }
}

const activeTocId = ref<string>('toc-cust')
let io: IntersectionObserver | null = null

const progressPercent = computed(() => {
  const n = doc.value.sections.length
  if (n === 0) return 0
  const sid = tocToSectionId[activeTocId.value]
  const idx = sid ? doc.value.sections.findIndex(s => s.id === sid) : 0
  const i = idx >= 0 ? idx : 0
  return Math.min(100, Math.round(((i + 1) / n) * 100))
})

function scrollToToc(tocId: string) {
  const sectionId = tocToSectionId[tocId]
  if (!sectionId) return
  const el = document.getElementById(`credit-${sectionId}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeTocId.value = tocId
}

function goBack() {
  const pid =
    projectId.value ||
    (typeof appStore.selectedCustomerId === 'string' ? appStore.selectedCustomerId : '') ||
    ''
  if (pid) {
    appStore.setSelectedCustomer(pid)
    /** path 导航与地址栏一致，避免部分环境下 name+params 未写入导致项目页拿不到 projectId */
    router.push({ path: `/project/${encodeURIComponent(pid)}` })
  } else {
    router.push({ name: 'Home' })
  }
}

function downloadReport() {
  try {
    const sections = collectCurrentSections()
    downloadCreditReportAsWord({
      fileName: displayTitle.value || 'credit-report',
      reportTitle: displayTitle.value || doc.value.reportTitle,
      metrics: doc.value.metrics,
      toc: doc.value.toc,
      sections,
      tocToSectionId
    })
    ElMessage.success('Download started')
  } catch {
    ElMessage.error('Download failed')
  }
}

function setupObserver() {
  io?.disconnect()
  io = new IntersectionObserver(
    entries => {
      const visible = entries
        .filter(e => e.isIntersecting && e.intersectionRatio > 0.15)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
      const top = visible[0]
      if (!top) return
      const id = top.target.id.replace(/^credit-/, '')
      const tocEntry = Object.entries(tocToSectionId).find(([, sid]) => sid === id)
      if (tocEntry) activeTocId.value = tocEntry[0]
    },
    { root: articleRef.value, threshold: [0.1, 0.25, 0.5, 0.75] }
  )
  nextTick(() => {
    doc.value.sections.forEach(sec => {
      const el = document.getElementById(`credit-${sec.id}`)
      if (el) io?.observe(el)
    })
  })
}

onMounted(() => {
  nextTick(setupObserver)
})

watch(
  () => projectId.value,
  () => nextTick(setupObserver)
)

onBeforeUnmount(() => {
  io?.disconnect()
  io = null
})
</script>

<style scoped>
/* 与 ProjectHome 外沿、内容板一致；字体继承全局 OPPO Sans（main.ts 引入 fonts.css） */
.credit-page {
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

.credit-header {
  flex-shrink: 0;
}

/* Figma 1:12495：返回(362)→ 图标(419) 间距 25px；图标 86×86；标题 24px Bold；标签行 gap 28 / 组内 gap 10 */
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

/* 与 Figma「返回箭头」一致：资源需顺时针旋转 90° 为向左 */
.back-icon {
  display: block;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  object-fit: contain;
  transform: rotate(90deg);
}

/* Figma「项目图标」1:12504：86×86 白底圆角 + 内嵌 64×58 插图 + 投影 */
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

/* Figma 1:12507 */
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
  min-width: 140px;
  padding: 0 12px;
  border-radius: 5px;
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

.credit-btn-icon {
  flex-shrink: 0;
  align-self: center;
  display: block;
  object-fit: contain;
}

.credit-btn--outline {
  border: 1px solid #2036ca;
  background: #fff;
  color: #2036ca;
}

.credit-btn--solid {
  border: none;
  background: #2036ca;
  color: #fff;
}

/* Figma 1:12508「标签」：16px / leading 1.75 / tracking 0.32；组间距 28；标签与值间距 10 */
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

.credit-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0;
}

.credit-toc-panel {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border: 1px solid #cedbfa;
  border-radius: 6px;
  box-shadow: 0 3px 10px rgba(36, 31, 164, 0.08);
  padding: 16px 14px 16px 16px;
  box-sizing: border-box;
}

/* Figma 1:12491「目录」标题 */
.toc-head {
  margin-bottom: 8px;
}

.toc-head-title {
  font-size: 18px;
  font-weight: 900;
  color: #21243d;
  letter-spacing: 0.4px;
  line-height: normal;
}

/* Figma 1:12320 整体进度条 */
.toc-progress-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding: 8px 10px;
  background: rgba(32, 54, 202, 0.08);
  border-radius: 2px;
  box-sizing: border-box;
}

.toc-progress-label {
  font-size: 10px;
  font-weight: 400;
  color: #21243d;
  line-height: 1;
  white-space: nowrap;
}

.toc-progress-bar-wrap {
  flex: 1;
  min-width: 0;
  position: relative;
  height: 5px;
}

.toc-progress-track {
  position: absolute;
  inset: 0;
  border-radius: 100px;
  background: #d9d9d9;
}

.toc-progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  border-radius: 100px;
  background: linear-gradient(90deg, #d4e5ff 0%, #667aff 100%);
  transition: width 0.25s ease;
}

.toc-progress-num {
  font-size: 12px;
  font-weight: 700;
  color: #2036ca;
  line-height: 1;
  white-space: nowrap;
}

.toc-tree {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Figma 1:12328+：一级 16 Medium / 二级 14 Regular / 三级 13 Regular */
:deep(.toc-node) {
  display: flex;
  flex-direction: column;
  gap: 0;
}

:deep(.toc-row) {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  border-radius: 4px;
  box-sizing: border-box;
}

:deep(.toc-row:hover) {
  background: rgba(32, 54, 202, 0.04);
}

:deep(.toc-row--d0) {
  min-height: 36px;
  font-size: 16px;
  font-weight: 500;
  color: #21243d;
  padding: 8px 10px;
  line-height: 1;
}

:deep(.toc-row--d0.toc-row--leaf) {
  padding-left: 26px;
}

:deep(.toc-row--d1) {
  min-height: 32px;
  font-size: 14px;
  font-weight: 400;
  color: #21243d;
  padding: 8px 10px;
  line-height: 1;
}

:deep(.toc-row--d2) {
  min-height: 32px;
  font-size: 13px;
  font-weight: 400;
  color: #21243d;
  padding: 8px 10px;
  line-height: 1;
}

:deep(.toc-text) {
  flex: 1;
  min-width: 0;
  text-align: left;
}

:deep(.toc-row--active) {
  background: rgba(32, 54, 202, 0.08);
  color: #2036ca;
  font-weight: 500;
}

:deep(.toc-row--d1.toc-row--active),
:deep(.toc-row--d2.toc-row--active) {
  font-weight: 500;
}

:deep(.toc-caret) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  flex-shrink: 0;
  font-size: 8px;
  line-height: 1;
  color: #21243d;
  transition: transform 0.15s ease;
}

:deep(.toc-caret--down) {
  transform: rotate(90deg);
}

:deep(.toc-children) {
  margin-top: 0;
  padding-left: 8px;
  margin-left: 4px;
  border-left: 1px solid #e8eaf2;
}

.credit-toc-gutter {
  width: 16px;
  flex-shrink: 0;
}

.credit-content-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #cedbfa;
  border-radius: 6px;
  box-shadow: 0 3px 10px rgba(36, 31, 164, 0.08);
  overflow: hidden;
}

.content-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
}

.content-head-title {
  font-size: 18px;
  font-weight: 900;
  color: #21243d;
  letter-spacing: 0.4px;
}

.credit-article {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px 32px;
  box-sizing: border-box;
}

.credit-article::-webkit-scrollbar {
  width: 6px;
}

.credit-article::-webkit-scrollbar-track {
  background: transparent;
}

.credit-article::-webkit-scrollbar-thumb {
  background: #c2c7e8;
  border-radius: 100px;
}

.credit-section {
  scroll-margin-top: 12px;
  margin-bottom: 28px;
}

.credit-section-title {
  margin: 0 0 10px;
  font-size: 17px;
  font-weight: 700;
  color: #2036ca;
}

.credit-section-title--editable {
  cursor: text;
  padding: 2px 4px;
  margin: -2px -4px 10px -4px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: border-color 0.15s ease;
  outline: none;
}

.credit-section-title--editable:focus {
  border-color: #CEDBFA;
  background: rgba(206, 219, 250, 0.2);
}

.credit-section-body {
  font-size: 14px;
  line-height: 25px;
  color: #21243d;
  letter-spacing: 0.28px;
}

.credit-section-body--editable {
  min-height: 1.5em;
  height: fit-content;
  width: 100%;
  box-sizing: border-box;
  cursor: text;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px;
  margin: -4px;
  transition: border-color 0.15s ease, background 0.15s ease;
  outline: none;
}

.credit-section-body--editable:focus {
  border-color: #CEDBFA;
  background: rgba(206, 219, 250, 0.1);
}

.credit-section-body :deep(p) {
  margin: 0 0 12px;
}

.credit-section-body :deep(p:last-child) {
  margin-bottom: 0;
}

.credit-section-body :deep(h3),
.credit-section-body :deep(h4) {
  margin: 0 0 12px;
  font-weight: 700;
  color: #2d3149;
  line-height: 1.45;
}

.credit-section-body :deep(h3) {
  font-size: 18px;
}

.credit-section-body :deep(h4) {
  font-size: 16px;
}
</style>
