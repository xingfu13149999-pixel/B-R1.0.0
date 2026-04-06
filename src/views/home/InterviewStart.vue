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
          <el-button type="danger" :loading="stopConfirmInProgress" @click="confirmStop">确认结束</el-button>
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
          <!-- 历史回看须优先于「session 恢复」：否则 recordId 在 URL 时会先误恢复现场再加载历史，胶囊状态错乱 -->
          <!-- 历史「录音中」：与现场已暂停/录音中条一致（波形 + 文案 + 继续/结束），避免仅灰条无按钮 -->
          <div
            v-if="isViewingHistory && historyView?.status === 'recording'"
            class="recording-bar"
            :class="{ 'recording-bar--paused': historyRecordingCapsulePausedStyle }"
          >
            <div class="waveform" :class="{ 'waveform-paused': historyRecordingCapsulePausedStyle }">
              <span v-for="(h, i) in waveBars" :key="'hist-w-' + i" class="wave-bar-wrap">
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
            <span class="recording-text">{{ historyRecordingCapsuleText }}</span>
            <el-tooltip content="继续录音" placement="bottom" :show-after="300">
              <button type="button" class="ctrl-btn" @click="continueFromHistoryRecording">
                <img :src="playBtn" alt="继续" />
              </button>
            </el-tooltip>
            <el-tooltip content="结束录音" placement="bottom" :show-after="300">
              <button type="button" class="ctrl-btn" @click="onStopClick">
                <img :src="stopBtn" alt="结束" />
              </button>
            </el-tooltip>
          </div>
          <div
            v-else-if="isViewingHistory"
            class="recording-bar recording-bar--history"
          >
            <span class="recording-text">{{ historyBarText }}</span>
          </div>

          <!-- 刷新恢复（暂停/录音中断）：显示暂停状态 + 继续 / 结束 按钮 -->
          <div
            v-else-if="restoredFromSession && recorderStatus === 'idle' && capsuleDisplayStatus === 'paused'"
            class="recording-bar recording-bar--paused"
          >
            <div class="waveform waveform-paused">
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
            <el-tooltip content="继续录音" placement="bottom" :show-after="300">
              <button type="button" class="ctrl-btn" @click="resumeFromRestore">
                <img :src="playBtn" alt="继续" />
              </button>
            </el-tooltip>
            <el-tooltip content="结束录音" placement="bottom" :show-after="300">
              <button type="button" class="ctrl-btn" @click="onStopClick">
                <img :src="stopBtn" alt="结束" />
              </button>
            </el-tooltip>
          </div>

          <!-- 未开始：开始录音按钮 -->
          <div v-else-if="recorderStatus === 'idle' && !restoredFromSession" class="start-bar">
            <el-tooltip content="开始录音" placement="bottom" :show-after="300">
              <button type="button" class="start-record-btn" @click="startRecording">
                <img :src="recordStartBtn" alt="开始录音" />
              </button>
            </el-tooltip>
          </div>

          <!-- 录音中 / 已暂停 -->
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
            :recorder-status="effectiveRecorderStatus"
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
              <p v-if="hotKeywords.length && hotKeywordsAiLoading" class="keyword-ai-hint">
                AI 正在刷新关键热词…
              </p>
              <p v-else-if="!hotKeywords.length" class="keyword-empty">
                <template v-if="hotKeywordsAiLoading">AI 正在提炼关键热词…</template>
                <template v-else>{{
                  recorderStatus === 'idle' ? '开始录音后将自动提取关键词' : '正在聆听，关键词将随对话内容实时更新...'
                }}</template>
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
import {
  computed,
  nextTick,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch
} from 'vue'
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
import { extractKeywords } from '@/views/home/utils/interviewKeywordExtract'
import {
  fetchInterviewHotKeywordsFromTranscript,
  MIN_TRANSCRIPT_CHARS_FOR_AI_HOT_KEYWORDS
} from '@/views/home/utils/interviewHotKeywordsFromAi'
import type { InterviewSummaryBlock } from '@/views/home/types/interviewSummary'
import {
  appendProjectInterviewRecord,
  deleteProjectInterviewRecord,
  getProjectInterviewRecord,
  getProjectInterviewRecords,
  nextInterviewTitle,
  updateProjectInterviewRecord,
} from '@/views/home/utils/interviewRecordsStorage'
import {
  clearInterviewSessionCachesForProject,
  INTERVIEW_SESSION_HOT_KEYWORDS_PREFIX,
  interviewHotKeywordsSessionKey,
  persistInterviewTranscriptSegments,
  persistInterviewRecorderState,
  readInterviewRecorderState,
  readInterviewLiveSummaryFromSession,
  readInterviewTranscriptSegmentsFromSession
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
  let raw = ''
  if (Array.isArray(q)) raw = q[0] ?? ''
  else if (typeof q === 'string' && q) raw = q
  else {
    const sid = appStore.selectedCustomerId
    raw = typeof sid === 'string' ? sid : ''
  }
  return raw.trim()
})

/** 仅侧栏点击「开始访谈」时写入；F5 刷新不会写入，用于区分「新开本会话」与「刷新保留现场」 */
const SIDEBAR_FRESH_INTENT_KEY = 'pd-interview-sidebar-fresh-intent'

function consumeSidebarFreshIntent(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  try {
    const v = sessionStorage.getItem(SIDEBAR_FRESH_INTENT_KEY)
    if (!v) return false
    sessionStorage.removeItem(SIDEBAR_FRESH_INTENT_KEY)
    return true
  } catch {
    return false
  }
}

