<!--
  授信报告正文格式工具栏：段落/字号/加粗等，对当前选区执行 document.execCommand，供 CreditReport 引用。
-->
<template>
  <div class="fmt-toolbar" role="toolbar" aria-label="正文格式">
    <!-- 段落样式 -->
    <div class="fmt-group">
      <select
        v-model="blockValue"
        class="fmt-select"
        title="段落样式"
        @change="onBlockChange"
      >
        <option value="p">正文</option>
        <option value="h2">标题</option>
        <option value="h3">标题 1</option>
        <option value="h4">标题 2</option>
      </select>
    </div>

    <!-- 字号 -->
    <div class="fmt-group">
      <select
        v-model="fontSizeValue"
        class="fmt-select"
        title="字号"
        @change="onFontSizeChange"
      >
        <option v-for="px in fontSizes" :key="px" :value="`${px}px`">{{ px }}px</option>
      </select>
    </div>

    <!-- 字体 -->
    <div class="fmt-group">
      <select
        v-model="fontFamilyValue"
        class="fmt-select fmt-select--font"
        title="字体"
        @change="onFontFamilyChange"
      >
        <option value="OPPO Sans">OPPO Sans</option>
        <option value="Microsoft YaHei">微软雅黑</option>
        <option value="SimSun">宋体</option>
        <option value="KaiTi">楷体</option>
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Georgia">Georgia</option>
        <option value="Impact">Impact</option>
      </select>
    </div>

    <!-- B / I / S / U -->
    <button
      type="button"
      class="fmt-btn"
      :class="{ 'fmt-btn--active': formatState.isBold }"
      title="粗体 (Ctrl+B)"
      @mousedown.prevent
      @click="runCmd('bold')"
    >
      <strong>B</strong>
    </button>
    <button
      type="button"
      class="fmt-btn"
      :class="{ 'fmt-btn--active': formatState.isItalic }"
      title="斜体 (Ctrl+I)"
      @mousedown.prevent
      @click="runCmd('italic')"
    >
      <em>I</em>
    </button>
    <button
      type="button"
      class="fmt-btn"
      :class="{ 'fmt-btn--active': formatState.isStrike }"
      title="删除线"
      @mousedown.prevent
      @click="runCmd('strikeThrough')"
    >
      <span class="fmt-strike">S</span>
    </button>
    <button
      type="button"
      class="fmt-btn"
      :class="{ 'fmt-btn--active': formatState.isUnderline }"
      title="下划线 (Ctrl+U)"
      @mousedown.prevent
      @click="runCmd('underline')"
    >
      <span class="fmt-underline">U</span>
    </button>

    <span class="fmt-sep" />

    <!-- 字色 -->
    <label class="fmt-btn fmt-color-btn" title="字体颜色">
      <span class="fmt-color-letter">A</span>
      <span class="fmt-color-bar" :style="{ background: fontColor }" />
      <input
        type="color"
        class="fmt-color-input"
        :value="fontColor"
        @input="onFontColorPick"
      />
    </label>

    <!-- 高亮色 -->
    <label class="fmt-btn fmt-color-btn" title="高亮颜色">
      <span class="fmt-color-letter fmt-color-letter--bg">A</span>
      <span class="fmt-color-bar" :style="{ background: bgColor }" />
      <input
        type="color"
        class="fmt-color-input"
        :value="bgColor"
        @input="onBgColorPick"
      />
    </label>

    <!-- 链接 -->
    <button type="button" class="fmt-btn" title="插入链接" @mousedown.prevent @click="insertLink">
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
    </button>

    <span class="fmt-sep" />

    <!-- 图片 -->
    <button type="button" class="fmt-btn" title="插入图片" @mousedown.prevent @click="insertImage">
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="5.5" cy="6" r="1.5" stroke="currentColor" stroke-width="1.1"/><path d="M1.5 11l3.5-3.5 2.5 2.5 2-2L14.5 13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>

    <span class="fmt-sep" />

    <!-- 列表 -->
    <button
      type="button"
      class="fmt-btn"
      :class="{ 'fmt-btn--active': formatState.isBulletList }"
      title="无序列表"
      @mousedown.prevent
      @click="runCmd('insertUnorderedList')"
    >
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="4" r="1.2" fill="currentColor"/><circle cx="3" cy="8" r="1.2" fill="currentColor"/><circle cx="3" cy="12" r="1.2" fill="currentColor"/><line x1="6" y1="4" x2="14" y2="4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="6" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
    </button>
    <button
      type="button"
      class="fmt-btn"
      :class="{ 'fmt-btn--active': formatState.isNumberList }"
      title="有序列表"
      @mousedown.prevent
      @click="runCmd('insertOrderedList')"
    >
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><text x="1.5" y="5.5" font-size="5" fill="currentColor" font-family="sans-serif">1.</text><text x="1.5" y="9.5" font-size="5" fill="currentColor" font-family="sans-serif">2.</text><text x="1.5" y="13.5" font-size="5" fill="currentColor" font-family="sans-serif">3.</text><line x1="6" y1="4" x2="14" y2="4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="6" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
    </button>

    <span class="fmt-sep" />

    <!-- 缩进 -->
    <button type="button" class="fmt-btn" title="减少缩进" @mousedown.prevent @click="runCmd('outdent')">
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M3 8h7M3 12h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 4l-1.5 1.5L2 7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button type="button" class="fmt-btn" title="增加缩进" @mousedown.prevent @click="runCmd('indent')">
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 8h7M3 12h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M14 4l1.5 1.5L14 7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>

    <span class="fmt-sep" />

    <!-- 对齐 -->
    <button type="button" class="fmt-btn" title="左对齐" @mousedown.prevent @click="align('justifyLeft')">
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="2" y1="6.3" x2="10" y2="6.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="2" y1="9.6" x2="14" y2="9.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="2" y1="13" x2="10" y2="13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
    </button>
    <button type="button" class="fmt-btn" title="居中对齐" @mousedown.prevent @click="align('justifyCenter')">
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="4" y1="6.3" x2="12" y2="6.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="2" y1="9.6" x2="14" y2="9.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="4" y1="13" x2="12" y2="13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
    </button>
    <button type="button" class="fmt-btn" title="右对齐" @mousedown.prevent @click="align('justifyRight')">
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="6" y1="6.3" x2="14" y2="6.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="2" y1="9.6" x2="14" y2="9.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="6" y1="13" x2="14" y2="13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
    </button>
    <button type="button" class="fmt-btn" title="两端对齐" @mousedown.prevent @click="align('justifyFull')">
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="2" y1="6.3" x2="14" y2="6.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="2" y1="9.6" x2="14" y2="9.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="2" y1="13" x2="14" y2="13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
    </button>

    <span class="fmt-sep" />

    <!-- 清除格式 -->
    <button type="button" class="fmt-btn" title="清除格式" @mousedown.prevent @click="doClearFormat">
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><path d="M3 3h10v2H3V3zm2 4h6v2H5V7zm-1 4h8v2H4v-2z" fill="currentColor"/><path d="M12 10l2-2-2-2v4z" fill="currentColor"/><path d="M11 5l-2 2 2 2V5z" fill="currentColor"/></svg>
    </button>

    <!-- 撤销 -->
    <button type="button" class="fmt-btn" title="撤销 (Ctrl+Z)" @mousedown.prevent @click="doUndo">
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none"><path d="M4 8a5 5 0 1 1 1 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 5l2-2 2 2" fill="currentColor"/></svg>
    </button>

    <!-- 重做：与撤销同一矢量水平镜像，保证在 28×28 按钮内视觉居中一致 -->
    <button type="button" class="fmt-btn" title="重做 (Ctrl+Y)" @mousedown.prevent @click="doRedo">
      <svg class="fmt-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <g transform="translate(16 0) scale(-1 1)">
          <path d="M4 8a5 5 0 1 1 1 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          <path d="M2 5l2-2 2 2" fill="currentColor" />
        </g>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FormatState } from '../composables/useTextFormat'
