<template>
  <div class="home-page">
    <div class="content-panel">
      <section class="notes-board">
        <header class="notes-toolbar">
          <div class="notes-title-wrap">
            <img class="notes-title-icon" :src="iconNotesTitle" alt="" />
            <h1 class="notes-title">笔记列表</h1>
          </div>

          <label class="notes-search">
            <input
              v-model.trim="keyword"
              type="text"
              class="notes-search__input"
              placeholder="请输入查询文字"
            />
            <img class="notes-search__icon" :src="iconNotesSearch" alt="" />
          </label>
        </header>

        <HoverScrollbar class="notes-grid-scroll">
          <div class="notes-grid">
            <article
              v-for="note in filteredNotes"
              :key="note.id"
              class="note-card"
              @click="openNoteDetail(note.id)"
            >
              <div class="note-card__header">
                <div class="note-card__title-row">
                  <span class="note-card__pinned-badge">
                    <img class="note-card__pinned-icon" :src="iconNoteRecording" alt="" />
                  </span>
                  <h2 class="note-card__title">{{ note.title }}</h2>
                </div>

                <div @click.stop>
                  <el-dropdown
                    trigger="click"
                    placement="bottom-end"
                    popper-class="note-more-popper"
                    @visible-change="(visible: boolean) => handleMoreVisibleChange(visible, note.id)"
                    @command="(command: string | number) => handleMoreCommand(String(command), note)"
                  >
                    <button
                      type="button"
                      class="note-card__more"
                      :class="{ 'note-card__more--active': openMoreId === note.id }"
                      aria-label="更多操作"
                    >
                      <img class="note-card__more-icon" :src="iconNoteMore" alt="" />
                    </button>

                    <template #dropdown>
                      <el-dropdown-menu class="note-more-menu">
                        <el-dropdown-item class="note-more-menu__entry" command="tag">
                          <span class="note-more-item">
                            <img class="note-more-item__icon" :src="iconNoteTag" alt="" />
                            <span>添加标签</span>
                          </span>
                        </el-dropdown-item>
                        <el-dropdown-item class="note-more-menu__entry" command="rename">
                          <span class="note-more-item">
                            <img class="note-more-item__icon" :src="iconNoteRenameDefault" alt="" />
                            <span>重命名</span>
                          </span>
                        </el-dropdown-item>
                        <el-dropdown-item class="note-more-menu__entry" command="pin">
                          <span class="note-more-item">
                            <img class="note-more-item__icon" :src="iconNotePin" alt="" />
                            <span>{{ note.pinned ? '取消置顶' : '置顶' }}</span>
                          </span>
                        </el-dropdown-item>
                        <el-dropdown-item class="note-more-menu__entry" command="delete">
                          <span class="note-more-item">
                            <img class="note-more-item__icon" :src="iconNoteDelete" alt="" />
                            <span>删除</span>
                          </span>
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>

              <p class="note-card__content">{{ note.content }}</p>

              <footer class="note-card__footer">
                <time class="note-card__time">{{ note.updatedAt }}</time>
                <span class="note-card__tag" :class="{ 'note-card__tag--cyan': note.tag === '重要会议' }">
                  {{ note.tag }}
                </span>
              </footer>
            </article>
          </div>
        </HoverScrollbar>
      </section>
    </div>

    <el-dialog
      v-model="renameDialogVisible"
      :show-close="false"
      :close-on-click-modal="false"
      align-center
      width="520px"
      class="note-dialog"
    >
      <template #header>
        <div class="note-dialog__header">
          <span class="note-dialog__title">重命名</span>
          <button type="button" class="note-dialog__close" @click="renameDialogVisible = false">×</button>
        </div>
      </template>

      <div class="note-dialog__body">
        <label class="note-form-field">
          <span class="note-form-field__label">笔记名称</span>
          <el-input v-model.trim="renameValue" placeholder="请输入笔记名称" maxlength="40" />
        </label>
      </div>

      <template #footer>
        <div class="note-dialog__footer">
          <el-button class="note-dialog__cancel" @click="renameDialogVisible = false">取消</el-button>
          <el-button class="note-dialog__confirm" @click="confirmRename">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="tagDialogVisible"
      :show-close="false"
      :close-on-click-modal="false"
      align-center
      width="520px"
      class="note-dialog"
    >
      <template #header>
        <div class="note-dialog__header">
          <span class="note-dialog__title">添加标签</span>
          <button type="button" class="note-dialog__close" @click="tagDialogVisible = false">×</button>
        </div>
      </template>

      <div class="note-dialog__body">
        <label class="note-form-field">
          <span class="note-form-field__label">标签名称</span>
          <el-input v-model.trim="tagValue" placeholder="请输入标签名称" maxlength="12" />
        </label>
      </div>

      <template #footer>
        <div class="note-dialog__footer">
          <el-button class="note-dialog__cancel" @click="tagDialogVisible = false">取消</el-button>
          <el-button class="note-dialog__confirm" @click="confirmTag">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deleteDialogVisible"
      :show-close="false"
      :close-on-click-modal="false"
      align-center
      width="520px"
      class="note-dialog note-dialog--delete"
    >
      <template #header>
        <div class="note-dialog__header">
          <span class="note-dialog__title">删除笔记</span>
          <button type="button" class="note-dialog__close" @click="deleteDialogVisible = false">×</button>
        </div>
      </template>

      <div class="note-dialog__body note-dialog__body--delete">
        确认删除“{{ activeNote?.title ?? '' }}”吗？删除后不可恢复。
      </div>

      <template #footer>
        <div class="note-dialog__footer">
          <el-button class="note-dialog__cancel" @click="deleteDialogVisible = false">取消</el-button>
          <el-button class="note-dialog__danger" @click="confirmDelete">删除</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import HoverScrollbar from '@/components/HoverScrollbar.vue'