/** 去掉 URL 中的 fresh，保留 nodeId / recordId / fromRecords，不碰 sessionStorage 现场 */
function buildInterviewQueryWithoutFresh(): Record<string, string> | null {
  const pid = nodeId.value?.trim()
  if (!pid) return null
  const next: Record<string, string> = { nodeId: pid }
  const rid = route.query.recordId
  if (rid) {
    const r = Array.isArray(rid) ? rid[0] : typeof rid === 'string' ? rid : ''
    if (r) next.recordId = r
  }
  const frSrc = route.query.fromRecords
  if (frSrc) {
    const f = Array.isArray(frSrc) ? frSrc[0] : typeof frSrc === 'string' ? frSrc : ''
    if (f) next.fromRecords = f
  }
  return next
}

/**
 * 侧栏「开始访谈」带 query.fresh=时间戳：新开本会话，清同项目旧 session。
 * 整页刷新若 URL 仍含 stale 的 fresh（例如 replace 未完成），不得清 session：由侧栏写入的
 * sessionStorage intent 区分；无 intent 时仅 strip 掉 query.fresh。
 */
function shouldClearStaleInterviewSessionOnEntry(): boolean {
  const frSrc = route.query.fromRecords
  const fromRecordsVal = Array.isArray(frSrc) ? frSrc[0] : frSrc
  if (String(fromRecordsVal ?? '') === '1') return false
  const fq = route.query.fresh
  const freshVal = Array.isArray(fq) ? fq[0] : fq
  if (freshVal == null || String(freshVal).trim() === '') return false
  const q = route.query.recordId
  const hasRecord = (Array.isArray(q) ? q[0] ?? '' : typeof q === 'string' ? q : '').trim()
  if (hasRecord) return false
  const pid = nodeId.value?.trim()
  if (!pid) return false
  return true
}

/**
 * 侧栏「开始访谈」= 新录音会话：清空本页现场数据（与新建一条访谈记录前的空白态一致）。
 * 同页复用时子组件不会 remount，须同步清总结内存 + 退出历史回看 + 重置录音器。
 */
function applyFreshInterviewSessionFromSidebar() {
  if (route.name !== 'Interview') return
  if (!shouldClearStaleInterviewSessionOnEntry()) return
  const pid = nodeId.value?.trim()
  if (!pid) return

  /** F5 等整页刷新：URL 可能仍带 ?fresh=，但无侧栏 intent，禁止清空现场，只规范 URL */
  if (!consumeSidebarFreshIntent()) {
    const next = buildInterviewQueryWithoutFresh()
    if (next) void router.replace({ name: 'Interview', query: next })
    return
  }

  /** 自动将未完成的「录音中」记录保存为 completed，防止点"开始访谈"丢失旧数据 */
  const openRecordings = getProjectInterviewRecords(pid).filter(r => r.status === 'recording')
  if (openRecordings.length) {
    const segs = readInterviewTranscriptSegmentsFromSession(pid) ?? []
    const savedState = readInterviewRecorderState(pid)
    const summaryBlocks = readInterviewLiveSummaryFromSession(pid) ?? []
    for (const rec of openRecordings) {
      const patch: Record<string, unknown> = {
        status: 'completed',
        durationMs: savedState?.durationMs || rec.durationMs,
        segments: segs.length ? JSON.parse(JSON.stringify(segs)) : rec.segments
      }
      if (summaryBlocks.length) {
        patch.summaryBlocks = summaryBlocks
        patch.summaryGeneratedAt = Date.now()
      }
      updateProjectInterviewRecord(pid, rec.id, patch)
    }
    window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId: pid } }))
  }

  historyView.value = null
  currentSessionRecordId.value = null
  lastCompletedSessionRecordId.value = null
  interviewPersistCompleted.value = false
  restoredSessionDurationMs.value = 0
  restoredFromSession.value = false
  clearInterviewSessionCachesForProject(pid)
  persistedHotKeywords.value = []
  aiHotKeywords.value = []
  hotKwCachedTranscriptSig.value = ''
  hotKwRequestId++
  resetTranscription()
  resetRecorder()
  if (summaryPanelRef.value) {
    summaryPanelRef.value.resetLiveSummaryMemory()
  } else {
    void nextTick(() => summaryPanelRef.value?.resetLiveSummaryMemory?.())
  }
  void nextTick(() => {
    persistedHotKeywords.value = []
    aiHotKeywords.value = []
    hotKwCachedTranscriptSig.value = ''
    summaryPanelRef.value?.resetLiveSummaryMemory?.()
    const next = buildInterviewQueryWithoutFresh()
    if (next) void router.replace({ name: 'Interview', query: next })
  })
}

/**
 * 访谈仅绑定「项目」节点；公司客户或集团父节点不可进入（与侧栏「开始访谈」一致）。
 * 刷新时 liveCustomerTreeItems 会被重新初始化为 mock 数据，动态新增的项目丢失，
 * 因此首次 immediate 执行以及有 session/localStorage 数据的场景不做跳转。
 */
let nodeIdRouteGuardReady = false
watch(
  () => nodeId.value?.trim(),
  (id, prevId) => {
    if (prevId && id && prevId !== id) lastCompletedSessionRecordId.value = null
  }
)
watch(
  () => nodeId.value,
  id => {
    if (!id) return
    if (!nodeIdRouteGuardReady) {
      nodeIdRouteGuardReady = true
      return
    }
    const list = liveCustomerTreeItems.value
    if (isProjectRouteTarget(list, id)) return
    const hasSessionData =
      readInterviewTranscriptSegmentsFromSession(id) !== null ||
      readInterviewRecorderState(id) !== null ||
      getProjectInterviewRecords(id).length > 0
    if (hasSessionData) return
    router.replace({ name: 'Home' })
  },
  { immediate: true }
)

