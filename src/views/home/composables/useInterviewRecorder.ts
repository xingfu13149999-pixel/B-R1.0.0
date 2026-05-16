/**
 * 访谈录音：基于 MediaRecorder + 麦克风，维护状态、时长、波形与导出 Blob（供 InterviewStart 使用）。
 */
import { onUnmounted, ref } from 'vue'

export type InterviewRecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped'

const BAR_COUNT = 48

function pickRecorderMime(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

export function useInterviewRecorder() {
  const status = ref<InterviewRecorderStatus>('idle')
  const durationMs = ref(0)
  const error = ref<string | null>(null)
  const waveform = ref<number[]>(Array.from({ length: BAR_COUNT }, () => 0.08))

  let mediaStream: MediaStream | null = null
  let mediaRecorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let mimeType = 'audio/webm'
  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let rafId = 0
  let timerInterval: ReturnType<typeof setInterval> | null = null
  let recordStartTime = 0
  let pausedAccumMs = 0

  function stopWaveformLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function disconnectAudioGraph() {
    stopWaveformLoop()
    stopTimer()
    try {
      sourceNode?.disconnect()
    } catch {
      /* ignore */
    }
    sourceNode = null
    analyser = null
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close()
    }
    audioContext = null
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop())
      mediaStream = null
    }
  }

  function runWaveformLoop() {
    if (!analyser) return
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const step = Math.max(1, Math.floor(bufferLength / BAR_COUNT))

    const tick = () => {
      if (!analyser) return
      analyser.getByteFrequencyData(dataArray)
      const bars: number[] = []
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0
        const start = i * step
        for (let j = 0; j < step; j++) sum += dataArray[start + j] ?? 0
        const avg = sum / step / 255
        bars.push(Math.min(1, Math.max(0.06, avg * 1.45)))
      }
      waveform.value = bars
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
  }

  async function start() {
    error.value = null
    if (typeof MediaRecorder === 'undefined') {
      error.value = '当前浏览器不支持录音（缺少 MediaRecorder）'
      return
    }
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      })
    } catch {
      error.value = '无法访问麦克风，请在浏览器中允许麦克风权限'
      return
    }

    mimeType = pickRecorderMime() || 'audio/webm'
    chunks = []
    try {
      mediaRecorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream)
    } catch {
      disconnectAudioGraph()
      error.value = '无法创建录音器，请更换浏览器或检查权限'
      return
    }

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    try {
      audioContext = new AudioContext()
      sourceNode = audioContext.createMediaStreamSource(mediaStream)
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      sourceNode.connect(analyser)
    } catch {
      disconnectAudioGraph()
      error.value = '音频分析初始化失败'
      return
    }

    runWaveformLoop()

    pausedAccumMs = 0
    durationMs.value = 0
    recordStartTime = Date.now()
    timerInterval = setInterval(() => {
      if (status.value !== 'recording') return
      durationMs.value = pausedAccumMs + (Date.now() - recordStartTime)
    }, 100)

    mediaRecorder.start(250)
    status.value = 'recording'
  }

  function pause() {
    if (!mediaRecorder || status.value !== 'recording') return
    mediaRecorder.pause()
    pausedAccumMs += Date.now() - recordStartTime
    stopWaveformLoop()
    stopTimer()
    status.value = 'paused'
  }

  function resume() {
    if (!mediaRecorder || status.value !== 'paused') return
    mediaRecorder.resume()
    runWaveformLoop()
    recordStartTime = Date.now()
    timerInterval = setInterval(() => {
      if (status.value !== 'recording') return
      durationMs.value = pausedAccumMs + (Date.now() - recordStartTime)
    }, 100)
    status.value = 'recording'
  }

  function finalizeDuration() {
    if (status.value === 'recording') {
      durationMs.value = pausedAccumMs + (Date.now() - recordStartTime)
    }
  }

  function stop(): Promise<void> {
    finalizeDuration()
    stopTimer()

    return new Promise(resolve => {
      const mr = mediaRecorder
      if (!mr || mr.state === 'inactive') {
        disconnectAudioGraph()
        mediaRecorder = null
        if (status.value !== 'idle') status.value = 'stopped'
        resolve()
        return
      }
      mr.onstop = () => {
        disconnectAudioGraph()
        mediaRecorder = null
        status.value = 'stopped'
        resolve()
      }
      try {
        mr.stop()
      } catch {
        disconnectAudioGraph()
        mediaRecorder = null
        status.value = 'stopped'
        resolve()
      }
    })
  }

  function getBlob(): Blob | null {
    if (!chunks.length) return null
    const type = chunks[0]?.type || mimeType
    return new Blob(chunks, { type })
  }

  function reset() {
    stopTimer()
    stopWaveformLoop()
    if (mediaRecorder) {
      mediaRecorder.ondataavailable = null
      if (mediaRecorder.state !== 'inactive') {
        try {
          mediaRecorder.stop()
        } catch {
          /* ignore */
        }
      }
      mediaRecorder = null
    }
    chunks = []
    disconnectAudioGraph()
    durationMs.value = 0
    status.value = 'idle'
    waveform.value = Array.from({ length: BAR_COUNT }, () => 0.08)
    error.value = null
    pausedAccumMs = 0
  }

  onUnmounted(() => {
    reset()
  })

  return {
    status,
    durationMs,
    error,
    waveform,
    start,
    pause,
    resume,
    stop,
    reset,
    getBlob
  }
}