import iconNotesTitle from '@/assets/images/notes/icon-notes-title.svg'
import iconNotesSearch from '@/assets/images/notes/icon-notes-search.svg'
import iconNoteMore from '@/assets/images/notes/icon-note-more.svg'
import iconNoteTag from '@/assets/images/notes/icon-note-tag.svg'
import iconNotePin from '@/assets/images/notes/icon-note-pin.svg'
import iconNoteDelete from '@/assets/images/notes/icon-note-delete.svg'
import iconNoteRenameDefault from '@/assets/images/sidebar/icon-edit.svg'
import iconNoteRecording from '@/assets/images/notes/icon-note-recording.svg'
import { loadNotes, saveNotes, type NoteItem } from './noteStorage'

const router = useRouter()

const keyword = ref('')
const notes = ref<NoteItem[]>(loadNotes())
const activeNoteId = ref<string | null>(null)
const openMoreId = ref<string | null>(null)
const renameDialogVisible = ref(false)
const tagDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const renameValue = ref('')
const tagValue = ref('')

const activeNote = computed(() => notes.value.find(item => item.id === activeNoteId.value) ?? null)

const filteredNotes = computed(() => {
  const query = keyword.value.toLowerCase()
  const source = [...notes.value].sort((a, b) => Number(b.pinned) - Number(a.pinned))

  if (!query) return source

  return source.filter(note =>
    [note.title, note.content, note.tag, note.updatedAt].some(field =>
      field.toLowerCase().includes(query)
    )
  )
})

watch(
  notes,
  value => {
    saveNotes(value)
  },
  { deep: true }
)

function handleMoreCommand(command: string, note: NoteItem) {
  activeNoteId.value = note.id

  if (command === 'rename') {
    renameValue.value = note.title
    renameDialogVisible.value = true
    return
  }

  if (command === 'tag') {
    tagValue.value = note.tag
    tagDialogVisible.value = true
    return
  }

  if (command === 'pin') {
    note.pinned = !note.pinned
    ElMessage.success(note.pinned ? '已置顶' : '已取消置顶')
    return
  }

  if (command === 'delete') {
    deleteDialogVisible.value = true
  }
}

