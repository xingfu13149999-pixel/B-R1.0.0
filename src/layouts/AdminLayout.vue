<template>
  <div class="admin-layout" :class="{ 'admin-layout--home': isHome }">
    <header class="top-header">
      <div class="header-left">
        <img class="header-logo" :src="headerLogo" alt="语纪" />
        <img class="header-divider" :src="headerDivider" alt="" />
        <span class="header-slogan">语之所及 纪之成册</span>
      </div>
      <div class="header-right">
        <button
          type="button"
          class="header-ai-btn"
          :class="{ 'header-ai-btn--active': aiPanelOpen }"
          @click="aiPanelOpen = true"
        >
          <img
            class="header-ai-icon"
            :src="aiPanelOpen ? headerIconAiActive : headerIconAi"
            alt=""
          />
          <span>AI助手</span>
        </button>
        <button type="button" class="header-icon-btn" aria-label="设备管理">
          <img class="header-icon-default" :src="headerIconDevice" alt="" />
          <img class="header-icon-active" :src="headerIconDeviceActive" alt="" />
        </button>
        <button type="button" class="header-icon-btn" aria-label="用户管理">
          <img class="header-icon-default" :src="headerIconUser" alt="" />
          <img class="header-icon-active" :src="headerIconUserActive" alt="" />
        </button>
        <el-dropdown
          trigger="click"
          class="header-user-dropdown"
          @visible-change="onUserDropdownVisible"
        >
          <span
            class="header-user-trigger"
            :class="{ 'header-user-trigger--active': userDropdownVisible }"
          >
            Hi，{{ appStore.currentUser.name }}
            <img
              class="header-user-arrow header-user-arrow--default"
              :src="headerIconArrowDown"
              alt=""
            />
            <img
              class="header-user-arrow header-user-arrow--white"
              :src="headerIconArrowDownWhite"
              alt=""
            />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/login')">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <img class="header-divider header-divider-right" :src="headerDivider" alt="" />
        <button
          type="button"
          class="header-theme-btn"
          :class="{ 'header-theme-btn--selected': appStore.darkMode }"
          aria-label="主题切换"
          @click="appStore.toggleDarkMode"
        >
          <img class="header-theme-icon-default" :src="headerIconTheme" alt="" />
          <img class="header-theme-icon-selected" :src="headerIconThemeSelected" alt="" />
        </button>
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
        <hr class="sidebar-divider" />
        <div class="search-row">
          <div class="search-box">
            <img class="search-icon" :src="iconSearch" alt="" />
            <input
              v-model="searchKeyword"
              type="text"
              class="search-input-inner"
              placeholder="搜索客户"
            />
          </div>
          <button
            type="button"
            class="add-customer-btn"
            aria-label="新增客户"
            @click="showAddDialog"
          >
            <img :src="iconAdd" alt="" />
          </button>
        </div>
        <div class="customer-list" @click="closeContextMenu">
          <div
            v-for="item in filteredCustomerList"
            :key="item.id"
            class="customer-item"
            :class="{ active: selectedId === item.id, expanded: expandedIds.has(item.id) }"
            @contextmenu="onContextMenu($event, item, 'parent')"
          >
            <div
              class="customer-row"
              :class="{ active: selectedId === item.id, expanded: expandedIds.has(item.id) }"
              @click="onSelectCustomer(item)"
            >
              <img
                class="expand-icon"
                :src="expandedIds.has(item.id) ? iconArrowDown : iconArrowRight"
                alt=""
                @click.stop="toggleExpand(item.id)"
              />
              <span class="customer-name">{{ item.name }}</span>
              <span v-if="item.count" class="customer-count" :class="countBadgeClass(item.count)">{{
                item.count
              }}</span>
            </div>
            <div v-if="item.children && expandedIds.has(item.id)" class="customer-children">
              <div
                v-for="(child, cIdx) in item.children"
                :key="child.id"
                class="customer-child"
                :class="{
                  active: selectedId === child.id,
                  'child-selected-primary': selectedId === child.id && cIdx === 0,
                  'child-selected-secondary': selectedId === child.id && cIdx > 0
                }"
                @click.stop="onSelectCustomer(child)"
                @contextmenu="onContextMenu($event, child, 'child')"
              >
                <img
                  class="child-icon-img"
                  :src="
                    selectedId === child.id
                      ? cIdx === 0
                        ? iconCompanySelected
                        : iconDocSelected
                      : cIdx === 0
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

        <!-- 右键上下文菜单 -->
        <Teleport to="body">
          <div
            v-if="contextMenu.visible"
            class="context-menu"
            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
            @click.stop
            @mouseleave="closeContextMenu"
          >
            <div class="context-menu-item" @click="onContextMenuEdit">
              <img class="context-menu-icon" :src="iconEdit" alt="" />
              <span>编辑</span>
            </div>
            <div class="context-menu-item" @click="onContextMenuAddProject">
              <img class="context-menu-icon" :src="iconAddProject" alt="" />
              <span>新增项目</span>
            </div>
            <div class="context-menu-item" @click="onContextMenuAddChild">
              <img class="context-menu-icon" :src="iconAddSub" alt="" />
              <span>新增子客户</span>
            </div>
            <div class="context-menu-item context-menu-item--danger" @click="onContextMenuDelete">
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
          <button type="button" class="interview-btn">
            <img class="interview-btn-icon" :src="iconMic" alt="" />
            <span>开始访谈</span>
          </button>
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

    <!-- 新增客户弹窗 -->
    <AddCustomerDialog v-model:visible="addDialogVisible" @success="handleAddSuccess" />
    <!-- 编辑客户弹窗（样式与新增客户一致） -->
    <AddCustomerDialog
      v-model:visible="editDialogVisible"
      title="编辑客户"
      :initial-data="editingCustomerData"
      @success="handleEditSuccess"
    />

    <!-- 新增项目弹窗 -->
    <AddProjectDialog
      v-model:visible="addProjectDialogVisible"
      @success="handleAddProjectSuccess"
    />

    <el-dialog
      v-model="deleteDialogVisible"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="640px"
      top="184px"
      class="delete-confirm-dialog"
      modal-class="delete-confirm-overlay"
      @closed="handleDeleteCancel"
    >
      <template #header>
        <div class="delete-dialog-header">
          <span class="delete-dialog-title">确认删除</span>
          <img
            class="delete-dialog-close"
            :src="deleteDialogCloseIcon"
            alt=""
            @click="handleDeleteCancel"
          />
        </div>
      </template>

      <div class="delete-dialog-content">
        {{ deleteDialogMessage }}
      </div>

      <template #footer>
        <div class="delete-dialog-footer">
          <el-button class="delete-cancel-btn" @click="handleDeleteCancel">取消</el-button>
          <el-button class="delete-confirm-btn" @click="handleDeleteConfirm">确定删除</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import AddCustomerDialog from '@/views/home/components/AddCustomerDialog.vue'
