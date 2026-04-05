import assert from 'node:assert/strict'
import { useInterviewTranscription } from '../src/views/home/composables/useInterviewTranscription'
import {
  formatInterimTranscript,
  splitTranscriptSentences
} from '../src/views/home/utils/interviewTranscript'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type FakeResultInput = {
  text: string
  isFinal: boolean
}

class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = []

  continuous = false
  interimResults = false
  lang = ''
  maxAlternatives = 1
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null =
    null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  startCount = 0
  stopCount = 0
  abortCount = 0

  constructor() {
    FakeSpeechRecognition.instances.push(this)
  }

  start() {
    this.startCount += 1
  }

  stop() {
    this.stopCount += 1
    setTimeout(() => {
      this.onend?.()
    }, 10)
  }

  abort() {
    this.abortCount += 1
  }

  emitResults(items: FakeResultInput[]) {
    this.onresult?.({
      resultIndex: 0,
      results: items.map(item => ({
        isFinal: item.isFinal,
        0: { transcript: item.text },
        length: 1
      }))
    })
  }

  emitUnexpectedEnd() {
    this.onend?.()
  }
}

async function main() {
  const originalWarn = console.warn
  console.warn = (...args) => {
    if (String(args[0] ?? '').includes('onUnmounted')) return
    originalWarn(...args)
  }

  Object.assign(globalThis, {
    window: globalThis,
    SpeechRecognition: FakeSpeechRecognition
  })
  Reflect.deleteProperty(globalThis, 'webkitSpeechRecognition')

  let timelineMs = 0
  const transcription = useInterviewTranscription({
    getTimelineMs: () => timelineMs
  })

  transcription.start()
  assert.equal(transcription.status.value, 'recording')
  assert.equal(FakeSpeechRecognition.instances.length, 1)

  const recognition = FakeSpeechRecognition.instances[0]
  assert.equal(recognition.continuous, true)
  assert.equal(recognition.interimResults, true)
  assert.equal(recognition.lang, 'zh-CN')

  assert.deepEqual(
    splitTranscriptSentences(
      'revenue improved significantly in the domestic market, cash flow stayed stable throughout the quarter, order volume recovered steadily.'
    ),
    [
      'revenue improved significantly in the domestic market,',
      'cash flow stayed stable throughout the quarter,',
      'order volume recovered steadily.'
    ]
  )
  assert.equal(
    formatInterimTranscript(
      'the management team answered in detail, and the key points are easier to read now'
    ),
    'the management team answered in detail,\nand the key points are easier to read now'
  )

  timelineMs = 15_000
  recognition.emitResults([{ text: 'revenue growth in the last two years', isFinal: false }])
  assert.equal(transcription.interimText.value, 'revenue growth in the last two years')
  assert.equal(transcription.segments.value.length, 0)

  timelineMs = 18_000
  recognition.emitResults([{ text: 'revenue remained on an upward trend', isFinal: true }])
  assert.equal(transcription.interimText.value, '')
  assert.equal(transcription.segments.value.length, 1)
  assert.equal(transcription.segments.value[0]?.text, 'revenue remained on an upward trend')
  assert.equal(transcription.segments.value[0]?.timeMs, 18_000)

  timelineMs = 20_000
  recognition.emitResults([
    {
      text: 'revenue improved significantly in the domestic market, cash flow stayed stable throughout the quarter, order volume recovered steadily.',
      isFinal: true
    }
  ])
  assert.equal(transcription.segments.value.length, 4)
  assert.deepEqual(
    transcription.segments.value.slice(1).map(segment => segment.text),
    [
      'revenue improved significantly in the domestic market,',
      'cash flow stayed stable throughout the quarter,',
      'order volume recovered steadily.'
    ]
  )
  assert.deepEqual(
    transcription.segments.value.slice(1).map(segment => segment.timeMs),
    [20_000, 20_900, 21_800]
  )

  timelineMs = 22_000
  recognition.emitResults([{ text: 'cash flow stayed stable', isFinal: false }])
  transcription.pause()
  await wait(20)
  assert.equal(transcription.status.value, 'paused')
  assert.equal(transcription.interimText.value, '')
  assert.equal(transcription.segments.value.length, 5)
  assert.equal(transcription.segments.value.at(-1)?.text, 'cash flow stayed stable')

  transcription.resume()
  assert.equal(transcription.status.value, 'recording')
  assert.ok(recognition.startCount >= 2, 'resume should restart recognition')

  recognition.emitUnexpectedEnd()
  await wait(300)
  assert.ok(recognition.startCount >= 3, 'unexpected end should auto-restart while recording')

  timelineMs = 31_000
  recognition.emitResults([{ text: 'order volume also improved year over year', isFinal: false }])
  transcription.stop()
  await wait(20)
  assert.equal(transcription.status.value, 'stopped')
  assert.equal(transcription.interimText.value, '')
  assert.equal(
    transcription.segments.value.at(-1)?.text,
    'order volume also improved year over year'
  )
  const startCountAfterStop = recognition.startCount
  await wait(300)
  assert.equal(
    recognition.startCount,
    startCountAfterStop,
    'manual stop should not auto-restart recognition'
  )

  transcription.reset()
  assert.equal(transcription.status.value, 'idle')
  assert.deepEqual(transcription.segments.value, [])
  assert.equal(transcription.interimText.value, '')
  assert.equal(recognition.abortCount, 1)

  Reflect.deleteProperty(globalThis, 'SpeechRecognition')
  const unsupported = useInterviewTranscription()
  unsupported.start()
  assert.equal(unsupported.status.value, 'recording')
  assert.ok(unsupported.error.value?.includes('Chrome'))

  console.warn = originalWarn
  console.log('PASS interview transcription smoke test')
}

void main().catch(error => {
  console.error('FAIL interview transcription smoke test')
  console.error(error)
  process.exitCode = 1
})