import {
  runFormatCommand,
  clearFormatting,
  undo,
  redo,
  setFontSize,
  setFontFamily
} from '../composables/useTextFormat'

const props = defineProps<{
  formatState: FormatState
}>()

const emit = defineEmits<{
  formatted: []
  'selection-change': []
}>()

const fontSizes = [12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32]
/** 与 Figma 工具条默认「15px」一致 */
const defaultFontSizePx = 15

// v-model 绑定
const blockValue = ref('p')
const fontSizeValue = ref(`${defaultFontSizePx}px`)
const fontFamilyValue = ref('OPPO Sans')
const fontColor = ref('#ff0000')
const bgColor = ref('#ffff00')

// 监听外部 formatState 变化，更新下拉框选中状态
watch(
  () => props.formatState,
  (state) => {
    if (state.fontSize) {
      fontSizeValue.value = state.fontSize
    }
    if (state.blockType) {
      blockValue.value = state.blockType
    }
    if (state.fontFamily) {
      // 提取字体名称（去掉引号和回退字体）
      const fontName = state.fontFamily.split(',')[0]?.replace(/['"]/g, '')
      if (fontName) fontFamilyValue.value = fontName
    }
  },
  { deep: true }
)

function afterCmd() {
  emit('selection-change')
  emit('formatted')
}

function runCmd(cmd: string) {
  runFormatCommand(cmd)
  afterCmd()
}

function align(cmd: string) {
  runFormatCommand(cmd)
  afterCmd()
}

function onBlockChange() {
  runFormatCommand('formatBlock', blockValue.value)
  afterCmd()
}

function onFontSizeChange() {
  setFontSize(fontSizeValue.value)
  afterCmd()
}

function onFontFamilyChange() {
  setFontFamily(fontFamilyValue.value)
  afterCmd()
}

function onFontColorPick(e: Event) {
  const v = (e.target as HTMLInputElement).value
  fontColor.value = v
  runFormatCommand('foreColor', v)
  afterCmd()
}

function onBgColorPick(e: Event) {
  const v = (e.target as HTMLInputElement).value
  bgColor.value = v
  runFormatCommand('hiliteColor', v)
  afterCmd()
}

function insertLink() {
  const url = prompt('请输入链接地址：', 'https://')
  if (!url) return
  runFormatCommand('createLink', url)
  afterCmd()
}

function insertImage() {
  const url = prompt('请输入图片地址：', 'https://')
  if (!url) return
  runFormatCommand('insertImage', url)
  afterCmd()
}

function doClearFormat() {
  clearFormatting()
  afterCmd()
}

function doUndo() {
  undo()
  afterCmd()
}

function doRedo() {
  redo()
  afterCmd()
}
</script>

<style scoped>
.fmt-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #4b5563;
  padding: 6px 16px;
  border-bottom: 1px solid #e9ecef;
  background: #fafbff;
  /* 避免在右侧内容区纵向 flex 中被压缩，导致换行后末行（撤销/重做）被父级 overflow 裁切 */
  flex-shrink: 0;
  min-height: min-content;
}

.fmt-group {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
}

.fmt-select {
  display: block;
  height: 28px;
  padding: 0 6px;
  margin: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  box-sizing: border-box;
}

.fmt-select:focus {
  outline: none;
  border-color: #CEDBFA;
}

.fmt-select--font {
  max-width: 68px;
}

.fmt-btn {
  position: relative;
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  color: #4b5563;
  flex-shrink: 0;
  transition: all 0.15s ease;
  outline: none;
}

.fmt-btn:hover {
  border-color: #cedbfa;
  background: #f0f4ff;
  color: #2036ca;
}

.fmt-btn:active {
  background: #e0e7ff;
}

/* 激活状态样式 */
.fmt-btn--active {
  background: #e0e7ff;
  border-color: #a5b4fc;
  color: #2036ca;
}

.fmt-btn--active:hover {
  background: #c7d2fe;
}

.fmt-strike {
  text-decoration: line-through;
}

.fmt-underline {
  text-decoration: underline;
}

.fmt-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  display: block;
  overflow: visible;
}

.fmt-sep {
  display: inline-block;
  width: 1px;
  height: 20px;
  background: #d9d9d9;
  margin: 0 4px;
  flex-shrink: 0;
}

.fmt-color-btn {
  flex-direction: column;
  gap: 1px;
  cursor: pointer;
}

.fmt-color-letter {
  font-weight: 700;
  font-size: 13px;
  line-height: 1;
}

.fmt-color-letter--bg {
  background: #ffff00;
  padding: 0 2px;
  border-radius: 1px;
}

.fmt-color-bar {
  display: block;
  width: 14px;
  height: 3px;
  border-radius: 1px;
}

.fmt-color-input {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  padding: 0;
}
</style>