import AddProjectDialog from '@/views/home/components/AddProjectDialog.vue'
import iconArrowRight from '@/assets/images/sidebar/icon-arrow-right.svg'
import headerLogo from '@/assets/images/header/logo.png'
import headerDivider from '@/assets/images/header/divider.svg'
import headerIconAi from '@/assets/images/header/icon-ai.png'
import headerIconAiActive from '@/assets/images/header/icon-ai-active.png'
import headerIconDevice from '@/assets/images/header/icon-device.svg'
import headerIconDeviceActive from '@/assets/images/header/icon-device-active.svg'
import headerIconUser from '@/assets/images/header/icon-user.svg'
import headerIconUserActive from '@/assets/images/header/icon-user-active.svg'
import headerIconArrowDown from '@/assets/images/header/icon-arrow-down.svg'
import headerIconArrowDownWhite from '@/assets/images/header/icon-arrow-down-white.svg'
import headerIconTheme from '@/assets/images/header/icon-theme.svg'
import headerIconThemeSelected from '@/assets/images/header/icon-theme-selected.svg'
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
import deleteDialogCloseIcon from '@/assets/images/home/dialog-close-figma.svg'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const aiPanelOpen = ref(false)
const userDropdownVisible = ref(false)
const searchKeyword = ref('')
const addDialogVisible = ref(false)
const editDialogVisible = ref(false)
const addProjectDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const editingCustomerId = ref<string | null>(null)
const editingCustomerData = ref<CustomerForm | null>(null)
const deletingCustomerId = ref<string | null>(null)
const deletingCustomerName = ref('')

