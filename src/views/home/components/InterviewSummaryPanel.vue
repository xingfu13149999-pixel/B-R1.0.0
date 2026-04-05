<!--
  实时总结：根据访谈字幕调用 DeepSeek 生成 Markdown，解析为块并展示（对齐 ai-admin InterviewSummaryCard 三态）
-->
<template>
  <div class="interview-summary-panel">
    <div v-if="showRobotUI" class="summary-summarizing">
      <img :src="summarizingIllustration" alt="" class="summary-summarizing-img" />
      <p class="summary-summarizing-main">
        AI助手正在总结中<span class="summary-dots" aria-hidden="true"
          ><span class="summary-dot">.</span><span class="summary-dot">.</span
          ><span class="summary-dot">.</span></span
        >
      </p>
      <p class="summary-summarizing-hint">离开本页面不会中断，您可以稍后查看</p>
    </div>
    <div v-else-if="!summaryBlocks.length" class="summary-empty">
      <img :src="emptyIllustration" alt="" class="summary-empty-img" />
      <p class="summary-empty-text">暂无总结</p>
      <p v-if="showEmptyHint" class="summary-empty-hint">{{ emptyHintText }}</p>
    </div>
    <div v-else class="summary-list">
      <template v-for="(block, idx) in summaryBlocks" :key="idx">
        <h1 v-if="block.type === 'mainTitle'" class="summary-main-title">{{ block.content }}</h1>
        <h2 v-else-if="block.type === 'subTitle'" class="summary-sub-title">{{ block.content }}</h2>
        <p v-else-if="block.type === 'body'" class="summary-body">{{ block.content }}</p>
        <ul v-else-if="block.type === 'bodyBullets'" class="summary-body-bullets">
          <li v-for="(item, i) in block.items" :key="i" class="summary-bullet-item">{{ item }}</li>
        </ul>
      </template>
      <p v-if="syncFooterText && showSyncFooter" class="summary-sync-hint">{{ syncFooterText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, onUnmounted, ref, watch } from 'vue'
import { getChatCompletion } from '@/api/ai'
import type { InterviewRecorderStatus } from '@/views/home/composables/useInterviewRecorder'
import type { InterviewTranscriptSegment } from '@/views/home/composables/useInterviewTranscription'
import type { InterviewSummaryBlock } from '@/views/home/types/interviewSummary'
import summarizingIllustration from '@/assets/images/interview/robot.svg'
import emptyIllustration from '@/assets/images/interview/empty-illustration.svg'

export type SummaryBlock = InterviewSummaryBlock

const emit = defineEmits<{
  /** 总结内容更新（用于同步到访谈记录 localStorage，与开始访谈页一致） */
  'summary-change': [blocks: InterviewSummaryBlock[]]
}>()

const props = withDefaults(
  defineProps<{
    segments: InterviewTranscriptSegment[]
    recorderStatus: InterviewRecorderStatus
    isViewingHistory: boolean
    /** 与右侧「访谈字幕」LIVE 行一致，参与总结拼稿（录音/暂停时） */
    interimText?: string
    liveSpeakerLabel?: string
    /** 已持久化的总结块（与开始访谈页一致，不重复请求 AI） */
    storedSummaryBlocks?: InterviewSummaryBlock[] | null
    /** 是否展示底部「与访谈字幕同步」提示 */
    showSyncFooter?: boolean
    /** 当前项目节点 id：用于 sessionStorage 备份，离开页面再进入仍显示同一份总结 */
    summaryCacheKey?: string
  }>(),
  {
    interimText: '',
    liveSpeakerLabel: '发言人1',
    storedSummaryBlocks: null,
    showSyncFooter: true,
    summaryCacheKey: ''
  }
)

const DEBOUNCE_MS = 15_000

const summaryResult = ref<SummaryBlock[] | null>(null)
const hasSummaryContentOnce = ref(false)
const isRequestInFlight = ref(false)

/** 与 emit watch 共用，恢复 session 后避免重复 summary-change */
let lastEmittedSig = ''

let summaryRequestId = 0
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function clearDebounce() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

/**
 * 与访谈字幕区可见内容对齐：已定稿分段 + 正在识别行（与 InterviewStart 中 LIVE 行同一数据源）
 */
function buildTranscriptText(): string {
  const lines = props.segments.map(s => `${s.speakerLabel}：${s.text}`)
  const interim = props.interimText?.trim()
  if (
    interim &&
    (props.recorderStatus === 'recording' || props.recorderStatus === 'paused') &&
    !props.isViewingHistory
  ) {
    lines.push(`${props.liveSpeakerLabel}（正在识别）：${interim}`)
  }
  return lines.join('\n').trim()
}

function parseMarkdownToBlocks(text: string): SummaryBlock[] {
  const blocks: SummaryBlock[] = []
  const lines = text.split('\n')
  let bulletBuffer: string[] = []

  function flushBullets() {
    if (bulletBuffer.length) {
      blocks.push({ type: 'bodyBullets', items: [...bulletBuffer] })
      bulletBuffer = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('# ')) {
      flushBullets()
      blocks.push({ type: 'mainTitle', content: line.slice(2).trim() })
    } else if (line.startsWith('## ')) {
      flushBullets()
      blocks.push({ type: 'subTitle', content: line.slice(3).trim() })
    } else if (line.startsWith('### ')) {
      flushBullets()
      blocks.push({ type: 'subTitle', content: line.slice(4).trim() })
    } else if (/^[-•*]\s+/.test(line)) {
      bulletBuffer.push(line.replace(/^[-•*]\s+/, '').trim())
    } else if (/^\d+\.\s+/.test(line)) {
      bulletBuffer.push(line.replace(/^\d+\.\s+/, '').trim())
    } else {
      flushBullets()
      const cleaned = line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
      blocks.push({ type: 'body', content: cleaned })
    }
  }
  flushBullets()
  return blocks
}

function buildLocalSummary(): SummaryBlock[] {
  const segs = props.segments
  if (!segs.length) return []

  const speakers = new Map<string, string[]>()
  for (const s of segs) {
    const list = speakers.get(s.speakerLabel) ?? []
    list.push(s.text)
    speakers.set(s.speakerLabel, list)
  }

  const blocks: SummaryBlock[] = [
    { type: 'mainTitle', content: '访谈要点总结' }
  ]

  blocks.push({
    type: 'body',
    content: `本次访谈共 ${segs.length} 段对话，涉及 ${speakers.size} 位发言人。`
  })

  for (const [speaker, texts] of speakers) {
    blocks.push({ type: 'subTitle', content: `${speaker} 发言内容` })
    const sentences = texts.flatMap(t =>
      t.split(/[。！？；]/).map(s => s.trim()).filter(s => s.length > 1)
    )
    if (sentences.length <= 5) {
      blocks.push({ type: 'bodyBullets', items: sentences.length ? sentences : [texts.join('')] })
    } else {
      blocks.push({ type: 'bodyBullets', items: sentences.slice(0, 5) })
      blocks.push({ type: 'body', content: `……共 ${sentences.length} 条发言` })
    }
  }

  if (!import.meta.env.VITE_DEEPSEEK_API_KEY) {
    blocks.push({
      type: 'body',
      content: '提示：配置 VITE_DEEPSEEK_API_KEY 可获得 AI 智能总结。'
    })
  }

  return blocks
}

async function fetchSummaryFromApi(): Promise<SummaryBlock[]> {
  const text = buildTranscriptText()
  if (!text) return []

  if (!import.meta.env.VITE_DEEPSEEK_API_KEY) {
    return buildLocalSummary()
  }

  try {
    const raw = await getChatCompletion(
      [
        {
          role: 'system',
          content:
            '你是擅长提炼访谈记录的资深学者，擅长提炼访谈记录的核心要点并生成结构清晰的总结报告。请用中文回复，格式要求：\n# 一级标题\n## 二级标题\n正文段落\n- 列表项'
        },
        {
          role: 'user',
          content: `请对以下访谈记录进行总结，生成一份结构清晰的访谈总结报告：\n\n${text}`
        }
      ],
      { maxTokens: 2000 }
    )
    return parseMarkdownToBlocks(raw)
  } catch (e) {
    console.error('AI 总结失败，使用本地摘要:', e)
    return buildLocalSummary()
  }
}

const lastSyncMeta = ref<{ lineCount: number; timeLabel: string } | null>(null)

const SESSION_SUMMARY_PREFIX = 'pd-interview-live-summary:'

function sessionStorageKey() {
  const k = props.summaryCacheKey?.trim()
  return k ? `${SESSION_SUMMARY_PREFIX}${k}` : ''
}

function clearSessionSummaryCache() {
  const key = sessionStorageKey()
  if (!key || typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

function persistSummaryToSession() {
  const key = sessionStorageKey()
  if (!key || props.isViewingHistory || typeof sessionStorage === 'undefined') return
  if (!summaryResult.value?.length) return
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        blocks: summaryResult.value,
        lastSyncMeta: lastSyncMeta.value,
        hasSummaryContentOnce: hasSummaryContentOnce.value
      })
    )
  } catch {
    /* ignore */
  }
}

