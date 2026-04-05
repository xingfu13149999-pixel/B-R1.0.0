<!--
  访谈记录列表 — 对齐 Figma「访谈记录一」1:13653：416×90、描边 #4457d7、标题 #4557d3、右侧蓝色「⋯」+ 22×22 状态。
-->
<template>
  <section class="figma-interview-records" aria-labelledby="figma-interview-records-title">
    <header class="figma-interview-records__head">
      <h2 id="figma-interview-records-title" class="figma-interview-records__title">访谈记录</h2>
      <div class="figma-interview-records__title-line" aria-hidden="true" />
    </header>

    <div v-if="!pid" class="figma-interview-records__hint">未选择项目。</div>

    <div v-else-if="records.length === 0" class="figma-interview-records__hint">
      暂无访谈记录。请在侧栏进入「开始访谈」，点击「开始录音」后记录将立即出现在此列表。
    </div>

    <div v-else class="figma-interview-records__list">
      <article
        v-for="r in records"
        :key="r.id"
        class="interview-card interview-card--clickable"
        :class="{
          'interview-card--selected': r.id === selectedRecordId,
          'interview-card--recording': isRecording(r),
          'interview-card--done': !isRecording(r),
        }"
        role="button"
        tabindex="0"
        @click="onSelect(r)"
        @dblclick.prevent="openRecord(r)"
        @keydown.enter.prevent="onSelect(r)"
        @keydown.space.prevent="onSelect(r)"
      >
        <div class="interview-card__thumb" :class="{ 'interview-card__thumb--recording': isRecording(r) }">
          <img class="interview-card__thumb-img" :src="thumbArt" alt="" width="54" height="46" />
        </div>
        <div class="interview-card__body">
          <h3 class="interview-card__title">{{ r.title }}</h3>
          <div class="interview-card__meta">
            <span class="interview-card__time">创建时间：{{ formatCreatedClock(r.createdAt) }}</span>
            <span class="interview-card__divider" aria-hidden="true" />
            <span
              v-if="isRecording(r)"
              class="interview-card__duration interview-card__duration--live"
            >持续时间：录音中</span>
            <span v-else class="interview-card__duration">持续时间：{{ formatDurationFigma(r.durationMs) }}</span>
          </div>
        </div>
        <div class="interview-card__tail" @click.stop>
          <el-dropdown
            trigger="click"
            placement="bottom-end"
            popper-class="figma-interview-more-popper"
            :disabled="resummarizingId === r.id"
            @command="cmd => onCardCommand(cmd, r)"
          >
            <button
              type="button"
              class="interview-card__more"
              :aria-label="'更多操作：' + r.title"
              :aria-busy="resummarizingId === r.id"
            >
              <span class="interview-card__more-dots" aria-hidden="true">
                <span class="interview-card__dot" />
                <span class="interview-card__dot" />
                <span class="interview-card__dot" />
              </span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="resummarize" :disabled="resummarizingId === r.id">
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
          <div class="interview-card__status" aria-hidden="true">
            <img
              v-if="isRecording(r)"
              class="interview-card__status-img interview-card__status-img--spin"
              :src="iconListRecording"
              width="22"
              height="22"
              alt=""
            />
            <img
              v-else
              class="interview-card__status-img"
              :src="iconListDone"
              width="22"
              height="22"
              alt=""
            />
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import recordThumb from '@/assets/images/interview/record-start-btn.svg'
import iconListRecording from '@/assets/images/interview/ir-list-status-recording.svg'
import iconListDone from '@/assets/images/interview/ir-list-status-completed.svg'
import iconMenuResummarize from '@/assets/images/interview/ir-menu-resummarize.svg'
import iconMenuDelete from '@/assets/images/interview/ir-menu-delete.svg'
import {
  deleteProjectInterviewRecord,
  getProjectInterviewRecords,
  updateProjectInterviewRecord,
  type ProjectInterviewRecord
} from '@/views/home/utils/interviewRecordsStorage'
import { clearInterviewSessionCachesForProject } from '@/views/home/utils/interviewSessionCache'
import { fetchInterviewSummaryBlocksFromSegments } from '@/views/home/utils/interviewSummaryFromSegments'

