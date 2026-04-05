<!--
  全屏访谈页（路由：/interview，name: Interview）：独立布局无 AdminLayout 侧栏；录音、波形、实时转写、访谈信息区。
  结束录音可写入 utils/interviewRecordsStorage；顶栏复用 AdminHeader。
-->
<template>
  <!-- 顶栏与首页一致：复用 AdminHeader -->
  <div class="interview-root">
    <div class="interview-bg" aria-hidden="true" />

    <div class="interview-chrome">
      <AdminHeader
        :ai-panel-open="aiPanelOpen"
        :current-user-name="appStore.currentUser.name"
        :dark-mode="appStore.darkMode"
        @open-ai-panel="aiPanelOpen = true"
        @logout="router.push('/login')"
        @toggle-dark-mode="appStore.toggleDarkMode"
      />

      <el-dialog v-model="aiPanelOpen" title="AI助手" width="400px" append-to-body>
        <p>AI 助手功能开发中。</p>
      </el-dialog>

      <el-dialog
        v-model="showStopConfirm"
        title="结束录音"
        width="380px"
        append-to-body
        :close-on-click-modal="false"
        class="stop-confirm-dialog"
      >
        <p style="font-size: 15px; color: #333; line-height: 1.6; margin: 0;">
          确定要结束本次录音吗？结束后将无法继续录制。
        </p>
        <template #footer>
          <el-button @click="cancelStop">取消</el-button>
          <el-button type="danger" @click="confirmStop">确认结束</el-button>
        </template>
      </el-dialog>
    </div>

    <div class="interview-main-card">
      <!-- 返回 + 录音胶囊：位于白色主卡片内顶部 -->
      <div class="interview-card-toolbar">
        <div class="interview-chrome-left">
          <button type="button" class="back-btn" aria-label="返回" @click="goBack">
            <img class="back-icon" :src="iconBack" alt="" width="32" height="32" />
          </button>
          <span class="interview-back-label">返回</span>
        </div>

        <div
          v-if="showRecordingCapsule"
          class="interview-recording-wrap"
          role="status"
          aria-live="polite"
        >
          <!-- 与 ai-admin InterviewDetail 一致：开始条 / 录音条（波形 + 文案 + 暂停·播放·结束）；结束录制后隐藏胶囊 -->
          <div v-if="recorderStatus === 'idle'" class="start-bar">
            <el-tooltip content="开始录音" placement="bottom" :show-after="300">
              <button type="button" class="start-record-btn" @click="startRecording">
                <img :src="recordStartBtn" alt="开始录音" />
              </button>
            </el-tooltip>
          </div>

          <div
            v-else-if="(recorderStatus === 'recording' || recorderStatus === 'paused') && !isViewingHistory"
            class="recording-bar"
            :class="{ 'recording-bar--paused': recorderStatus === 'paused' }"
          >
            <div class="waveform" :class="{ 'waveform-paused': recorderStatus === 'paused' }">
              <span v-for="(h, i) in waveBars" :key="i" class="wave-bar-wrap">
                <span
                  class="wave-bar-fill"
                  :style="{
                    animationDelay: h.delay + 's',
                    '--h-min': h.min + 'px',
                    '--h-max': h.max + 'px',
                  }"
                >
                  <img :src="waveBarSvg" class="wave-bar-img" alt="" />
                </span>
              </span>
            </div>
            <span class="recording-text">{{ recordingBarText }}</span>
            <el-tooltip
              :content="recorderStatus === 'paused' ? '继续录音' : '暂停录音'"
              placement="bottom"
              :show-after="300"
            >
              <button type="button" class="ctrl-btn" @click="onPauseOrResumeClick">
                <img
                  :src="recorderStatus === 'paused' ? playBtn : pauseBtn"
                  :alt="recorderStatus === 'paused' ? '继续' : '暂停'"
                />
              </button>
            </el-tooltip>
            <el-tooltip content="结束录音" placement="bottom" :show-after="300">
              <button type="button" class="ctrl-btn" @click="onStopClick">
                <img :src="stopBtn" alt="结束" />
              </button>
            </el-tooltip>
          </div>
        </div>
      </div>

      <div class="interview-body">
        <section class="interview-col interview-col--left" aria-label="实时总结">
          <div class="interview-section-head">
            <h2 class="interview-section-title">
              <span class="interview-section-title__text">实时总结</span>
            </h2>
          </div>

          <InterviewSummaryPanel
            ref="summaryPanelRef"
            :segments="effectiveSegments"
            :recorder-status="recorderStatus"
            :is-viewing-history="isViewingHistory"
            :interim-text="subtitleInterimText"
            :live-speaker-label="liveSpeakerLabel"
            :stored-summary-blocks="storedSummaryBlocksForHistory"
            :summary-cache-key="nodeId"
            @summary-change="onInterviewSummaryChange"
          />
        </section>

        <div class="interview-gutter" aria-hidden="true" />

        <section class="interview-col interview-col--right" aria-label="访谈信息">
          <div class="interview-section-head">
            <h2 class="interview-section-title">
              <span class="interview-section-title__text">访谈信息</span>
            </h2>
          </div>

          <!-- 访谈信息：结构对齐 Figma node 1:15739 Frame 36401（标题在卡片内左上 ≈18,18，减号 15×15 + 文案；内容区顶边 ≈52） -->
          <div
            class="info-panel info-panel--subtitles"
            :class="{ 'info-panel--collapsed': !interviewPanelsOpen.subtitles }"
          >
            <button
              type="button"
              class="info-panel__toggle"
              :aria-expanded="interviewPanelsOpen.subtitles"
              aria-controls="interview-panel-subtitles"
              @click="toggleInterviewPanel('subtitles')"
            >
              <span class="info-panel__fold-ico" aria-hidden="true">
                <img
                  v-if="interviewPanelsOpen.subtitles"
                  class="info-panel__fold-img"
                  :src="iconPanelCollapse"
                  alt=""
                  width="16"
                  height="16"
                />
                <img
                  v-else
                  class="info-panel__fold-img"
                  :src="iconPanelExpand"
                  alt=""
                  width="16"
                  height="16"
                />
              </span>
              <span class="info-panel__heading">访谈字幕</span>
            </button>
            <div
              ref="subtitlePanelBodyRef"
              v-show="interviewPanelsOpen.subtitles"
              id="interview-panel-subtitles"
              class="info-panel__content info-panel__content--scroll"
            >
              <div class="subtitle-feed">
                <template v-if="subtitleDisplayBlocks.length || subtitleInterimDisplayText">
                  <!-- 结构对齐 ai-admin InterviewTranscriptCard：胶囊发言人 + 单行时间 + 正文 + 分隔线；当前条高亮 -->
                  <div class="transcript-list">
                    <div
                      v-for="(block, idx) in subtitleDisplayBlocks"
                      :key="block.id"
                      class="transcript-entry"
                    >
                      <div class="entry-header">
                        <span
                          class="speaker-tag"
                          :class="{ 'speaker-tag-active': block.isActive }"
                        >
                          <img
                            class="speaker-person-icon"
                            :src="block.isActive ? personIconWhite : personIconBlue"
                            alt=""
                            width="11"
                            height="14"
                          />
                          <span class="speaker-name">{{ block.speakerLabel }}</span>
                        </span>
                        <span class="entry-time">{{ block.timeLabel }}</span>
                      </div>
                      <p class="entry-text">{{ block.text }}</p>
                      <div
                        v-if="idx < subtitleDisplayBlocks.length - 1 || subtitleInterimDisplayText"
                        class="entry-divider"
                      />
                    </div>
                    <div v-if="subtitleInterimDisplayText" class="transcript-entry transcript-entry--live">
                      <div class="entry-header">
                        <span class="speaker-tag speaker-tag-active">
                          <img class="speaker-person-icon" :src="personIconWhite" alt="" width="11" height="14" />
                          <span class="speaker-name">{{ liveSpeakerLabel }}</span>
                        </span>
                        <span class="entry-time entry-time--live">LIVE</span>
                      </div>
                      <p class="entry-text">{{ subtitleInterimDisplayText }}</p>
                    </div>
                  </div>
                </template>
                <p v-else class="subtitle-placeholder">{{ subtitleEmptyText }}</p>
              </div>
              <p v-if="subtitleError" class="interview-error">{{ subtitleError }}</p>
            </div>
          </div>

          <div
            class="info-panel info-panel--keywords"
            :class="{ 'info-panel--collapsed': !interviewPanelsOpen.keywords }"
          >
            <button
              type="button"
              class="info-panel__toggle"
              :aria-expanded="interviewPanelsOpen.keywords"
              aria-controls="interview-panel-keywords"
              @click="toggleInterviewPanel('keywords')"
            >
              <span class="info-panel__fold-ico" aria-hidden="true">
                <img
                  v-if="interviewPanelsOpen.keywords"
                  class="info-panel__fold-img"
                  :src="iconPanelCollapse"
                  alt=""
                  width="16"
                  height="16"
                />
                <img
                  v-else
                  class="info-panel__fold-img"
                  :src="iconPanelExpand"
                  alt=""
                  width="16"
                  height="16"
                />
              </span>
              <span class="info-panel__heading">关键热词</span>
            </button>
            <div v-show="interviewPanelsOpen.keywords" id="interview-panel-keywords" class="info-panel__content">
              <div v-if="hotKeywords.length" class="keyword-row">
                <span v-for="w in hotKeywords" :key="w" class="keyword-chip">{{ w }}</span>
              </div>
              <p v-else class="keyword-empty">
                {{ recorderStatus === 'idle' ? '开始录音后将自动提取关键词' : '正在聆听，关键词将随对话内容实时更新...' }}
              </p>
            </div>
          </div>

          <div
            class="info-panel info-panel--suggest"
            :class="{ 'info-panel--collapsed': !interviewPanelsOpen.suggest }"
          >
            <div class="info-panel__head-row">
              <button
                type="button"
                class="info-panel__toggle info-panel__toggle--suggest"
                :aria-expanded="interviewPanelsOpen.suggest"
                aria-controls="interview-panel-suggest"
                @click="toggleInterviewPanel('suggest')"
              >
                <span class="info-panel__fold-ico" aria-hidden="true">
                  <img
                    v-if="interviewPanelsOpen.suggest"
                    class="info-panel__fold-img"
                    :src="iconPanelCollapse"
                    alt=""
                    width="16"
                    height="16"
                  />
                  <img
                    v-else
                    class="info-panel__fold-img"
                    :src="iconPanelExpand"
                    alt=""
                    width="16"
                    height="16"
                  />
                </span>
                <span class="info-panel__heading info-panel__heading--suggest">访谈建议</span>
              </button>
              <button type="button" class="add-suggest-btn" disabled>
                <span class="add-suggest-btn__plus" aria-hidden="true">+</span>
                添加访谈建议
              </button>
            </div>
            <div v-show="interviewPanelsOpen.suggest" id="interview-panel-suggest" class="info-panel__content">
              <div class="suggest-list">
                <div class="suggest-line suggest-line--ghost">暂无建议，录音中可自动生成</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import AdminHeader from '@/views/layouts/components/AdminHeader.vue'
