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
      <el-dropdown
        v-if="record"
        trigger="click"
        placement="bottom-end"
        popper-class="figma-interview-more-popper"
        :disabled="resummarizing"
        @command="onDropdownCommand"
      >
        <button
          type="button"
          class="ir-more-btn"
          aria-label="更多操作"
          :aria-busy="resummarizing"
          @click.stop
        >
          <img class="ir-more-btn__img" :src="iconMore" alt="" width="18" height="18" />
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="resummarize" :disabled="resummarizing">
              <span class="figma-more-menu-row">
                <img class="figma-more-menu-row__ico" :src="iconMenuResummarize" alt="" width="24" height="24" />
                <span>重新总结</span>
              </span>
            </el-dropdown-item>
            <el-dropdown-item command="delete">
              <span class="figma-more-menu-row">
                <img class="figma-more-menu-row__ico" :src="iconMenuDelete" alt="" width="24" height="24" />
                <span>删除</span>
              </span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
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
              ref="summaryPanelRef"
              :segments="record.segments"
              recorder-status="stopped"
              :is-viewing-history="true"
              :stored-summary-blocks="record.summaryBlocks ?? null"
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
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import InterviewSummaryPanel from '@/views/home/components/InterviewSummaryPanel.vue'
import {
  deleteProjectInterviewRecord,
  updateProjectInterviewRecord,
  type ProjectInterviewRecord
} from '@/views/home/utils/interviewRecordsStorage'
import { clearInterviewSessionCachesForProject } from '@/views/home/utils/interviewSessionCache'
/** Tab 图标与 Figma 1:13248 头部导航一致：实时总结、思维导图、访谈字幕 */
import irTabSummarySvg from '@/assets/images/interview/ir-tab-summary.svg?raw'
import irTabMindmapSvg from '@/assets/images/interview/ir-tab-mindmap.svg?raw'
import irTabSubtitlesSvg from '@/assets/images/interview/ir-tab-subtitles.svg?raw'
import iconMore from '@/assets/images/interview/ir-detail-more.svg'
import iconMenuResummarize from '@/assets/images/interview/ir-menu-resummarize.svg'
import iconMenuDelete from '@/assets/images/interview/ir-menu-delete.svg'

const props = defineProps<{
  record: ProjectInterviewRecord | null
}>()

const emit = defineEmits<{
  openInterview: []
}>()

const appStore = useAppStore()

const summaryPanelRef = ref<InstanceType<typeof InterviewSummaryPanel> | null>(null)
const resummarizing = ref(false)

type TabId = 'summary' | 'mindmap' | 'subtitles'
const activeTab = ref<TabId>('summary')

watch(
  () => props.record?.id,
  () => {
    activeTab.value = 'summary'
  }
)

function emitOpenInterview() {
  emit('openInterview')
}

function isRecording(r: ProjectInterviewRecord) {
  return r.status === 'recording'
}

function onDropdownCommand(cmd: string) {
  if (cmd === 'resummarize') void onResummarize()
  else if (cmd === 'delete') void confirmDeleteRecord()
}

async function onResummarize() {
  const r = props.record
  if (!r) return
  if (isRecording(r)) {
    ElMessage.warning('该条录音尚未结束，请先在访谈页结束录音后再重新总结')
    return
  }
  if (!r.segments?.length) {
    ElMessage.warning('暂无访谈字幕，无法重新总结')
    return
  }
  resummarizing.value = true
  try {
    await summaryPanelRef.value?.regenerateHistorySummary?.()
    await summaryPanelRef.value?.waitForSummaryIdle?.(60000)
    const blocks = summaryPanelRef.value?.getSummaryBlocks?.() ?? []
    if (!blocks.length) {
      ElMessage.warning('未生成总结内容，请检查网络或 API 配置')
      summaryPanelRef.value?.endRegenerateHistory?.()
      return
    }
    updateProjectInterviewRecord(r.projectId, r.id, {
      summaryBlocks: blocks,
      summarizerName: appStore.currentUser.name,
      summaryGeneratedAt: Date.now()
    })
    window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId: r.projectId } }))
    await nextTick()
    await nextTick()
    summaryPanelRef.value?.endRegenerateHistory?.()
    ElMessage.success('已重新生成总结')
  } catch (e) {
    console.error(e)
    summaryPanelRef.value?.endRegenerateHistory?.()
    ElMessage.error('重新总结失败，请稍后重试')
  } finally {
    resummarizing.value = false
  }
}

async function confirmDeleteRecord() {
  const r = props.record
  if (!r) return
  if (isRecording(r)) {
    ElMessage.warning('该条录音尚未结束，请先在访谈页结束录音后再删除')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确定删除该条访谈记录？删除后将清除该项目下本地缓存的实时总结、字幕与关键热词。',
      '删除访谈记录',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  const projectId = r.projectId
  if (!deleteProjectInterviewRecord(projectId, r.id)) {
    ElMessage.error('删除失败')
    return
  }
  clearInterviewSessionCachesForProject(projectId)
  window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId } }))
  window.dispatchEvent(
    new CustomEvent('pd-interview-session-cache-cleared', { detail: { projectId } })
  )
  ElMessage.success('已删除')
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
  const r = props.record
  if (!r?.segments?.length) return []
  return r.segments
    .map(s => (s.text || '').trim())
    .filter(Boolean)
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
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.ir-detail__head .ir-detail__tabs {
  margin-bottom: 0;
}

.ir-more-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease;
}

.ir-more-btn:hover {
  background: rgba(32, 54, 202, 0.08);
}

.ir-more-btn[aria-busy='true'] {
  opacity: 0.55;
  pointer-events: none;
}

.ir-more-btn__img {
  display: block;
  opacity: 0.85;
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

.figma-more-menu-row {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.figma-more-menu-row__ico {
  flex-shrink: 0;
  display: block;
  width: 24px;
  height: 24px;
  object-fit: contain;
}
</style>
