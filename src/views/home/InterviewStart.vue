<template>
  <div class="interview-root">
    <div class="interview-bg" aria-hidden="true" />

    <div class="interview-chrome">
      <AdminHeader
        :ai-panel-open="aiPanelOpen"
        :current-user-name="appStore.currentUser.name"
        :dark-mode="appStore.darkMode"
        :device-route-active="false"
        :user-route-active="false"
        @go-home="router.push({ name: 'Home' })"
        @open-ai-panel="aiPanelOpen = !aiPanelOpen"
        @open-device-management="router.push({ name: 'DeviceManagement' })"
        @open-user-management="router.push({ name: 'UserManagement' })"
        @logout="router.push('/login')"
        @toggle-dark-mode="appStore.toggleDarkMode"
      />

      <AiAssistantPanel :visible="aiPanelOpen" @update:visible="aiPanelOpen = $event" />

      <el-dialog
        v-model="showStopConfirm"
        title="结束录音"
        align-center
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

          <div v-else-if="recorderStatus === 'idle' && !restoredFromSession" class="start-bar">
            <el-tooltip content="开始录音" placement="bottom" :show-after="300">
              <button type="button" class="start-record-btn" @click="startRecording">
                <img :src="recordStartBtn" alt="开始录音" />
              </button>
            </el-tooltip>
          </div>

          <!-- 褰曢煶涓?/ 宸叉殏鍋?-->
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
            <div
              v-show="interviewPanelsOpen.keywords"
              id="interview-panel-keywords"
              class="info-panel__content"
            >
              <div v-if="hotKeywords.length" class="keyword-row">
                <span v-for="w in hotKeywords" :key="w" class="keyword-chip">{{ w }}</span>
              </div>
              <p v-if="hotKeywords.length && hotKeywordsAiLoading" class="keyword-ai-hint">
                AI 正在刷新关键热词...
              </p>
              <p v-else-if="!hotKeywords.length" class="keyword-empty">
                <template v-if="hotKeywordsAiLoading">AI 正在提炼关键热词...</template>
                <template v-else>{{
                  recorderStatus === 'idle'
                    ? '开始录音后将自动提取关键词'
                    : '正在聆听，关键词将随对话内容实时更新...'
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
            <div
              v-show="interviewPanelsOpen.suggest"
              id="interview-panel-suggest"
              class="info-panel__content"
            >
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
import AiAssistantPanel from '@/views/layouts/components/AiAssistantPanel.vue'
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
import iconPanelExpand from '@/assets/images/interview/icon-panel-expand.svg'
import personIconBlue from '@/assets/images/interview/person-icon-blue.svg'
import personIconWhite from '@/assets/images/interview/person-icon-white.svg'

defineOptions({ name: 'Interview' })

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

function applyFreshInterviewSessionFromSidebar() {
  if (route.name !== 'Interview') return
  if (!shouldClearStaleInterviewSessionOnEntry()) return
  const pid = nodeId.value?.trim()
  if (!pid) return

  if (!consumeSidebarFreshIntent()) {
    const next = buildInterviewQueryWithoutFresh()
    if (next) void router.replace({ name: 'Interview', query: next })
    return
  }

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

const currentSessionRecordId = ref<string | null>(null)

const lastCompletedSessionRecordId = ref<string | null>(null)

function markInterviewRecordPersistCompleted(completedRecordId: string) {
  const id = completedRecordId.trim()
  if (id) lastCompletedSessionRecordId.value = id
  currentSessionRecordId.value = null
}

const interviewPersistCompleted = ref(false)

const stopConfirmInProgress = ref(false)

const restoredSessionDurationMs = ref(0)
const restoredFromSession = ref(false)
const restoredLastStatus = ref<'recording' | 'paused' | 'stopped' | 'idle'>('paused')

const isViewingHistory = computed(() => historyView.value !== null)

const effectiveRecorderStatus = computed<typeof recorderStatus.value>(() => {
  if (recorderStatus.value === 'idle' && restoredFromSession.value) {
    return capsuleDisplayStatus.value
  }
  return recorderStatus.value
})

const capsuleDisplayStatus = computed<typeof recorderStatus.value>(() => {
  if (recorderStatus.value === 'idle' && restoredFromSession.value) {
    const last = restoredLastStatus.value
    if (last === 'recording' || last === 'paused') return 'paused'
    return 'stopped'
  }
  return recorderStatus.value
})

const showRecordingCapsule = computed(() => {
  if (isViewingHistory.value) {
    return recorderStatus.value === 'idle' && historyView.value?.status === 'recording'
  }
  if (restoredFromSession.value) {
    return capsuleDisplayStatus.value !== 'stopped'
  }
  return recorderStatus.value !== 'stopped'
})

const effectiveSegments = computed(() => {
  const hv = historyView.value
  if (hv?.segments?.length) return hv.segments
  return subtitleSegments.value
})

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
const aiHotKeywords = ref<string[]>([])
const hotKeywordsAiLoading = ref(false)
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

const isLiveInterviewSession = computed(
  () =>
    !isViewingHistory.value &&
    (recorderStatus.value === 'recording' || recorderStatus.value === 'paused')
)

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
  }
}

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
      return `速记中... ${t}`
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
  return `速记中... ${t}`
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
  resetTranscription()
  await startRecorder()
  if (recorderStatus.value === 'recording') {
    startTranscription()
    const pid = nodeId.value
    const list = liveCustomerTreeItems.value
    if (pid && isProjectRouteTarget(list, pid)) {
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

async function resumeFromRestore() {
  restoredFromSession.value = false
  await startRecorder()
  if (recorderStatus.value === 'recording') {
    startTranscription()
    tryRestoreSessionRecordId()
  }
}

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

/* Figma style_44TMQ8 */
.interview-back-label {
  font-size: 20px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.02em;
  color: #21243d;
}

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


