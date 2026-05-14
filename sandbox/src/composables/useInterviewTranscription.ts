/**
 * 访谈实时转写：浏览器 SpeechRecognition（或兼容层）+ 句子切分，输出分段字幕（供 InterviewStart 使用）。
 * 若配置 VITE_DEEPSEEK_API_KEY，则在防抖后对定稿片段调用 DeepSeek 补标点（失败则保留本地规则结果）。
 */
import { computed, onUnmounted, ref } from 'vue'
import { polishTranscriptWithAi } from '@/api/transcriptPolish'

export type InterviewTranscriptionStatus = 'idle' | 'recording' | 'paused' | 'stopped'

export interface InterviewTranscriptSegment {
  id: string
  text: string
  timeMs: number
  speakerLabel: string
}

interface UseInterviewTranscriptionOptions {
  getTimelineMs?: () => number
  lang?: string
}

interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike extends ArrayLike<SpeechRecognitionAlternativeLike> {
  isFinal: boolean
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionErrorEventLike {
  error: string
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
}

const MAX_SEGMENTS = 120
const POLISH_DEBOUNCE_MS = 1200
const POLISH_MIN_CHARS = 6
const SILENCE_SPLIT_MS = 5000
const MAX_SPEAKERS = 4

function makeSpeakerLabel(index: number) {
  return `发言人${index + 1}`
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

function normalizeTranscript(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function getRecognitionErrorMessage(code: string) {
  switch (code) {
    case 'audio-capture':
      return '实时字幕不可用，请检查麦克风是否被其他应用占用。'
    case 'network':
      return '实时字幕服务暂时不可用，请稍后重试。'
    case 'not-allowed':
    case 'service-not-allowed':
      return '浏览器未允许实时字幕，请检查麦克风权限。'
    default:
      return '实时字幕已中断，请尝试重新开始录音。'
  }
}

export function useInterviewTranscription(options: UseInterviewTranscriptionOptions = {}) {
  const status = ref<InterviewTranscriptionStatus>('idle')
  const supported = ref(Boolean(getSpeechRecognitionCtor()))
  const error = ref<string | null>(null)
  const segments = ref<InterviewTranscriptSegment[]>([])
  const interimText = ref('')

  let recognition: SpeechRecognitionLike | null = null
  let segmentId = 0
  let shouldListen = false
  let manualStop = false
  let restartTimer: ReturnType<typeof setTimeout> | null = null
  let currentSpeakerIndex = 0
  let lastFinalWallMs = 0

  type PolishQueueItem = { source: string; ids: string[] }
  let polishQueue: PolishQueueItem[] = []
  let polishTimer: ReturnType<typeof setTimeout> | null = null
  let polishRunning = false
  let polishSourceSnapshot = ''

  function clearPolishTimer() {
    if (!polishTimer) return
    clearTimeout(polishTimer)
    polishTimer = null
  }

  function schedulePolish(source: string, ids: string[]) {
    if (!import.meta.env.VITE_DEEPSEEK_API_KEY) return
    if (source.length < POLISH_MIN_CHARS || !ids.length) return
    polishQueue.push({ source, ids })
    clearPolishTimer()
    polishTimer = setTimeout(() => void flushPolish(), POLISH_DEBOUNCE_MS)
  }

  async function flushPolish() {
    clearPolishTimer()
    if (polishRunning) {
      polishTimer = setTimeout(() => void flushPolish(), 0)
      return
    }

    const batch = polishQueue.splice(0)
    if (!batch.length) return

    const lastItem = batch[batch.length - 1]!
    const targetId = lastItem.ids[lastItem.ids.length - 1]!
    const sourceText = lastItem.source
    if (sourceText.length < POLISH_MIN_CHARS || !targetId) {
      if (polishQueue.length) {
        polishTimer = setTimeout(() => void flushPolish(), 0)
      }
      return
    }

    polishRunning = true
    polishSourceSnapshot = sourceText
    try {
      let polished: string
      try {
        polished = await polishTranscriptWithAi(sourceText)
      } catch (e) {
        console.warn('转写 AI 润色失败，保留原文:', e)
        return
      }

      const t = polished.trim()
      if (!t || t === sourceText.trim()) return

      const segs = [...segments.value]
      const idx = segs.findIndex(s => s.id === targetId)
      if (idx < 0) return

      if (segs[idx]!.text !== sourceText && segs[idx]!.text !== polishSourceSnapshot) {
        return
      }

      segs[idx] = { ...segs[idx]!, text: t }
      segments.value = segs
    } finally {
      polishRunning = false
      if (polishQueue.length) {
        polishTimer = setTimeout(() => void flushPolish(), 0)
      }
    }
  }

  async function flushPolishImmediate() {
    clearPolishTimer()
    let spins = 0
    while (polishRunning && spins < 400) {
      await new Promise(r => setTimeout(r, 25))
      spins += 1
    }
    await flushPolish()
  }

  function clearRestartTimer() {
    if (!restartTimer) return
    clearTimeout(restartTimer)
    restartTimer = null
  }

  function getTimeMs() {
    return options.getTimelineMs?.() ?? 0
  }

  function appendSegment(text: string) {
    const raw = normalizeTranscript(text)
    if (!raw) return

    const now = Date.now()
    const gap = lastFinalWallMs > 0 ? now - lastFinalWallMs : Infinity
    lastFinalWallMs = now

    const startNewSegment = gap >= SILENCE_SPLIT_MS || segments.value.length === 0

    if (startNewSegment && gap >= SILENCE_SPLIT_MS && segments.value.length > 0) {
      currentSpeakerIndex = (currentSpeakerIndex + 1) % MAX_SPEAKERS
    }

    const speakerLabel = makeSpeakerLabel(currentSpeakerIndex)

    if (!startNewSegment && segments.value.length > 0) {
      const nextSegments = [...segments.value]
      const lastSeg = nextSegments[nextSegments.length - 1]!
      const combined = `${lastSeg.text}${raw}`
      lastSeg.text = combined
      segments.value = nextSegments.slice(-MAX_SEGMENTS)
      schedulePolish(combined, [lastSeg.id])
    } else {
      const id = `segment-${++segmentId}`
      const nextSegments = [...segments.value]
      nextSegments.push({
        id,
        text: raw,
        timeMs: getTimeMs(),
        speakerLabel
      })
      segments.value = nextSegments.slice(-MAX_SEGMENTS)
      schedulePolish(raw, [id])
    }
  }

  function commitInterimSegment() {
    if (!interimText.value) return
    appendSegment(interimText.value)
    interimText.value = ''
  }

  function scheduleRestart(delay = 240) {
    clearRestartTimer()
    if (!shouldListen) return
    restartTimer = setTimeout(() => {
      restartTimer = null
      startRecognition()
    }, delay)
  }

  function bindRecognition(rec: SpeechRecognitionLike) {
    rec.continuous = true
    rec.interimResults = true
    rec.lang = options.lang || 'zh-CN'
    rec.maxAlternatives = 1

    rec.onresult = event => {
      error.value = null
      const interimParts: string[] = []

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (!result) continue

        const transcript = normalizeTranscript(result[0]?.transcript ?? '')
        if (!transcript) continue

        if (result.isFinal) appendSegment(transcript)
        else interimParts.push(transcript)
      }

      interimText.value = normalizeTranscript(interimParts.join(' '))
    }

    rec.onerror = event => {
      if (event.error === 'aborted' && manualStop) return
      if (event.error === 'no-speech') return

      error.value = getRecognitionErrorMessage(event.error)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldListen = false
      }
    }

    rec.onend = () => {
      clearRestartTimer()
      if (manualStop) {
        manualStop = false
        return
      }
      if (shouldListen) scheduleRestart()
    }
  }

  function ensureRecognition() {
    if (recognition) return recognition

    const RecognitionCtor = getSpeechRecognitionCtor()
    supported.value = Boolean(RecognitionCtor)
    if (!RecognitionCtor) return null

    recognition = new RecognitionCtor()
    bindRecognition(recognition)
    return recognition
  }

  function startRecognition() {
    const rec = ensureRecognition()
    if (!rec) {
      error.value = '当前浏览器不支持实时字幕，请使用 Chrome 或 Edge。'
      return
    }

    clearRestartTimer()
    manualStop = false

    try {
      rec.start()
    } catch {
      scheduleRestart()
    }
  }

  function start() {
    error.value = null
    interimText.value = ''
    shouldListen = true
    status.value = 'recording'
    startRecognition()
  }

  function pause() {
    shouldListen = false
    status.value = 'paused'
    commitInterimSegment()
    void flushPolishImmediate()

    if (!recognition) return
    clearRestartTimer()
    manualStop = true
    try {
      recognition.stop()
    } catch {
      /* ignore */
    }
  }

  function resume() {
    error.value = null
    shouldListen = true
    status.value = 'recording'
    startRecognition()
  }

  function stop() {
    shouldListen = false
    status.value = 'stopped'
    commitInterimSegment()
    void flushPolishImmediate()

    if (!recognition) return
    clearRestartTimer()
    manualStop = true
    try {
      recognition.stop()
    } catch {
      /* ignore */
    }
  }

  /** 离开页面后再进入时从 sessionStorage 恢复字幕（与 InterviewStart 配合） */
  function restoreSegments(snapshot: InterviewTranscriptSegment[]) {
    if (!snapshot?.length) return
    segments.value = snapshot.map(s => ({ ...s }))
    let maxN = 0
    for (const s of snapshot) {
      const m = /^segment-(\d+)$/.exec(s.id)
      if (m) maxN = Math.max(maxN, Number(m[1]))
    }
    segmentId = maxN
    lastFinalWallMs = snapshot[snapshot.length - 1]!.timeMs
    currentSpeakerIndex = 0
    interimText.value = ''
    error.value = null
    status.value = 'idle'
  }

  function reset() {
    shouldListen = false
    manualStop = false
    clearRestartTimer()
    clearPolishTimer()
    polishQueue = []
    polishRunning = false
    polishSourceSnapshot = ''
    interimText.value = ''
    error.value = null
    segments.value = []
    segmentId = 0
    currentSpeakerIndex = 0
    lastFinalWallMs = 0
    status.value = 'idle'

    if (!recognition) return

    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null

    try {
      recognition.abort()
    } catch {
      /* ignore */
    }

    recognition = null
  }

  /**
   * 组件卸载时仅停止语音识别实例，不清空 segments。
   * 刷新/关页时浏览器可能不执行父组件 onBeforeUnmount，若在 reset() 里先清空字幕，
   * InterviewStart 的 pagehide 落盘会读到空数组导致「刷新后数据丢失」。
   */
  function abortRecognitionOnly() {
    shouldListen = false
    manualStop = true
    clearRestartTimer()
    clearPolishTimer()
    polishQueue = []
    polishRunning = false
    polishSourceSnapshot = ''
    interimText.value = ''
    error.value = null
    if (!recognition) return
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    try {
      recognition.abort()
    } catch {
      /* ignore */
    }
    recognition = null
  }

  onUnmounted(() => {
    abortRecognitionOnly()
  })

  const currentSpeakerLabel = computed(() => makeSpeakerLabel(currentSpeakerIndex))

  return {
    status,
    supported,
    error,
    segments,
    interimText,
    currentSpeakerLabel,
    start,
    pause,
    resume,
    stop,
    reset,
    restoreSegments
  }
}