function handleMoreVisibleChange(visible: boolean, noteId: string) {
  openMoreId.value = visible ? noteId : openMoreId.value === noteId ? null : openMoreId.value
}

function openNoteDetail(noteId: string) {
  router.push({ name: 'NoteDetail', params: { noteId } })
}

function confirmRename() {
  const note = activeNote.value
  if (!note || !renameValue.value) {
    ElMessage.warning('请输入笔记名称')
    return
  }
  note.title = renameValue.value
  renameDialogVisible.value = false
  ElMessage.success('已重命名')
}

function confirmTag() {
  const note = activeNote.value
  if (!note || !tagValue.value) {
    ElMessage.warning('请输入标签名称')
    return
  }
  note.tag = tagValue.value
  tagDialogVisible.value = false
  ElMessage.success('标签已更新')
}

function confirmDelete() {
  if (!activeNoteId.value) return
  notes.value = notes.value.filter(item => item.id !== activeNoteId.value)
  deleteDialogVisible.value = false
  ElMessage.success('已删除')
}
</script>

<style scoped>
.home-page {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  box-sizing: border-box;
  min-width: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  background: transparent;
  padding: 13px 30px 30px 12px;
}

.content-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  min-height: 0;
  min-width: 0;
  max-height: 100%;
  box-sizing: border-box;
  padding: 20px 24px;
  overflow: hidden;
  background: linear-gradient(180deg, #eef2ff 0%, #f5f7ff 40%, #f5f7ff 30%);
  border-radius: 10px;
  box-shadow: 0 0 20px hwb(226 28% 19% / 0.15);
}

.notes-board {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.notes-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 8px 14px 18px 10px;
}

.notes-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.notes-title-icon {
  width: 20px;
  height: 18px;
  display: block;
  flex-shrink: 0;
}

.notes-title {
  margin: 0;
  font-size: 18px;
  font-weight: 400;
  line-height: 26px;
  color: #2d3149;
}

.notes-search {
  width: 306px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 8px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-sizing: border-box;
}

.notes-search:focus-within {
  border-color: #2036ca;
  box-shadow: none;
}

.notes-search__input {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  font-size: 14px;
  line-height: 14px;
  color: #2d3149;
}

.notes-search__input::placeholder {
  color: #bec4d3;
}

.notes-search__icon {
  width: 13.6px;
  height: 14.15px;
  display: block;
  flex-shrink: 0;
}

.notes-grid-scroll {
  flex: 1;
  min-height: 0;
}

.notes-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 474px), 1fr));
  gap: 20px;
  padding: 0 10px 10px;
  align-content: start;
}

.note-card {
  height: 140px;
  box-sizing: border-box;
  padding: 15px 24px 17px 22px;
  background: #fff;
  border: 1px solid #f3f6ff;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(36, 31, 164, 0.08);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.note-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(36, 31, 164, 0.1);
}

.note-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.note-card__title-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.note-card__pinned-badge {
  width: 25.84px;
  height: 15.86px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
  flex-shrink: 0;
}

.note-card__pinned-icon {
  width: 25.84px;
  height: 15.86px;
  display: block;
}

.note-card__title {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 700;
  line-height: 21px;
  color: #2d3149;
}

.note-card__more {
  width: 23px;
  height: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  background: transparent;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
  box-sizing: content-box;
  transition: background-color 0.2s ease;
}

.note-card__more:hover,
.note-card__more:focus-visible {
  background: rgba(32, 54, 202, 0.1);
  outline: none;
}

.note-card__more--active {
  background: #2036ca;
}

.note-card__more--active:hover,
.note-card__more--active:focus-visible {
  background: #2036ca;
}

.note-card__more-icon {
  width: 15px;
  height: 3px;
  display: block;
  transition: filter 0.2s ease;
}

.note-card__more--active .note-card__more-icon {
  filter: brightness(0) invert(1);
}

