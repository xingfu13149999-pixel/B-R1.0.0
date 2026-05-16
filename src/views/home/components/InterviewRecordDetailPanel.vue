<!--
  访谈记录页右栏：实时总结 / 思维导图 / 访谈字幕 三 Tab + 详情白卡片（Figma 1:13248 等）。
-->
<template>
  <section class="ir-detail" aria-label="访谈详情">
    <div class="ir-detail__head">
      <div class="ir-detail__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="ir-tab"
          :class="{ 'ir-tab--active': activeTab === 'summary' }"
          :aria-selected="activeTab === 'summary'"
          @click="activeTab = 'summary'"
        >
          <span class="ir-tab__svg-wrap" v-html="irTabSummarySvg" aria-hidden="true" />
          <span>实时总结</span>
        </button>
        <button
          type="button"
          role="tab"
          class="ir-tab"
          :class="{ 'ir-tab--active': activeTab === 'mindmap' }"
          :aria-selected="activeTab === 'mindmap'"
          @click="activeTab = 'mindmap'"
        >
          <span class="ir-tab__svg-wrap" v-html="irTabMindmapSvg" aria-hidden="true" />
          <span>思维导图</span>
        </button>
        <button
          type="button"
          role="tab"
          class="ir-tab"
          :class="{ 'ir-tab--active': activeTab === 'subtitles' }"
          :aria-selected="activeTab === 'subtitles'"
          @click="activeTab = 'subtitles'"
        >
          <span class="ir-tab__svg-wrap" v-html="irTabSubtitlesSvg" aria-hidden="true" />
          <span>访谈字幕</span>
        </button>
      </div>
    </div>

    <div class="ir-detail__card">
      <div v-if="!record" class="ir-detail__empty">请选择左侧一条访谈记录查看详情。</div>

      <template v-else>
        <div v-show="activeTab === 'summary'" class="ir-detail__body ir-detail__body--summary">
          <div class="ir-meta">
            <div class="ir-meta__row">
              <span class="ir-meta__label">主题：</span>
              <span class="ir-meta__value">{{ summaryTheme }}</span>
            </div>
            <div class="ir-meta__row">
              <span class="ir-meta__label">日期与时间：</span>
              <span class="ir-meta__value">{{ summaryDateTime }}</span>
            </div>
            <div class="ir-meta__row">
              <span class="ir-meta__label">地点：</span>
              <span class="ir-meta__value">{{ summaryPlace }}</span>
            </div>
            <div class="ir-meta__row">
              <span class="ir-meta__label">参与人员：</span>
              <span class="ir-meta__value">{{ summaryPeople }}</span>
            </div>
            <div class="ir-meta__row">
              <span class="ir-meta__label">录音时长：</span>
              <span class="ir-meta__value">{{ summaryDuration }}</span>
            </div>
            <div class="ir-meta__row">
              <span class="ir-meta__label">总结人：</span>
              <span class="ir-meta__value">{{ summaryAuthor }}</span>
            </div>
            <div class="ir-meta__row">
              <span class="ir-meta__label">总结日期：</span>
              <span class="ir-meta__value">{{ summaryDate }}</span>
            </div>
          </div>
          <div class="ir-divider" />
          <div class="ir-summary-embed">
            <InterviewSummaryPanel
              v-if="record"
              :key="`${record.id}-sum-${displaySegments.length}`"
              :segments="displaySegments"
              recorder-status="stopped"
              :is-viewing-history="true"
              :stored-summary-blocks="displaySummaryBlocks"
              :suppress-history-summary-request="
                record.status === 'recording' &&
                !displaySummaryBlocks?.length &&
                !displaySegments.length
              "
              :show-sync-footer="false"
            />
          </div>
        </div>

        <div v-show="activeTab === 'mindmap'" class="ir-detail__body ir-detail__body--mind">
          <div class="ir-placeholder">思维导图功能开发中。</div>
        </div>

        <div v-show="activeTab === 'subtitles'" class="ir-detail__body ir-detail__body--subs">
          <div v-if="!subtitleLines.length" class="ir-placeholder">暂无字幕内容。</div>
          <ul v-else class="ir-subs">
            <li v-for="(line, i) in subtitleLines" :key="i" class="ir-subs__item">{{ line }}</li>
          </ul>
        </div>

        <div class="ir-detail__footer">
          <button type="button" class="ir-open-btn" @click="emitOpenInterview">查看完整访谈</button>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import InterviewSummaryPanel from '@/views/home/components/InterviewSummaryPanel.vue'