import InterviewSummaryPanel from '@/views/home/components/InterviewSummaryPanel.vue'
import { isProjectRouteTarget } from '@/views/home/mock/customerTree'
import { liveCustomerTreeItems } from '@/views/home/mock/liveCustomerTree'
import { useInterviewRecorder } from '@/views/home/composables/useInterviewRecorder'
import {
  useInterviewTranscription,
  type InterviewTranscriptSegment
} from '@/views/home/composables/useInterviewTranscription'
import { formatInterimTranscript } from '@/views/home/utils/interviewTranscript'
import type { InterviewSummaryBlock } from '@/views/home/types/interviewSummary'
import {
  appendProjectInterviewRecord,
  getProjectInterviewRecord,
  nextInterviewTitle,
  updateProjectInterviewRecord
} from '@/views/home/utils/interviewRecordsStorage'
import {
  INTERVIEW_SESSION_HOT_KEYWORDS_PREFIX,
  INTERVIEW_SESSION_TRANSCRIPT_PREFIX
} from '@/views/home/utils/interviewSessionCache'
import iconBack from '@/assets/images/credit-report/icon-back.svg'
import recordStartBtn from '@/assets/images/interview/record-start-btn.svg'
import pauseBtn from '@/assets/images/interview/pause-btn.svg'
import playBtn from '@/assets/images/interview/play-btn.svg'
import stopBtn from '@/assets/images/interview/stop-btn.svg'
import waveBarSvg from '@/assets/images/interview/wave.svg'
import iconPanelCollapse from '@/assets/images/interview/icon-panel-collapse.svg'
/** Figma「7.1首页-实时总结+展开」访谈信息区节点 1:16299「加」，与收起图标同形（蓝框 + 号） */
import iconPanelExpand from '@/assets/images/interview/icon-panel-expand.svg'
/** 与 ai-admin InterviewTranscriptCard 一致：胶囊标签内人形图标（蓝 / 白） */
import personIconBlue from '@/assets/images/interview/person-icon-blue.svg'
import personIconWhite from '@/assets/images/interview/person-icon-white.svg'

