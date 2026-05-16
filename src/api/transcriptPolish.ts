/**
 * 语音识别结果的后处理：调用 DeepSeek 补全标点并按语义断句。
 */
import { getChatCompletion } from '@/api/ai'

function stripAssistantNoise(text: string): string {
  let s = text.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '')
  }
  return s.trim()
}

/**
 * 一体化：补标点 + 按语义断成句子数组。
 * DeepSeek 直接输出「每句一行」的结果，避免本地规则二次拆分导致断句不准。
 */
export async function polishAndSegmentTranscript(text: string): Promise<string[]> {
  const raw = text.trim()
  if (!raw) return []

  const maxTokens = Math.min(1500, Math.max(150, Math.ceil(raw.length * 0.8) + 100))

  const out = await getChatCompletion(
    [
      {
        role: 'system',
        content:
          '你是中文口语转写编辑。任务：\n' +
          '1. 为无标点的语音识别文本补充准确的中文标点（逗号、句号、问号、感叹号、顿号等）。\n' +
          '2. 按语义和语气将文本分成独立句子，每句一行输出。\n' +
          '3. 一个完整的语意表达放在同一行，不要把一句话拆成多行；但不同话题、不同问答应分行。\n' +
          '4. 保持说话人原意与口语感，不增删改事实内容，不要纠正别字。\n' +
          '只输出处理后的文本，每句一行。不要编号、不要引号包裹、不要任何解释。'
      },
      {
        role: 'user',
        content: raw
      }
    ],
    { temperature: 0.15, maxTokens }
  )

  const cleaned = stripAssistantNoise(out)
  return cleaned
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
}

/**
 * 仅补标点（不断句），用于单段短文本。
 */
export async function polishTranscriptWithAi(text: string): Promise<string> {
  const raw = text.trim()
  if (!raw) return ''

  const maxTokens = Math.min(1200, Math.max(120, Math.ceil(raw.length * 0.6) + 80))

  const out = await getChatCompletion(
    [
      {
        role: 'system',
        content:
          '你是中文口语转写编辑。任务：为无标点的语音识别文本补充合适的逗号、句号、问号、顿号等。' +
          '保持说话人原意与口语感，不要增删事实内容，不要加引号包裹整段，不要输出任何解释或前后缀。只输出处理后的正文。'
      },
      {
        role: 'user',
        content: `请处理以下转写文本：\n\n${raw}`
      }
    ],
    { temperature: 0.25, maxTokens }
  )

  return stripAssistantNoise(out)
}