import type { InterviewTranscriptSegment } from '@/views/home/composables/useInterviewTranscription'
import type { ProjectInterviewRecord } from '@/views/home/utils/interviewRecordsStorage'
import {
  readInterviewLiveSummaryFromSession,
  readInterviewTranscriptSegmentsFromSession
} from '@/views/home/utils/interviewSessionCache'
/** Tab 图标与 Figma 1:13248 头部导航一致：实时总结、思维导图、访谈字幕 */
import irTabSummarySvg from '@/assets/images/interview/ir-tab-summary.svg?raw'
import irTabMindmapSvg from '@/assets/images/interview/ir-tab-mindmap.svg?raw'
import irTabSubtitlesSvg from '@/assets/images/interview/ir-tab-subtitles.svg?raw'

const props = defineProps<{
  record: ProjectInterviewRecord | null
}>()

const emit = defineEmits<{
  openInterview: []
}>()

/** 录音未结束时，字幕/总结主要在 sessionStorage；localStorage 条目标记仍为「录音中」且 segments 常为空，详情需合并 session 避免刷新后空白 */
const sessionHydrateTick = ref(0)
function bumpSessionHydrate() {
  sessionHydrateTick.value++
}

const displaySegments = computed((): InterviewTranscriptSegment[] => {
  sessionHydrateTick.value
  const r = props.record
  if (!r) return []
  const base = r.segments ?? []
  if (r.status === 'recording') {
    const live = readInterviewTranscriptSegmentsFromSession(r.projectId)
    if (live?.length) return live
  }
  return base
})

const displaySummaryBlocks = computed(() => {
  sessionHydrateTick.value
  const r = props.record
  if (!r) return null
  if (r.summaryBlocks?.length) return r.summaryBlocks
  if (r.status === 'recording') {
    return readInterviewLiveSummaryFromSession(r.projectId)
  }
  return null
})

type TabId = 'summary' | 'mindmap' | 'subtitles'
const activeTab = ref<TabId>('summary')

watch(
  () => props.record?.id,
  () => {
    activeTab.value = 'summary'
  }
)

let sessionPollTimer: ReturnType<typeof setInterval> | null = null

watch(
  () => props.record?.status === 'recording',
  isRec => {
    if (sessionPollTimer) {
      clearInterval(sessionPollTimer)
      sessionPollTimer = null
    }
    if (isRec) {
      sessionPollTimer = setInterval(() => bumpSessionHydrate(), 1500)
    }
  },
  { immediate: true }
)

function onWindowStorage(ev: StorageEvent) {
  if (ev.storageArea !== sessionStorage) return
  const pid = props.record?.projectId?.trim()
  if (!pid || !ev.key) return
  if (!ev.key.includes(pid)) return
  bumpSessionHydrate()
}

onMounted(() => {
  window.addEventListener('pd-interview-record-saved', bumpSessionHydrate)
  window.addEventListener('storage', onWindowStorage)
})

onUnmounted(() => {
  if (sessionPollTimer) {
    clearInterval(sessionPollTimer)
    sessionPollTimer = null
  }
  window.removeEventListener('pd-interview-record-saved', bumpSessionHydrate)
  window.removeEventListener('storage', onWindowStorage)
})

function emitOpenInterview() {
  emit('openInterview')
}

const summaryTheme = computed(() => props.record?.title?.trim() || '—')

const summaryDateTime = computed(() => formatInterviewDateTime(props.record))

const summaryPlace = computed(() => props.record?.place?.trim() || '—')

const summaryPeople = computed(() => props.record?.participants?.trim() || '—')

const summaryDuration = computed(() => formatDurationCn(props.record?.durationMs ?? 0))

const summaryAuthor = computed(() => props.record?.summarizerName?.trim() || '—')

const summaryDate = computed(() =>
  formatDateOnly(props.record?.summaryGeneratedAt ?? props.record?.createdAt)
)