defineOptions({ name: 'Interview' })

/** 与 ai-admin InterviewDetail 相同的波形条动画参数（固定随机种子，仅初始化一次） */
const waveBars = (() => {
  const pattern = [
    { min: 3, max: 8 }, { min: 4, max: 13 }, { min: 3, max: 10 }, { min: 5, max: 14 },
    { min: 3, max: 7 }, { min: 4, max: 12 }, { min: 3, max: 9 }, { min: 5, max: 14 },
    { min: 3, max: 6 }, { min: 4, max: 10 }, { min: 3, max: 8 }, { min: 5, max: 13 },
    { min: 3, max: 7 }, { min: 4, max: 11 }, { min: 3, max: 9 }, { min: 5, max: 14 },
    { min: 3, max: 8 }, { min: 4, max: 12 }, { min: 3, max: 7 }, { min: 5, max: 13 },
    { min: 3, max: 10 }, { min: 4, max: 14 }, { min: 3, max: 8 }, { min: 5, max: 11 },
  ]
  return pattern.map((p, i) => ({ ...p, delay: i * 0.07 + Math.random() * 0.15 }))
})()

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const aiPanelOpen = ref(false)
const subtitlePanelBodyRef = ref<HTMLElement | null>(null)

/** 访谈信息：访谈字幕 / 关键热词 / 访谈建议（对齐 Figma 7.0 可展开收起） */
const interviewPanelsOpen = reactive({
  subtitles: true,
  keywords: true,
  suggest: true
})

function toggleInterviewPanel(key: keyof typeof interviewPanelsOpen) {
  interviewPanelsOpen[key] = !interviewPanelsOpen[key]
}

const {
  status: recorderStatus,
  error: recorderError,
  durationMs,
  start: startRecorder,
  pause: pauseRecorder,
  resume: resumeRecorder,
  stop: stopRecorder,
  reset: resetRecorder
} = useInterviewRecorder()

const {
  error: subtitleRecognitionError,
  segments: subtitleSegments,
  interimText: subtitleInterimText,
  currentSpeakerLabel,
  start: startTranscription,
  pause: pauseTranscription,
  resume: resumeTranscription,
  stop: stopTranscription,
  reset: resetTranscription,
  restoreSegments: restoreTranscriptionSegments
} = useInterviewTranscription({
  getTimelineMs: () => durationMs.value
})

const DOMAIN_KEYWORDS = new Set([
  '营收', '负债率', '现金流', '担保', '行业周期', '订单', '利润', '毛利',
  '净利', '资产', '负债', '应收', '应付', '成本', '收入', '融资',
  '贷款', '还款', '授信', '风险', '合同', '客户', '供应商', '产能',
  '产量', '库存', '账期', '逾期', '坏账', '税收', '税务', '股东',
  '股权', '分红', '投资', '回款', '预算', '费用', '销售', '市场',
  '政务', '游泳', '股票', '基金', '公司', '项目', '技术', '产品',
  '方案', '需求', '目标', '计划', '进度', '质量', '数据', '系统',
  '服务', '管理', '运营', '研发', '设计', '测试', '部署', '团队',
])