// 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  targetItem: null as { id: string; name: string; type: 'parent' | 'child' } | null
})

function onContextMenu(
  e: MouseEvent,
  item: { id: string; name: string },
  type: 'parent' | 'child'
) {
  e.preventDefault()
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    targetItem: { id: item.id, name: item.name, type }
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

function onContextMenuEdit() {
  const target = contextMenu.value.targetItem
  if (!target) return
  const current = findCustomerById(customerList.value, target.id)
  editingCustomerId.value = target.id
  editingCustomerData.value = {
    name: current?.name ?? target.name,
    creditCode: current?.creditCode ?? '',
    customerCode: current?.customerCode ?? '',
    remark: current?.remark ?? ''
  }
  editDialogVisible.value = true
  closeContextMenu()
}

function onContextMenuAddProject() {
  console.log('新增项目:', contextMenu.value.targetItem)
  addProjectDialogVisible.value = true
  closeContextMenu()
}

function onContextMenuAddChild() {
  console.log('新增子客户:', contextMenu.value.targetItem)
  closeContextMenu()
}

async function onContextMenuDelete() {
  const target = contextMenu.value.targetItem
  if (!target) return

  closeContextMenu()

  const deletingTarget = findCustomerById(customerList.value, target.id)
  if (!deletingTarget) {
    ElMessage.error('删除失败，未找到目标客户')
    return
  }

  deletingCustomerId.value = target.id
  deletingCustomerName.value = deletingTarget.name
  deleteDialogVisible.value = true
}

const deleteDialogMessage = computed(() => {
  if (!deletingCustomerName.value) return ''
  return `确定删除${deletingCustomerName.value}？删除后${deletingCustomerName.value}内的所有子客户和项目都会删除。请您确认是否继续？`
})

function handleDeleteCancel() {
  deleteDialogVisible.value = false
  deletingCustomerId.value = null
  deletingCustomerName.value = ''
}

function handleDeleteConfirm() {
  const targetId = deletingCustomerId.value
  if (!targetId) return

  const deletingTarget = findCustomerById(customerList.value, targetId)
  if (!deletingTarget) {
    handleDeleteCancel()
    ElMessage.error('删除失败，未找到目标客户')
    return
  }

  const selectedWillBeDeleted = containsCustomerId(deletingTarget, selectedId.value)
  const editingWillBeDeleted = editingCustomerId.value
    ? containsCustomerId(deletingTarget, editingCustomerId.value)
    : false

  const deleted = deleteCustomerById(customerList.value, targetId)
  if (!deleted) {
    handleDeleteCancel()
    ElMessage.error('删除失败，未找到目标客户')
    return
  }

  if (selectedWillBeDeleted) {
    const fallback = findFirstSelectableCustomer(customerList.value)
    if (fallback) {
      selectedId.value = fallback.id
      appStore.setSelectedCustomer(fallback.id)
      if (isProjectRouteTarget(fallback.id)) {
        router.push({ name: 'HomeProject', params: { projectId: fallback.id } })
      } else {
        router.push({ name: 'Home' })
      }
    } else {
      selectedId.value = ''
      appStore.setSelectedCustomer('')
      router.push({ name: 'Home' })
    }
  }

  if (editingWillBeDeleted) {
    editingCustomerId.value = null
    editingCustomerData.value = null
    editDialogVisible.value = false
  }

  handleDeleteCancel()
  ElMessage.success('删除成功')
}

function onUserDropdownVisible(visible: boolean) {
  userDropdownVisible.value = visible
}
const selectedId = ref('2')
const expandedIds = ref(new Set(['2']))

const isHome = computed(() => route.name === 'Home' || route.name === 'HomeProject')

interface CustomerForm {
  name: string
  creditCode: string
  customerCode: string
  remark: string
}

interface CustomerTreeItem extends CustomerForm {
  id: string
  name: string
  count?: string
  parentId?: string
  children?: CustomerTreeItem[]
}

// TODO: [客户列表] 后端接口完成后，替换假数据为 API 调用
const customerList = ref<CustomerTreeItem[]>([
  {
    id: '1',
    name: '四川晨光博达新材...',
    count: '新',
    creditCode: '',
    customerCode: '',
    remark: ''
  },
  {
    id: '2',
    name: '成都盟升电子技术...',
    count: '1/2',
    creditCode: '',
    customerCode: '',
    remark: '',
    children: [
      {
        id: '2-1',
        name: '成都盟升电子技术科',
        parentId: '2',
        creditCode: '',
        customerCode: '',
        remark: ''
      },
      {
        id: '2-2',
        name: '7000万元授信尽职调查',
        parentId: '2',
        creditCode: '',
        customerCode: '',
        remark: ''
      },
      {
        id: '2-3',
        name: '6000万元授信尽职调查',
        parentId: '2',
        creditCode: '',
        customerCode: '',
        remark: ''
      }
    ]
  },
  {
    id: '3',
    name: '杭州宇树科技股份...',
    count: '4/6',
    creditCode: '',
    customerCode: '',
    remark: ''
  },
  {
    id: '4',
    name: '惠州市赢合智能...',
    count: '0/5',
    creditCode: '',
    customerCode: '',
    remark: ''
  },
  {
    id: '5',
    name: '惠州市知合行...',
    count: '0/3',
    creditCode: '',
    customerCode: '',
    remark: ''
  },
  {
    id: '6',
    name: '杭州宇树科技股份...',
    count: '4/6',
    creditCode: '',
    customerCode: '',
    remark: ''
  }
])

/** 根据搜索关键字过滤客户列表（包括父级和子客户名称）
 *  TODO: [搜索功能] 如需后端搜索支持，可将此处改为 API 请求 */
const filteredCustomerList = computed(() => {
  if (!searchKeyword.value.trim()) return customerList.value
  const kw = searchKeyword.value.toLowerCase()
  return customerList.value
    .map(item => {
      const nameMatch = item.name.toLowerCase().includes(kw)
      const childMatch = item.children?.some(child => child.name.toLowerCase().includes(kw))
      if (nameMatch || childMatch) {
        if (item.children && childMatch) {
          const filteredChildren = item.children.filter(child =>
            child.name.toLowerCase().includes(kw)
          )
          return { ...item, children: filteredChildren }
        }
        return item
      }
      return null
    })
    .filter((item): item is (typeof customerList.value)[number] => item !== null)
})

function toggleExpand(id: string) {
  const set = new Set(expandedIds.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  expandedIds.value = set
}

/** Figma 徽章：新=红，n/x(n>0)=橙，0/x=灰 */
function countBadgeClass(count?: string): string {
  const c: string = count ?? ''
  if (c === '新' || /^\d+\.\d+$/.test(c)) return 'badge-new'
  if (/^\d+\/\d+$/.test(c)) {
    const n = parseInt(c.split('/')[0] ?? '0', 10)
    return n > 0 ? 'badge-orange' : 'badge-gray'
  }
  return 'badge-orange'
}

function showAddDialog() {
  addDialogVisible.value = true
}

function findCustomerById(items: CustomerTreeItem[], id: string): CustomerTreeItem | null {
  for (const item of items) {
    if (item.id === id) return item
    if (item.children) {
      const child = findCustomerById(item.children, id)
      if (child) return child
    }
  }
  return null
}

/** 仅用于路由分流：首个子项为子客户 → 客户首页；其后为项目 → 项目页（与 Figma 左侧列表一致） */
function isProjectRouteTarget(id: string): boolean {
  for (const parent of customerList.value) {
    if (!parent.children?.length) continue
    const idx = parent.children.findIndex(c => c.id === id)
    if (idx > 0) return true
  }
  return false
}

function findParentCustomerId(items: CustomerTreeItem[], childId: string): string | null {
  for (const item of items) {
    if (item.children?.some(c => c.id === childId)) return item.id
  }
  return null
}

watch(
  () => ({ name: route.name, pid: route.params.projectId }),
  ({ name, pid }) => {
    if (name === 'HomeProject' && typeof pid === 'string' && pid) {
      selectedId.value = pid
      appStore.setSelectedCustomer(pid)
      const parentId = findParentCustomerId(customerList.value, pid)
      if (parentId) {
        const expanded = new Set(expandedIds.value)
        expanded.add(parentId)
        expandedIds.value = expanded
      }
    }
  },
  { immediate: true }
)

provide(
  'findCustomerName',
  (id: string) => findCustomerById(customerList.value, id)?.name ?? ''
)

function onSelectCustomer(item: { id: string }) {
  selectedId.value = item.id
  appStore.setSelectedCustomer(item.id)
  if (isProjectRouteTarget(item.id)) {
    router.push({ name: 'HomeProject', params: { projectId: item.id } })
  } else {
    router.push({ name: 'Home' })
  }
}

function containsCustomerId(item: CustomerTreeItem, id: string): boolean {
  if (!id) return false
  if (item.id === id) return true
  return item.children?.some(child => containsCustomerId(child, id)) ?? false
}

function findFirstSelectableCustomer(items: CustomerTreeItem[]): CustomerTreeItem | null {
  for (const item of items) {
    if (item.children?.length) return item.children[0] ?? null
    return item
  }
  return null
}

function deleteCustomerById(items: CustomerTreeItem[], id: string): boolean {
  const index = items.findIndex(item => item.id === id)
  if (index !== -1) {
    items.splice(index, 1)
    const set = new Set(expandedIds.value)
    set.delete(id)
    expandedIds.value = set
    return true
  }

  for (const item of items) {
    if (!item.children?.length) continue

    const childIndex = item.children.findIndex(child => child.id === id)
    if (childIndex !== -1) {
      item.children.splice(childIndex, 1)
      if (item.children.length === 0) {
        delete item.children
        const set = new Set(expandedIds.value)
        set.delete(item.id)
        expandedIds.value = set
      }
      return true
    }

    if (deleteCustomerById(item.children, id)) return true
  }

  return false
}

function handleAddSuccess(data: CustomerForm) {
  console.log('新增客户成功:', data)
  // TODO: 调用 API 保存客户数据
  // 保存成功后，将新客户添加到列表中
  const newCustomer = {
    id: String(Date.now()),
    name: data.name,
    count: '新',
    creditCode: data.creditCode,
    customerCode: data.customerCode,
    remark: data.remark
  }
  customerList.value.unshift(newCustomer)
  ElMessage.success('客户添加成功')
}

function handleEditSuccess(data: CustomerForm) {
  const targetId = editingCustomerId.value
  if (!targetId) return

  const target = findCustomerById(customerList.value, targetId)
  if (!target) return
  target.name = data.name
  target.creditCode = data.creditCode
  target.customerCode = data.customerCode
  target.remark = data.remark
  ElMessage.success('客户编辑成功')
}

interface ProjectForm {
  name: string
  businessType: string
  creditTotal: string
  exposureLimit: string
  reliefTotal: string
  creditTerm: string
}

function handleAddProjectSuccess(data: ProjectForm) {
  console.log('新增项目成功:', data)
  // TODO: 调用 API 保存项目数据
}
</script>

<style scoped>
.admin-layout {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.admin-layout--home {
  background-image: url('@/assets/images/home/背景.svg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

/* Figma 1:761 顶部 - 一比一 */
.top-header {
  height: 64px;
  min-height: 64px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0;
}

.header-logo {
  width: 100px;
  height: 40px;
  object-fit: contain;
  object-position: left center;
  flex-shrink: 0;
}

.header-divider {
  width: 1px;
  height: 30px;
  margin: 0 20px;
  object-fit: contain;
  flex-shrink: 0;
}

.header-divider-right {
  margin: 0 6px;
}

.header-slogan {
  font-size: 16px;
  color: #21243d;
  letter-spacing: 0.32px;
  white-space: nowrap;
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-ai-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  padding: 0 20px;
  min-width: 130px;
  background: #fff;
  border: 1px solid #c4c4c4;
  border-radius: 100px;
  font-size: 16px;
  font-weight: 500;
  color: #2d3149;
  letter-spacing: 0.16px;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
}

/* Figma 1-1609 AI 助手点击态：蓝渐变底 + 白字 + 白 AI 图标 */
.header-ai-btn--active {
  background: linear-gradient(135deg, #2036ca 0%, #5b6cfb 100%);
  border-color: transparent;
  color: #fff;
}

.header-ai-btn:hover:not(.header-ai-btn--active) {
  border-color: #2036ca;
  color: #2036ca;
}

.header-ai-icon {
  width: 33px;
  height: 24px;
  object-fit: contain;
}

.header-icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  transition: background 0.2s;
}

/* 默认显示普通图标，hover/active 显示高亮图标 */
.header-icon-btn .header-icon-default {
  width: 36px;
  height: 36px;
  object-fit: contain;
  display: block;
}

.header-icon-btn .header-icon-active {
  width: 36px;
  height: 36px;
  object-fit: contain;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: none;
}

.header-icon-btn:hover,
.header-icon-btn:active {
  background: #2036ca;
}

.header-icon-btn:hover .header-icon-default,
.header-icon-btn:active .header-icon-default {
  display: none;
}

.header-icon-btn:hover .header-icon-active,
.header-icon-btn:active .header-icon-active {
  display: block;
}

.header-user-dropdown {
  flex-shrink: 0;
  padding-left: 5px;
}

.header-user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  min-width: 100px;
  max-width: 128px;
  background: transparent;
  border: none;
  border-radius: 100px;
  font-size: 16px;
  color: #2d3149;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    background 0.2s,
    color 0.2s;
}

/* Figma 1-1609 信息账号 hover/点击：背景 #2036ca、白字、白箭头 */
.header-user-trigger:hover,
.header-user-trigger--active {
  background: #2036ca;
  color: #fff;
}

.header-user-arrow {
  width: 16px;
  height: 9px;
  object-fit: contain;
  flex-shrink: 0;
}

.header-user-arrow--white {
  display: none;
}

.header-user-arrow--default {
  display: block;
}

.header-user-trigger:hover .header-user-arrow--default,
.header-user-trigger--active .header-user-arrow--default {
  display: none;
}

.header-user-trigger:hover .header-user-arrow--white,
.header-user-trigger--active .header-user-arrow--white {
  display: block;
}

/* Figma 高亮模式：未选中仅图标，选中为蓝底圆 + 白太阳；hover 参考用户管理按钮 */
.header-theme-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  transition: background 0.2s;
}

.header-theme-btn .header-theme-icon-default,
.header-theme-btn .header-theme-icon-selected {
  width: 20px;
  height: 20px;
  object-fit: contain;
  position: absolute;
}

.header-theme-btn .header-theme-icon-default {
  display: block;
}

.header-theme-btn .header-theme-icon-selected {
  display: none;
}

/* 未选中时 hover：蓝底 + 白太阳，与用户管理按钮一致 */
.header-theme-btn:hover:not(.header-theme-btn--selected) {
  background: #2036ca;
}

.header-theme-btn:hover:not(.header-theme-btn--selected) .header-theme-icon-default {
  display: none;
}

.header-theme-btn:hover:not(.header-theme-btn--selected) .header-theme-icon-selected {
  display: block;
}

/* 选中态：蓝底圆 + 白太阳 */
.header-theme-btn--selected {
  background: #2036ca;
}

.header-theme-btn--selected .header-theme-icon-default {
  display: none;
}

.header-theme-btn--selected .header-theme-icon-selected {
  display: block;
}

/* 选中态 hover：略微变深，与用户区 hover 一致有反馈 */
.header-theme-btn--selected:hover {
  background: #1a2da8;
}

.layout-body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

/* Figma 左 1:1759 - 侧边栏一比一，整体留左右间距 */
.left-sidebar {
  width: 320px;
  min-width: 320px;
  background: transparent;
  display: flex;
  flex-direction: column;
  padding: 28px 16px;
  overflow: hidden;
}

/* 首页：侧边栏上边与内容板块上边对齐（home-page padding-top 13px） */
.admin-layout--home .left-sidebar {
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

.customer-type-tabs .tab-btn:first-child {
  border-radius: 5px 5px 5px 5px;
}

.customer-type-tabs .tab-btn:last-child {
  border-radius: 5px 5px 5px 5px;
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

/* TODO: [搜索框样式] 可按需调整边框颜色、背景色、圆角等 */
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

/* 父级列表被选中样式：蓝色背景 + 白色文字 */
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

/* 选中状态下箭头变白色 */
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

.customer-child.child-selected-primary {
  background: #2036ca;
  color: #fff;
}

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

.report-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 220px;
  height: 44px;
  padding: 10px;
  background: #fff;
  border: none;
  border-radius: 100px;
  box-shadow: 0 3px 10px rgba(36, 31, 164, 0.1);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.75;
  color: #2d3149;
  cursor: pointer;
}

.report-btn-icon {
  width: 26px;
  height: 24px;
  object-fit: contain;
}

.interview-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 220px;
  height: 44px;
  padding: 10px;
  background: #2036ca;
  border: none;
  border-radius: 100px;
  box-shadow: 0 3px 10px rgba(36, 31, 164, 0.1);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.75;
  color: #fff;
  cursor: pointer;
}

.interview-btn-icon {
  width: 26px;
  height: 24px;
  object-fit: contain;
}

.main-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: #f5f7fa;
}

/* 首页一屏展示：主内容区不出现滚动条、背景透明以露出布局背景图 */
.admin-layout--home .main-content {
  overflow: hidden;
  background: transparent;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 右键上下文菜单 */
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

/* hover时图标变白（用于编辑/新增项目/新增子客户） */
.context-menu-item:hover .context-menu-icon {
  filter: brightness(0) invert(1);
}

.context-menu-item--danger {
  color: #2d3149;
}

.context-menu-item--danger:hover {
  background: #fe635d;
  color: #fff;
}

/* 删除图标hover时变白 */
.context-menu-item--danger:hover .context-menu-icon {
  filter: brightness(0) invert(1);
}

.context-menu-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  object-fit: contain;
}

.delete-confirm-dialog :deep(.el-dialog) {
  border-radius: 0;
  background: #fff;
  height: 260px;
  box-shadow: 0 3px 10px 0 rgba(36, 31, 164, 0.1);
  margin-bottom: 0;
}

.delete-confirm-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
}

.delete-confirm-dialog :deep(.el-dialog__body) {
  padding: 0 !important;
  height: 77px;
}

.delete-confirm-dialog :deep(.el-dialog__footer) {
  padding: 0 !important;
}

.delete-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 10px;
  border-bottom: 1px solid #e9ecef;
  box-sizing: border-box;
}

.delete-dialog-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 22px;
  color: #21243d;
}

.delete-dialog-close {
  width: 18.31px;
  height: 16.83px;
  display: block;
  flex-shrink: 0;
  object-fit: contain;
  cursor: pointer;
}

.delete-dialog-close:hover {
  opacity: 0.75;
}

.delete-dialog-content {
  padding: 10px 12px 0 20px;
  font-size: 16px;
  line-height: 26px;
  color: #21243d;
  height: 74px;
  box-sizing: border-box;
}

.delete-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding: 17px 28px 0 0;
}

.delete-cancel-btn,
.delete-confirm-btn {
  height: 38px;
  min-width: 100px;
  padding: 9px 20px;
  border-radius: 4px;
  font-size: 14px;
}

.delete-cancel-btn {
  background: #fff;
  border: 1px solid #d9d9d9;
  color: #303030;
}

.delete-cancel-btn:hover {
  border-color: #2036ca;
  color: #2036ca;
}

.delete-confirm-btn {
  background: #fe635d;
  border: none;
  color: #fff;
}

.delete-confirm-btn:hover {
  background: #f55a54;
  color: #fff;
}

::global(.delete-confirm-overlay) {
  background: rgba(0, 0, 0, 0.26);
}
</style>
