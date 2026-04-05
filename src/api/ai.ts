/**
 * AI 助手 API — DeepSeek（与 ai-admin 对齐，供实时总结等调用）
 */

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 调用 DeepSeek API 获取 AI 回复（非流式）
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  const apiKey = DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error('DeepSeek API Key 未配置，请在 .env 文件中设置 VITE_DEEPSEEK_API_KEY')
  }

  const requestBody: ChatCompletionRequest = {
    model: options?.model || 'deepseek-chat',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error?.message || `API 请求失败: ${response.status} ${response.statusText}`
      )
    }

    const data: ChatCompletionResponse = await response.json()

    const choice = data.choices?.[0]
    const content = choice?.message?.content
    if (content == null || content === '') {
      throw new Error('API 返回数据格式错误')
    }

    return content
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('AI 服务暂时不可用，请稍后重试')
  }
}