const STOP_WORDS = new Set([
  '我们', '你们', '他们', '她们', '自己', '大家', '这个', '那个',
  '什么', '怎么', '可以', '已经', '就是', '不是', '因为', '所以',
  '如果', '虽然', '但是', '而且', '或者', '以及', '对于', '关于',
  '通过', '进行', '可能', '应该', '需要', '一下', '一些', '一个',
  '这些', '那些', '现在', '今天', '明天', '昨天', '时候', '地方',
  '问题', '事情', '东西', '方面', '情况', '然后', '这样', '那样',
  '比较', '其实', '还是', '你好', '能听', '听到', '知道', '觉得',
  '说的', '的话', '好的', '就好', '没有', '有没', '对吧', '是吧',
  '嗯嗯', '哈哈', '那么', '这么', '怎样', '哪些', '哪个', '为什么',
])

function extractKeywords(text: string): string[] {
  if (!text || text.length < 4) return []
  const clean = text.replace(/[，。！？、；：""''（）【】《》\s\d.,:;!?'"()\[\]{}]+/g, '')
  if (clean.length < 4) return []

  const freq = new Map<string, number>()
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= clean.length - len; i++) {
      const gram = clean.slice(i, i + len)
      if (STOP_WORDS.has(gram)) continue
      freq.set(gram, (freq.get(gram) || 0) + 1)
    }
  }

  const domain: string[] = []
  const general: string[] = []
  for (const [term, count] of freq) {
    if (DOMAIN_KEYWORDS.has(term)) {
      domain.push(term)
    } else if (count >= 2) {
      general.push(term)
    }
  }

  general.sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0))

  const result: string[] = [...domain]
  for (const t of general) {
    if (result.length >= 8) break
    if (result.some(r => r.includes(t) || t.includes(r))) continue
    result.push(t)
  }
  return result.slice(0, 8)
}

const liveSpeakerLabel = currentSpeakerLabel

const showStopConfirm = ref(false)

