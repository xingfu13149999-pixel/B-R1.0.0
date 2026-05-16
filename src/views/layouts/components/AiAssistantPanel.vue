<template>
  <transition name="ai-panel-slide">
    <aside v-if="visible" class="ai-panel" role="dialog" aria-modal="false" aria-label="AI助手">
      <header class="ai-panel__header">
        <div class="ai-panel__title">
          <img class="ai-panel__title-icon" :src="iconAiTitle" alt="" />
          <span>AI助手</span>
        </div>
        <button type="button" class="ai-panel__close" aria-label="关闭" @click="closePanel">
          <img :src="iconClose" alt="" />
        </button>
      </header>

      <section ref="bodyRef" class="ai-panel__body" @scroll="handleBodyScroll">
        <div v-if="chatMessages.length === 0 && !isLoading" class="ai-panel__empty">
          <img class="ai-panel__empty-image" :src="emptyAi" alt="" />
          <p class="ai-panel__empty-text">Hi，有关于公司的问题。请问我...</p>
        </div>

        <div v-else class="ai-chat-list">
          <article
            v-for="(message, index) in chatMessages"
            :key="message.id"
            class="ai-chat-item"
            :class="`ai-chat-item--${message.role}`"
          >
            <template v-if="message.role === 'user'">
              <div class="ai-chat-user-wrap">
                <div class="ai-chat-bubble ai-chat-bubble--user" :class="{ 'ai-chat-bubble--error': message.error }">
                  {{ message.content }}
                </div>
                <div class="ai-chat-actions ai-chat-actions--user">
                  <button
                    type="button"
                    class="ai-icon-action-btn"
                    :class="{ 'ai-icon-action-btn--solid': isActionHighlighted(`${message.id}-copy`) }"
                    aria-label="复制问题"
                    @mouseenter="setHoveredAction(`${message.id}-copy`)"
                    @mouseleave="clearHoveredAction(`${message.id}-copy`)"
                    @click="copyUserMessage(message)"
                  >
                    <img
                      class="ai-icon-action-btn__img ai-icon-action-btn__img--copy"
                      :class="{ 'is-active': isActionHighlighted(`${message.id}-copy`) }"
                      :src="getCopyIcon(message)"
                      alt=""
                    />
                  </button>
                  <button
                    type="button"
                    class="ai-icon-action-btn"
                    :class="{ 'ai-icon-action-btn--solid': isActionHighlighted(`${message.id}-edit`) }"
                    aria-label="修改问题"
                    @mouseenter="setHoveredAction(`${message.id}-edit`)"
                    @mouseleave="clearHoveredAction(`${message.id}-edit`)"
                    @click="editUserMessage(index)"
                  >
                    <img
                      class="ai-icon-action-btn__img ai-icon-action-btn__img--edit"
                      :class="{ 'is-active': isActionHighlighted(`${message.id}-edit`) }"
                      :src="getEditIcon(message)"
                      alt=""
                    />
                  </button>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="ai-chat-assistant-wrap">
                <div
                  class="ai-chat-richtext"
                  :class="{ 'ai-chat-richtext--error': message.error }"
                  v-html="renderAssistantReply(message.content, message.error === true)"
                />
                <div class="ai-chat-actions ai-chat-actions--assistant">
                  <button
                    type="button"
                    class="ai-icon-action-btn"
                    :class="{ 'ai-icon-action-btn--solid': isActionHighlighted(`${message.id}-copy`) }"
                    aria-label="复制回答"
                    @mouseenter="setHoveredAction(`${message.id}-copy`)"
                    @mouseleave="clearHoveredAction(`${message.id}-copy`)"
                    @click="copyAssistantMessage(message)"
                  >
                    <img
                      class="ai-icon-action-btn__img ai-icon-action-btn__img--copy"
                      :class="{ 'is-active': isActionHighlighted(`${message.id}-copy`) }"
                      :src="getCopyIcon(message)"
                      alt=""
                    />
                  </button>
                  <button
                    type="button"
                    class="ai-icon-action-btn"
                    :disabled="isLoading"
                    aria-label="刷新回答"
                    @mouseenter="setHoveredAction(`${message.id}-refresh`)"
                    @mouseleave="clearHoveredAction(`${message.id}-refresh`)"
                    @click="regenerateMessage(index)"
                  >
                    <img
                      class="ai-icon-action-btn__img ai-icon-action-btn__img--refresh"
                      :class="{ 'is-active': isActionHighlighted(`${message.id}-refresh`) }"
                      :src="getRefreshIcon(message)"
                      alt=""
                    />
                  </button>
                </div>
              </div>
            </template>
          </article>

          <article v-if="isLoading" class="ai-chat-item ai-chat-item--assistant">
            <div class="ai-chat-assistant-wrap">
              <div class="ai-chat-bubble ai-chat-bubble--loading">
                <span />
                <span />
                <span />
              </div>
            </div>
          </article>
        </div>

        <div v-if="showScrollActions" class="ai-scroll-actions">
          <button
            v-if="canScrollToTop"
            type="button"
            class="ai-scroll-btn ai-scroll-btn--top"
            aria-label="置顶"
            @mouseenter="setHoveredAction('scroll-top')"
            @mouseleave="clearHoveredAction('scroll-top')"
            @click="scrollToTop"
          >
            <img
              class="ai-scroll-btn__img"
              :class="{ 'is-active': isActionHighlighted('scroll-top') }"
              :src="getScrollIcon('top')"
              alt=""
            />
          </button>
          <button
            v-if="canScrollToBottom"
            type="button"
            class="ai-scroll-btn"
            aria-label="置底"
            @mouseenter="setHoveredAction('scroll-bottom')"
            @mouseleave="clearHoveredAction('scroll-bottom')"
            @click="() => scrollToBottomSmooth()"
          >
            <img
              class="ai-scroll-btn__img"
              :class="{ 'is-active': isActionHighlighted('scroll-bottom') }"
              :src="getScrollIcon('bottom')"
              alt=""
            />
          </button>
        </div>
      </section>

      <footer class="ai-panel__footer">
        <div class="ai-panel__tools">
          <button type="button" class="ai-panel__tool-btn" aria-label="新建对话" @click="startNewConversation">
            <img class="ai-panel__tool-icon ai-panel__tool-icon--new-chat" :src="iconNewChat" alt="" />
          </button>
          <div class="ai-panel__tool-item ai-panel__tool-item--history">
            <button
              ref="historyTriggerRef"
              type="button"
              class="ai-panel__tool-btn ai-panel__tool-btn--muted"
              aria-label="历史对话"
              @mouseenter="setHoveredAction('history')"
              @mouseleave="clearHoveredAction('history')"
              @click="toggleHistoryPanel"
            >
              <img class="ai-panel__tool-icon ai-panel__tool-icon--history" :src="getHistoryToolIcon()" alt="" />
            </button>

            <div v-if="historyOpen" ref="historyPanelRef" class="ai-history">
              <span class="ai-history__tail" aria-hidden="true" />

              <div v-if="groupedHistoryList.length" class="ai-history__scroll">
                <section v-for="group in groupedHistoryList" :key="group.key" class="ai-history__group">
                  <p class="ai-history__time">{{ group.label }}</p>

                  <div class="ai-history__group-list">
                    <div
                      v-for="item in group.items"
                      :key="item.id"
                      class="ai-history__item"
                      :class="{ 'ai-history__item--active': isHistoryItemActive(item.id) }"
                    >
                      <button type="button" class="ai-history__item-main" @click="restoreHistory(item.id)">
                        <span class="ai-history__title">{{ item.title }}</span>
                      </button>
                      <button
                        type="button"
                        class="ai-history__delete"
                        aria-label="删除历史对话"
                        @click.stop="deleteHistoryItem(item.id)"
                      >
                        <img :src="iconHistoryDelete" alt="" />
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              <p v-else class="ai-history__empty">暂无历史对话</p>
            </div>
          </div>
        </div>

        <div v-if="!isVoiceMode" class="ai-panel__composer">
          <textarea
            ref="textareaRef"
            v-model="draft"
            class="ai-panel__textarea"
            placeholder="请输入你想提出的问题"
            maxlength="2000"
            @keydown.enter.exact.prevent="sendMessage"
          />

          <div class="ai-panel__actions">
            <button
              type="button"
              class="ai-panel__action-btn ai-panel__action-btn--voice"
              aria-label="语音输入"
              @mouseenter="setHoveredAction('voice')"
              @mouseleave="clearHoveredAction('voice')"
              @click="handleVoiceEntry"
            >
              <img :src="getVoiceToolIcon()" alt="" />
            </button>
            <button
              type="button"
              class="ai-panel__action-btn"
              aria-label="发送"
              @mouseenter="setHoveredAction('send')"
              @mouseleave="clearHoveredAction('send')"
              :disabled="isLoading || !draft.trim()"
              @click="handleSendClick"
            >
              <img :src="getSendToolIcon()" alt="" />
            </button>
          </div>
        </div>

        <div v-else class="ai-voice-box">
          <div class="ai-voice-box__wave">
            <span
              v-for="(height, index) in voiceWaveBars"
              :key="index"
              class="ai-voice-box__bar"
              :class="{ 'ai-voice-box__bar--active': isVoiceRecording }"
              :style="{ height: `${height}px`, animationDelay: `${index * 0.05}s` }"
            />
          </div>

          <p v-if="voiceText" class="ai-voice-box__text">{{ voiceText }}</p>
          <p v-else class="ai-voice-box__hint">
            {{ isVoiceRecording ? '正在聆听，请继续说...' : '点击麦克风开始语音输入' }}
          </p>

          <div class="ai-voice-box__actions">
            <button type="button" class="ai-voice-box__btn ai-voice-box__btn--ghost" @click="exitVoiceMode">
              取消
            </button>
            <button
              type="button"
              class="ai-voice-box__btn ai-voice-box__btn--mic"
              :class="{ 'ai-voice-box__btn--mic-active': isVoiceRecording }"
              @click="toggleVoiceRecording"
            >
              <img :src="iconVoice" alt="" />
            </button>
            <button
              type="button"
              class="ai-voice-box__btn ai-voice-box__btn--send"
              :disabled="!voiceText.trim()"
              @click="sendVoiceText"
            >
              <img :src="iconSend" alt="" />
            </button>
          </div>
        </div>
      </footer>
    </aside>
  </transition>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getChatCompletion } from '@/api/ai'