let sessionPersistTimer: ReturnType<typeof setTimeout> | null = null
function schedulePersistSummaryToSession() {
  if (sessionPersistTimer) clearTimeout(sessionPersistTimer)
  sessionPersistTimer = setTimeout(() => {
    sessionPersistTimer = null
    persistSummaryToSession()
  }, 400)
}

function restoreSummaryFromSession(): boolean {
  const key = sessionStorageKey()
  if (!key || props.isViewingHistory || typeof sessionStorage === 'undefined') return false
  if (summaryResult.value?.length) return true
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return false
    const data = JSON.parse(raw) as {
      blocks: SummaryBlock[]
      lastSyncMeta: { lineCount: number; timeLabel: string } | null
      hasSummaryContentOnce: boolean
    }
    if (!data.blocks?.length) return false
    summaryResult.value = data.blocks.map(b => {
      if (b.type === 'bodyBullets') return { ...b, items: [...b.items] }
      return { ...b }
    })
    hasSummaryContentOnce.value = data.hasSummaryContentOnce ?? true
    lastSyncMeta.value = data.lastSyncMeta ?? null
    lastEmittedSig = JSON.stringify(summaryResult.value ?? [])
    return true
  } catch {
    return false
  }
}

/** 进入历史记录全屏前调用：把当前现场总结写入 session，避免被历史稿覆盖后无法恢复 */
function saveLiveCacheToSession() {
  persistSummaryToSession()
}