const props = defineProps<{
  projectId: string
  /** 与右栏联动，由父级 v-model */
  selectedRecordId?: string | null
}>()

const emit = defineEmits<{
  'update:selectedRecordId': [id: string | null]
}>()

const router = useRouter()
const appStore = useAppStore()
const thumbArt = recordThumb

const pid = computed(() => props.projectId?.trim() ?? '')

const records = ref<ProjectInterviewRecord[]>([])

/** 正在重新总结的记录 id（列表内触发） */
const resummarizingId = ref<string | null>(null)

function load() {
  const id = pid.value
  records.value = id ? getProjectInterviewRecords(id) : []
}

function syncSelection() {
  const list = records.value
  if (!list.length) {
    emit('update:selectedRecordId', null)
    return
  }
  const cur = props.selectedRecordId
  if (cur && list.some(r => r.id === cur)) return
  const first = list[0]
  if (first) emit('update:selectedRecordId', first.id)
}

function onSelect(r: ProjectInterviewRecord) {
  emit('update:selectedRecordId', r.id)
}

function openRecord(r: ProjectInterviewRecord) {
  const id = pid.value
  if (!id) return
  router.push({
    name: 'Interview',
    query: { nodeId: id, recordId: r.id }
  })
}

function onCardCommand(cmd: string | number, r: ProjectInterviewRecord) {
  const c = String(cmd)
  if (c === 'resummarize') void onResummarizeFromList(r)
  else if (c === 'delete') void confirmDelete(r)
}

async function onResummarizeFromList(r: ProjectInterviewRecord) {
  const projectId = pid.value
  if (!projectId) return
  if (isRecording(r)) {
    ElMessage.warning('该条录音尚未结束，请先在访谈页结束录音后再重新总结')
    return
  }
  if (!r.segments?.length) {
    ElMessage.warning('暂无访谈字幕，无法重新总结')
    return
  }
  resummarizingId.value = r.id
  try {
    const blocks = await fetchInterviewSummaryBlocksFromSegments(r.segments)
    if (!blocks.length) {
      ElMessage.warning('未生成总结内容，请检查网络或 API 配置')
      return
    }
    updateProjectInterviewRecord(projectId, r.id, {
      summaryBlocks: blocks,
      summarizerName: appStore.currentUser.name,
      summaryGeneratedAt: Date.now()
    })
    window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId } }))
    ElMessage.success('已重新生成总结')
  } catch (e) {
    console.error(e)
    ElMessage.error('重新总结失败，请稍后重试')
  } finally {
    resummarizingId.value = null
  }
}

async function confirmDelete(r: ProjectInterviewRecord) {
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
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch {
    return
  }
  const projectId = pid.value
  if (!projectId) return
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
  load()
  syncSelection()
}

function onInterviewSaved(ev: Event) {
  const d = (ev as CustomEvent<{ projectId?: string }>).detail
  if (d?.projectId && d.projectId === pid.value) load()
}

watch(
  () => props.projectId,
  () => {
    load()
    syncSelection()
  },
  { immediate: true }
)

watch(
  records,
  () => syncSelection(),
  { deep: true }
)

onMounted(() => {
  window.addEventListener('pd-interview-record-saved', onInterviewSaved as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('pd-interview-record-saved', onInterviewSaved as EventListener)
})

function formatCreatedClock(ts: number) {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 与 Figma「加载中」一致：开始录音后未结束 */
function isRecording(r: ProjectInterviewRecord) {
  return r.status === 'recording'
}

function formatDurationFigma(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) {
    return `${h}h${String(m).padStart(2, '0')} ${String(s).padStart(2, '0')} `
  }
  return `${m}'${String(s).padStart(2, '0')}"`
}
</script>

<style scoped>
.figma-interview-records {
  width: 100%;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  scroll-margin-top: 12px;
}

.figma-interview-records__head {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.figma-interview-records__title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.448;
  letter-spacing: 0.02em;
  color: #2036ca;
  font-family: 'OPPOSans', 'Source Han Sans CN', system-ui, sans-serif;
}

.figma-interview-records__title-line {
  width: 73px;
  height: 6px;
  margin-top: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, #2036ca 0%, rgba(32, 54, 202, 0) 100%);
}

.figma-interview-records__hint {
  padding: 20px 16px;
  font-size: 14px;
  font-weight: 300;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: #a6a6a6;
  background: #fff;
  border-radius: 6px;
  box-sizing: border-box;
}

.figma-interview-records__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
}