/** 与 ai-admin InterviewTranscriptCard.formatTime 一致：起始时刻 HH:MM:SS */
function formatSubtitleTimeLabel(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const nodeId = computed(() => {
  const q = route.query.nodeId
  if (Array.isArray(q)) return q[0] ?? ''
  if (typeof q === 'string' && q) return q
  const sid = appStore.selectedCustomerId
  return typeof sid === 'string' ? sid : ''
})

/** 访谈仅绑定「项目」节点；公司客户或集团父节点不可进入（与侧栏「开始访谈」一致） */
watch(
  () => nodeId.value,
  id => {
    if (!id) return
    const list = liveCustomerTreeItems.value
    if (isProjectRouteTarget(list, id)) return
    router.replace({ name: 'Home' })
  },
  { immediate: true }
)

const historyView = ref<{
  segments: InterviewTranscriptSegment[]
  durationMs: number
  title: string
  summaryBlocks?: InterviewSummaryBlock[]
} | null>(null)

const summaryPanelRef = ref<{
  getSummaryBlocks: () => InterviewSummaryBlock[]
  waitForSummaryIdle: () => Promise<void>
  saveLiveCacheToSession: () => void
  resetLiveSummaryMemory: () => void
} | null>(null)

/** 当前这次从「开始录音」创建的列表项 id，结束录音时更新同一条，避免重复条目 */
const currentSessionRecordId = ref<string | null>(null)

const isViewingHistory = computed(() => historyView.value !== null)

/**
 * 录音胶囊显示规则：
 * - 当前会话已结束（stopped）且非历史：整块隐藏（含波形+文案）
 * - 历史回看：仅 idle 时显示「开始录音」入口，不再显示历史波形条
 */
const showRecordingCapsule = computed(() => {
  if (isViewingHistory.value) return recorderStatus.value === 'idle'
  return recorderStatus.value !== 'stopped'
})

const effectiveSegments = computed(
  () => historyView.value?.segments ?? subtitleSegments.value
)

/** 关键热词：按项目 sessionStorage 缓存；仅在访谈记录列表删除时集中清理 */
function loadHotKeywordsForProject(projectId: string): string[] {
  if (!projectId || typeof sessionStorage === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(`${INTERVIEW_SESSION_HOT_KEYWORDS_PREFIX}${projectId}`)
    if (!raw) return []
    const data = JSON.parse(raw) as { words?: string[] }
    return Array.isArray(data.words) ? data.words.filter(w => typeof w === 'string' && w.trim()) : []
  } catch {
    return []
  }
}

function saveHotKeywordsForProject(projectId: string, words: string[]) {
  if (!projectId || typeof sessionStorage === 'undefined' || !words.length) return
  try {
    sessionStorage.setItem(
      `${INTERVIEW_SESSION_HOT_KEYWORDS_PREFIX}${projectId}`,
      JSON.stringify({ words, updatedAt: Date.now() })
    )
  } catch {
    /* ignore quota */
  }
}

const persistedHotKeywords = ref<string[]>([])

watch(
  () => nodeId.value,
  id => {
    const pid = (typeof id === 'string' ? id : '').trim()
    persistedHotKeywords.value = pid ? loadHotKeywordsForProject(pid) : []
  },
  { immediate: true }
)

const hotKeywords = computed(() => {
  const allText =
    effectiveSegments.value.map(s => s.text).join('') + (subtitleInterimText.value ?? '')
  const live = extractKeywords(allText)
  if (live.length) return live
  return persistedHotKeywords.value
})

watch(
  () => [nodeId.value, effectiveSegments.value, subtitleInterimText.value] as const,
  () => {
    const pid = nodeId.value?.trim()
    if (!pid) return
    const allText =
      effectiveSegments.value.map(s => s.text).join('') + (subtitleInterimText.value ?? '')
    const words = extractKeywords(allText)
    if (words.length) {
      persistedHotKeywords.value = words
      saveHotKeywordsForProject(pid, words)
    }
  },
  { deep: true }
)

const effectiveDurationMs = computed(
  () => historyView.value?.durationMs ?? durationMs.value
)

const storedSummaryBlocksForHistory = computed(() =>
  isViewingHistory.value ? historyView.value?.summaryBlocks ?? null : null
)

function syncHistoryFromRoute() {
  const q = route.query.recordId
  const rid = Array.isArray(q) ? q[0] ?? '' : typeof q === 'string' ? q : ''
  const nid = nodeId.value
  if (!rid || !nid) {
    historyView.value = null
    return
  }
  if (recorderStatus.value === 'recording' || recorderStatus.value === 'paused') {
    return
  }
  const rec = getProjectInterviewRecord(nid, rid)
  if (!rec) {
    historyView.value = null
    return
  }
  summaryPanelRef.value?.saveLiveCacheToSession?.()
  historyView.value = {
    segments: rec.segments,
    durationMs: rec.durationMs,
    title: rec.title,
    summaryBlocks: rec.summaryBlocks
  }
  resetTranscription()
  resetRecorder()
}

watch(
  () => [route.query.recordId, route.query.nodeId, nodeId.value],
  () => syncHistoryFromRoute(),
  { immediate: true }
)

/** 进行中访谈（非历史回看）：用于最后一条字幕胶囊高亮，对齐 ai-admin「当前条」 */
const isLiveInterviewSession = computed(
  () =>
    !isViewingHistory.value &&
    (recorderStatus.value === 'recording' || recorderStatus.value === 'paused')
)

/** 设计稿 / 实时转写列表：结构对齐 ai-admin InterviewTranscriptCard（起始时间 + 当前条 speaker-tag-active） */
const subtitleDisplayBlocks = computed(() => {
  const segs = effectiveSegments.value
  const hasInterim = Boolean(subtitleInterimText.value?.trim())

  if (segs.length) {
    return segs.map((seg, i) => ({
      id: seg.id,
      speakerLabel: seg.speakerLabel,
      timeLabel: formatSubtitleTimeLabel(seg.timeMs),
      text: seg.text,
      isActive: isLiveInterviewSession.value && !hasInterim && i === segs.length - 1
    }))
  }
  return []
})

const subtitleInterimDisplayText = computed(() => formatInterimTranscript(subtitleInterimText.value))

watch(
  () => [subtitleDisplayBlocks.value.length, subtitleInterimText.value],
  async () => {
    await nextTick()
    const el = subtitlePanelBodyRef.value
    if (el) el.scrollTop = el.scrollHeight
  }
)

function onInterviewSessionCacheCleared(ev: Event) {
  const d = (ev as CustomEvent<{ projectId?: string }>).detail
  if (!d?.projectId || d.projectId !== nodeId.value?.trim()) return
  persistedHotKeywords.value = []
  resetTranscription()
  summaryPanelRef.value?.resetLiveSummaryMemory?.()
}

onMounted(() => {
  window.addEventListener('pd-interview-session-cache-cleared', onInterviewSessionCacheCleared as EventListener)
  const id = nodeId.value
  if (id) appStore.setSelectedCustomer(id)
  void nextTick(() => {
    if (isViewingHistory.value) return
    const pid = nodeId.value?.trim()
    if (!pid || typeof sessionStorage === 'undefined') return
    if (subtitleSegments.value.length) return
    try {
      const raw = sessionStorage.getItem(`${INTERVIEW_SESSION_TRANSCRIPT_PREFIX}${pid}`)
      if (!raw) return
      const data = JSON.parse(raw) as { segments?: InterviewTranscriptSegment[] }
      if (data.segments?.length) restoreTranscriptionSegments(data.segments)
    } catch {
      /* ignore */
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('pd-interview-session-cache-cleared', onInterviewSessionCacheCleared as EventListener)
  const pid = nodeId.value?.trim()
  if (!pid || typeof sessionStorage === 'undefined') return
  const segs = subtitleSegments.value
  if (!segs.length) return
  try {
    sessionStorage.setItem(
      `${INTERVIEW_SESSION_TRANSCRIPT_PREFIX}${pid}`,
      JSON.stringify({ segments: segs, savedAt: Date.now() })
    )
  } catch {
    /* ignore quota */
  }
})

onActivated(() => {
  const pid = nodeId.value?.trim()
  if (pid) persistedHotKeywords.value = loadHotKeywordsForProject(pid)
  void nextTick(() => {
    if (isViewingHistory.value) return
    if (!pid || typeof sessionStorage === 'undefined') return
    if (subtitleSegments.value.length) return
    try {
      const raw = sessionStorage.getItem(`${INTERVIEW_SESSION_TRANSCRIPT_PREFIX}${pid}`)
      if (!raw) return
      const data = JSON.parse(raw) as { segments?: InterviewTranscriptSegment[] }
      if (data.segments?.length) restoreTranscriptionSegments(data.segments)
    } catch {
      /* ignore */
    }
  })
})

const formattedDuration = computed(() => {
  const totalMs = effectiveDurationMs.value
  const s = Math.floor(totalMs / 1000)
  const hh = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return [hh, mm, ss].map(n => String(n).padStart(2, '0')).join(':')
})

const recordingBarText = computed(() => {
  const t = formattedDuration.value
  switch (recorderStatus.value) {
    case 'recording':
      return `速写中... ${t}`
    case 'paused':
      return `已暂停... ${t}`
    case 'stopped':
      return `录音已结束 ${t}`
    default:
      return ''
  }
})

function onPauseOrResumeClick() {
  if (recorderStatus.value === 'recording') pauseRecording()
  else if (recorderStatus.value === 'paused') resumeRecording()
}

const subtitleError = computed(() => {
  const messages = [recorderError.value, subtitleRecognitionError.value].filter(Boolean)
  return messages.length ? messages.join(' ') : null
})

const subtitleEmptyText = computed(() => {
  if (isViewingHistory.value && !effectiveSegments.value.length) {
    return '该条记录暂无转写文本。'
  }
  if (subtitleRecognitionError.value) return '实时字幕暂不可用，但录音仍可继续。'
  if (recorderStatus.value === 'recording') return '正在聆听，请开始发言，字幕会实时展示在这里。'
  if (recorderStatus.value === 'paused') return '录音已暂停，继续后会从这里接着转写。'
  if (recorderStatus.value === 'stopped') return '本次录音已结束，字幕内容会保留在这里供回看。'
  return '开始录音后，字幕与转写将在此区域实时展示。'
})

watch(
  () => [subtitleDisplayBlocks.value.length, subtitleInterimDisplayText.value],
  async () => {
    await nextTick()
    const panel = subtitlePanelBodyRef.value
    if (!panel) return
    panel.scrollTop = panel.scrollHeight
  }
)

async function leaveHistoryView() {
  historyView.value = null
  const id = nodeId.value
  await router.replace({ name: 'Interview', query: id ? { nodeId: id } : {} })
}

async function startRecording() {
  await leaveHistoryView()
  currentSessionRecordId.value = null
  /** 不再在此处清理 session 缓存：结束录音后胶囊隐藏，缓存保留至访谈记录列表中删除 */
  /** 与录音同一次会话：先清空旧字幕/识别实例，再开麦，最后启动 Web Speech（避免与上一轮字幕、segmentId 混在一起） */
  resetTranscription()
  await startRecorder()
  if (recorderStatus.value === 'recording') {
    startTranscription()
    const pid = nodeId.value
    const list = liveCustomerTreeItems.value
    if (pid && isProjectRouteTarget(list, pid)) {
      const title = nextInterviewTitle(pid)
      const rec = appendProjectInterviewRecord(pid, {
        projectId: pid,
        title,
        createdAt: Date.now(),
        durationMs: 0,
        segments: [],
        status: 'recording',
        place: '',
        participants: '',
        summarizerName: appStore.currentUser.name
      })
      currentSessionRecordId.value = rec.id
      window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId: pid } }))
    }
  }
}