.note-card__content {
  margin: 12px 0 0;
  min-height: 42px;
  font-size: 14px;
  line-height: 21px;
  color: #2d3149;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.note-card__footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.note-card__time {
  font-size: 12px;
  line-height: 15px;
  color: #7d82a1;
}

.note-card__tag {
  min-width: 56px;
  height: 17px;
  padding: 2px 10px;
  box-sizing: border-box;
  border-radius: 3px;
  font-size: 9px;
  line-height: 13px;
  color: #fff;
  background: #1575e3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.note-card__tag--cyan {
  background: #15bde3;
}

.note-dialog :deep(.el-dialog) {
  border-radius: 6px;
  box-shadow: 0 3px 10px rgba(36, 31, 164, 0.1);
}

.note-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
}

.note-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.note-dialog :deep(.el-dialog__footer) {
  padding: 0;
}

.note-dialog__header {
  height: 52px;
  padding: 0 16px 0 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.note-dialog__title {
  font-size: 18px;
  font-weight: 700;
  color: #21243d;
}

.note-dialog__close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #98a1b4;
  cursor: pointer;
}

.note-dialog__body {
  padding: 24px 20px;
}

.note-dialog__body--delete {
  font-size: 16px;
  line-height: 26px;
  color: #21243d;
}

.note-form-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note-form-field__label {
  font-size: 14px;
  line-height: 20px;
  color: #2d3149;
}

.note-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  padding: 0 20px 20px;
}

.note-dialog__cancel,
.note-dialog__confirm,
.note-dialog__danger {
  width: 100px;
  height: 38px;
  border-radius: 4px;
}

.note-dialog__cancel {
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #303030;
}

.note-dialog__cancel:hover {
  border-color: #2036ca;
  color: #2036ca;
}

.note-dialog__confirm {
  border: none;
  background: #2036ca;
  color: #fff;
}

.note-dialog__confirm:hover {
  background: #1a2ba8;
  color: #fff;
}

.note-dialog__danger {
  border: none;
  background: #fe635d;
  color: #fff;
}

.note-dialog__danger:hover {
  background: #f55a54;
  color: #fff;
}

:deep(.note-more-popper.el-popper) {
  border: none !important;
  box-shadow: 0 3px 5px rgba(36, 31, 164, 0.1) !important;
  border-radius: 4px !important;
  padding: 0 !important;
  min-width: 140px !important;
  background: #fff !important;
  overflow: hidden !important;
  --el-dropdown-menuItem-hover-fill: #2036ca !important;
  --el-dropdown-menuItem-hover-color: #ffffff !important;
}

:deep(.note-more-popper .el-popper__arrow) {
  display: none !important;
}

:deep(.note-more-popper .el-dropdown-menu) {
  padding: 0 !important;
}

:deep(.note-more-popper .el-dropdown-menu__item) {
  width: 140px;
  height: 40px;
  padding: 8px 22px;
  box-sizing: border-box;
  border-bottom: 1px solid #cedbfa;
  color: #2d3149;
  background: #fff !important;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

:deep(.note-more-popper .el-dropdown-menu__item:last-child) {
  border-bottom: none;
}

:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):hover),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus-visible),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-focus),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-active) {
  background: #2036ca !important;
  box-shadow: inset 0 0 0 999px #2036ca !important;
  color: #fff !important;
}

:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):hover *),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus *),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus-visible *),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-focus *),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-active *) {
  color: #fff !important;
}

:deep(.note-more-popper .el-dropdown-menu__item:hover .note-more-item),
:deep(.note-more-popper .el-dropdown-menu__item:focus .note-more-item),
:deep(.note-more-popper .el-dropdown-menu__item:focus-visible .note-more-item),
:deep(.note-more-popper .el-dropdown-menu__item.is-focus .note-more-item),
:deep(.note-more-popper .el-dropdown-menu__item.is-active .note-more-item),
:deep(.note-more-popper .el-dropdown-menu__item:hover .note-more-item span),
:deep(.note-more-popper .el-dropdown-menu__item:focus .note-more-item span),
:deep(.note-more-popper .el-dropdown-menu__item:focus-visible .note-more-item span),
:deep(.note-more-popper .el-dropdown-menu__item.is-focus .note-more-item span),
:deep(.note-more-popper .el-dropdown-menu__item.is-active .note-more-item span) {
  color: #fff !important;
}

:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):hover .note-more-item__icon),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus .note-more-item__icon),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus-visible .note-more-item__icon),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-focus .note-more-item__icon),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-active .note-more-item__icon) {
  filter: brightness(0) invert(1) !important;
  opacity: 1 !important;
}

.note-more-item {
  display: inline-flex;
  align-items: center;
  width: 100%;
  gap: 5px;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: inherit;
}

.note-more-item__icon-wrap {
  position: relative;
  width: 24px;
  height: 24px;
  display: block;
  flex-shrink: 0;
}

.note-more-item__icon {
  width: 24px;
  height: 24px;
  display: block;
  flex-shrink: 0;
  transition:
    filter 0.18s ease,
    opacity 0.18s ease;
}

.note-more-item__icon--active {
  position: absolute;
  inset: 0;
  opacity: 0;
}

:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):hover .note-more-item__icon--active),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus .note-more-item__icon--active),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus-visible .note-more-item__icon--active),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-focus .note-more-item__icon--active),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-active .note-more-item__icon--active) {
  opacity: 1 !important;
}

:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):hover .note-more-item__icon--default),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus .note-more-item__icon--default),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus-visible .note-more-item__icon--default),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-focus .note-more-item__icon--default),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-active .note-more-item__icon--default) {
  opacity: 0 !important;
}

:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):hover .note-more-item),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus .note-more-item),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus-visible .note-more-item),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-focus .note-more-item),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-active .note-more-item),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):hover .note-more-item span),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus .note-more-item span),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus-visible .note-more-item span),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-focus .note-more-item span),
:deep(.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-active .note-more-item span) {
  color: #fff !important;
}

@media (max-width: 1700px) {
  .notes-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr));
  }
}

@media (max-width: 1440px) {
  .home-page {
    padding-right: 20px;
    padding-bottom: 20px;
  }

  .content-panel {
    padding: 16px;
  }

  .notes-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .notes-search {
    width: 100%;
    max-width: 360px;
  }

  .notes-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr));
  }
}
</style>

<style>
.note-more-popper.el-popper {
  border: none !important;
  box-shadow: 0 3px 5px rgba(36, 31, 164, 0.1) !important;
  border-radius: 4px !important;
  padding: 0 !important;
  min-width: 140px !important;
  background: #fff !important;
  overflow: hidden !important;
  --el-dropdown-menuItem-hover-fill: #2036ca !important;
  --el-dropdown-menuItem-hover-color: #ffffff !important;
}

.note-more-popper .el-popper__arrow {
  display: none !important;
}

.note-more-popper .el-dropdown-menu {
  padding: 0 !important;
  --el-dropdown-menuItem-hover-fill: #2036ca !important;
  --el-dropdown-menuItem-hover-color: #ffffff !important;
}

