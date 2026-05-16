<template>
  <div class="note-detail-page">
    <div class="note-detail__main-card">
      <header class="note-detail__toolbar">
        <div class="note-detail__toolbar-left">
          <button type="button" class="note-detail__back-btn" aria-label="返回" @click="goBack">
            <img class="note-detail__back-icon" :src="iconBack" alt="" />
          </button>
          <span class="note-detail__back-label">返回</span>
        </div>
      </header>

      <section v-if="note" class="note-detail__content">
        <section class="note-detail__column note-detail__column--main" aria-label="笔记详情">
          <div class="note-detail__section-head">
            <div class="note-detail__section-head-main">
              <h2 class="note-detail__section-title">
                <span class="note-detail__section-title-text">笔记</span>
              </h2>

              <div class="note-detail__actions">
                <button type="button" class="note-detail__action-btn" @click="handleEdit">
                  <img class="note-detail__action-icon" :src="iconEdit" alt="" />
                  <span>{{ isEditing ? '保存' : '编辑' }}</span>
                </button>
                <button
                  type="button"
                  class="note-detail__action-btn"
                  :disabled="isEditing"
                  @click="handleDownload"
                >
                  <img class="note-detail__action-icon" :src="iconDownload" alt="" />
                  <span>下载</span>
                </button>
              </div>
            </div>
          </div>

          <div class="note-detail__article-frame">
            <div v-if="!isEditing" class="note-detail__main-lines" aria-hidden="true">
              <span v-for="index in 12" :key="index" class="note-detail__line"></span>
            </div>

            <div class="note-detail__article" :class="{ 'note-detail__article--editing': isEditing }">
              <div
                class="note-detail__article-inner"
                :class="{ 'note-detail__article-inner--editing': isEditing }"
              >
                <template v-if="isEditing">
                  <input
                    v-model="editTitle"
                    type="text"
                    class="note-detail__title-input"
                    maxlength="100"
                  />
                  <textarea
                    v-model="editBody"
                    class="note-detail__body-editor"
                    spellcheck="false"
                  />
                </template>
                <template v-else>
                  <h1 class="note-detail__title">{{ note.detailTitle || note.title }}</h1>
                  <p
                    v-for="(paragraph, index) in note.detailParagraphs"
                    :key="`${note.id}-${index}`"
                    class="note-detail__paragraph"
                  >
                    {{ paragraph }}
                  </p>
                </template>
              </div>
            </div>
          </div>
        </section>

        <section class="note-detail__column note-detail__column--aside" aria-label="笔记详情侧栏">
          <div class="note-detail__tabs" role="tablist" aria-label="笔记详情切换">
            <button
              type="button"
              class="note-detail__tab"
              :class="{ 'note-detail__tab--active': activeTab === 'transcript' }"
              :aria-selected="activeTab === 'transcript'"
              @click="activeTab = 'transcript'"
            >
              访谈字幕
            </button>
            <button
              type="button"
              class="note-detail__tab"
              :class="{ 'note-detail__tab--active': activeTab === 'summary' }"
              :aria-selected="activeTab === 'summary'"
              @click="activeTab = 'summary'"
            >
              实时总结
            </button>
          </div>

          <div class="note-detail__panel">
            <div v-show="activeTab === 'transcript'" class="note-detail__panel-scroll">
              <article
                v-for="segment in note.transcriptSegments"
                :key="segment.id"
                class="note-detail__entry"
              >
                <header class="note-detail__entry-head">
                  <span
                    class="note-detail__speaker-tag"
                    :class="{ 'note-detail__speaker-tag--active': isTranscriptSegmentActive(segment) }"
                  >
                    <img
                      class="note-detail__speaker-icon"
                      :src="isTranscriptSegmentActive(segment) ? personIconWhite : personIconBlue"
                      alt=""
                      width="11"
                      height="14"
                    />
                    <span class="note-detail__speaker">{{ segment.speaker }}</span>
                  </span>
                  <span class="note-detail__time">{{ segment.timeRange }}</span>
                </header>
                <p class="note-detail__entry-text">{{ segment.text }}</p>
                <div
                  v-if="segment.id !== note.transcriptSegments[note.transcriptSegments.length - 1]?.id"
                  class="note-detail__entry-divider"
                />
              </article>
            </div>

            <div
              v-show="activeTab === 'summary'"
              class="note-detail__panel-scroll note-detail__panel-scroll--summary"
            >
              <section
                v-for="section in note.summarySections"
                :key="section.id"
                class="note-detail__summary-block"
              >
                <h3 class="note-detail__summary-title">{{ section.title }}</h3>
                <p class="note-detail__summary-text">{{ section.content }}</p>
              </section>
            </div>
          </div>
        </section>
      </section>

      <section v-else class="note-detail__empty">
        <h1 class="note-detail__empty-title">未找到对应笔记</h1>
        <p class="note-detail__empty-text">这条笔记可能已经被删除，或者当前地址无效。</p>
        <button type="button" class="note-detail__empty-btn" @click="goBack">返回笔记列表</button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import iconBack from '@/assets/images/credit-report/icon-back.svg'