const historyView = ref<{
  segments: InterviewTranscriptSegment[]
  durationMs: number
  title: string
  status?: string
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

/**
 * 落库完成后 currentSessionRecordId 会被清空，但热词 session 仍按 recordId 分键；
 * 用该字段保留「刚结束的这一条」的 id，供 hotKeywordsScopeRecordId 回退，避免结束瞬间热词被清空。
 */
const lastCompletedSessionRecordId = ref<string | null>(null)

function markInterviewRecordPersistCompleted(completedRecordId: string) {
  const id = completedRecordId.trim()
  if (id) lastCompletedSessionRecordId.value = id
  currentSessionRecordId.value = null
}

/** 本次录音会话是否已落库完成；防止连点「确认结束」或重复调用 persist 时第二条走 append 分支产生重复记录 */
const interviewPersistCompleted = ref(false)

/** 结束录音确认流程进行中，防止确认按钮连点触发竞态 */
const stopConfirmInProgress = ref(false)

/** 刷新后从 sessionStorage 恢复的录音时长（毫秒），用于 UI 展示；续录时新时长在此基础上累加 */
const restoredSessionDurationMs = ref(0)
/** 刷新后检测到上次处于录音/暂停状态（MediaRecorder 已不可恢复，仅影响 UI 展示逻辑） */
const restoredFromSession = ref(false)
/** 刷新前的精确录音状态（recording / paused / stopped），用于区分恢复后的 UI 样式 */
const restoredLastStatus = ref<'recording' | 'paused' | 'stopped' | 'idle'>('paused')

const isViewingHistory = computed(() => historyView.value !== null)

/**
 * 对子组件（InterviewSummaryPanel 等）传递的等效录音状态：
 * 刷新恢复且胶囊为「可继续」态时与 capsuleDisplayStatus 一致传 paused，否则实时总结的防抖永远不触发。
 * 仅真正结束态传 stopped。
 */
const effectiveRecorderStatus = computed<typeof recorderStatus.value>(() => {
  if (recorderStatus.value === 'idle' && restoredFromSession.value) {
    return capsuleDisplayStatus.value
  }
  return recorderStatus.value
})

/**
 * 胶囊 UI 的显示状态：
 * - 刷新恢复 + 之前是 recording/paused → 显示 paused（用户可继续或结束）
 * - 刷新恢复 + 之前是 stopped → 显示 stopped
 * - 其余情况跟 recorderStatus 一致
 */
const capsuleDisplayStatus = computed<typeof recorderStatus.value>(() => {
  if (recorderStatus.value === 'idle' && restoredFromSession.value) {
    const last = restoredLastStatus.value
    if (last === 'recording' || last === 'paused') return 'paused'
    return 'stopped'
  }
  return recorderStatus.value
})

const showRecordingCapsule = computed(() => {
  /** 历史回看：仅「录音中」条目需要胶囊（继续/结束）；已完成记录只读，不显示胶囊、不提供本页开录 */
  if (isViewingHistory.value) {
    return recorderStatus.value === 'idle' && historyView.value?.status === 'recording'
  }
  if (restoredFromSession.value) {
    return capsuleDisplayStatus.value !== 'stopped'
  }
  return recorderStatus.value !== 'stopped'
})

/** 历史条有字幕时用历史；若 localStorage 里 segments 仍为空但内存/session 有稿，必须回退到现场，避免 [] 盖住字幕 */
const effectiveSegments = computed(() => {
  const hv = historyView.value
  if (hv?.segments?.length) return hv.segments
  return subtitleSegments.value
})

/**
 * 热词仅归属当前这条访谈记录（sessionStorage 按 recordId 分键），
 * 不写入 localStorage 访谈列表，也不与同项目其它记录共用缓存。
 */
const hotKeywordsScopeRecordId = computed(() => {
  if (isViewingHistory.value) {
    const q = route.query.recordId
    const r = Array.isArray(q) ? q[0] ?? '' : typeof q === 'string' ? q : ''
    return (r || '').trim()
  }
  const cur = (currentSessionRecordId.value ?? '').trim()
  if (cur) return cur
  return (lastCompletedSessionRecordId.value ?? '').trim()
})

/** 与当前热词对应的逐字稿指纹；一致时不重复请求 AI（重进访谈页亦然） */
function hashHotKwTranscript(t: string): string {
  if (!t.length) return '0:'
  let h = 5381
  for (let i = 0; i < t.length; i++) h = (h * 33) ^ t.charCodeAt(i)
  return `${t.length}:${(h >>> 0).toString(36)}`
}

function parseHotKeywordsSessionRaw(raw: string): { words: string[]; transcriptSig: string } {
  try {
    const data = JSON.parse(raw) as { words?: string[]; transcriptSig?: string }
    const words = Array.isArray(data.words)
      ? data.words.filter((w): w is string => typeof w === 'string' && Boolean(w.trim()))
      : []
    const transcriptSig = typeof data.transcriptSig === 'string' ? data.transcriptSig : ''
    return { words, transcriptSig }
  } catch {
    return { words: [], transcriptSig: '' }
  }
}

function saveHotKeywordsForRecord(
  projectId: string,
  recordId: string,
  words: string[],
  transcriptSig?: string
) {
  if (!projectId || !recordId || typeof sessionStorage === 'undefined' || !words.length) return
  const key = interviewHotKeywordsSessionKey(projectId, recordId)
  if (!key) return
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        words,
        updatedAt: Date.now(),
        ...(transcriptSig ? { transcriptSig } : {})
      })
    )
  } catch {
    /* ignore quota */
  }
}

