/**
 * 与 InterviewSummaryPanel 同源：仅根据字幕分段生成总结块，供列表「重新总结」等无 Panel 实例的场景调用。
 */
import { getChatCompletion } from '@/api/ai'
import type { InterviewTranscriptSegment } from '@/views/home/composables/useInterviewTranscription'
import type { InterviewSummaryBlock } from '@/views/home/types/interviewSummary'

function parseMarkdownToBlocks(text: string): InterviewSummaryBlock[] {
  const blocks: InterviewSummaryBlock[] = []
  const lines = text.split('\n')
  let bulletBuffer: string[] = []

  function flushBullets() {
    if (bulletBuffer.length) {
      blocks.push({ type: 'bodyBullets', items: [...bulletBuffer] })
      bulletBuffer = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('# ')) {
      flushBullets()
      blocks.push({ type: 'mainTitle', content: line.slice(2).trim() })
    } else if (line.startsWith('## ')) {
      flushBullets()
      blocks.push({ type: 'subTitle', content: line.slice(3).trim() })
    } else if (line.startsWith('### ')) {
      flushBullets()
      blocks.push({ type: 'subTitle', content: line.slice(4).trim() })
    } else if (/^[-•*]\s+/.test(line)) {
      bulletBuffer.push(line.replace(/^[-•*]\s+/, '').trim())
    } else if (/^\d+\.\s+/.test(line)) {
      bulletBuffer.push(line.replace(/^\d+\.\s+/, '').trim())
    } else {
      flushBullets()
      const cleaned = line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
      blocks.push({ type: 'body', content: cleaned })
    }
  }
  flushBullets()
  return blocks
}

function buildTranscriptLines(segments: InterviewTranscriptSegment[]): string {
  const lines = segments.map(s => `${s.speakerLabel}：${s.text}`)
  return lines.join('\n').trim()
}

function buildLocalSummary(segments: InterviewTranscriptSegment[]): InterviewSummaryBlock[] {
  if (!segments.length) return []

  const speakers = new Map<string, string[]>()
  for (const s of segments) {
    const list = speakers.get(s.speakerLabel) ?? []
    list.push(s.text)
    speakers.set(s.speakerLabel, list)
  }

  const blocks: InterviewSummaryBlock[] = [{ type: 'mainTitle', content: '访谈要点总结' }]

  blocks.push({
    type: 'body',
    content: `本次访谈共 ${segments.length} 段对话，涉及 ${speakers.size} 位发言人。`
  })

  for (const [speaker, texts] of speakers) {
    blocks.push({ type: 'subTitle', content: `${speaker} 发言内容` })
    const sentences = texts.flatMap(t =>
      t.split(/[。！？；]/).map(s => s.trim()).filter(s => s.length > 1)
    )
    if (sentences.length <= 5) {
      blocks.push({ type: 'bodyBullets', items: sentences.length ? sentences : [texts.join('')] })
    } else {
      blocks.push({ type: 'bodyBullets', items: sentences.slice(0, 5) })
      blocks.push({ type: 'body', content: `……共 ${sentences.length} 条发言` })
    }
  }

  if (!import.meta.env.VITE_DEEPSEEK_API_KEY) {
    blocks.push({
      type: 'body',
      content: '提示：配置 VITE_DEEPSEEK_API_KEY 可获得 AI 智能总结。'
    })
  }

  return blocks
}

/**
 * 根据访谈字幕分段生成总结块（与 InterviewSummaryPanel 中 AI/本地逻辑一致）。
 */
export async function fetchInterviewSummaryBlocksFromSegments(
  segments: InterviewTranscriptSegment[]
): Promise<InterviewSummaryBlock[]> {
  const text = buildTranscriptLines(segments)
  if (!text) return []

  if (!import.meta.env.VITE_DEEPSEEK_API_KEY) {
    return buildLocalSummary(segments)
  }

  try {
    const raw = await getChatCompletion(
      [
        {
          role: 'system',
          content:
            '你是擅长提炼访谈记录的资深学者，擅长提炼访谈记录的核心要点并生成结构清晰的总结报告。请用中文回复，格式要求：\n# 一级标题\n## 二级标题\n正文段落\n- 列表项'
        },
        {
          role: 'user',
          content: `请对以下访谈记录进行总结，生成一份结构清晰的访谈总结报告：\n\n${text}`
        }
      ],
      { maxTokens: 2000 }
    )
    return parseMarkdownToBlocks(raw)
  } catch (e) {
    console.error('AI 总结失败，使用本地摘要:', e)
    return buildLocalSummary(segments)
  }
}