function pauseRecording() {
  pauseRecorder()
  pauseTranscription()
}

function resumeRecording() {
  resumeRecorder()
  if (recorderStatus.value === 'recording') resumeTranscription()
}

let summaryPersistDebounce: ReturnType<typeof setTimeout> | null = null
const SUMMARY_PERSIST_DEBOUNCE_MS = 2500

/** 录音/暂停中把实时总结防抖写入当前条记录，访谈记录页与开始访谈页一致 */
function onInterviewSummaryChange(blocks: InterviewSummaryBlock[]) {
  if (!blocks.length) return
  const pid = nodeId.value
  const rid = currentSessionRecordId.value
  if (!pid || !rid) return
  if (isViewingHistory.value) return
  if (recorderStatus.value !== 'recording' && recorderStatus.value !== 'paused') return

  if (summaryPersistDebounce) clearTimeout(summaryPersistDebounce)
  summaryPersistDebounce = setTimeout(() => {
    summaryPersistDebounce = null
    const p = nodeId.value
    const r = currentSessionRecordId.value
    if (!p || !r) return
    if (recorderStatus.value !== 'recording' && recorderStatus.value !== 'paused') return
    const fresh = summaryPanelRef.value?.getSummaryBlocks?.() ?? []
    if (!fresh.length) return
    updateProjectInterviewRecord(p, r, {
      summaryBlocks: fresh,
      summarizerName: appStore.currentUser.name,
      summaryGeneratedAt: Date.now()
    })
    window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId: p } }))
  }, SUMMARY_PERSIST_DEBOUNCE_MS)
}

function goBack() {
  const id = nodeId.value
  if (!id) {
    router.push({ name: 'Home' })
    return
  }
  appStore.setSelectedCustomer(id)
  const list = liveCustomerTreeItems.value
  if (isProjectRouteTarget(list, id)) {
    const q = route.query.recordId
    const rid = Array.isArray(q) ? q[0] : typeof q === 'string' ? q : ''
    if (rid) {
      router.push({ name: 'InterviewRecords', params: { projectId: id }, query: { recordId: rid } })
      return
    }
    if (currentSessionRecordId.value) {
      router.push({ name: 'InterviewRecords', params: { projectId: id }, query: { recordId: currentSessionRecordId.value } })
      return
    }
    router.push({ name: 'HomeProject', params: { projectId: id } })
  } else {
    router.push({ name: 'Home' })
  }
}