/** 按 projectId + recordId；兼容旧版仅 projectId 的键并迁移到当前记录 */
function loadHotKeywordsForRecord(projectId: string, recordId: string): { words: string[]; transcriptSig: string } {
  if (!projectId || !recordId || typeof sessionStorage === 'undefined') return { words: [], transcriptSig: '' }
  try {
    const key = interviewHotKeywordsSessionKey(projectId, recordId)
    if (key) {
      const raw = sessionStorage.getItem(key)
      if (raw) return parseHotKeywordsSessionRaw(raw)
    }
    const legacyKey = `${INTERVIEW_SESSION_HOT_KEYWORDS_PREFIX}${projectId}`
    const legacyRaw = sessionStorage.getItem(legacyKey)
    if (legacyRaw) {
      const parsed = parseHotKeywordsSessionRaw(legacyRaw)
      if (parsed.words.length) {
        saveHotKeywordsForRecord(projectId, recordId, parsed.words, parsed.transcriptSig || undefined)
        sessionStorage.removeItem(legacyKey)
      }
      return parsed
    }
  } catch {
    /* ignore */
  }
  return { words: [], transcriptSig: '' }
}

const persistedHotKeywords = ref<string[]>([])
/** 配置 DeepSeek 时由 AI 提炼；与 session 恢复时从 persisted 同步 */
const aiHotKeywords = ref<string[]>([])
const hotKeywordsAiLoading = ref(false)
/** 与 persisted 热词对应的逐字稿指纹，用于重进页面跳过重复 AI */
const hotKwCachedTranscriptSig = ref('')

let hotKwRequestId = 0

function syncHotKeywordsPersistedFromSession() {
  const pid = nodeId.value?.trim()
  const rid = hotKeywordsScopeRecordId.value
  if (!pid || !rid) {
    persistedHotKeywords.value = []
    aiHotKeywords.value = []
    hotKwCachedTranscriptSig.value = ''
    hotKwRequestId++
    return
  }
  const { words, transcriptSig } = loadHotKeywordsForRecord(pid, rid)
  persistedHotKeywords.value = words
  aiHotKeywords.value = [...words]
  hotKwCachedTranscriptSig.value = transcriptSig
  hotKwRequestId++
}
let hotKwDebounceTimer: ReturnType<typeof setTimeout> | null = null
let historyHotKwImmediateTimer: ReturnType<typeof setTimeout> | null = null
const HOT_KW_AI_DEBOUNCE_MS = 10_000
/** 与 MIN_TRANSCRIPT_CHARS_FOR_AI_HOT_KEYWORDS 一致，满足后由 DeepSeek 提炼 */
const MIN_HOT_KW_AI_CHARS = MIN_TRANSCRIPT_CHARS_FOR_AI_HOT_KEYWORDS
const MIN_HOT_KW_AI_CHARS_HISTORY = MIN_TRANSCRIPT_CHARS_FOR_AI_HOT_KEYWORDS

function buildHotKeywordsTranscript(): string {
  const lines = effectiveSegments.value.map(s => `${s.speakerLabel}：${s.text}`)
  const interim = subtitleInterimText.value?.trim()
  if (
    interim &&
    (recorderStatus.value === 'recording' || recorderStatus.value === 'paused') &&
    !isViewingHistory.value
  ) {
    lines.push(`${liveSpeakerLabel.value}（正在识别）：${interim}`)
  }
  return lines.join('\n').trim()
}

function scheduleHotKeywordsAiFetch() {
  if (!import.meta.env.VITE_DEEPSEEK_API_KEY) return
  if (hotKwDebounceTimer) clearTimeout(hotKwDebounceTimer)
  hotKwDebounceTimer = setTimeout(() => {
    hotKwDebounceTimer = null
    void runHotKeywordsAiFetch()
  }, HOT_KW_AI_DEBOUNCE_MS)
}

async function runHotKeywordsAiFetch() {
  if (!import.meta.env.VITE_DEEPSEEK_API_KEY) return
  const transcript = buildHotKeywordsTranscript()
  const sig = hashHotKwTranscript(transcript)
  if (
    aiHotKeywords.value.length > 0 &&
    hotKwCachedTranscriptSig.value !== '' &&
    sig === hotKwCachedTranscriptSig.value
  ) {
    return
  }
  const minChars = isViewingHistory.value ? MIN_HOT_KW_AI_CHARS_HISTORY : MIN_HOT_KW_AI_CHARS
  if (transcript.length < minChars) return
  const reqId = ++hotKwRequestId
  hotKeywordsAiLoading.value = true
  try {
    const words = await fetchInterviewHotKeywordsFromTranscript(transcript)
    if (reqId !== hotKwRequestId) return
    aiHotKeywords.value = words
    const pid = nodeId.value?.trim()
    const rid = hotKeywordsScopeRecordId.value
    if (pid && rid && words.length) {
      persistedHotKeywords.value = words
      hotKwCachedTranscriptSig.value = sig
      saveHotKeywordsForRecord(pid, rid, words, sig)
    }
  } finally {
    if (reqId === hotKwRequestId) hotKeywordsAiLoading.value = false
  }
}