async function requestSummary() {
  const text = buildTranscriptText()
  if (!text) return

  const interimIncluded =
    Boolean(props.interimText?.trim()) &&
    (props.recorderStatus === 'recording' || props.recorderStatus === 'paused') &&
    !props.isViewingHistory
  const lineCountForHint = props.segments.length + (interimIncluded ? 1 : 0)

  const id = ++summaryRequestId
  /** 每次请求都标记进行中，供结束录音时 waitForSummaryIdle 等待（不仅限首屏加载） */
  isRequestInFlight.value = true
  try {
    const blocks = await fetchSummaryFromApi()
    if (id !== summaryRequestId) return
    summaryResult.value = blocks
    hasSummaryContentOnce.value = true
    lastSyncMeta.value = {
      lineCount: lineCountForHint,
      timeLabel: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  } finally {
    if (id === summaryRequestId) {
      isRequestInFlight.value = false
    }
  }
}

function scheduleDebouncedSummary() {
  if (props.isViewingHistory) return
  if (props.recorderStatus !== 'recording' && props.recorderStatus !== 'paused') return
  if (!props.segments.length && !props.interimText?.trim()) return
  clearDebounce()
  const delay = hasSummaryContentOnce.value ? DEBOUNCE_MS : 8_000
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    if (props.segments.length >= 2 || hasSummaryContentOnce.value) {
      requestSummary()
    }
  }, delay)
}

const summaryBlocks = computed<SummaryBlock[]>(() => summaryResult.value ?? [])

watch(
  summaryBlocks,
  blocks => {
    if (props.isViewingHistory) return
    const sig = JSON.stringify(blocks)
    if (sig === lastEmittedSig) return
    lastEmittedSig = sig
    schedulePersistSummaryToSession()
    emit('summary-change', blocks.map(b => {
      if (b.type === 'bodyBullets') return { ...b, items: [...b.items] }
      return { ...b }
    }))
  },
  { deep: true }
)