import iconAiTitle from '@/assets/images/ai-assistant/icon-ai-title.png'
import emptyAi from '@/assets/images/ai-assistant/empty-ai.png'
import iconClose from '@/assets/images/ai-assistant/icon-close.svg'
import iconNewChat from '@/assets/images/ai-assistant/icon-new-chat.svg'
import iconHistory from '@/assets/images/ai-assistant/icon-history.svg'
import iconVoice from '@/assets/images/ai-assistant/icon-voice.svg'
import iconSend from '@/assets/images/ai-assistant/icon-send.svg'
import iconHistoryActive from '@/assets/images/ai-assistant/icon-history-active.svg'
import iconVoiceActive from '@/assets/images/ai-assistant/icon-voice-active.svg'
import iconSendActive from '@/assets/images/ai-assistant/icon-send-active.svg'
import iconHistoryDelete from '@/assets/images/ai-assistant/icon-history-delete.svg'
import iconCopyDefault from '@/assets/images/ai-assistant/icon-copy-default.svg'
import iconCopyActive from '@/assets/images/ai-assistant/icon-copy-active.svg'
import iconEditDefault from '@/assets/images/ai-assistant/icon-edit-default.svg'
import iconEditActive from '@/assets/images/ai-assistant/icon-edit-active.svg'
import iconRefreshDefault from '@/assets/images/ai-assistant/icon-refresh-default.svg'
import iconRefreshActive from '@/assets/images/ai-assistant/icon-refresh.svg'
import iconScrollBottom from '@/assets/images/ai-assistant/icon-scroll-bottom.svg'
import iconScrollBottomActive from '@/assets/images/ai-assistant/icon-scroll-bottom-active.svg'