const hotKeywords = computed(() => {
  const allText =
    effectiveSegments.value.map(s => s.text).join('') + (subtitleInterimText.value ?? '')
  const fallback = extractKeywords(allText)
  if (!import.meta.env.VITE_DEEPSEEK_API_KEY) {
    if (fallback.length) return fallback
    return persistedHotKeywords.value
  }
  /** 已配置 Key 时只展示 AI 结果（含 session 恢复的 persisted），避免本地 n-gram 与模型抢显 */
  if (aiHotKeywords.value.length) return aiHotKeywords.value
  return persistedHotKeywords.value
})

watch(
  () => [nodeId.value, hotKeywordsScopeRecordId.value] as const,
  () => {
    syncHotKeywordsPersistedFromSession()
  },
  { immediate: true }
)

watch(
  () =>
    [
      nodeId.value,
      effectiveSegments.value,
      subtitleInterimText.value,
      recorderStatus.value,
      isViewingHistory.value
    ] as const,
  () => {
    scheduleHotKeywordsAiFetch()
  },
  { deep: true }
)

/** 历史回看/有现成字幕时尽快拉取热词，不再等 12s 防抖；短防抖合并分段写入，避免连打 API */
watch(
  () => [isViewingHistory.value, effectiveSegments.value.length] as const,
  ([vh, segLen]) => {
    if (!import.meta.env.VITE_DEEPSEEK_API_KEY) return
    if (!vh || segLen < 1) return
    if (historyHotKwImmediateTimer) clearTimeout(historyHotKwImmediateTimer)
    historyHotKwImmediateTimer = setTimeout(() => {
      historyHotKwImmediateTimer = null
      void runHotKeywordsAiFetch()
    }, 400)
  }
)

watch(
  () => [nodeId.value, effectiveSegments.value, subtitleInterimText.value] as const,
  () => {
    if (import.meta.env.VITE_DEEPSEEK_API_KEY) return
    const pid = nodeId.value?.trim()
    if (!pid) return
    const allText =
      effectiveSegments.value.map(s => s.text).join('') + (subtitleInterimText.value ?? '')
    const words = extractKeywords(allText)
    const rid = hotKeywordsScopeRecordId.value
    if (words.length && rid) {
      const transcript = buildHotKeywordsTranscript()
      const sig = hashHotKwTranscript(transcript)
      persistedHotKeywords.value = words
      hotKwCachedTranscriptSig.value = sig
      saveHotKeywordsForRecord(pid, rid, words, sig)
    }
  },
  { deep: true }
)

const effectiveDurationMs = computed(
  () => historyView.value?.durationMs ?? (durationMs.value + restoredSessionDurationMs.value)
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
  const pid = nid.trim()
  let segments: InterviewTranscriptSegment[] =
    Array.isArray(rec.segments) && rec.segments.length
      ? (JSON.parse(JSON.stringify(rec.segments)) as InterviewTranscriptSegment[])
      : []
  if (!segments.length) {
    const fromSession = readInterviewTranscriptSegmentsFromSession(pid)
    if (fromSession?.length) {
      segments = JSON.parse(JSON.stringify(fromSession)) as InterviewTranscriptSegment[]
    }
  }
  if (!segments.length && subtitleSegments.value.length) {
    segments = JSON.parse(JSON.stringify(subtitleSegments.value)) as InterviewTranscriptSegment[]
  }
  historyView.value = {
    segments,
    durationMs: rec.durationMs,
    title: rec.title,
    status: rec.status,
    summaryBlocks: rec.summaryBlocks
  }
  /** 避免与「仅现场 session 恢复」冲突，防止胶囊错显为暂停恢复态 */
  restoredFromSession.value = false
  restoredSessionDurationMs.value = 0
  restoredLastStatus.value = 'paused'
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
  const d = (ev as CustomEvent<{ projectId?: string; recordId?: string }>).detail
  if (!d?.projectId || d.projectId !== nodeId.value?.trim()) return
  lastCompletedSessionRecordId.value = null
  if (d.recordId && d.recordId === currentSessionRecordId.value) {
    stopTranscription()
    void stopRecorder()
    currentSessionRecordId.value = null
    interviewPersistCompleted.value = false
  }
  restoredSessionDurationMs.value = 0
  restoredFromSession.value = false
  persistedHotKeywords.value = []
  aiHotKeywords.value = []
  hotKwCachedTranscriptSig.value = ''
  resetTranscription()
  summaryPanelRef.value?.resetLiveSummaryMemory?.()
}

let sessionSnapshotTimer: ReturnType<typeof setTimeout> | null = null
const SESSION_SNAPSHOT_DEBOUNCE_MS = 400

/** 字幕 / 总结 / 热词 / 录音状态一并写入 sessionStorage，供刷新与关页恢复 */
function persistSessionSnapshot() {
  const pid = nodeId.value?.trim()
  if (!pid || typeof sessionStorage === 'undefined') return
  try {
    const segs = subtitleSegments.value
    if (segs.length) persistInterviewTranscriptSegments(pid, segs)
    summaryPanelRef.value?.saveLiveCacheToSession?.()
    const rid = hotKeywordsScopeRecordId.value?.trim()
    if (persistedHotKeywords.value.length && rid) {
      saveHotKeywordsForRecord(
        pid,
        rid,
        persistedHotKeywords.value,
        hotKwCachedTranscriptSig.value || undefined
      )
    }
    const dur = effectiveDurationMs.value
    const status = recorderStatus.value
    const isActive = status === 'recording' || status === 'paused'
    const lastStatus = restoredFromSession.value && status === 'idle'
      ? (restoredLastStatus.value || 'paused')
      : status
    if (dur > 0 || isActive || status === 'stopped' || restoredFromSession.value) {
      persistInterviewRecorderState(pid, {
        durationMs: dur,
        wasRecording: isActive,
        lastStatus: lastStatus as 'recording' | 'paused' | 'stopped' | 'idle'
      })
    }
    syncActiveRecordingToLocalStorage(pid, segs, dur)
  } catch {
    /* 防止任何异常导致刷新前落盘中断 */
  }
}

