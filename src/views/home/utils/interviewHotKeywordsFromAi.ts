/**
 * 使用 DeepSeek 从访谈逐字稿提炼关键热词（与 InterviewSummaryPanel 同源 API）。
 * 已配置 Key 时优先全程走模型；仅在未配置 Key 或请求/解析失败时回退本地启发式。
 */
import { getChatCompletion } from '@/api/ai'
import { extractKeywords } from '@/views/home/utils/interviewKeywordExtract'

const MAX_TRANSCRIPT_CHARS = 14000
/** 字数过少时模型难以稳定产出，与 InterviewStart 触发阈值对齐 */
export const MIN_TRANSCRIPT_CHARS_FOR_AI_HOT_KEYWORDS = 12

function normalizeKeywordStrings(arr: unknown[]): string[] {
  return arr
    .map(x => (typeof x === 'string' ? x.trim() : String(x)))
    .map(x => x.replace(/^["'「」]|["'「」]$/g, '').trim())
    .filter(x => x.length >= 2 && x.length <= 24)
}

function parseJsonKeywordArray(raw: string): string[] {
  let s = raw.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m
  const m = s.match(fence)
  if (m?.[1]) s = m[1].trim()

  const tryParse = (json: string): string[] => {
    try {
      const parsed = JSON.parse(json) as unknown
      if (Array.isArray(parsed)) return normalizeKeywordStrings(parsed)
      if (parsed && typeof parsed === 'object') {
        const o = parsed as Record<string, unknown>
        const k = o.keywords ?? o.words ?? o.热词
        if (Array.isArray(k)) return normalizeKeywordStrings(k)
      }
    } catch {
      /* ignore */
    }
    return []
  }

  const direct = tryParse(s)
  if (direct.length) return direct

  const arrStart = s.indexOf('[')
  const arrEnd = s.lastIndexOf(']')
  if (arrStart === -1 || arrEnd === -1 || arrEnd <= arrStart) return []
  return tryParse(s.slice(arrStart, arrEnd + 1))
}

const SYSTEM_PROMPT = `你是资深商业与行业访谈分析师，任务是从逐字稿中提炼「关键热词」供检索与复盘。

输出要求（必须严格遵守）：
1. 只输出一个 JSON 数组，不要 markdown、不要代码块、不要解释、不要序号。
2. 数组含 6～8 个字符串；每个为 2～12 个汉字的短语。
3. 优先：专有名词、产品/项目名、机构与角色、指标与数字相关表述、风险与约束、决策与时间节点；可含简短英文缩写（如 KPI、SaaS）若文稿中出现。
4. 禁止：寒暄、语气词、纯连接词、与主题无关的泛词（如「情况」「方面」「问题」单独出现且无指代）。
5. 去重；与上文已选词勿近义重复。

示例（仅格式示意）：
["应收账款周转天数","授信额度","担保物估值","二期产线","2025Q1 回款"]`

/**
 * 根据带发言人标签的访谈文本提炼关键热词；未配置 Key 时用本地 extractKeywords。
 */
export async function fetchInterviewHotKeywordsFromTranscript(transcript: string): Promise<string[]> {
  const trimmed = transcript.trim()

  if (!import.meta.env.VITE_DEEPSEEK_API_KEY) {
    return trimmed.length >= 4 ? extractKeywords(stripSpeakerLabelsForLocal(trimmed)) : []
  }

  if (trimmed.length < MIN_TRANSCRIPT_CHARS_FOR_AI_HOT_KEYWORDS) {
    return []
  }

  const body =
    trimmed.length > MAX_TRANSCRIPT_CHARS ? trimmed.slice(-MAX_TRANSCRIPT_CHARS) : trimmed

  try {
    const raw = await getChatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `以下为访谈逐字稿（含发言人标签，提炼热词时可忽略标签本身）。请输出热词 JSON 数组：\n\n${body}`
        }
      ],
      { temperature: 0.2, maxTokens: 512 }
    )
    const parsed = parseJsonKeywordArray(raw)
    if (parsed.length) return [...new Set(parsed)].slice(0, 8)
    const retry = await getChatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `上一回复未解析到合法 JSON 数组。请重新只输出 6～8 个热词的 JSON 数组，例如 ["词一","词二"]，不要其它文字：\n\n${body.slice(0, 8000)}`
        }
      ],
      { temperature: 0.1, maxTokens: 400 }
    )
    const again = parseJsonKeywordArray(retry)
    if (again.length) return [...new Set(again)].slice(0, 8)
    console.warn('AI 关键热词解析为空，使用本地提取兜底')
    return extractKeywords(stripSpeakerLabelsForLocal(trimmed))
  } catch (e) {
    console.error('AI 关键热词失败，使用本地提取:', e)
    return trimmed.length >= 4 ? extractKeywords(stripSpeakerLabelsForLocal(trimmed)) : []
  }
}

/** 本地启发式时去掉「某某：」前缀，减少噪声 */
function stripSpeakerLabelsForLocal(s: string): string {
  return s
    .split('\n')
    .map(line => line.replace(/^[^：:\n]{1,32}[：:]\s*/, ''))
    .join('\n')
}