interface ChatItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

interface ConversationHistory {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatItem[]
}

interface HistoryGroup {
  key: string
  label: string
  items: ConversationHistory[]
}

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart?: null | (() => void)
  onresult?: null | ((event: any) => void)
  onerror?: null | ((event: any) => void)
  onend?: null | (() => void)
  start: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

const HISTORY_CACHE_KEY = 'b2b-ai-assistant-history'
const AI_CONFIG_HINT = '当前未配置 AI 服务，请在项目根目录 .env 文件中设置 VITE_DEEPSEEK_API_KEY 后再试。'
const ACTIVE_ACTION_DURATION = 1200

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const bodyRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const historyPanelRef = ref<HTMLElement | null>(null)
const historyTriggerRef = ref<HTMLButtonElement | null>(null)
const draft = ref('')
const isLoading = ref(false)
const historyOpen = ref(false)
const isVoiceMode = ref(false)
const isVoiceRecording = ref(false)
const voiceText = ref('')
const chatMessages = ref<ChatItem[]>([])
const historyList = ref<ConversationHistory[]>([])
const activeConversationId = ref<string | null>(null)
const activeActionKey = ref('')
const hoveredActionKey = ref('')
const canScrollToTop = ref(false)
const canScrollToBottom = ref(false)
const voiceWaveBars = [10, 16, 12, 22, 14, 28, 18, 24, 12, 20, 14, 26]

let recognition: SpeechRecognitionLike | null = null
let activeActionTimer: ReturnType<typeof setTimeout> | null = null

const sortedHistoryList = computed(() => [...historyList.value].sort((a, b) => b.updatedAt - a.updatedAt))
const groupedHistoryList = computed<HistoryGroup[]>(() => {
  const groups: HistoryGroup[] = []

  for (const item of sortedHistoryList.value) {
    const key = formatHistoryGroupKey(item.updatedAt)
    const current = groups[groups.length - 1]

    if (current && current.key === key) {
      current.items.push(item)
    } else {
      groups.push({
        key,
        label: formatHistoryGroupTime(item.updatedAt),
        items: [item]
      })
    }
  }

  return groups
})
const hasAiApiKey = computed(() => Boolean(import.meta.env.VITE_DEEPSEEK_API_KEY))
const showScrollActions = computed(() => chatMessages.value.length > 0)