/** 将录音中的字幕/时长/总结同步到 localStorage 记录，确保双击查看时数据完整 */
function syncActiveRecordingToLocalStorage(
  pid: string,
  segs: InterviewTranscriptSegment[],
  dur: number
) {
  const rid = currentSessionRecordId.value
  if (!rid || !segs.length) return
  const status = recorderStatus.value
  if (status !== 'recording' && status !== 'paused' && !restoredFromSession.value) return
  const segments = JSON.parse(JSON.stringify(segs)) as InterviewTranscriptSegment[]
  const patch: Record<string, unknown> = { durationMs: dur, segments }
  const summaryBlocks = summaryPanelRef.value?.getSummaryBlocks?.() ?? []
  if (summaryBlocks.length) {
    patch.summaryBlocks = summaryBlocks
    patch.summarizerName = appStore.currentUser.name
    patch.summaryGeneratedAt = Date.now()
  }
  updateProjectInterviewRecord(pid, rid, patch)
}

function schedulePersistSessionSnapshot() {
  if (sessionSnapshotTimer) clearTimeout(sessionSnapshotTimer)
  sessionSnapshotTimer = setTimeout(() => {
    sessionSnapshotTimer = null
    persistSessionSnapshot()
  }, SESSION_SNAPSHOT_DEBOUNCE_MS)
}

/** 刷新/关标签前同步落盘（先于 Vue 卸载与转写 composable 清理） */
function onPageHideOrFreeze() {
  if (sessionSnapshotTimer) {
    clearTimeout(sessionSnapshotTimer)
    sessionSnapshotTimer = null
  }
  persistSessionSnapshot()
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') onPageHideOrFreeze()
}

/** 刷新后内存中的 currentSessionRecordId 丢失，从 localStorage 录音中条目恢复，便于继续写入同一条 */
function tryRestoreSessionRecordId() {
  const pid = nodeId.value?.trim()
  if (!pid || currentSessionRecordId.value) return
  const open = getProjectInterviewRecords(pid).find(r => r.status === 'recording')
  if (open) currentSessionRecordId.value = open.id
}

watch(
  () => subtitleSegments.value,
  () => {
    if (isViewingHistory.value) return
    const pid = nodeId.value?.trim()
    if (!pid || !subtitleSegments.value.length) return
    schedulePersistSessionSnapshot()
  },
  { deep: true }
)

watch(
  () => recorderStatus.value,
  s => {
    if (isViewingHistory.value) return
    if (s === 'recording' || s === 'paused' || s === 'stopped') {
      persistSessionSnapshot()
    }
  }
)

onBeforeMount(() => {
  window.addEventListener('pagehide', onPageHideOrFreeze)
  window.addEventListener('beforeunload', onPageHideOrFreeze)
  document.addEventListener('visibilitychange', onVisibilityChange)
  applyFreshInterviewSessionFromSidebar()
})

watch(
  () => [route.query.nodeId, route.query.fresh, route.query.recordId, route.query.fromRecords] as const,
  () => {
    applyFreshInterviewSessionFromSidebar()
  }
)