/* 默认浅灰描边；选中态为 Figma 蓝 #4457d7 */
.interview-card {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  max-width: 416px;
  min-height: 90px;
  padding: 0 19px 0 18px;
  background: #fff;
  border-radius: 6px;
  border: 1.2px solid #e8ecf4;
  box-shadow: 0 1px 2px rgba(32, 54, 202, 0.05);
  transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.interview-card--recording {
  background: #fffdfb;
  border-color: #e8ecf4;
  box-shadow: 0 1px 2px rgba(32, 54, 202, 0.05);
}

.interview-card--selected {
  border-color: #4457d7;
  box-shadow: 0 4px 14px rgba(32, 54, 202, 0.18);
}

.interview-card--recording.interview-card--selected {
  border-color: #4457d7;
  box-shadow: 0 4px 14px rgba(32, 54, 202, 0.12);
}

.interview-card--clickable {
  cursor: pointer;
  outline: none;
}

.interview-card--clickable:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.interview-card--clickable:not(.interview-card--selected):hover {
  border-color: #dce3ef;
}

.interview-card--selected:hover {
  box-shadow: 0 4px 16px rgba(32, 54, 202, 0.2);
}

.interview-card--clickable:focus-visible {
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #2036ca;
}

.interview-card--clickable:active {
  transform: scale(0.998);
}

.interview-card__thumb {
  flex-shrink: 0;
  width: 54px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  border-radius: 8px;
  background: linear-gradient(145deg, #eef2ff 0%, #e8edff 100%);
}

.interview-card__thumb--recording {
  background: linear-gradient(145deg, #fff5e8 0%, #ffefce 100%);
}

.interview-card__thumb-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
}

.interview-card__body {
  flex: 1;
  min-width: 0;
  padding: 18px 8px 16px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

/* Figma 1:13669：标题 #4557d3，16px */
.interview-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.448;
  letter-spacing: 0.02em;
  color: #4557d3;
  font-family: 'OPPOSans', 'Source Han Sans CN', system-ui, sans-serif;
}

.interview-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 200;
  line-height: 1.448;
  letter-spacing: 0.02em;
  color: #a6a6a6;
  font-family: 'OPPO Sans', sans-serif;
}

.interview-card__time,
.interview-card__duration {
  white-space: nowrap;
}

.interview-card__time {
  font-weight: 100;
}

.interview-card__divider {
  width: 1px;
  height: 16px;
  flex-shrink: 0;
  background: #cedbfa;
}

.interview-card--recording .interview-card__divider {
  background: rgba(237, 157, 72, 0.35);
}

.interview-card__duration--live {
  color: #c9762e;
  font-weight: 500;
}

/* Figma：「交互」26×16 区域，蓝底圆角 3px，白点 18×4；其下 12px 为 22×22 勾选 */
.interview-card__tail {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.interview-card__more {
  flex-shrink: 0;
  box-sizing: border-box;
  width: 26px;
  height: 16px;
  padding: 6px 4px;
  border: none;
  border-radius: 3px;
  background: #4557d3;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.interview-card__more:hover {
  background: #3a4abf;
}

.interview-card__more[aria-busy='true'] {
  opacity: 0.65;
  pointer-events: none;
}

.interview-card__more-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 18px;
  height: 4px;
}

.interview-card__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
  flex-shrink: 0;
}

.interview-card__status {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.interview-card__status-img {
  display: block;
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.interview-card__status-img--spin {
  animation: ir-rec-pulse 1.2s ease-in-out infinite;
}

@keyframes ir-rec-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
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

@media (max-width: 1100px) {
  .interview-card {
    max-width: 100%;
  }

  .interview-card__meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .interview-card__divider {
    display: none;
  }
}
</style>