function persistProjectInterviewIfNeeded() {
  const pid = nodeId.value
  if (!pid) return
  const tree = liveCustomerTreeItems.value
  if (!isProjectRouteTarget(tree, pid)) return
  const dur = durationMs.value
  const segs = subtitleSegments.value
  const segments = JSON.parse(JSON.stringify(segs)) as InterviewTranscriptSegment[]
  const rid = currentSessionRecordId.value
  const summaryBlocks = summaryPanelRef.value?.getSummaryBlocks?.() ?? []
  /** 无块时不要带 summaryBlocks，避免 spread 用 undefined 覆盖掉录音过程中已防抖落库的总结 */
  const summaryPatch = {
    summarizerName: appStore.currentUser.name,
    summaryGeneratedAt: Date.now(),
    ...(summaryBlocks.length ? { summaryBlocks } : {})
  }

  if (rid) {
    updateProjectInterviewRecord(pid, rid, {
      durationMs: dur,
      segments,
      status: 'completed',
      ...summaryPatch
    })
    currentSessionRecordId.value = null
    window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId: pid } }))
    return
  }

  const hasText = segs.some(s => s.text.trim().length > 0)
  if (dur < 1000 && !hasText) return
  appendProjectInterviewRecord(pid, {
    projectId: pid,
    title: nextInterviewTitle(pid),
    createdAt: Date.now(),
    durationMs: dur,
    segments,
    status: 'completed',
    place: '',
    participants: '',
    ...summaryPatch
  })
  window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId: pid } }))
}

function onStopClick() {
  showStopConfirm.value = true
}

async function confirmStop() {
  showStopConfirm.value = false
  stopTranscription()
  await stopRecorder()
  await nextTick()
  await summaryPanelRef.value?.waitForSummaryIdle?.()
  await nextTick()
  persistProjectInterviewIfNeeded()
}

function cancelStop() {
  showStopConfirm.value = false
}
</script>

<style scoped>
/* 全屏根节点：无 AdminLayout，占满视口 */
.interview-root {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  background: #edf2fd;
  color: #21243d;
}

.interview-bg {
  position: absolute;
  inset: 0;
  background: url('@/assets/images/home/bg.svg') center / cover no-repeat;
  opacity: 0.35;
  pointer-events: none;
}

.interview-chrome {
  position: relative;
  flex-shrink: 0;
}

/* 白色卡片内顶栏：返回 + 录音胶囊 */
.interview-card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 46px;
  margin: 0 0 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
  box-sizing: border-box;
}

.interview-chrome-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

/* 与 CreditReport.vue 返回按钮完全一致（.back-btn / .back-icon） */
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

/* Figma style_44TMQ8 */
.interview-back-label {
  font-size: 20px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.02em;
  color: #21243d;
}

/* 录音区：对齐 ai-admin InterviewDetail .recording-bar / .start-bar */
.interview-recording-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  max-width: min(100%, 620px);
}

.start-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #cddeff;
  border-radius: 100px;
  padding: 0 20px;
  height: 40px;
  width: 120px;
  box-sizing: border-box;
}

.recording-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #cddeff;
  border-radius: 100px;
  padding: 0 10px;
  height: 40px;
  box-sizing: border-box;
}

.recording-bar--paused {
  min-width: 200px;
}

.recording-bar--paused .recording-text {
  flex: 0 1 auto;
  min-width: 100px;
}

.recording-bar--stopped {
  flex-wrap: wrap;
  height: auto;
  min-height: 40px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.waveform {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 16px;
}

.waveform--embed {
  flex: 0 0 auto;
}

.wave-bar-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2px;
  height: 15px;
  flex-shrink: 0;
}

.waveform-paused .wave-bar-fill {
  animation-play-state: paused;
}

.wave-bar-fill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2px;
  height: var(--h-max);
  border-radius: 1px;
  overflow: hidden;
  animation: interviewWaveAnim 0.8s ease-in-out infinite alternate;
}

.wave-bar-fill .wave-bar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 1px;
}

@keyframes interviewWaveAnim {
  0% {
    height: var(--h-max);
  }
  100% {
    height: var(--h-min);
  }
}

.recording-text {
  font-size: 14px;
  color: #313131;
  letter-spacing: 0.28px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.ctrl-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ctrl-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ctrl-btn img {
  width: 26px;
  height: 26px;
}

.start-record-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-record-btn img {
  width: 26px;
  height: 26px;
}

.stopped-text-btn {
  height: 26px;
  padding: 0 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  color: #303030;
  cursor: pointer;
  font-family: inherit;
}

.stopped-text-btn:hover {
  border-color: #2036ca;
  color: #2036ca;
}

/* 主白卡片 Figma 底色 12px 圆角 + 阴影 */
.interview-main-card {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin: 0 32px 32px;
  padding: 20px 24px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 3px 10px 0 rgba(36, 31, 164, 0.1);
  overflow: hidden;
}

.interview-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: 0;
}