const subtitleLines = computed(() => {
  sessionHydrateTick.value
  const segs = displaySegments.value
  if (!segs.length) return []
  return segs.map(s => (s.text || '').trim()).filter(Boolean)
})

function formatInterviewDateTime(rec: ProjectInterviewRecord | null) {
  if (!rec?.createdAt) return '—'
  const start = new Date(rec.createdAt)
  const end = new Date(rec.createdAt + (rec.durationMs || 0))
  const y = start.getFullYear()
  const mo = start.getMonth() + 1
  const day = start.getDate()
  return `${y}年${mo}月${day}日 ${pad(start.getHours())}:${pad(start.getMinutes())}–${pad(end.getHours())}:${pad(end.getMinutes())}`
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatDateOnly(ts?: number) {
  if (!ts) return '—'
  const d = new Date(ts)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function formatDurationCn(ms: number) {
  if (ms <= 0) return '—'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (h > 0) return `${h}小时${mm}分钟`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}
</script>

<style scoped>
.ir-detail {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ir-detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.ir-detail__head .ir-detail__tabs {
  margin-bottom: 0;
}

.ir-detail__tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-shrink: 0;
  flex: 1;
  min-width: 0;
}

.ir-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 3px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  background: #fff;
  color: #21243d;
  box-shadow: 0 1px 0 rgba(230, 233, 240, 0.9);
  transition: background 0.15s ease, color 0.15s ease;
}

.ir-tab > span:not(.ir-tab__svg-wrap) {
  font-weight: 400;
}

.ir-tab:hover {
  background: #f5f7ff;
}

.ir-tab--active {
  background: #2036ca;
  color: #fff;
  box-shadow: none;
}

.ir-tab--active:hover {
  background: #1a2ba8;
  color: #fff;
}

.ir-tab__svg-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: inherit;
}

.ir-tab__svg-wrap :deep(svg) {
  width: 16px;
  height: 16px;
  display: block;
}

/* 访谈字幕为双色块：未选中深蓝底 + 白字；选中时隐藏底板仅保留白色字形 */
.ir-tab__svg-wrap :deep(.ir-tab-subtitles__plate) {
  fill: #21243d;
  stroke: #21243d;
}

.ir-tab__svg-wrap :deep(.ir-tab-subtitles__glyph) {
  fill: #fff;
}

.ir-tab--active .ir-tab__svg-wrap :deep(.ir-tab-subtitles__plate) {
  opacity: 0;
}

.ir-tab--active .ir-tab__svg-wrap :deep(.ir-tab-subtitles__glyph) {
  fill: currentColor;
}

.ir-detail__card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 6px;
  border: 1px solid rgba(32, 54, 202, 0.12);
  box-shadow: 0 2px 12px rgba(32, 54, 202, 0.06);
  padding: 30px;
  box-sizing: border-box;
}

.ir-detail__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 300;
  color: #a6a6a6;
  text-align: center;
  padding: 40px 16px;
}

.ir-detail__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.65;
  color: #21243d;
}

.ir-meta {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ir-meta__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0;
}

.ir-meta__label {
  flex-shrink: 0;
  width: 98px;
  font-weight: 500;
  color: #2036ca;
}

.ir-meta__value {
  flex: 1;
  min-width: 0;
  color: #21243d;
}

.ir-divider {
  height: 0;
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  margin: 22px 0 20px;
}

.ir-summary-embed {
  flex: 1;
  min-height: 0;
  max-height: min(480px, 50vh);
  overflow: auto;
}

.ir-summary-embed :deep(.interview-summary-panel) {
  min-height: 0;
}

.ir-placeholder {
  padding: 24px 8px;
  text-align: center;
  color: #a6a6a6;
  font-size: 14px;
}

.ir-subs {
  margin: 0;
  padding: 0 0 0 18px;
  list-style: disc;
}

.ir-subs__item {
  margin-bottom: 8px;
}

.ir-detail__footer {
  flex-shrink: 0;
  padding-top: 20px;
  margin-top: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.ir-open-btn {
  height: 36px;
  padding: 0 18px;
  border-radius: 5px;
  border: 1px solid #2036ca;
  background: #fff;
  color: #2036ca;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
}

.ir-open-btn:hover {
  background: #f5f7ff;
}
</style>