const syncFooterText = computed(() => {
  if (!summaryBlocks.value.length || !lastSyncMeta.value) return ''
  const { lineCount, timeLabel } = lastSyncMeta.value
  return `与访谈字幕同步 · ${lineCount} 条文本 · ${timeLabel}`
})

const showRobotUI = computed(
  () => isRequestInFlight.value && !hasSummaryContentOnce.value
)

/** 无总结内容时展示提示（含录音中尚未出要点） */
const showEmptyHint = computed(() => {
  if (props.isViewingHistory) return false
  if (showRobotUI.value) return false
  return !summaryBlocks.value.length
})

const emptyHintText = computed(() => {
  if (props.recorderStatus === 'stopped' && !props.segments.length) {
    return '本次录音未产生可总结的字幕。'
  }
  if (
    (props.recorderStatus === 'recording' || props.recorderStatus === 'paused') &&
    (props.segments.length || props.interimText?.trim())
  ) {
    return '要点与右侧「访谈字幕」同源；定稿句与正在识别行均会参与总结。'
  }
  return '开始录音后，AI 将根据访谈字幕在此处展示要点。'
})

let lastHistorySig = ''

/** 访谈记录页「重新总结」时暂时忽略已落库的 stored 块，强制走 AI */
const ignoreStoredBlocks = ref(false)

/** 仅清空内存态，不删 sessionStorage（避免再次进入页面时误清已缓存的总结） */
function resetSessionState() {
  clearDebounce()
  summaryRequestId++
  summaryResult.value = null
  hasSummaryContentOnce.value = false
  isRequestInFlight.value = false
  lastHistorySig = ''
  lastSyncMeta.value = null
  lastEmittedSig = ''
}

/** 从新录音会话调用：父级已删 session 后再清内存 */
function resetLiveSummaryMemory() {
  clearSessionSummaryCache()
  resetSessionState()
}

/** 从历史回看回到现场会话：优先从 session 恢复离开前备份的现场总结 */
watch(
  () => props.isViewingHistory,
  (v, old) => {
    if (old === true && v === false) {
      if (!restoreSummaryFromSession()) {
        resetSessionState()
      }
    }
  }
)

watch(
  () => props.recorderStatus,
  s => {
    if (props.isViewingHistory) return
    if (s === 'stopped' && buildTranscriptText()) {
      clearDebounce()
      requestSummary()
    }
  }
)

watch(
  () => props.segments,
  () => {
    if (props.isViewingHistory) return
    if (props.recorderStatus !== 'recording' && props.recorderStatus !== 'paused') return
    if (!props.segments.length && !props.interimText?.trim()) return
    scheduleDebouncedSummary()
  },
  { deep: true }
)

watch(
  () => props.interimText,
  () => {
    if (props.isViewingHistory) return
    if (props.recorderStatus !== 'recording' && props.recorderStatus !== 'paused') return
    if (!props.segments.length && !props.interimText?.trim()) return
    scheduleDebouncedSummary()
  }
)

watch(
  () => [props.isViewingHistory, props.segments, props.storedSummaryBlocks] as const,
  () => {
    if (!props.isViewingHistory) return
    if (!props.segments.length) {
      summaryResult.value = null
      hasSummaryContentOnce.value = false
      lastHistorySig = ''
      lastSyncMeta.value = null
      return
    }
    const sig = props.segments.map(s => s.id).join('|')
    if (props.storedSummaryBlocks?.length && !ignoreStoredBlocks.value) {
      summaryResult.value = props.storedSummaryBlocks.map(b => {
        if (b.type === 'bodyBullets') return { ...b, items: [...b.items] }
        return { ...b }
      })
      hasSummaryContentOnce.value = true
      lastHistorySig = sig
      lastSyncMeta.value = {
        lineCount: props.segments.length,
        timeLabel: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }
      return
    }
    if (sig === lastHistorySig) return
    lastHistorySig = sig
    summaryRequestId++
    summaryResult.value = null
    hasSummaryContentOnce.value = false
    requestSummary()
  },
  { deep: true, immediate: true }
)

