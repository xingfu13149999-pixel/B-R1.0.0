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

/**
 * 二字词集合：在插入逗号时，如果当前字是这些词的第一个字，不在此断句。
 * 避免破坏 "已经"、"所以"、"但是" 等常见二字词。
 */
const DONT_BREAK_WORDS = new Set([
  '已经', '因此', '所以', '但是', '而且', '或者', '以及', '关于',
  '通过', '进行', '可以', '应该', '需要', '一个', '这个',
  '那个', '什么', '怎么', '今天', '明天', '现在', '时候', '问题',
  '情况', '然后', '这样', '那样', '比较', '其实', '没有', '对吧',
  '是的', '好的', '我们', '你们', '他们', '这里', '那里', '为什么',
  '怎么样', '第一', '阶段', '讨论', '项目', '进展',
  '完成', '开发', '计划', '目标', '方面',
  '上次', '这次', '其中', '其他', '其后', '之前', '之后',
  '根据', '讨论', '商议', '研究', '决定', '确定'
])

/**
 * "X的Y" 模式：Y 是这些单字时，X的Y 不应断开
 * 因为 "的" 后面通常是名词/动词，断开会破坏语义
 */
const DE_AFTER_NOUN_VERB = new Set([
  '开', '发', '进', '展', '成', '败', '功', '错', '讨', '论',
  '完', '做', '建', '设', '生', '长', '动', '定', '决', '策',
  '划', '管', '理', '营', '销', '售', '务', '产', '品', '质',
  '量', '能', '源', '金', '融', '资', '本', '预', '算', '标',
  '准', '节', '约', '增', '长', '减', '少', '亏', '损', '利',
  '润', '率', '模', '式', '度', '间', '内', '部', '外', '前',
  '后', '来', '去', '说', '问', '答', '思', '考', '析', '解'
])

/**
 * "X了Y" 模式：Y 是这些单字时，X了Y 不应断开
 * 因为 "了" 后面通常是动词/名词
 */
const LE_AFTER_VERB_NOUN = new Set([
  '完', '成', '定', '决', '议', '论', '建', '设', '开', '发',
  '展', '进', '行', '做', '作', '为', '取', '得', '到', '见',
  '给', '告', '诉', '请', '让', '使', '派', '接', '送', '还',
  '还', '增', '减', '改', '变', '化', '解', '答', '处理'
])

/**
 * "X上Y" 模式：这些组合中 "上" 不应断开
 */
const SHANG_PATTERN = new Set([
  '根据', '按照', '遵照', '遵循', '参照', '依据', '原则上'
])

/**
 * "X次Y" 模式：当 "次" 后面是 "的" + 动词/名词时，"次" 不应断开
 */
const DE_AFTER_CI = new Set([
  '的', '之'
])

const MIN_SOFT_CHUNK = 6
const MAX_SOFT_CHUNK = 15

/**
 * 检查在位置 j 的字符是否应该作为断点
 * @param slice 当前处理的切片
 * @param j 当前位置（相对于 slice）
 * @param totalLen 原始字符串总长度
 */
