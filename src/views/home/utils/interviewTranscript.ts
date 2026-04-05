/**
 * 访谈转写文本工具：Web Speech 中文常无标点，先轻量补句读再按标点/长度分段，供 useInterviewTranscription 等使用。
 * 另提供 shouldMergeTranscriptSegment：合并引擎多次 isFinal 产生的碎段，再断句，减轻「不知在哪断句」的体验。
 * 实时字幕使用 enrichTranscriptPunctuation({ mode: 'streaming' })，避免给半句强加句号导致无法与后续片段合并。
 */
const STRONG_BREAK_RE = /[。！？!?；;]$/
const SOFT_BREAK_RE = /[，,、：:]$/
const LATIN_OR_DIGIT_RE = /[A-Za-z0-9]/
const WHITESPACE_RE = /\s/
const PUNCTUATION_RE = /[.,'"!?;:()[\]{}\-_/\\，、。：；！？]/

/** 单字后较适合插逗号的语气/语法位置（便于朗读） */
const SOFT_BREAK_AFTER = new Set(
  '的了着过吗呢吧嘛呀啊与和及或是就在有从到对把被给让而但且又就都已还能会要很所以之为里上下来说看作用想行好呐哇哩嘛'.split('')
)

function measureTextWeight(text: string) {
  let total = 0
  for (const char of text) {
    if (WHITESPACE_RE.test(char)) total += 0.15
    else if (LATIN_OR_DIGIT_RE.test(char)) total += 0.55
    else if (PUNCTUATION_RE.test(char)) total += 0.4
    else total += 1
  }
  return total
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

/** 常见连接/转折词前补逗号（若前面不是标点） */
function insertCommaBeforeConjunctions(s: string): string {
  return s.replace(
    /([^，。！？；：、\s])(那么|但是|所以|因为|然后|不过|而且|如果|虽然|因此|同时|另外|首先|其次|最后|总之|并且|以及|就是说|接着|此外)/g,
    '$1，$2'
  )
}

/** 「喂」后、「你好」后接正文时加逗号，便于断读（喂你好你能→喂，你好，你能）；避免「你好吗」被误插 */
function insertGreetingCommas(s: string): string {
  let t = s
  t = t.replace(/^喂(?=[\u4e00-\u9fff])/u, '喂，')
  t = t.replace(/(你好|您好)(?=[\u4e00-\u9fff])(?!吗|呢)/gu, '$1，')
  return t
}

/**
 * 问句「吗」后若紧接下一分句汉字，先断成「吗？」（听到吗暂时→听到吗？暂时）
 */
function insertMaNeQuestionBreaks(s: string): string {
  let t = s
  t = t.replace(/吗(?=[\u4e00-\u9fff])/gu, '吗？')
  t = t.replace(/呢(?=[\u4e00-\u9fff])/gu, '呢？')
  return t
}

export type EnrichTranscriptMode = 'full' | 'streaming'

/**
 * 在无句读的长串中按字数与「软断点」插入逗号，并在末尾酌情补句号。
 * 不追求语义完美，仅提升可读性；若识别结果已有标点则少做处理。
 *
 * `streaming`：用于 Web Speech 单次 isFinal 片段。只做最轻量处理（问候语、连词逗号），
 * 不插软断逗号、不强加句末标点——真正的断句和标点由 DeepSeek AI 在 1.2s 后补全。
 */
export function enrichTranscriptPunctuation(
  text: string,
  options: { mode?: EnrichTranscriptMode } = {}
): string {
  const mode = options.mode ?? 'full'
  let s = normalizeWhitespace(text)
  if (!s) return ''

  s = insertGreetingCommas(s)
  s = insertCommaBeforeConjunctions(s)

  if (mode === 'streaming') {
    return s.replace(/，{2,}/g, '，')
  }

  s = insertMaNeQuestionBreaks(s)

  const hasAnyPunct = /[。！？，、；：…—]/.test(s)
  if (!hasAnyPunct) {
    s = insertSoftBreaksChinese(s)
  }

  s = ensureSentenceEnd(s)
  return s.replace(/，{2,}/g, '，').replace(/。{2,}/g, '。').replace(/\？{2,}/g, '？')
}

function ensureSentenceEnd(s: string): string {
  const t = s.trim()
  if (!t) return ''
  if (/[。！？…!?]$/.test(t)) return t
  // 口语问句常以「吗/呢」收束而无问号
  if (/[吗呢]$/.test(t)) return `${t}？`
  if (t.length >= 6) return `${t}。`
  return t
}

const MIN_SOFT_CHUNK = 6
const MAX_SOFT_CHUNK = 15

function insertSoftBreaksChinese(s: string): string {
  const n = s.length
  if (n <= MAX_SOFT_CHUNK) return s

  let out = ''
  let i = 0
  while (i < n) {
    if (n - i <= MAX_SOFT_CHUNK) {
      out += s.slice(i)
      break
    }
    const end = Math.min(i + MAX_SOFT_CHUNK, n)
    const slice = s.slice(i, end)
    let cutRel = -1
    for (let j = slice.length - 1; j >= MIN_SOFT_CHUNK; j--) {
      const ch = slice[j - 1]!
      if (SOFT_BREAK_AFTER.has(ch) || /[\s，,、：]/.test(ch)) {
        cutRel = j
        break
      }
    }
    if (cutRel === -1) cutRel = MAX_SOFT_CHUNK
    out += s.slice(i, i + cutRel) + '，'
    i += cutRel
  }
  return out
}

function splitOversizedFragment(text: string, targetWeight: number, maxWeight: number) {
  const parts: string[] = []
  let current = ''

  const flush = () => {
    const clean = normalizeWhitespace(current)
    if (!clean) return
    parts.push(clean)
    current = ''
  }

  for (const char of text) {
    current += char
    const weight = measureTextWeight(current)
    const atSoftBoundary =
      /[\s，,、：:]/.test(char) || SOFT_BREAK_AFTER.has(char) || /[。！？!?；;]/.test(char)

    if (weight >= targetWeight && atSoftBoundary) {
      flush()
      continue
    }

    if (weight >= maxWeight) {
      flush()
    }
  }

  flush()
  return parts
}

/**
 * 是否应将「上一条字幕」与「下一段识别文本」拼在一起再断句。
 * 用于缓解 Web Speech 把一句拆成多次 isFinal 导致的碎段。
 */
export function shouldMergeTranscriptSegment(prev: string, next: string): boolean {
  const p = prev.trim()
  const n = next.trim()
  if (!p || !n) return false
  if (p.length + n.length > 240) return false
  if (p.length > 120) return false
  return true
}

export function splitTranscriptSentences(
  text: string,
  options: {
    targetWeight?: number
    maxWeight?: number
    enrich?: boolean
    /** 实时识别：轻量润色，避免半句被拆成多条字幕，真正断句交给 AI */
    streaming?: boolean
  } = {}
) {
  const useEnrich = options.enrich !== false
  const streaming = options.streaming === true
  const targetWeight = options.targetWeight ?? (streaming ? 50 : 24)
  const maxWeight = options.maxWeight ?? (streaming ? 80 : 34)

  const cleanText = normalizeWhitespace(
    useEnrich
      ? enrichTranscriptPunctuation(text, { mode: streaming ? 'streaming' : 'full' })
      : text
  )
  if (!cleanText) return []

  if (streaming && measureTextWeight(cleanText) <= maxWeight) {
    return [cleanText]
  }

  const tokens =
    cleanText.match(/[^。！？!?；;，,、：:\n]+[。！？!?；;，,、：:\n]*/g) ?? [cleanText]

  const sentences: string[] = []
  let current = ''

  const flushCurrent = () => {
    const clean = normalizeWhitespace(current)
    if (!clean) return
    sentences.push(clean)
    current = ''
  }

  const consumeToken = (token: string) => {
    const clean = normalizeWhitespace(token)
    if (!clean) return

    if (!current) {
      if (measureTextWeight(clean) > maxWeight) {
        sentences.push(...splitOversizedFragment(clean, targetWeight, maxWeight))
        return
      }

      current = clean
    } else {
      const combined = `${current}${clean}`
      if (measureTextWeight(combined) > maxWeight) {
        flushCurrent()
        consumeToken(clean)
        return
      }

      current = combined
    }

    if (
      STRONG_BREAK_RE.test(clean) ||
      (SOFT_BREAK_RE.test(clean) && measureTextWeight(current) >= targetWeight)
    ) {
      flushCurrent()
    }
  }

  for (const token of tokens) consumeToken(token)
  flushCurrent()

  return sentences
}

export function formatInterimTranscript(text: string) {
  return splitTranscriptSentences(text, {
    targetWeight: 18,
    maxWeight: 26,
    streaming: true
  }).join('\n')
}