function getSummaryBlocks(): InterviewSummaryBlock[] {
  return summaryResult.value ? summaryResult.value.map(b => {
    if (b.type === 'bodyBullets') return { ...b, items: [...b.items] }
    return { ...b }
  }) : []
}

/** 结束录音后等待「停止触发的总结请求」完成，再持久化，避免 summaryBlocks 为空 */
async function waitForSummaryIdle(maxMs = 12000) {
  const start = Date.now()
  await new Promise(r => setTimeout(r, 50))
  while (isRequestInFlight.value && Date.now() - start < maxMs) {
    await new Promise(r => setTimeout(r, 80))
  }
}

/** 访谈记录详情：基于当前字幕重新请求 AI 总结（需配合 endRegenerateHistory 在父级落库后调用） */
async function regenerateHistorySummary() {
  if (!props.isViewingHistory) return
  const text = buildTranscriptText()
  if (!text.trim()) return
  ignoreStoredBlocks.value = true
  summaryRequestId++
  summaryResult.value = null
  hasSummaryContentOnce.value = false
  lastSyncMeta.value = null
  lastEmittedSig = ''
  lastHistorySig = ''
  await requestSummary()
}

function endRegenerateHistory() {
  ignoreStoredBlocks.value = false
}

defineExpose({
  getSummaryBlocks,
  waitForSummaryIdle,
  saveLiveCacheToSession,
  resetLiveSummaryMemory,
  regenerateHistorySummary,
  endRegenerateHistory
})

onMounted(() => {
  if (!props.isViewingHistory) restoreSummaryFromSession()
})

onActivated(() => {
  if (!props.isViewingHistory) restoreSummaryFromSession()
})

onUnmounted(() => {
  clearDebounce()
  summaryRequestId++
  if (sessionPersistTimer) {
    clearTimeout(sessionPersistTimer)
    sessionPersistTimer = null
  }
  persistSummaryToSession()
})
</script>

<style scoped>
.interview-summary-panel {
  flex: 1;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.summary-summarizing {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 8px 20px;
}

.summary-summarizing-img {
  width: 100px;
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.summary-summarizing-main {
  margin: 24px 0 0 0;
  font-size: 16px;
  font-weight: 400;
  color: #000;
  line-height: 24px;
  font-family: inherit;
}

.summary-dots {
  display: inline-block;
  width: 1em;
  text-align: left;
}

.summary-dot {
  animation: summary-dot 1.4s ease-in-out infinite both;
  opacity: 0.3;
}
.summary-dot:nth-child(1) {
  animation-delay: 0s;
}
.summary-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.summary-dot:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes summary-dot {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

.summary-summarizing-hint {
  margin: 16px 0 0 0;
  font-size: 16px;
  font-weight: 400;
  color: #bdbcbc;
  line-height: 24px;
  font-family: inherit;
}

.summary-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 8px 16px;
}

.summary-empty-img {
  width: min(100%, 250px);
  height: auto;
  max-height: 200px;
  object-fit: contain;
}

.summary-empty-text {
  font-size: 20px;
  color: #d2d2d2;
  letter-spacing: 0.04em;
  margin: 8px 0 0;
  font-family: inherit;
  font-weight: 400;
}

.summary-empty-hint {
  font-size: 14px;
  color: #a6a6a6;
  letter-spacing: 0.02em;
  margin: 12px 0 0;
  text-align: center;
  max-width: 320px;
  line-height: 1.5;
}

.summary-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 4px 12px 0;
}

.summary-main-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.45;
  color: #21243d;
}

.summary-sub-title {
  margin: 16px 0 8px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
  color: #21243d;
}

.summary-body {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.6;
  color: #303030;
}

.summary-body-bullets {
  margin: 0 0 12px;
  padding-left: 1.25em;
  font-size: 14px;
  line-height: 1.6;
  color: #303030;
}

.summary-bullet-item {
  margin-bottom: 6px;
}

.summary-sync-hint {
  margin: 16px 0 0;
  padding-top: 10px;
  border-top: 1px solid #eceef5;
  font-size: 12px;
  line-height: 1.5;
  color: #a6a6a6;
  letter-spacing: 0.02em;
}
</style>
