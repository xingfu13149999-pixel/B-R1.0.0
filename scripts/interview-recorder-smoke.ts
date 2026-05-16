import assert from 'node:assert/strict'
import { useInterviewRecorder } from '../src/views/home/composables/useInterviewRecorder'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

class FakeTrack {
  stopped = 0

  stop() {
    this.stopped += 1
  }
}

class FakeMediaStream {
  readonly track = new FakeTrack()

  getTracks() {
    return [this.track]
  }
}

class FakeAnalyser {
  fftSize = 0
  frequencyBinCount = 64
  private frame = 0

  getByteFrequencyData(data: Uint8Array) {
    this.frame += 1
    for (let i = 0; i < data.length; i += 1) {
      data[i] = ((i + this.frame) % 16) * 16
    }
  }
}

class FakeSourceNode {
  disconnected = false

  connect(_target: FakeAnalyser) {
    return undefined
  }

  disconnect() {
    this.disconnected = true
  }
}

class FakeAudioContext {
  static lastInstance: FakeAudioContext | null = null

  state: 'running' | 'closed' = 'running'
  readonly analyser = new FakeAnalyser()
  readonly source = new FakeSourceNode()

  constructor() {
    FakeAudioContext.lastInstance = this
  }

  createMediaStreamSource(_stream: MediaStream) {
    return this.source
  }

  createAnalyser() {
    return this.analyser
  }

  async close() {
    this.state = 'closed'
  }
}

class FakeMediaRecorder {
  static readonly supportedTypes = new Set(['audio/webm;codecs=opus', 'audio/webm'])
  static instances: FakeMediaRecorder[] = []

  static isTypeSupported(type: string) {
    return FakeMediaRecorder.supportedTypes.has(type)
  }

  readonly mimeType: string
  state: 'inactive' | 'recording' | 'paused' = 'inactive'
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null

  constructor(
    readonly stream: MediaStream,
    options?: { mimeType?: string }
  ) {
    this.mimeType = options?.mimeType || 'audio/webm'
    FakeMediaRecorder.instances.push(this)
  }

  start(_timeslice?: number) {
    this.state = 'recording'
    setTimeout(() => {
      this.ondataavailable?.({
        data: new Blob(['chunk-start'], { type: this.mimeType })
      })
    }, 20)
  }

  pause() {
    assert.equal(this.state, 'recording')
    this.state = 'paused'
  }

  resume() {
    assert.equal(this.state, 'paused')
    this.state = 'recording'
    setTimeout(() => {
      this.ondataavailable?.({
        data: new Blob(['chunk-resume'], { type: this.mimeType })
      })
    }, 20)
  }

  stop() {
    const shouldEmit = this.state !== 'inactive'
    this.state = 'inactive'
    setTimeout(() => {
      if (shouldEmit) {
        this.ondataavailable?.({
          data: new Blob(['chunk-stop'], { type: this.mimeType })
        })
      }
      this.onstop?.()
    }, 20)
  }
}

async function main() {
  const originalWarn = console.warn
  console.warn = (...args) => {
    if (String(args[0] ?? '').includes('onUnmounted')) return
    originalWarn(...args)
  }

  const fakeStream = new FakeMediaStream()
  const getUserMediaCalls: unknown[] = []

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      mediaDevices: {
        async getUserMedia(options: unknown) {
          getUserMediaCalls.push(options)
          return fakeStream as unknown as MediaStream
        }
      }
    }
  })

  let rafId = 0
  const rafTimers = new Map<number, ReturnType<typeof setTimeout>>()
  Object.assign(globalThis, {
    AudioContext: FakeAudioContext,
    MediaRecorder: FakeMediaRecorder,
    requestAnimationFrame(callback: FrameRequestCallback) {
      const id = ++rafId
      const timer = setTimeout(() => {
        rafTimers.delete(id)
        callback(Date.now())
      }, 16)
      rafTimers.set(id, timer)
      return id
    },
    cancelAnimationFrame(id: number) {
      const timer = rafTimers.get(id)
      if (!timer) return
      clearTimeout(timer)
      rafTimers.delete(id)
    }
  })

  const recorder = useInterviewRecorder()

  assert.equal(recorder.status.value, 'idle')
  assert.equal(recorder.getBlob(), null)

  await recorder.start()
  await wait(180)

  assert.equal(getUserMediaCalls.length, 1)
  assert.deepEqual(getUserMediaCalls[0], {
    audio: { echoCancellation: true, noiseSuppression: true }
  })
  assert.equal(recorder.status.value, 'recording')
  assert.ok(recorder.durationMs.value > 0, 'duration should advance while recording')
  assert.ok(
    recorder.waveform.value.some(value => value > 0.08),
    'waveform should receive analyser values'
  )

  recorder.pause()
  const pausedAt = recorder.durationMs.value
  await wait(180)
  assert.equal(recorder.status.value, 'paused')
  assert.equal(recorder.durationMs.value, pausedAt)

  recorder.resume()
  await wait(180)
  assert.equal(recorder.status.value, 'recording')
  assert.ok(recorder.durationMs.value > pausedAt, 'duration should continue after resume')

  await recorder.stop()
  assert.equal(recorder.status.value, 'stopped')
  assert.equal(fakeStream.track.stopped, 1)
  assert.equal(FakeAudioContext.lastInstance?.state, 'closed')
  assert.equal(FakeAudioContext.lastInstance?.source.disconnected, true)

  const blob = recorder.getBlob()
  assert.ok(blob, 'recorded blob should exist after stop')
  assert.equal(blob?.type, 'audio/webm;codecs=opus')
  assert.ok(blob && blob.size > 0, 'recorded blob should contain audio chunks')

  recorder.reset()
  assert.equal(recorder.status.value, 'idle')
  assert.equal(recorder.durationMs.value, 0)
  assert.equal(recorder.getBlob(), null)
  assert.ok(
    recorder.waveform.value.every(value => value === 0.08),
    'waveform should reset to the baseline bars'
  )

  ;(navigator.mediaDevices as MediaDevices).getUserMedia = async () => {
    throw new Error('denied')
  }

  const deniedRecorder = useInterviewRecorder()
  await deniedRecorder.start()
  assert.equal(deniedRecorder.status.value, 'idle')
  assert.ok(deniedRecorder.error.value, 'permission failure should surface an error message')

  console.warn = originalWarn
  console.log('PASS interview recorder smoke test')
}

void main().catch(error => {
  console.error('FAIL interview recorder smoke test')
  console.error(error)
  process.exitCode = 1
})