function shouldBreakAt(slice: string, j: number, totalLen: number): { shouldBreak: boolean; skipChars: number } {
  const ch = slice[j]

  // 检查是否是二字词的首字 - 如果是，跳过整个词
  if (j + 1 < slice.length) {
    const nextCh = slice[j + 1]
    const potentialWord = ch + nextCh
    if (DONT_BREAK_WORDS.has(potentialWord)) {
      return { shouldBreak: false, skipChars: 2 }
    }

    // 特殊处理 "X的Y"：如果当前是 "的" 且下一个字是名词/动词，不在 "的" 后断开
    if (ch === '的' && j + 2 < slice.length) {
      const afterDe = slice[j + 2]
      // 处理 "的开发"、"的讨论"、"的研究" 等 "的+动词/名词两字词"
      if (afterDe === '发' || afterDe === '论' || afterDe === '究' || afterDe === '策') {
        return { shouldBreak: false, skipChars: 3 }
      }
      if (DE_AFTER_NOUN_VERB.has(afterDe)) {
        return { shouldBreak: false, skipChars: 3 }
      }
    }

    // 特殊处理 "X了Y"：如果当前是 "了" 且下一个字是动词/名词，不在 "了" 后断开
    if (ch === '了' && j + 2 < slice.length) {
      const afterLe = slice[j + 2]
      if (LE_AFTER_VERB_NOUN.has(afterLe)) {
        return { shouldBreak: false, skipChars: 3 }
      }
    }

    // 特殊处理 "X上Y"：如果当前是 "上" 且下一个字与前一个或前两个字符形成特定模式，不断开
    if (ch === '上' && j >= 1) {
      const prev2 = slice.slice(j - 1, j + 1) // 前两字
      if (SHANG_PATTERN.has(prev2)) {
        return { shouldBreak: false, skipChars: 2 }
      }
    }

    // 特殊处理 "X次Y"：如果当前是 "次" 且下一个字是 "的" 或 "之"，不断开
    if (ch === '次' && j + 1 < slice.length) {
      const afterCi = slice[j + 1]
      if (DE_AFTER_CI.has(afterCi)) {
        return { shouldBreak: false, skipChars: 2 }
      }
    }
  }

  // 如果当前是 "的" 或 "了" 或 "上"，检查下一个字
  if ((ch === '的' || ch === '了' || ch === '上') && j + 1 < slice.length) {
    const afterCh = slice[j + 1]

    if (ch === '的' && DE_AFTER_NOUN_VERB.has(afterCh)) {
      return { shouldBreak: false, skipChars: 2 }
    }
    if (ch === '了' && LE_AFTER_VERB_NOUN.has(afterCh)) {
      return { shouldBreak: false, skipChars: 2 }
    }
    // "上" 作为软断点，但 "根据上" 不应断开
    if (ch === '上' && j >= 1) {
      const prev2 = slice.slice(j - 1, j + 1)
      if (SHANG_PATTERN.has(prev2)) {
        return { shouldBreak: false, skipChars: 2 }
      }
    }
  }

  // 检查是否是软断点字符
  if (SOFT_BREAK_AFTER.has(ch) || /[\s，,、：]/.test(ch)) {
    return { shouldBreak: true, skipChars: 1 }
  }

  return { shouldBreak: false, skipChars: 0 }
}

function insertSoftBreaksChinese(s: string): string {
  const n = s.length
  if (n <= MAX_SOFT_CHUNK) return s

  let out = ''
  let i = 0

  while (i < n) {
    const remaining = n - i

    // 剩余字数小于等于 MAX_SOFT_CHUNK 时，直接追加不处理
    if (remaining <= MAX_SOFT_CHUNK) {
      out += s.slice(i)
      break
    }

    // 取 MAX_SOFT_CHUNK + 3 个字符，在范围内找最佳断点
    const extendedEnd = Math.min(i + MAX_SOFT_CHUNK + 3, n)
    const slice = s.slice(i, extendedEnd)

    let cutRel = -1
    let skipChars = 0

    // 从块末尾向前找软断点
    for (let j = Math.min(slice.length, MAX_SOFT_CHUNK) - 1; j >= MIN_SOFT_CHUNK - 1; j--) {
      const result = shouldBreakAt(slice, j, n - i)

      if (result.shouldBreak) {
        cutRel = j + 1
        break
      } else if (result.skipChars > 0) {
        // 跳过整个词/模式
        j -= result.skipChars - 1
        continue
      }
    }

    if (cutRel === -1) cutRel = MAX_SOFT_CHUNK
    out += s.slice(i, i + cutRel) + '，'
    i += cutRel
  }

  return out
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

/**
 * 检查是否应该在此处断句（用于 splitOversizedFragment）
 */
function canBreakAt(char: string, nextChar: string | undefined): boolean {
  if (!nextChar) return true

  const pair = char + nextChar
  // 如果是二字词，不断开
  if (DONT_BREAK_WORDS.has(pair)) return false

  // "X的Y" 检查
  if (char === '的' && DE_AFTER_NOUN_VERB.has(nextChar)) return false
  // "X了Y" 检查
  if (char === '了' && LE_AFTER_VERB_NOUN.has(nextChar)) return false

  return true
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

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    const nextChar = text[i + 1]
    current += char
    const weight = measureTextWeight(current)

    const atSoftBoundary =
      /[\s，,、：:]/.test(char) || SOFT_BREAK_AFTER.has(char) || /[。！？!?；;]/.test(char)

    if (weight >= targetWeight && atSoftBoundary) {
      if (canBreakAt(char, nextChar)) {
        flush()
        continue
      }
    }

    if (weight >= maxWeight) {
      flush()
    }
  }

  flush()
  return parts
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