function setActiveAction(key: string) {
  activeActionKey.value = key
  if (activeActionTimer) clearTimeout(activeActionTimer)
  activeActionTimer = setTimeout(() => {
    if (activeActionKey.value === key) activeActionKey.value = ''
    activeActionTimer = null
  }, ACTIVE_ACTION_DURATION)
}

function updateScrollState() {
  const el = bodyRef.value
  if (!el) return
  const threshold = 12
  canScrollToTop.value = el.scrollTop > threshold
  canScrollToBottom.value = el.scrollTop + el.clientHeight < el.scrollHeight - threshold
}

function handleBodyScroll() {
  updateScrollState()
}

function closePanel() {
  historyOpen.value = false
  stopRecognition()
  emit('update:visible', false)
}

function closeHistoryOnOutsidePointer(event: MouseEvent) {
  if (!historyOpen.value) return
  const target = event.target as Node | null
  if (!target) return
  if (historyPanelRef.value?.contains(target)) return
  if (historyTriggerRef.value?.contains(target)) return
  historyOpen.value = false
}

function createMessage(role: 'user' | 'assistant', content: string, error = false): ChatItem {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    role,
    content,
    error
  }
}

function buildConversationTitle(messages: ChatItem[]) {
  const firstUser = messages.find(item => item.role === 'user')
  const source = firstUser?.content.trim() || '新对话'
  return source.length > 14 ? `${source.slice(0, 14)}...` : source
}

function saveHistoryToCache() {
  try {
    localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(historyList.value))
  } catch {
    // ignore storage failures
  }
}