import iconDownload from '@/assets/images/home/icon-download.svg'
import iconEdit from '@/assets/images/sidebar/icon-edit.svg'
import personIconBlue from '@/assets/images/interview/person-icon-blue.svg'
import personIconWhite from '@/assets/images/interview/person-icon-white.svg'
import {
  findNoteById,
  loadNotes,
  saveNotes,
  type NoteItem,
  type NoteTranscriptSegment
} from './noteStorage'

type DetailTab = 'transcript' | 'summary'

const route = useRoute()
const router = useRouter()
const activeTab = ref<DetailTab>('transcript')
const isEditing = ref(false)
const editTitle = ref('')
const editBody = ref('')
const note = ref<NoteItem | null>(null)

const noteId = computed(() => {
  const raw = route.params.noteId
  return Array.isArray(raw) ? raw[0] ?? '' : typeof raw === 'string' ? raw : ''
})

watch(
  noteId,
  currentId => {
    note.value = findNoteById(currentId)
    isEditing.value = false
    syncEditDraft()
  },
  { immediate: true }
)

function goBack() {
  router.push({ name: 'MyNotes' })
}

function handleEdit() {
  if (!note.value) return

  if (!isEditing.value) {
    isEditing.value = true
    syncEditDraft()
    return
  }

  const nextTitle = editTitle.value.trim() || note.value.detailTitle || note.value.title
  const nextParagraphs = normalizeParagraphs(editBody.value)
  const nextContent = nextParagraphs.join(' ')
  const nextNotes = loadNotes().map(item =>
    item.id === note.value?.id
      ? {
          ...item,
          title: nextTitle,
          detailTitle: nextTitle,
          content: nextContent.slice(0, 160),
          detailParagraphs: nextParagraphs
        }
      : item
  )

  saveNotes(nextNotes)
  note.value = nextNotes.find(item => item.id === note.value?.id) ?? note.value
  isEditing.value = false
  syncEditDraft()
  ElMessage.success('笔记内容已保存')
}