.interview-col {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.interview-col--left {
  flex: 1.65;
  padding-right: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.interview-col--right {
  flex: 1;
  padding-left: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.interview-gutter {
  flex-shrink: 0;
  width: 6px;
  align-self: stretch;
  margin: 36px 0 8px;
  background: #c2c7e8;
  border-radius: 100px;
}

.interview-section-head {
  margin-bottom: 18px;
}

.interview-section-title {
  margin: 0;
}

.interview-section-title__text {
  display: inline-block;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: #2036ca;
}

.interview-section-title::after {
  content: '';
  display: block;
  width: 73px;
  height: 6px;
  margin-top: 4px;
  border-radius: 3px;
  background: linear-gradient(90deg, #2036ca 0%, rgba(32, 54, 202, 0) 100%);
}

/*
 * 访谈信息 — 对齐 Figma Frame 36401（node 1:15739）：
 * - 列 gap 10px（父级 .interview-col--right）
 * - 卡片白底、1px #D3DAEC、圆角 4px
 * - 标题在卡片内绝对定位 top/left ≈18px：减号 15×15（#2036CA）+ 标题 16px Bold（字幕/热词 #21243D，建议 #303030）
 * - 正文区相对卡片顶约 52px、左右约 19px（与稿一致）
 */
.info-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid #d3daec;
  border-radius: 4px;
  background: #fff;
  box-sizing: border-box;
}

.info-panel--subtitles {
  flex: 1;
  min-height: 180px;
}

.info-panel--subtitles.info-panel--collapsed {
  flex: 0 0 auto;
  min-height: 70px;
}

.info-panel--keywords,
.info-panel--suggest {
  flex: 0 0 auto;
}

.info-panel--keywords.info-panel--collapsed,
.info-panel--suggest.info-panel--collapsed {
  min-height: 70px;
}

.info-panel__toggle {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  cursor: pointer;
  text-align: left;
  color: inherit;
}

.info-panel__toggle--suggest {
  position: static;
  flex: 0 1 auto;
  min-width: 0;
}

.info-panel__head-row {
  position: absolute;
  top: 16px;
  left: 18px;
  right: 18px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.info-panel__fold-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 展开：与侧栏「新增客户」.add-customer-btn 一致，底色为收起图标同款蓝 #2036CA */
.info-panel__expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  background: #2036ca;
  border-radius: 4px;
  box-sizing: border-box;
}

.info-panel__expand-btn img {
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  object-fit: contain;
}

.info-panel__fold-img {
  display: block;
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.info-panel__heading {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.02em;
  color: #21243d;
}

.info-panel__heading--suggest {
  color: #303030;
}

.info-panel__content {
  padding: 52px 19px 16px;
  box-sizing: border-box;
  min-height: 0;
}

.info-panel__content--scroll {
  overflow: auto;
  flex: 1 1 auto;
}

.info-panel--subtitles:not(.info-panel--collapsed) .info-panel__content--scroll {
  flex: 1 1 auto;
  min-height: 140px;
}

.info-panel--suggest .info-panel__content {
  padding-top: 52px;
}

.info-panel--suggest:not(.info-panel--collapsed) {
  min-height: 200px;
}

/* 访谈字幕：对齐 ai-admin InterviewTranscriptCard（transcript-list / speaker-tag / entry-divider） */
.subtitle-feed {
  min-width: 0;
}

.transcript-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.transcript-entry {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.entry-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.speaker-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 100px;
  background: #dbe7ff;
}

.speaker-tag-active {
  background: #2036ca;
}

.speaker-tag-active .speaker-name {
  color: #fff;
}

.speaker-person-icon {
  width: 11px;
  height: 14px;
  flex-shrink: 0;
  display: block;
}

.speaker-name {
  font-size: 14px;
  color: #2d3149;
  line-height: 1;
}

.entry-time {
  font-size: 14px;
  color: #a6a6a6;
  font-variant-numeric: tabular-nums;
}

.entry-time--live {
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #a6a6a6;
}

.entry-text {
  margin: 0;
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.32px;
  color: #21243d;
  white-space: pre-wrap;
  word-break: break-word;
}

.entry-divider {
  height: 0;
  border-bottom: 1px solid #e8e8e8;
  margin-top: 10px;
}

.transcript-entry--live .speaker-tag {
  background: #2036ca;
}

.transcript-entry--live .speaker-name {
  color: #fff;
}

.subtitle-placeholder {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #606060;
  white-space: pre-wrap;
  word-break: break-word;
}

.interview-error {
  margin: 10px 0 0;
  font-size: 13px;
  color: #ff4646;
}

.keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 4px 0 4px;
}

.keyword-chip {
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
  color: #21243d;
  background: #f0f4ff;
}

.keyword-empty {
  margin: 0;
  padding: 4px 0;
  font-size: 13px;
  color: #a6a6a6;
}

.info-panel--suggest .suggest-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 4px 0 0;
}

.suggest-line {
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 13px;
  color: #606060;
  background: #f0f4ff;
}

.suggest-line--ghost {
  background: #fafafa;
  border: 1px dashed #e8e8e8;
  color: #8c8c8c;
}

.add-suggest-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 20px;
  padding: 0 10px 0 24px;
  border: none;
  border-radius: 3px;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: #a6a6a6;
  background: #e1e7f9;
  cursor: not-allowed;
  font-family: inherit;
}

.add-suggest-btn__plus {
  font-size: 14px;
  line-height: 1;
}

@media (max-width: 1400px) {
  .interview-chrome :deep(.top-header) {
    padding-left: 24px;
    padding-right: 24px;
  }

  .interview-main-card {
    margin-left: 16px;
    margin-right: 16px;
  }

  .interview-recording-wrap {
    max-width: none;
    justify-content: flex-start;
    width: 100%;
  }
}
</style>