function loadHistoryFromCache() {
  try {
    const raw = localStorage.getItem(HISTORY_CACHE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as ConversationHistory[]
    if (!Array.isArray(parsed)) return
    historyList.value = parsed.filter(item => item?.id && Array.isArray(item.messages))
  } catch {
    historyList.value = []
  }
}

function syncCurrentConversation() {
  const onlyEmpty = chatMessages.value.every(item => !item.content.trim())
  if (chatMessages.value.length === 0 || onlyEmpty) return

  const now = Date.now()
  const payload: ConversationHistory = {
    id: activeConversationId.value || `history-${now}-${Math.random().toString(16).slice(2, 6)}`,
    title: buildConversationTitle(chatMessages.value),
    createdAt: activeConversationId.value
      ? historyList.value.find(item => item.id === activeConversationId.value)?.createdAt || now
      : now,
    updatedAt: now,
    messages: chatMessages.value.map(item => ({ ...item }))
  }

  activeConversationId.value = payload.id
  historyList.value = [payload, ...historyList.value.filter(item => item.id !== payload.id)].slice(0, 20)
}

function pushAssistantMessage(content: string, error = false) {
  chatMessages.value.push(createMessage('assistant', content, error))
  syncCurrentConversation()
}

function startNewConversation() {
  historyOpen.value = false
  stopRecognition()
  isVoiceMode.value = false
  isVoiceRecording.value = false
  voiceText.value = ''
  activeConversationId.value = null
  chatMessages.value = []
  draft.value = ''
  nextTick(() => {
    textareaRef.value?.focus()
    updateScrollState()
  })
}

function restoreHistory(id: string) {
  const target = historyList.value.find(item => item.id === id)
  if (!target) return
  activeConversationId.value = target.id
  chatMessages.value = target.messages.map(item => ({ ...item }))
  historyOpen.value = false
  isVoiceMode.value = false
  nextTick(() => {
    scrollToBottomSmooth(false)
  })
}

function deleteHistoryItem(id: string) {
  historyList.value = historyList.value.filter(item => item.id !== id)
  if (activeConversationId.value === id) activeConversationId.value = null
}

function formatHistoryGroupKey(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatHistoryGroupTime(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function scrollToTop() {
  setActiveAction('scroll-top')
  bodyRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToBottomSmooth(smooth = true) {
  setActiveAction('scroll-bottom')
  const el = bodyRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  requestAnimationFrame(updateScrollState)
}

function renderAssistantReply(content: string, isError = false) {
  const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  if (isError) {
    return `<p class="ai-reply-p">${escaped}</p>`
  }

  const lines = escaped.split(/\r?\n/)
  let html = ''
  let inList = false
  let listTag = 'ul'

  const closeList = () => {
    if (inList) {
      html += `</${listTag}>`
      inList = false
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      closeList()
      html += '<div class="ai-reply-gap"></div>'
      continue
    }

    if (/^#{1,3}\s+/.test(line)) {
      closeList()
      const level = line.match(/^#+/)?.[0].length ?? 1
      const text = line.replace(/^#{1,3}\s+/, '')
      const tag = level === 1 ? 'h2' : 'h3'
      html += `<${tag} class="ai-reply-${tag}">${text}</${tag}>`
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      if (!inList || listTag !== 'ol') {
        closeList()
        inList = true
        listTag = 'ol'
        html += '<ol class="ai-reply-ol">'
      }
      html += `<li>${line.replace(/^\d+\.\s+/, '')}</li>`
      continue
    }

    if (/^[-*\u2022]\s+/.test(line)) {
      if (!inList || listTag !== 'ul') {
        closeList()
        inList = true
        listTag = 'ul'
        html += '<ul class="ai-reply-ul">'
      }
      html += `<li>${line.replace(/^[-*\u2022]\s+/, '')}</li>`
      continue
    }

    closeList()
    const text = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>')
    html += `<p class="ai-reply-p">${text}</p>`
  }

  closeList()
  return html
}

async function requestAssistantReply() {
  if (!hasAiApiKey.value) {
    pushAssistantMessage(AI_CONFIG_HINT, true)
    ElMessage.warning('AI 服务尚未配置，请先补充 VITE_DEEPSEEK_API_KEY。')
    await nextTick()
    scrollToBottomSmooth()
    return
  }

  isLoading.value = true
  await nextTick()
  scrollToBottomSmooth(false)

  try {
    const reply = await getChatCompletion(
      [
        {
          role: 'system',
          content:
            '你是企业风格的 AI 助手，请用简洁、专业、友好的中文回答问题。若信息不足，请明确说明并给出下一步建议。输出时优先使用清晰的段落、标题和列表。'
        },
        ...chatMessages.value.map(item => ({
          role: item.role,
          content: item.content
        }))
      ],
      {
        model: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 1200
      }
    )

    pushAssistantMessage(reply)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 服务暂时不可用，请稍后重试。'
    pushAssistantMessage(`抱歉，${message}`, true)
    ElMessage.warning('AI 助手暂时不可用，已返回错误信息。')
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottomSmooth()
  }
}

async function sendMessage() {
  const content = draft.value.trim()
  if (!content || isLoading.value) return

  historyOpen.value = false
  chatMessages.value.push(createMessage('user', content))
  draft.value = ''
  syncCurrentConversation()
  await nextTick()
  scrollToBottomSmooth(false)
  await requestAssistantReply()
}

async function copyMessage(content: string, key: string, successText = '已复制到剪贴板') {
  try {
    await navigator.clipboard.writeText(content)
    setActiveAction(key)
    ElMessage.success(successText)
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

function copyUserMessage(message: ChatItem) {
  return copyMessage(message.content, `${message.id}-copy`)
}

function copyAssistantMessage(message: ChatItem) {
  return copyMessage(message.content, `${message.id}-copy`)
}

function getCopyIcon(message: ChatItem) {
  return isActionHighlighted(`${message.id}-copy`) ? iconCopyActive : iconCopyDefault
}

function getEditIcon(message: ChatItem) {
  return isActionHighlighted(`${message.id}-edit`) ? iconEditActive : iconEditDefault
}

function getRefreshIcon(message: ChatItem) {
  return isActionHighlighted(`${message.id}-refresh`) ? iconRefreshActive : iconRefreshDefault
}

function getScrollIcon(direction: 'top' | 'bottom') {
  return isActionHighlighted(`scroll-${direction}`) ? iconScrollBottomActive : iconScrollBottom
}

function isActionActive(key: string) {
  return activeActionKey.value === key
}

function isActionHighlighted(key: string) {
  return isActionActive(key) || hoveredActionKey.value === key
}

function setHoveredAction(key: string) {
  hoveredActionKey.value = key
}

function clearHoveredAction(key: string) {
  if (hoveredActionKey.value === key) {
    hoveredActionKey.value = ''
  }
}

function getHistoryToolIcon() {
  return historyOpen.value || isActionHighlighted('history') ? iconHistoryActive : iconHistory
}

function isHistoryItemActive(id: string) {
  return activeConversationId.value === id
}

function getVoiceToolIcon() {
  return isVoiceMode.value || isActionHighlighted('voice') ? iconVoiceActive : iconVoice
}

function getSendToolIcon() {
  return isActionHighlighted('send') ? iconSendActive : iconSend
}

function toggleHistoryPanel() {
  setActiveAction('history')
  historyOpen.value = !historyOpen.value
}

function handleVoiceEntry() {
  setActiveAction('voice')
  enterVoiceMode()
}

function handleSendClick() {
  if (isLoading.value || !draft.value.trim()) return
  setActiveAction('send')
  void sendMessage()
}

function editUserMessage(index: number) {
  const message = chatMessages.value[index]
  if (!message || message.role !== 'user') return
  draft.value = message.content
  setActiveAction(`${message.id}-edit`)
  nextTick(() => {
    textareaRef.value?.focus()
    textareaRef.value?.setSelectionRange(draft.value.length, draft.value.length)
  })
}

async function regenerateMessage(index: number) {
  if (isLoading.value) {
    ElMessage.warning('AI 正在回复中，请稍后再试')
    return
  }

  let userMessageIndex = -1
  for (let i = index - 1; i >= 0; i -= 1) {
    if (chatMessages.value[i]?.role === 'user') {
      userMessageIndex = i
      break
    }
  }

  if (userMessageIndex === -1) {
    ElMessage.warning('未找到对应的问题，无法重新生成')
    return
  }

  const assistantMessage = chatMessages.value[index]
  if (assistantMessage?.role === 'assistant') {
    setActiveAction(`${assistantMessage.id}-refresh`)
  }

  chatMessages.value = chatMessages.value.slice(0, index)
  syncCurrentConversation()
  await requestAssistantReply()
}

function enterVoiceMode() {
  historyOpen.value = false
  isVoiceMode.value = true
  voiceText.value = ''
}

function exitVoiceMode() {
  stopRecognition()
  isVoiceMode.value = false
  isVoiceRecording.value = false
  voiceText.value = ''
}

function stopRecognition() {
  if (!recognition) return
  recognition.abort()
  recognition = null
}

function toggleVoiceRecording() {
  if (isVoiceRecording.value) {
    stopRecognition()
    isVoiceRecording.value = false
    return
  }

  const SpeechRecognitionAPI =
    (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor })
      .SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition

  if (!SpeechRecognitionAPI) {
    ElMessage.error('当前浏览器不支持语音识别，请使用 Chrome 浏览器。')
    return
  }

  const instance = new SpeechRecognitionAPI() as SpeechRecognitionLike
  instance.lang = 'zh-CN'
  instance.continuous = true
  instance.interimResults = true

  instance.onstart = () => {
    isVoiceRecording.value = true
  }

  instance.onresult = (event: any) => {
    let finalText = ''
    let interimText = ''

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i]
      if (result.isFinal) {
        finalText += result[0].transcript
      } else {
        interimText += result[0].transcript
      }
    }

    voiceText.value = finalText ? `${voiceText.value}${finalText}`.trim() : interimText.trim()
  }

  instance.onerror = (event: any) => {
    isVoiceRecording.value = false
    if (event.error === 'not-allowed') {
      ElMessage.error('麦克风权限被拒绝，请在浏览器设置中允许访问。')
    } else if (event.error !== 'aborted') {
      ElMessage.error('语音识别失败，请重试。')
    }
  }

  instance.onend = () => {
    isVoiceRecording.value = false
  }

  recognition = instance
  instance.start()
}

async function sendVoiceText() {
  const content = voiceText.value.trim()
  if (!content || isLoading.value) return
  exitVoiceMode()
  draft.value = content
  await sendMessage()
}

watch(
  () => props.visible,
  value => {
    if (!value) {
      historyOpen.value = false
      stopRecognition()
      isVoiceRecording.value = false
      return
    }

    nextTick(() => {
      if (!isVoiceMode.value) {
        textareaRef.value?.focus()
      }
      updateScrollState()
      scrollToBottomSmooth(false)
    })
  }
)

watch(historyList, saveHistoryToCache, { deep: true })
watch(chatMessages, () => nextTick(updateScrollState), { deep: true })

onMounted(() => {
  loadHistoryFromCache()
  updateScrollState()
  document.addEventListener('mousedown', closeHistoryOnOutsidePointer)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', closeHistoryOnOutsidePointer)
})
</script>

<style scoped>
.ai-panel {
  position: fixed;
  top: 77px;
  right: 0;
  width: min(434px, 100vw);
  height: calc(100vh - 77px);
  background: #fff;
  box-shadow: 0 1px 8.7px -3px rgba(31, 28, 73, 0.25);
  z-index: 240;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  color: #21243d;
}

.ai-panel button,
.ai-panel textarea,
.ai-panel input,
.ai-panel select {
  font: inherit;
}

.ai-panel__header {
  height: 50px;
  padding: 0 18px;
  border-bottom: 1px solid #eef0f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.ai-panel__title {
  display: inline-flex;
  align-items: center;
  gap: 7.5px;
  color: #303030;
  font-size: 16px;
  font-weight: 700;
  line-height: 21px;
}

.ai-panel__title-icon {
  width: 20px;
  height: 21.53px;
  object-fit: contain;
  flex-shrink: 0;
}

.ai-panel__close {
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.ai-panel__close img {
  width: 15px;
  height: 14px;
  display: block;
}

.ai-panel__close:hover {
  opacity: 0.8;
}

.ai-panel__body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 20px 0;
  box-sizing: border-box;
  scroll-behavior: smooth;
}

.ai-panel__empty {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px 150px;
  box-sizing: border-box;
}

.ai-panel__empty-image {
  width: 110px;
  height: 70px;
  object-fit: contain;
}

.ai-panel__empty-text {
  margin: 24px 0 0;
  color: #a8a8c4;
  font-size: 16px;
  line-height: 27px;
  letter-spacing: 0.36px;
  text-align: center;
}

.ai-chat-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-bottom: 24px;
}

.ai-chat-item {
  display: flex;
}

.ai-chat-item--user {
  justify-content: flex-end;
}

.ai-chat-item--assistant {
  justify-content: flex-start;
}

.ai-chat-user-wrap,
.ai-chat-assistant-wrap {
  display: flex;
  flex-direction: column;
}

.ai-chat-user-wrap {
  align-items: flex-end;
  max-width: 286px;
}

.ai-chat-assistant-wrap {
  align-items: flex-start;
  width: 100%;
}

.ai-chat-bubble {
  font-size: 14px;
  line-height: 22px;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-chat-bubble--user {
  padding: 10px 14px;
  border-radius: 4px;
  background: #f0f2ff;
  color: #21243d;
  letter-spacing: 0.28px;
}

.ai-chat-bubble--error {
  background: #fff4f4;
  color: #d94949;
}

.ai-chat-bubble--loading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 58px;
  padding: 8px 12px;
  border-radius: 4px;
  background: #f8f9ff;
}

.ai-chat-bubble--loading span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8a92a6;
  animation: ai-dot-pulse 1.2s infinite ease-in-out;
}

.ai-chat-bubble--loading span:nth-child(2) {
  animation-delay: 0.15s;
}

.ai-chat-bubble--loading span:nth-child(3) {
  animation-delay: 0.3s;
}

.ai-chat-richtext {
  width: 100%;
  color: #21243d;
}

.ai-chat-richtext :deep(*) {
  box-sizing: border-box;
}

.ai-chat-richtext :deep(.ai-reply-h2),
.ai-chat-richtext :deep(.ai-reply-h3) {
  margin: 22px 0 12px;
  color: #21243d;
  font-weight: 700;
  letter-spacing: 0.36px;
}

.ai-chat-richtext :deep(.ai-reply-h2) {
  font-size: 18px;
  line-height: 27px;
}

.ai-chat-richtext :deep(.ai-reply-h3) {
  font-size: 16px;
  line-height: 24px;
}

.ai-chat-richtext :deep(.ai-reply-p) {
  margin: 0;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: 0.14px;
}

.ai-chat-richtext :deep(.ai-reply-gap) {
  display: block;
  height: 10px;
}

.ai-chat-richtext :deep(.ai-reply-ul),
.ai-chat-richtext :deep(.ai-reply-ol) {
  margin: 8px 0;
  padding-left: 22px;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: 0.14px;
}

.ai-chat-richtext :deep(.ai-reply-ul li),
.ai-chat-richtext :deep(.ai-reply-ol li) {
  margin: 4px 0;
}

.ai-chat-richtext :deep(strong) {
  font-size: 16px;
  font-weight: 500;
}

.ai-chat-richtext--error {
  color: #d94949;
}

.ai-chat-actions {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
}

.ai-chat-actions--assistant {
  justify-content: flex-start;
}

.ai-chat-actions--user {
  justify-content: flex-end;
}

.ai-icon-action-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s ease, background-color 0.2s ease;
}

.ai-icon-action-btn--solid {
  background: #2036ca;
}

.ai-icon-action-btn__img {
  display: block;
  object-fit: contain;
}

.ai-icon-action-btn__img--copy,
.ai-icon-action-btn__img--edit,
.ai-icon-action-btn__img--refresh {
  width: 16px;
  height: 16px;
}

.ai-icon-action-btn__img--refresh.is-active {
  width: 24px;
  height: 24px;
}

.ai-icon-action-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.ai-icon-action-btn:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.ai-scroll-actions {
  position: sticky;
  bottom: 24px;
  margin-left: auto;
  width: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  pointer-events: none;
}

.ai-scroll-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
}

.ai-scroll-btn__img {
  width: 32px;
  height: 32px;
  display: block;
  object-fit: contain;
}

.ai-scroll-btn--top {
  transform: rotate(180deg);
}

.ai-panel__footer {
  position: relative;
  padding: 10px 20px 20px;
  flex-shrink: 0;
}

.ai-panel__tools {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
}

.ai-panel__tool-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ai-panel__tool-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.ai-panel__tool-icon {
  display: block;
  object-fit: contain;
}

.ai-panel__tool-icon--new-chat,
.ai-panel__tool-icon--history {
  width: 20px;
  height: 20px;
}

.ai-panel__tool-btn--muted {
  opacity: 0.88;
}

.ai-history {
  position: absolute;
  left: calc(100% + 10px);
  bottom: -8px;
  width: 260px;
  height: 400px;
  padding: 18px 0 18px 0;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 0 8px rgba(159, 159, 159, 0.4);
  z-index: 2;
  box-sizing: border-box;
}

.ai-history__tail {
  position: absolute;
  left: -9px;
  bottom: 10px;
  width: 10px;
  height: 18px;
  background: #fff;
  clip-path: polygon(100% 0, 100% 100%, 0 50%);
  box-shadow: -2px 0 6px rgba(159, 159, 159, 0.22);
  z-index: 1;
}

.ai-history__scroll {
  height: 100%;
  padding: 0 4px 0 0;
  overflow-y: auto;
  box-sizing: border-box;
}

.ai-history__group {
  padding: 0 0 17px;
}

.ai-history__time {
  margin: 0 0 14px;
  padding: 0 0 0 22px;
  color: #9e9e9e;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.ai-history__group-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ai-history__item {
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 0 16px 0 22px;
  margin: 0 2px 0 0;
  border-radius: 4px;
  box-sizing: border-box;
}

.ai-history__item:hover,
.ai-history__item--active {
  background: #e6eaf3;
}

.ai-history__item-main {
  flex: 1;
  min-width: 0;
  height: 42px;
  padding: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  text-align: left;
  cursor: pointer;
}

.ai-history__title {
  color: #21243d;
  font-size: 14px;
  line-height: 1;
  letter-spacing: 0.28px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-history__empty {
  color: #8a92a6;
  font-size: 12px;
  line-height: 18px;
}

.ai-history__delete {
  width: 18px;
  height: 18px;
  margin-left: 12px;
  padding: 0;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
}

.ai-history__item:hover .ai-history__delete,
.ai-history__item--active .ai-history__delete {
  opacity: 1;
  pointer-events: auto;
}

.ai-history__delete img {
  width: 10.48px;
  height: 12.73px;
  display: block;
}

.ai-history__empty {
  margin: 0;
  padding: 150px 24px 0;
  text-align: center;
}

.ai-panel__composer {
  position: relative;
  height: 100px;
  background: #fff;
  border: 1px solid #d7d7d7;
  border-radius: 8px;
  overflow: hidden;
}

.ai-panel__textarea {
  width: 100%;
  height: 100%;
  padding: 15px 18px 52px;
  border: none;
  outline: none;
  resize: none;
  box-sizing: border-box;
  background: transparent;
  color: #21243d;
  font-size: 14px;
  line-height: 25px;
  letter-spacing: 0.28px;
}

.ai-panel__textarea::placeholder {
  color: #cbcbcb;
}

.ai-panel__actions {
  position: absolute;
  right: 15px;
  bottom: 11px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-panel__action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.ai-panel__action-btn img {
  width: 32px;
  height: 32px;
  display: block;
}

.ai-panel__action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ai-panel__action-btn--voice:hover,
.ai-panel__action-btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.ai-voice-box {
  height: 100px;
  padding: 16px 18px;
  border: 1px solid #d7d7d7;
  border-radius: 8px;
  background: #fff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ai-voice-box__wave {
  height: 36px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 5px;
}

.ai-voice-box__bar {
  width: 4px;
  border-radius: 999px;
  background: #d6dcf2;
}

.ai-voice-box__bar--active {
  background: linear-gradient(180deg, #2036ca 0%, #6f82ff 100%);
  animation: ai-voice-wave 1.05s infinite ease-in-out;
}

.ai-voice-box__text,
.ai-voice-box__hint {
  margin: 0;
  text-align: center;
  font-size: 14px;
  line-height: 22px;
}

.ai-voice-box__text {
  color: #21243d;
}

.ai-voice-box__hint {
  color: #8a92a6;
}

.ai-voice-box__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.ai-voice-box__btn {
  border: none;
  cursor: pointer;
}

.ai-voice-box__btn--ghost {
  height: 32px;
  padding: 0 14px;
  border-radius: 16px;
  background: #f5f7ff;
  color: #65708f;
  font-size: 13px;
}

.ai-voice-box__btn--mic,
.ai-voice-box__btn--send {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
}

.ai-voice-box__btn--mic img,
.ai-voice-box__btn--send img {
  width: 32px;
  height: 32px;
  display: block;
}

.ai-voice-box__btn--mic-active {
  filter: drop-shadow(0 0 8px rgba(32, 54, 202, 0.25));
}

.ai-voice-box__btn--send:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ai-panel-slide-enter-active,
.ai-panel-slide-leave-active {
  transition:
    transform 0.24s ease,
    opacity 0.24s ease;
}

.ai-panel-slide-enter-from,
.ai-panel-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@keyframes ai-dot-pulse {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: scale(0.75);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes ai-voice-wave {
  0%,
  100% {
    transform: scaleY(0.7);
    opacity: 0.7;
  }

  50% {
    transform: scaleY(1.15);
    opacity: 1;
  }
}

@media (max-width: 1400px) {
  .ai-panel {
    top: 72px;
    height: calc(100vh - 72px);
  }
}

@media (max-width: 768px) {
  .ai-panel {
    width: 100vw;
    top: 64px;
    height: calc(100vh - 64px);
  }

  .ai-panel__body {
    padding: 20px 16px 0;
  }

  .ai-panel__footer {
    padding: 10px 16px 16px;
  }

  .ai-history {
    left: calc(100% + 10px);
    right: auto;
    bottom: -8px;
    width: 260px;
  }

  .ai-chat-user-wrap,
  .ai-chat-assistant-wrap {
    max-width: 100%;
  }
}
</style>