.note-more-menu__entry.el-dropdown-menu__item,
.note-more-popper .el-dropdown-menu__item {
  width: 140px;
  height: 40px;
  padding: 8px 22px;
  box-sizing: border-box;
  border-bottom: 1px solid #cedbfa;
  color: #2d3149 !important;
  background: #fff !important;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.note-more-menu__entry.el-dropdown-menu__item:last-child,
.note-more-popper .el-dropdown-menu__item:last-child {
  border-bottom: none;
}

.note-more-menu__entry.el-dropdown-menu__item:not(.is-disabled):hover,
.note-more-menu__entry.el-dropdown-menu__item:not(.is-disabled):focus,
.note-more-menu__entry.el-dropdown-menu__item:not(.is-disabled):focus-visible,
.note-more-menu__entry.el-dropdown-menu__item:not(.is-disabled).is-focus,
.note-more-menu__entry.el-dropdown-menu__item:not(.is-disabled).is-active,
.note-more-popper .el-dropdown-menu__item:not(.is-disabled):hover,
.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus,
.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus-visible,
.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-focus,
.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-active {
  background: #2036ca !important;
  box-shadow: inset 0 0 0 999px #2036ca !important;
  color: #fff !important;
}

.note-more-menu__entry.el-dropdown-menu__item:not(.is-disabled):hover *,
.note-more-menu__entry.el-dropdown-menu__item:not(.is-disabled):focus *,
.note-more-menu__entry.el-dropdown-menu__item:not(.is-disabled):focus-visible *,
.note-more-menu__entry.el-dropdown-menu__item:not(.is-disabled).is-focus *,
.note-more-menu__entry.el-dropdown-menu__item:not(.is-disabled).is-active *,
.note-more-popper .el-dropdown-menu__item:not(.is-disabled):hover *,
.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus *,
.note-more-popper .el-dropdown-menu__item:not(.is-disabled):focus-visible *,
.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-focus *,
.note-more-popper .el-dropdown-menu__item:not(.is-disabled).is-active * {
  color: #fff !important;
}

.note-more-menu__entry.el-dropdown-menu__item:hover .note-more-item,
.note-more-menu__entry.el-dropdown-menu__item:focus .note-more-item,
.note-more-menu__entry.el-dropdown-menu__item:focus-visible .note-more-item,
.note-more-menu__entry.el-dropdown-menu__item.is-focus .note-more-item,
.note-more-menu__entry.el-dropdown-menu__item.is-active .note-more-item,
.note-more-menu__entry.el-dropdown-menu__item:hover .note-more-item span,
.note-more-menu__entry.el-dropdown-menu__item:focus .note-more-item span,
.note-more-menu__entry.el-dropdown-menu__item:focus-visible .note-more-item span,
.note-more-menu__entry.el-dropdown-menu__item.is-focus .note-more-item span,
.note-more-menu__entry.el-dropdown-menu__item.is-active .note-more-item span,
.note-more-menu__entry.el-dropdown-menu__item:hover .note-more-item__icon,
.note-more-menu__entry.el-dropdown-menu__item:focus .note-more-item__icon,
.note-more-menu__entry.el-dropdown-menu__item:focus-visible .note-more-item__icon,
.note-more-menu__entry.el-dropdown-menu__item.is-focus .note-more-item__icon,
.note-more-menu__entry.el-dropdown-menu__item.is-active .note-more-item__icon,
.note-more-popper .el-dropdown-menu__item:hover .note-more-item,
.note-more-popper .el-dropdown-menu__item:focus .note-more-item,
.note-more-popper .el-dropdown-menu__item:focus-visible .note-more-item,
.note-more-popper .el-dropdown-menu__item.is-focus .note-more-item,
.note-more-popper .el-dropdown-menu__item.is-active .note-more-item,
.note-more-popper .el-dropdown-menu__item:hover .note-more-item span,
.note-more-popper .el-dropdown-menu__item:focus .note-more-item span,
.note-more-popper .el-dropdown-menu__item:focus-visible .note-more-item span,
.note-more-popper .el-dropdown-menu__item.is-focus .note-more-item span,
.note-more-popper .el-dropdown-menu__item.is-active .note-more-item span,
.note-more-popper .el-dropdown-menu__item:hover .note-more-item__icon,
.note-more-popper .el-dropdown-menu__item:focus .note-more-item__icon,
.note-more-popper .el-dropdown-menu__item:focus-visible .note-more-item__icon,
.note-more-popper .el-dropdown-menu__item.is-focus .note-more-item__icon,
.note-more-popper .el-dropdown-menu__item.is-active .note-more-item__icon {
  color: #fff !important;
  filter: brightness(0) invert(1) !important;
}

.note-more-item {
  display: inline-flex;
  align-items: center;
  width: 100%;
  gap: 5px;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: inherit !important;
}

.note-more-item__icon {
  width: 24px;
  height: 24px;
  display: block;
  flex-shrink: 0;
  transition: filter 0.18s ease;
}
</style>