function handleDownload() {
  if (!note.value) return

  const payload = [note.value.detailTitle || note.value.title, '', ...note.value.detailParagraphs].join(
    '\n'
  )

  const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${note.value.title}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

function isTranscriptSegmentActive(segment: NoteTranscriptSegment & { isActive?: boolean }) {
  return Boolean(segment.isActive)
}

function syncEditDraft() {
  editTitle.value = note.value?.detailTitle || note.value?.title || ''
  editBody.value = note.value?.detailParagraphs.join('\n\n') || ''
}

function normalizeParagraphs(rawText: string) {
  const paragraphs = rawText
    .split(/\r?\n+/)
    .map(item => item.trim())
    .filter(Boolean)

  return paragraphs.length ? paragraphs : ['']
}
</script>

<style scoped>
.note-detail-page {
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0 32px 32px;
  background: transparent;
}

.note-detail__main-card {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  padding: 20px 24px 24px;
  background: linear-gradient(125deg, #ffffff 10%, #f1f5fd 100%);
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(36, 31, 164, 0.1);
  box-sizing: border-box;
}

.note-detail__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 46px;
  margin: 0 0 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #cedbfa;
  box-sizing: border-box;
}

.note-detail__toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.note-detail__back-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.note-detail__back-icon {
  width: 32px;
  height: 32px;
  display: block;
  flex-shrink: 0;
  object-fit: contain;
  transform: rotate(90deg);
}

.note-detail__back-label {
  font-size: 20px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.02em;
  color: #21243d;
}

.note-detail__actions {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.note-detail__action-btn {
  min-width: 84px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 14px;
  border: 1px solid #c4c4c4;
  border-radius: 5px;
  background: #fff;
  color: #21243d;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease,
    opacity 0.2s ease;
}

.note-detail__action-btn:hover {
  border-color: #2036ca;
  color: #2036ca;
}

.note-detail__action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.note-detail__action-icon {
  width: 14px;
  height: 14px;
  display: block;
  object-fit: contain;
  flex-shrink: 0;
}

.note-detail__action-btn:first-child .note-detail__action-icon {
  width: 19px;
  height: 19px;
}

.note-detail__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 596px;
  gap: 24px;
  flex: 1;
  min-height: 0;
  padding: 18px 23px 0 22px;
  box-sizing: border-box;
}

.note-detail__column {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.note-detail__column--main {
  overflow: hidden;
  padding-left: 0;
  padding-right: 2px;
}

.note-detail__column--main .note-detail__section-head {
  flex: 0 0 auto;
  margin-bottom: 18px;
}

.note-detail__section-head-main {
  position: relative;
  min-height: 44px;
}

.note-detail__column--main .note-detail__actions {
  position: absolute;
  top: 2px;
  right: 0;
}

.note-detail__article-frame {
  --note-line-step: 48px;
  position: relative;
  flex: 1;
  min-height: 0;
  background: #fff;
  border: 1px solid #d9e3fb;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
  overflow: hidden;
}

.note-detail__main-lines {
  position: absolute;
  left: 38px;
  right: 22px;
  top: 90px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: var(--note-line-step);
  pointer-events: none;
}

.note-detail__line {
  width: 100%;
  height: 1px;
  background: rgba(198, 211, 248, 0.88);
}

.note-detail__article {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow-y: auto;
  padding: 52px 0 24px 54px;
}

.note-detail__article--editing {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: 36px;
}

.note-detail__article-inner {
  min-height: 100%;
  padding-right: 8px;
}

.note-detail__article-inner--editing {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.note-detail__section-title {
  margin: 0;
}

.note-detail__section-title-text {
  display: inline-block;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: #2036ca;
}

.note-detail__section-title::after {
  content: '';
  display: block;
  width: 73px;
  height: 6px;
  margin-top: 4px;
  border-radius: 3px;
  background: linear-gradient(90deg, #2036ca 0%, rgba(32, 54, 202, 0) 100%);
}

.note-detail__title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  color: #21243d;
}

.note-detail__title-input {
  width: 100%;
  margin: 0 0 20px;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  color: #21243d;
}

.note-detail__paragraph {
  margin: 0;
  font-size: 14px;
  line-height: var(--note-line-step);
  color: #2d3149;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-detail__body-editor {
  flex: 1;
  display: block;
  width: 100%;
  min-height: 0;
  padding: 0;
  border: none;
  outline: none;
  resize: none;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  line-height: var(--note-line-step);
  color: #2d3149;
  overflow-y: auto;
  box-sizing: border-box;
  padding-right: 0;
}

.note-detail__column--aside {
  min-width: 0;
  padding-left: 26px;
  border-left: 1px solid #dce5fb;
  box-sizing: border-box;
}

.note-detail__tabs {
  display: inline-flex;
  align-items: flex-start;
  gap: 30px;
  padding-top: 2px;
  margin-bottom: 20px;
}

.note-detail__tab {
  position: relative;
  padding: 0 4px 11px;
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 29px;
  letter-spacing: 0.4px;
  color: #21243d;
  cursor: pointer;
}

.note-detail__tab--active {
  color: #2036ca;
  font-weight: 700;
}

.note-detail__tab--active::after {
  content: '';
  position: absolute;
  left: 4px;
  right: 4px;
  bottom: 0;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, #2036ca 0%, rgba(32, 54, 202, 0) 100%);
}

.note-detail__panel {
  flex: 1;
  min-height: 0;
  border: 1px solid #d9e3fb;
  border-radius: 8px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
  box-sizing: border-box;
  overflow: hidden;
}

.note-detail__panel-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 24px 18px 20px 20px;
  box-sizing: border-box;
}

.note-detail__panel-scroll--summary {
  padding-right: 14px;
}

.note-detail__entry + .note-detail__entry {
  margin-top: 24px;
}

.note-detail__entry-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.note-detail__speaker-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 100px;
  background: #dbe7ff;
}

.note-detail__speaker-tag--active {
  background: #2036ca;
}

.note-detail__speaker-icon {
  width: 11px;
  height: 14px;
  flex-shrink: 0;
  display: block;
}

.note-detail__speaker {
  font-size: 14px;
  line-height: 1;
  color: #2d3149;
}

.note-detail__speaker-tag--active .note-detail__speaker {
  color: #fff;
}

.note-detail__time {
  font-size: 14px;
  line-height: 21px;
  color: #a6a6a6;
  font-variant-numeric: tabular-nums;
}

.note-detail__entry-text {
  margin: 0;
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.32px;
  color: #21243d;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-detail__entry-divider {
  height: 0;
  border-bottom: 1px solid #e8e8e8;
  margin-top: 10px;
}

.note-detail__summary-block + .note-detail__summary-block {
  margin-top: 18px;
}

.note-detail__summary-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  color: #2036ca;
}

.note-detail__summary-text {
  margin: 0;
  font-size: 16px;
  line-height: 26px;
  letter-spacing: 0.02em;
  color: #21243d;
}

.note-detail__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.note-detail__empty-title {
  margin: 0;
  font-size: 24px;
  color: #21243d;
}

.note-detail__empty-text {
  margin: 0;
  font-size: 14px;
  color: #7d82a1;
}

.note-detail__empty-btn {
  min-width: 132px;
  height: 40px;
  border: none;
  border-radius: 6px;
  background: #2036ca;
  color: #fff;
  cursor: pointer;
}

@media (max-width: 1660px) {
  .note-detail__content {
    grid-template-columns: minmax(0, 1fr) 536px;
    gap: 18px;
    padding-right: 18px;
  }
}

@media (max-width: 1400px) {
  .note-detail-page {
    padding: 0 20px 20px;
  }

  .note-detail__content {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 4px 8px 0;
  }

  .note-detail__section-head-main {
    min-height: 0;
  }

  .note-detail__column--main .note-detail__actions {
    position: static;
  }

  .note-detail__column--main {
    padding-left: 0;
    padding-right: 0;
  }

  .note-detail__main-lines {
    left: 16px;
    right: 16px;
  }

  .note-detail__column--aside {
    min-height: 420px;
    padding-left: 0;
    border-left: none;
  }
}
</style>
