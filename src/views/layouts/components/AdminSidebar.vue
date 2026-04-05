<!--
  左侧栏：集团/单一客户切换、搜索、客户树、右键菜单；选中项与 AdminLayout 路由联动。
-->
<template>
  <aside class="left-sidebar" :class="{ 'left-sidebar--home': isHome }">
    <div class="customer-type-tabs">
      <button
        class="tab-btn"
        :class="{ active: customerType === 'group' }"
        @click="emit('set-customer-type', 'group')"
      >
        集团客户
      </button>
      <button
        class="tab-btn"
        :class="{ active: customerType === 'single' }"
        @click="emit('set-customer-type', 'single')"
      >
        单一客户
      </button>
    </div>
    <hr class="sidebar-divider" />
    <div class="search-row">
      <div class="search-box">
        <img class="search-icon" :src="iconSearch" alt="" />
        <input
          v-model="searchKeywordValue"
          type="text"
          class="search-input-inner"
          placeholder="搜索客户"
        />
      </div>
      <button
        type="button"
        class="add-customer-btn"
        aria-label="新增客户"
        @click="emit('show-add-customer')"
      >
        <img :src="iconAdd" alt="" />
      </button>
    </div>
    <div class="customer-list" @click="emit('close-context-menu')">
      <div
        v-for="item in items"
        :key="item.id"
        class="customer-item"
        :class="{ active: selectedId === item.id, expanded: expandedIds.has(item.id) }"
        @contextmenu="emitContextMenu($event, item, 'parent')"
      >
        <div
          class="customer-row"
          :class="{ active: selectedId === item.id, expanded: expandedIds.has(item.id) }"
          @click="emit('select-customer', item)"
        >
          <img
            class="expand-icon"
            :src="expandedIds.has(item.id) ? iconArrowDown : iconArrowRight"
            alt=""
            @click.stop="emit('toggle-expand', item.id)"
          />
          <span class="customer-name">{{ item.name }}</span>
          <span v-if="item.count" class="customer-count" :class="countBadgeClass(item.count)">{{
            item.count
          }}</span>
        </div>
        <div v-if="item.children && expandedIds.has(item.id)" class="customer-children">
          <div
            v-for="(child, index) in item.children"
            :key="child.id"
            class="customer-child"
            :class="{
              active: selectedId === child.id,
              'child-selected-primary': selectedId === child.id && index === 0,
              'child-selected-secondary': selectedId === child.id && index > 0
            }"
            @click.stop="emit('select-customer', child)"
            @contextmenu.stop="emitContextMenu($event, child, 'child')"
          >
            <img
              class="child-icon-img"
              :src="
                selectedId === child.id
                  ? index === 0
                    ? iconCompanySelected
                    : iconDocSelected
                  : index === 0
                    ? iconCompanyUnselected
                    : iconDocUnselected
              "
              alt=""
            />
            <span class="customer-child-name">{{ child.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
        @mouseleave="emit('close-context-menu')"
      >
        <div class="context-menu-item" @click="emit('edit-context-menu')">
          <img class="context-menu-icon" :src="iconEdit" alt="" />
          <span>编辑</span>
        </div>
        <div class="context-menu-item" @click="emit('add-project-context-menu')">
          <img class="context-menu-icon" :src="iconAddProject" alt="" />
          <span>新增项目</span>
        </div>
        <div class="context-menu-item" @click="emit('add-child-context-menu')">
          <img class="context-menu-icon" :src="iconAddSub" alt="" />
          <span>新增子客户</span>
        </div>
        <div
          class="context-menu-item context-menu-item--danger"
          @click="emit('delete-context-menu')"
        >
          <img class="context-menu-icon" :src="iconDelete" alt="" />
          <span>删除</span>
        </div>
      </div>
    </Teleport>

    <div class="sidebar-footer">
      <button type="button" class="report-btn">
        <img class="report-btn-icon" :src="iconReport" alt="" />
        <span>我的报告</span>
      </button>
      <button
        type="button"
        class="interview-btn"
        :class="{ 'interview-btn--disabled': !canStartInterview }"
        :disabled="!canStartInterview"
        :title="
          canStartInterview ? '' : '访谈仅针对项目：请在左侧展开客户后，点击具体项目（非公司节点）'
        "
        @click="goInterview"
      >
        <img class="interview-btn-icon" :src="iconMic" alt="" />
        <span>开始访谈</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import iconArrowRight from '@/assets/images/sidebar/icon-arrow-right.svg'
import iconArrowDown from '@/assets/images/sidebar/icon-arrow-down.svg'
import iconCompanySelected from '@/assets/images/sidebar/icon-company-selected.svg'
import iconCompanyUnselected from '@/assets/images/sidebar/icon-company-unselected.svg'
import iconDocSelected from '@/assets/images/sidebar/icon-doc-selected.svg'
import iconDocUnselected from '@/assets/images/sidebar/icon-doc-unselected.svg'
import iconAdd from '@/assets/images/sidebar/icon-add.svg'
import iconAddProject from '@/assets/images/sidebar/icon-add-project.svg'
import iconSearch from '@/assets/images/sidebar/icon-search.svg'
import iconReport from '@/assets/images/sidebar/icon-report.svg'
import iconMic from '@/assets/images/sidebar/icon-mic.svg'
import iconEdit from '@/assets/images/sidebar/icon-edit.svg'
import iconDelete from '@/assets/images/sidebar/icon-delete.svg'
import iconAddSub from '@/assets/images/sidebar/icon-add-sub.svg'
import {
  countBadgeClass,
  isProjectRouteTarget,
  type CustomerNodeType,
  type CustomerTreeItem,
  type SidebarContextMenuState
} from '@/views/home/mock/customerTree'

interface ContextMenuRequest {
  event: MouseEvent
  item: { id: string; name: string }
  type: CustomerNodeType
}

const props = defineProps({
  isHome: {
    type: Boolean,
    required: true
  },
  customerType: {
    type: String as PropType<'group' | 'single'>,
    required: true
  },
  searchKeyword: {
    type: String,
    required: true
  },
  items: {
    type: Array as PropType<CustomerTreeItem[]>,
    required: true
  },
  selectedId: {
    type: String,
    required: true
  },
  expandedIds: {
    type: Object as PropType<Set<string>>,
    required: true
  },
  contextMenu: {
    type: Object as PropType<SidebarContextMenuState>,
    required: true
  }
})

const router = useRouter()

const emit = defineEmits<{
  'update:searchKeyword': [value: string]
  'set-customer-type': [value: 'group' | 'single']
  'show-add-customer': []
  'toggle-expand': [id: string]
  'select-customer': [item: CustomerTreeItem]
  'open-context-menu': [payload: ContextMenuRequest]
  'close-context-menu': []
  'edit-context-menu': []
  'add-project-context-menu': []
  'add-child-context-menu': []
  'delete-context-menu': []
}>()

const searchKeywordValue = computed({
  get: () => props.searchKeyword,
  set: value => emit('update:searchKeyword', value)
})

/** 仅当选中「项目」子节点（非公司客户行）时可进入访谈，与路由 HomeProject / Interview 一致 */
const canStartInterview = computed(() =>
  Boolean(props.selectedId && isProjectRouteTarget(props.items, props.selectedId))
)

function emitContextMenu(
  event: MouseEvent,
  item: { id: string; name: string },
  type: CustomerNodeType
) {
  emit('open-context-menu', { event, item, type })
}

function goInterview() {
  if (!canStartInterview.value) return
  const nodeId = props.selectedId
  router.push({
    name: 'Interview',
    query: nodeId ? { nodeId } : {}
  })
}
</script>

<style scoped>
.left-sidebar {
  width: 320px;
  min-width: 320px;
  background: transparent;
  display: flex;
  flex-direction: column;
  padding: 28px 16px;
  overflow: hidden;
}

.left-sidebar--home {
  padding-top: 13px;
}

.customer-type-tabs {
  display: flex;
  width: 100%;
  height: 48px;
  margin: 0 0 16px;
  background: #fff;
  border-radius: 5px;
  box-shadow: 0 3px 10px rgba(36, 31, 164, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}

.customer-type-tabs .tab-btn {
  flex: 1;
  height: 100%;
  border: none;
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #606060;
  background: transparent;
  cursor: pointer;
  transition:
    color 0.2s,
    background 0.2s;
}

.customer-type-tabs .tab-btn.active {
  background: #2036ca;
  color: #fff;
}

.sidebar-divider {
  height: 0;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin: 6px 0 20px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  flex-shrink: 0;
  width: 100%;
  min-height: 44px;
}

.search-box {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 12px;
  background: rgba(32, 54, 202, 0.1);
  border-radius: 5px;
  gap: 8px;
  border: 1px solid transparent;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.search-box:focus-within {
  border-color: #2036ca;
  background: #fff;
}

.search-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.search-input-inner {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #2d3149;
  letter-spacing: 0.32px;
  outline: none;
}

.search-input-inner::placeholder {
  color: #8c8c8c;
}

.add-customer-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2036ca;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
  box-sizing: border-box;
}

.add-customer-btn img {
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  object-fit: contain;
}

.customer-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.customer-item {
  flex-shrink: 0;
}

.customer-item.expanded {
  background: #fff;
  border-radius: 4px;
}

.customer-row {
  display: flex;
  align-items: center;
  padding: 8px 8px;
  cursor: pointer;
  gap: 10px;
  min-height: 40px;
  border-radius: 4px;
  transition:
    background 0.2s,
    color 0.2s;
}

.customer-row:hover:not(.active) {
  background: rgba(0, 0, 0, 0.02);
}

.customer-row.active {
  background: #2036ca;
}

.customer-row.active .customer-name {
  color: #fff;
}

.customer-item.expanded .customer-row {
  padding-left: 9px;
}

.customer-item.expanded .customer-row.active {
  background: #2036ca;
}

.expand-icon {
  width: 14px;
  height: 24px;
  min-width: 14px;
  min-height: 24px;
  flex-shrink: 0;
  object-fit: contain;
  object-position: center;
  transition: filter 0.2s;
}

.customer-row.active .expand-icon {
  filter: brightness(0) invert(1);
}

.customer-item.expanded .expand-icon {
  width: 14px;
  height: 8px;
  min-width: 14px;
  min-height: 8px;
}

.customer-name {
  flex: 1;
  font-size: 16px;
  line-height: 1.75;
  color: #2d3149;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-count {
  font-size: 12px;
  color: #fff;
  padding: 4px;
  border-radius: 5px;
  min-width: 28px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.customer-count.badge-new {
  background: #fe635d;
}

.customer-count.badge-orange {
  background: #ff8d1a;
}

.customer-count.badge-gray {
  background: #c4c4c4;
}

.customer-children {
  padding: 2px 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.customer-child {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 5px 22px;
  font-size: 15px;
  line-height: 1;
  color: #2d3149;
  cursor: pointer;
  border-radius: 4px;
  transition:
    background 0.2s,
    color 0.2s;
}

.customer-child .child-icon-img {
  width: 19px;
  height: 20px;
  flex-shrink: 0;
  object-fit: contain;
}

.customer-child.child-selected-secondary .child-icon-img {
  height: 16px;
}

.customer-child .customer-child-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-child.child-selected-primary,
.customer-child.child-selected-secondary {
  background: #2036ca;
  color: #fff;
}

.customer-child:hover:not(.child-selected-primary):not(.child-selected-secondary) {
  background: rgba(0, 0, 0, 0.03);
}

.sidebar-footer {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  flex-shrink: 0;
  margin-top: auto;
}

.report-btn,
.interview-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 220px;
  height: 44px;
  padding: 10px;
  border: none;
  border-radius: 100px;
  box-shadow: 0 3px 10px rgba(36, 31, 164, 0.1);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.75;
  cursor: pointer;
}

.report-btn {
  background: #fff;
  color: #2d3149;
}

.report-btn-icon,
.interview-btn-icon {
  width: 26px;
  height: 24px;
  object-fit: contain;
}

.interview-btn {
  background: #2036ca;
  color: #fff;
}

.interview-btn:disabled,
.interview-btn.interview-btn--disabled {
  cursor: not-allowed;
  opacity: 0.45;
  box-shadow: none;
}

.interview-btn:disabled:hover,
.interview-btn.interview-btn--disabled:hover {
  background: #2036ca;
  color: #fff;
}

.context-menu {
  position: fixed;
  z-index: 9999;
  width: 160px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(36, 31, 164, 0.1);
  padding: 0;
  overflow: hidden;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 22px;
  font-size: 14px;
  color: #2d3149;
  cursor: pointer;
  transition: background 0.2s;
}

.context-menu-item:not(:last-child) {
  border-bottom: 1px solid #cedbfa;
}

.context-menu-item:hover {
  background: #2036ca;
  color: #fff;
}

.context-menu-item:hover .context-menu-icon,
.context-menu-item--danger:hover .context-menu-icon {
  filter: brightness(0) invert(1);
}

.context-menu-item--danger:hover {
  background: #fe635d;
  color: #fff;
}

.context-menu-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  object-fit: contain;
}
</style>
