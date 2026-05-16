<!--
  授信报告单个章节正文：contenteditable 区域，与 CreditReportFormatToolbar 联动格式化，按 sectionId 回写 HTML。
-->
<template>
  <div
    ref="rootEl"
    class="credit-section-body credit-section-body--editable"
    :data-section-id="sectionId"
    contenteditable="true"
    spellcheck="false"
    @input="onInput"
    @focus="emit('focus')"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  /** 用于工具栏格式化后回写对应 section */
  sectionId: string
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: []
  'selection-change': []
}>()

const rootEl = ref<HTMLElement | null>(null)
/** 避免用户输入时父级同步触发 innerHTML 覆盖导致光标丢失 */
let syncingFromParent = false

watch(
  () => props.modelValue,
  v => {
    const el = rootEl.value
    if (!el || syncingFromParent) return
    if (el.innerHTML !== v) {
      el.innerHTML = v
    }
  }
)

onMounted(() => {
  const el = rootEl.value
  if (el) {
    el.innerHTML = props.modelValue || ''
  }
  // 监听选择变化
  document.addEventListener('selectionchange', onSelectionChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
})

function onSelectionChange() {
  const el = rootEl.value
  if (!el) return
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  // 检查选择是否在当前编辑区域内
  if (el.contains(sel.anchorNode) || el.contains(sel.focusNode)) {
    emit('selection-change')
  }
}

function onInput() {
  const el = rootEl.value
  if (!el) return
  syncingFromParent = true
  emit('update:modelValue', el.innerHTML)
  queueMicrotask(() => {
    syncingFromParent = false
  })
}

defineExpose({
  getRoot: () => rootEl.value
})
</script>