onMounted(() => {
  window.addEventListener('pd-interview-session-cache-cleared', onInterviewSessionCacheCleared as EventListener)
  const id = nodeId.value
  if (id) appStore.setSelectedCustomer(id)
  /** 刷新后 Pinia 从 localStorage 恢复选中项，但地址栏可能无 nodeId；补全 query，避免下次刷新丢项目上下文 */
  void nextTick(() => {
    const nid = nodeId.value?.trim()
    if (!nid) return
    const q = route.query.nodeId
    const cur = Array.isArray(q) ? q[0] ?? '' : typeof q === 'string' ? q : ''
    if (!cur.trim()) {
      const next: Record<string, string> = { nodeId: nid }
      const rid = route.query.recordId
      if (rid) {
        const r = Array.isArray(rid) ? rid[0] : typeof rid === 'string' ? rid : ''
        if (r) next.recordId = r
      }
      const fr = route.query.fromRecords
      if (fr) {
        const f = Array.isArray(fr) ? fr[0] : typeof fr === 'string' ? fr : ''
        if (f) next.fromRecords = f
      }
      void router.replace({ name: 'Interview', query: next })
    }
  })
  void nextTick(() => {
    const rq = route.query.recordId
    const routeRid = (Array.isArray(rq) ? rq[0] ?? '' : typeof rq === 'string' ? rq : '').trim()
    /** 地址栏要带某条记录时勿先恢复现场 session，否则与 historyView 竞态导致胶囊状态错乱 */
    if (routeRid) return
    if (isViewingHistory.value) return
    const pid = nodeId.value?.trim()
    if (!pid) return
    if (subtitleSegments.value.length) return
    const fromSession = readInterviewTranscriptSegmentsFromSession(pid)
    if (fromSession?.length) {
      restoreTranscriptionSegments(fromSession)
      const saved = readInterviewRecorderState(pid)
      if (saved) {
        restoredSessionDurationMs.value = saved.durationMs
        restoredLastStatus.value = saved.lastStatus ?? (saved.wasRecording ? 'paused' : 'stopped')
        restoredFromSession.value = true
      }
    }
    tryRestoreSessionRecordId()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('pd-interview-session-cache-cleared', onInterviewSessionCacheCleared as EventListener)
  window.removeEventListener('pagehide', onPageHideOrFreeze)
  window.removeEventListener('beforeunload', onPageHideOrFreeze)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (sessionSnapshotTimer) {
    clearTimeout(sessionSnapshotTimer)
    sessionSnapshotTimer = null
  }
  if (hotKwDebounceTimer) {
    clearTimeout(hotKwDebounceTimer)
    hotKwDebounceTimer = null
  }
  if (historyHotKwImmediateTimer) {
    clearTimeout(historyHotKwImmediateTimer)
    historyHotKwImmediateTimer = null
  }
  hotKwRequestId++
  onPageHideOrFreeze()
})

onActivated(() => {
  syncHotKeywordsPersistedFromSession()
  void nextTick(() => {
    const pid = nodeId.value?.trim()
    const rq = route.query.recordId
    const routeRid = (Array.isArray(rq) ? rq[0] ?? '' : typeof rq === 'string' ? rq : '').trim()
    if (routeRid) return
    if (isViewingHistory.value) return
    if (!pid) return
    if (subtitleSegments.value.length) return
    const fromSession = readInterviewTranscriptSegmentsFromSession(pid)
    if (fromSession?.length) {
      restoreTranscriptionSegments(fromSession)
      const saved = readInterviewRecorderState(pid)
      if (saved) {
        restoredSessionDurationMs.value = saved.durationMs
        restoredLastStatus.value = saved.lastStatus ?? (saved.wasRecording ? 'paused' : 'stopped')
        restoredFromSession.value = true
      }
    }
    tryRestoreSessionRecordId()
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
  const s = capsuleDisplayStatus.value
  switch (s) {
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

const historyBarText = computed(() => {
  const t = formattedDuration.value
  const s = historyView.value?.status
  if (s === 'completed') return `录音已结束 ${t}`
  return t ? `录音时长 ${t}` : ''
})

/** 历史「录音中」胶囊：与现场暂停条一致用 session 的 lastStatus 区分波形；无缓存时默认已暂停 */
const historyRecordingCapsulePausedStyle = computed(() => {
  if (!isViewingHistory.value || historyView.value?.status !== 'recording') return true
  const pid = nodeId.value?.trim()
  if (!pid) return true
  const last = readInterviewRecorderState(pid)?.lastStatus
  if (last === 'recording') return false
  return true
})

const historyRecordingCapsuleText = computed(() => {
  const t = formattedDuration.value
  if (historyRecordingCapsulePausedStyle.value) return `已暂停... ${t}`
  return `速写中... ${t}`
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
  const s = capsuleDisplayStatus.value
  if (subtitleRecognitionError.value) return '实时字幕暂不可用，但录音仍可继续。'
  if (s === 'recording') return '正在聆听，请开始发言，字幕会实时展示在这里。'
  if (s === 'paused') return '录音已暂停，继续后会从这里接着转写。'
  if (s === 'stopped') return '本次录音已结束，字幕内容会保留在这里供回看。'
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
  lastCompletedSessionRecordId.value = null
  interviewPersistCompleted.value = false
  restoredSessionDurationMs.value = 0
  restoredFromSession.value = false
  /** 不再在此处清理 session 缓存：结束录音后胶囊隐藏，缓存保留至访谈记录列表中删除 */
  /** 与录音同一次会话：先清空旧字幕/识别实例，再开麦，最后启动 Web Speech（避免与上一轮字幕、segmentId 混在一起） */
  resetTranscription()
  await startRecorder()
  if (recorderStatus.value === 'recording') {
    startTranscription()
    const pid = nodeId.value
    const list = liveCustomerTreeItems.value
    if (pid && isProjectRouteTarget(list, pid)) {
      /** 再次「开始录音」时若未先结束，会重复 append；先删掉本项目中仍为「录音中」的占位行，保证列表只有一条进行中记录 */
      const staleRecording = getProjectInterviewRecords(pid).filter(r => r.status === 'recording')
      for (const r of staleRecording) {
        deleteProjectInterviewRecord(pid, r.id)
      }
      if (staleRecording.length) {
        clearInterviewSessionCachesForProject(pid)
        window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId: pid } }))
      }
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

/** 刷新恢复后继续录音：新建 MediaRecorder / SpeechRecognition，在已有字幕和时长上续接 */
async function resumeFromRestore() {
  restoredFromSession.value = false
  await startRecorder()
  if (recorderStatus.value === 'recording') {
    startTranscription()
    tryRestoreSessionRecordId()
  }
}

/** 从访谈记录进入的「录音中」条：继续录音 — 退出历史态并续录同一条 */
async function continueFromHistoryRecording() {
  const hv = historyView.value
  const pid = nodeId.value?.trim()
  const q = route.query.recordId
  const rid = (Array.isArray(q) ? q[0] ?? '' : typeof q === 'string' ? q : '').trim()
  if (!hv || !pid || !rid) return
  const segs = JSON.parse(JSON.stringify(hv.segments)) as InterviewTranscriptSegment[]
  const dur = hv.durationMs ?? 0
  historyView.value = null
  await router.replace({ name: 'Interview', query: { nodeId: pid } })
  await nextTick()
  restoreTranscriptionSegments(segs)
  restoredSessionDurationMs.value = dur
  currentSessionRecordId.value = rid
  await resumeFromRestore()
}

/** 在历史「录音中」条上结束：落库为已完成并回到现场访谈（无 recordId） */
async function completeHistoryRecordingFromCapsule() {
  const hv = historyView.value
  const pid = nodeId.value?.trim()
  const q = route.query.recordId
  const rid = (Array.isArray(q) ? q[0] ?? '' : typeof q === 'string' ? q : '').trim()
  if (!hv || !pid || !rid || hv.status !== 'recording') return
  const segments = JSON.parse(JSON.stringify(hv.segments)) as InterviewTranscriptSegment[]
  const summaryBlocks = summaryPanelRef.value?.getSummaryBlocks?.() ?? hv.summaryBlocks ?? []
  const patch: Record<string, unknown> = {
    status: 'completed',
    durationMs: hv.durationMs ?? 0,
    segments,
    summarizerName: appStore.currentUser.name,
    summaryGeneratedAt: Date.now()
  }
  if (summaryBlocks.length) patch.summaryBlocks = summaryBlocks
  updateProjectInterviewRecord(pid, rid, patch)
  window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId: pid } }))
  historyView.value = null
  interviewPersistCompleted.value = true
  await router.replace({ name: 'Interview', query: { nodeId: pid } })
  await nextTick()
  restoreTranscriptionSegments(segments)
  markInterviewRecordPersistCompleted(rid)
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
  if (interviewPersistCompleted.value) return
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

  const finishPersist = () => {
    interviewPersistCompleted.value = true
    window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId: pid } }))
  }

  if (rid) {
    updateProjectInterviewRecord(pid, rid, {
      durationMs: dur,
      segments,
      status: 'completed',
      ...summaryPatch
    })
    markInterviewRecordPersistCompleted(rid)
    finishPersist()
    return
  }

  /** 内存中丢了 sessionId 但 localStorage 仍有「录音中」条目时，合并到该条，避免再 append 一条 */
  const openRecording = getProjectInterviewRecords(pid).find(r => r.status === 'recording')
  if (openRecording) {
    updateProjectInterviewRecord(pid, openRecording.id, {
      durationMs: dur,
      segments,
      status: 'completed',
      ...summaryPatch
    })
    markInterviewRecordPersistCompleted(openRecording.id)
    finishPersist()
    return
  }

  const hasText = segs.some(s => s.text.trim().length > 0)
  if (dur < 1000 && !hasText) return
  const appended = appendProjectInterviewRecord(pid, {
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
  lastCompletedSessionRecordId.value = appended.id
  finishPersist()
}

/** 刷新恢复的会话点「结束」：用 effectiveDurationMs（含恢复时长）落库 */
function persistRestoredInterviewIfNeeded() {
  if (interviewPersistCompleted.value) return
  const pid = nodeId.value
  if (!pid) return
  const dur = effectiveDurationMs.value
  const segs = subtitleSegments.value
  const segments = JSON.parse(JSON.stringify(segs)) as InterviewTranscriptSegment[]
  const rid = currentSessionRecordId.value
  const summaryBlocks = summaryPanelRef.value?.getSummaryBlocks?.() ?? []
  const summaryPatch = {
    summarizerName: appStore.currentUser.name,
    summaryGeneratedAt: Date.now(),
    ...(summaryBlocks.length ? { summaryBlocks } : {})
  }

  const finishPersist = () => {
    interviewPersistCompleted.value = true
    window.dispatchEvent(new CustomEvent('pd-interview-record-saved', { detail: { projectId: pid } }))
  }

  if (rid) {
    updateProjectInterviewRecord(pid, rid, {
      durationMs: dur,
      segments,
      status: 'completed',
      ...summaryPatch
    })
    markInterviewRecordPersistCompleted(rid)
    finishPersist()
    return
  }

  const openRecording = getProjectInterviewRecords(pid).find(r => r.status === 'recording')
  if (openRecording) {
    updateProjectInterviewRecord(pid, openRecording.id, {
      durationMs: dur,
      segments,
      status: 'completed',
      ...summaryPatch
    })
    markInterviewRecordPersistCompleted(openRecording.id)
    finishPersist()
    return
  }

  const hasText = segs.some(s => s.text.trim().length > 0)
  if (dur < 1000 && !hasText) return
  const appendedRestored = appendProjectInterviewRecord(pid, {
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
  lastCompletedSessionRecordId.value = appendedRestored.id
  finishPersist()
}

function onStopClick() {
  showStopConfirm.value = true
}

async function confirmStop() {
  if (stopConfirmInProgress.value) return
  stopConfirmInProgress.value = true
  try {
    showStopConfirm.value = false
    if (isViewingHistory.value && historyView.value?.status === 'recording') {
      await completeHistoryRecordingFromCapsule()
      return
    }
    const wasRestoredSession = restoredFromSession.value
    restoredFromSession.value = false
    restoredSessionDurationMs.value = 0
    stopTranscription()
    await stopRecorder()
    await nextTick()
    await summaryPanelRef.value?.waitForSummaryIdle?.()
    await nextTick()
    if (wasRestoredSession) {
      persistRestoredInterviewIfNeeded()
    } else {
      persistProjectInterviewIfNeeded()
    }
  } finally {
    stopConfirmInProgress.value = false
  }
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

.recording-bar--history {
  min-width: 160px;
  justify-content: center;
  background: rgba(120, 120, 140, 0.08);
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

.keyword-ai-hint {
  margin: 6px 0 0;
  padding: 0;
  font-size: 12px;
  color: #8b8fa3;
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
