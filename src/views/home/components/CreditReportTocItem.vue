<template>
  <div class="toc-node">
    <button
      v-if="node.children?.length"
      type="button"
      class="toc-row toc-row--parent"
      :class="[rowDepthClass, { 'toc-row--open': expanded[node.id] }]"
      @click="$emit('toggle', node)"
    >
      <span class="toc-caret" :class="{ 'toc-caret--down': expanded[node.id] }" aria-hidden="true">▶</span>
      <span class="toc-text">{{ node.title }}</span>
    </button>
    <div
      v-if="node.children?.length && expanded[node.id]"
      class="toc-children"
      :class="'toc-children--d' + depth"
    >
      <CreditReportTocItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :expanded="expanded"
        :active-toc-id="activeTocId"
        @toggle="$emit('toggle', $event)"
        @scroll="$emit('scroll', $event)"
      />
    </div>
    <button
      v-if="!node.children?.length"
      type="button"
      class="toc-row toc-row--leaf"
      :class="[rowDepthClass, { 'toc-row--active': activeTocId === node.id }]"
      @click="$emit('scroll', node.id)"
    >
      <span class="toc-text">{{ node.title }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CreditReportTocItem as TocItem } from '../mock/creditReportMock'

const props = defineProps<{
  node: TocItem
  depth: number
  expanded: Record<string, boolean>
  activeTocId: string
}>()

defineEmits<{
  toggle: [node: TocItem]
  scroll: [id: string]
}>()

const rowDepthClass = computed(() => {
  const d = props.depth
  if (d <= 0) return 'toc-row--d0'
  if (d === 1) return 'toc-row--d1'
  return 'toc-row--d2'
})
</script>
