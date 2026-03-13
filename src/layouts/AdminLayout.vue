<template>
  <div class="admin-layout">
    <header class="top-header">
      <div class="header-left">
        <span class="logo">语纪</span>
        <span class="slogan">语之所及 纪之成册</span>
      </div>
      <div class="header-right">
        <el-button type="primary" class="ai-btn" @click="aiPanelOpen = true">AI助手</el-button>
        <el-icon class="header-icon"><Document /></el-icon>
        <el-dropdown trigger="click">
          <span class="user-info">
            <el-avatar :size="24" class="user-avatar" />
            Hi, {{ appStore.currentUser.name }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/login')">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-icon class="header-icon theme-icon" @click="appStore.toggleDarkMode"><Sunny /></el-icon>
      </div>
    </header>

    <div class="layout-body">
      <aside class="left-sidebar">
        <div class="customer-type-tabs">
          <button
            class="tab-btn"
            :class="{ active: appStore.customerType === 'group' }"
            @click="appStore.setCustomerType('group')"
          >
            集团客户
          </button>
          <button
            class="tab-btn"
            :class="{ active: appStore.customerType === 'single' }"
            @click="appStore.setCustomerType('single')"
          >
            单一客户
          </button>
        </div>
        <div class="search-box">
          <el-input v-model="searchKeyword" placeholder="搜索客户" class="search-input" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
            <template #suffix><el-icon class="add-icon"><Plus /></el-icon></template>
          </el-input>
        </div>
        <div class="customer-list">
          <div
            v-for="item in customerList"
            :key="item.id"
            class="customer-item"
            :class="{ active: selectedId === item.id, expanded: expandedIds.has(item.id) }"
            @click="onSelectCustomer(item)"
          >
            <div class="customer-row" @click.stop="toggleExpand(item.id)">
              <el-icon class="expand-icon">
                <component :is="expandedIds.has(item.id) ? ArrowDown : ArrowRight" />
              </el-icon>
              <span class="customer-name">{{ item.name }}</span>
              <span v-if="item.count" class="customer-count">{{ item.count }}</span>
            </div>
            <div v-if="item.children && expandedIds.has(item.id)" class="customer-children">
              <div
                v-for="child in item.children"
                :key="child.id"
                class="customer-child"
                :class="{ active: selectedId === child.id }"
                @click.stop="onSelectCustomer(child)"
              >
                <el-icon class="child-icon"><Document /></el-icon>
                <span>{{ child.name }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="sidebar-footer">
          <div class="report-link">我的报告</div>
          <el-button type="primary" class="interview-btn">
            <el-icon><Microphone /></el-icon>
            开始访谈
          </el-button>
        </div>
      </aside>

      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <el-dialog v-model="aiPanelOpen" title="AI助手" width="400px" append-to-body>
      <p>AI 助手功能开发中。</p>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { Search, Plus, Document, ArrowDown, ArrowRight, Sunny, Microphone } from '@element-plus/icons-vue'

const router = useRouter()
const appStore = useAppStore()
const aiPanelOpen = ref(false)
const searchKeyword = ref('')
const selectedId = ref('2')
const expandedIds = ref(new Set(['2']))

const customerList = ref([
  { id: '1', name: '四川晨光博达新材...', count: '1.2' },
  {
    id: '2',
    name: '成都盟升电子技术...',
    count: '4.8',
    children: [
      { id: '2-1', name: '成都盟升电子技术科', parentId: '2' },
      { id: '2-2', name: '7000万元授信尽职调查', parentId: '2' },
      { id: '2-3', name: '6000万元授信尽职调查', parentId: '2' },
    ],
  },
  { id: '3', name: '杭州宇树科技股份...', count: '4/8' },
  { id: '4', name: '惠州市赢合智能...', count: '0/5' },
  { id: '5', name: '惠州市知合行...', count: '0/3' },
  { id: '6', name: '惠州市赢合科技...', count: '3' },
])

function toggleExpand(id: string) {
  const set = new Set(expandedIds.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  expandedIds.value = set
}

function onSelectCustomer(item: { id: string }) {
  selectedId.value = item.id
  appStore.setSelectedCustomer(item.id)
}
</script>

<style scoped>
.admin-layout {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.top-header {
  height: 77px;
  min-height: 77px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color, #2036ca);
}

.slogan {
  font-size: 14px;
  color: #8c8c8c;
  margin-left: 8px;
  padding-left: 12px;
  border-left: 1px solid #e8e8e8;
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

.ai-btn {
  background: #2036ca !important;
  border-color: #2036ca !important;
}

.header-icon {
  font-size: 20px;
  color: #595959;
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #262626;
  cursor: pointer;
}

.theme-icon:hover {
  color: #2036ca;
}

.layout-body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.left-sidebar {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  overflow: hidden;
}

.customer-type-tabs {
  display: flex;
  background: #f0f2f5;
  border-radius: 8px;
  margin: 0 16px 16px;
  padding: 4px;
}

.customer-type-tabs .tab-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #595959;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.customer-type-tabs .tab-btn.active {
  background: #2036ca;
  color: #fff;
}

.search-box {
  padding: 0 28px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 10px 12px;
}

.add-icon {
  cursor: pointer;
  color: #2036ca;
}

.customer-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.customer-item {
  margin-bottom: 4px;
}

.customer-row {
  display: flex;
  align-items: center;
  padding: 10px 28px;
  cursor: pointer;
  transition: background 0.2s;
}

.customer-row:hover {
  background: #fafafa;
}

.customer-item.active .customer-row {
  background: #e6f0ff;
  color: #2036ca;
}

.expand-icon {
  font-size: 12px;
  margin-right: 8px;
  flex-shrink: 0;
}

.customer-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-count {
  font-size: 12px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.customer-children {
  padding-left: 28px;
}

.customer-child {
  display: flex;
  align-items: center;
  padding: 8px 28px 8px 12px;
  font-size: 13px;
  color: #595959;
  cursor: pointer;
}

.customer-child:hover,
.customer-child.active {
  color: #2036ca;
  background: #fafafa;
}

.child-icon {
  font-size: 14px;
  margin-right: 8px;
}

.sidebar-footer {
  padding: 16px 28px;
  border-top: 1px solid #f0f0f0;
}

.report-link {
  font-size: 14px;
  color: #595959;
  margin-bottom: 12px;
  cursor: pointer;
}

.interview-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.main-content {
  flex: 1;
  min-width: 0;
  overflow: auto;
  background: #f5f7fa;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
