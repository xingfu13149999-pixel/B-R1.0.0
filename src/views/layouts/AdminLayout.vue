<!--
  登录后主布局：顶栏 AdminHeader、左侧 AdminSidebar、右侧 main 内嵌 router-view。
  首页类路由加 admin-layout--home 以显示背景图；侧栏树与弹窗增删改客户/项目逻辑在本文件。
-->
<template>
  <div class="admin-layout" :class="{ 'admin-layout--home': isHome }">
    <AdminHeader
      :ai-panel-open="aiPanelOpen"
      :current-user-name="appStore.currentUser.name"
      :dark-mode="appStore.darkMode"
      @open-ai-panel="aiPanelOpen = true"
      @logout="router.push('/login')"
      @toggle-dark-mode="appStore.toggleDarkMode"
    />

    <div class="layout-body">
      <AdminSidebar
        :is-home="isHome"
        :customer-type="appStore.customerType"
        :search-keyword="searchKeyword"
        :items="filteredCustomerList"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        :context-menu="contextMenu"
        @update:search-keyword="searchKeyword = $event"
        @set-customer-type="appStore.setCustomerType"
        @show-add-customer="showAddDialog"
        @toggle-expand="toggleExpand"
        @select-customer="onSelectCustomer"
        @open-context-menu="handleSidebarContextMenu"
        @close-context-menu="closeContextMenu"
        @edit-context-menu="onContextMenuEdit"
        @add-project-context-menu="onContextMenuAddProject"
        @add-child-context-menu="onContextMenuAddChild"
        @delete-context-menu="onContextMenuDelete"
      />

      <main class="main-content">
        <!-- 不使用 opacity 过渡：项目页 ↔ 访谈记录/授信报告 互跳时淡出会露出主区域底色，易感知为闪烁 -->
        <router-view v-slot="{ Component }">
          <component :is="Component" v-if="Component" :key="route.fullPath" />
        </router-view>
      </main>
    </div>

    <el-dialog v-model="aiPanelOpen" title="AI助手" width="400px" append-to-body>
      <p>AI 助手功能开发中。</p>
    </el-dialog>

    <AddCustomerDialog v-model:visible="addDialogVisible" @success="handleAddSuccess" />
    <AddCustomerDialog
      v-model:visible="editDialogVisible"
      title="编辑客户"
      :initial-data="editingCustomerData"
      @success="handleEditSuccess"
    />

    <AddProjectDialog
      v-model:visible="addProjectDialogVisible"
      @success="handleAddProjectSuccess"
    />
    <AddProjectDialog
      v-model:visible="editProjectDialogVisible"
      title="编辑项目"
      :initial-data="editingProjectData"
      @success="handleEditProjectSuccess"
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
          <el-button class="delete-confirm-btn" @click="handleDeleteConfirm">确认删除</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AddCustomerDialog from '@/views/home/components/AddCustomerDialog.vue'
import AddProjectDialog from '@/views/home/components/AddProjectDialog.vue'
import {
  containsCustomerId,
  deleteCustomerById,
  filterCustomerList,
  findCustomerById,
  findFirstSelectableCustomer,
  findParentCustomerId,
  isProjectRouteTarget,
  type CustomerForm,
  type CustomerTreeItem,
  type SidebarContextMenuState,
  type SidebarContextMenuTarget
} from '@/views/home/mock/customerTree'
import { liveCustomerTreeItems } from '@/views/home/mock/liveCustomerTree'
import type { ProjectForm } from '@/views/home/components/AddProjectDialog.vue'
import { useAppStore } from '@/stores/app'
import deleteDialogCloseIcon from '@/assets/images/home/dialog-close-figma.svg'
import AdminHeader from './components/AdminHeader.vue'
import AdminSidebar from './components/AdminSidebar.vue'

interface SidebarContextMenuRequest {
  event: MouseEvent
  item: { id: string; name: string }
  type: SidebarContextMenuTarget['type']
}

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const aiPanelOpen = ref(false)
const searchKeyword = ref('')
const addDialogVisible = ref(false)
const editDialogVisible = ref(false)
const addProjectDialogVisible = ref(false)
/** 右键「新增项目」时解析出的父客户 id，关闭弹窗时清空 */
const addProjectParentCustomerId = ref<string | null>(null)
const editProjectDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const editingCustomerId = ref<string | null>(null)
const editingCustomerData = ref<CustomerForm | null>(null)
const editingProjectId = ref<string | null>(null)
const editingProjectData = ref<Partial<ProjectForm> | null>(null)
const deletingCustomerId = ref<string | null>(null)
const deletingCustomerName = ref('')

/** 与全屏访谈等页共用，勿在别处再 createInitialCustomerList */
const customerList = liveCustomerTreeItems

function routeProjectIdParam(): string {
  const projectId = route.params.projectId
  if (Array.isArray(projectId)) return projectId[0] ?? ''
  return typeof projectId === 'string' ? projectId : ''
}

/** 与 URL 一致，避免从全屏访谈返回后侧栏仍停在默认项 */
function initialSidebarFromRoute(): { selectedId: string; expandedIds: Set<string> } {
  const n = route.name
  const pid = routeProjectIdParam()
  if (
    (n === 'HomeProject' || n === 'CreditReport' || n === 'InterviewRecords') &&
    pid
  ) {
    const parentId = findParentCustomerId(customerList.value, pid)
    const next = new Set<string>()
    if (parentId) next.add(parentId)
    else next.add('2')
    return { selectedId: pid, expandedIds: next }
  }
  return { selectedId: '2', expandedIds: new Set(['2']) }
}

const _sidebarInit = initialSidebarFromRoute()
const selectedId = ref(_sidebarInit.selectedId)
const expandedIds = ref(_sidebarInit.expandedIds)
const contextMenu = ref<SidebarContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  targetItem: null
})

const isHome = computed(
  () =>
    route.name === 'Home' ||
    route.name === 'HomeProject' ||
    route.name === 'InterviewRecords' ||
    route.name === 'CreditReport'
)

const deleteDialogMessage = computed(() => {
  if (!deletingCustomerName.value) return ''
  return `确定删除${deletingCustomerName.value}？删除后${deletingCustomerName.value}内的所有子客户和项目都会删除。请您确认是否继续？`
})

const filteredCustomerList = computed(() =>
  filterCustomerList(customerList.value, searchKeyword.value)
)

function handleSidebarContextMenu(payload: SidebarContextMenuRequest) {
  payload.event.preventDefault()
  contextMenu.value = {
    visible: true,
    x: payload.event.clientX,
    y: payload.event.clientY,
    targetItem: {
      id: payload.item.id,
      name: payload.item.name,
      type: payload.type
    }
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false
}

function onContextMenuEdit() {
  const target = contextMenu.value.targetItem
  if (!target) return

  const current = findCustomerById(customerList.value, target.id)
  if (!current) {
    closeContextMenu()
    return
  }

  if (isProjectRouteTarget(customerList.value, target.id)) {
    editDialogVisible.value = false
    editingCustomerId.value = null
    editingCustomerData.value = null
    editingProjectId.value = target.id

    const detail = current.projectDetail
    editingProjectData.value = {
      name: current.name,
      businessType: detail?.businessType ?? '常规类授信业务',
      creditTotal: detail?.creditTotal ?? '',
      exposureLimit: detail?.exposureLimit ?? '',
      reliefTotal: detail?.reliefTotal ?? '',
      creditTerm: detail?.creditTerm ?? ''
    }
    editProjectDialogVisible.value = true
  } else {
    editProjectDialogVisible.value = false
    editingProjectId.value = null
    editingProjectData.value = null
    editingCustomerId.value = target.id
    editingCustomerData.value = {
      name: current.name,
      creditCode: current.creditCode ?? '',
      customerCode: current.customerCode ?? '',
      remark: current.remark ?? ''
    }
    editDialogVisible.value = true
  }

  closeContextMenu()
}

function resolveParentIdForNewProject(target: SidebarContextMenuTarget): string | null {
  if (target.type === 'parent') return target.id
  return findParentCustomerId(customerList.value, target.id)
}

function onContextMenuAddProject() {
  const target = contextMenu.value.targetItem
  if (!target) return

  const parentId = resolveParentIdForNewProject(target)
  if (!parentId) {
    ElMessage.warning('无法确定所属客户，请重试')
    closeContextMenu()
    return
  }

  addProjectParentCustomerId.value = parentId
  addProjectDialogVisible.value = true
  closeContextMenu()
}

function onContextMenuAddChild() {
  console.log('新增子客户:', contextMenu.value.targetItem)
  closeContextMenu()
}

function onContextMenuDelete() {
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
  const editingProjectWillBeDeleted = editingProjectId.value
    ? containsCustomerId(deletingTarget, editingProjectId.value)
    : false

  const deletion = deleteCustomerById(customerList.value, targetId)
  if (!deletion.deleted) {
    handleDeleteCancel()
    ElMessage.error('删除失败，未找到目标客户')
    return
  }

  if (deletion.clearedExpandedId) {
    const nextExpandedIds = new Set(expandedIds.value)
    nextExpandedIds.delete(deletion.clearedExpandedId)
    expandedIds.value = nextExpandedIds
  }

  if (selectedWillBeDeleted) {
    const fallback = findFirstSelectableCustomer(customerList.value)
    if (fallback) {
      selectedId.value = fallback.id
      appStore.setSelectedCustomer(fallback.id)

      if (isProjectRouteTarget(customerList.value, fallback.id)) {
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

  if (editingProjectWillBeDeleted) {
    editingProjectId.value = null
    editingProjectData.value = null
    editProjectDialogVisible.value = false
  }

  handleDeleteCancel()
  ElMessage.success('删除成功')
}

function toggleExpand(id: string) {
  const nextExpandedIds = new Set(expandedIds.value)
  if (nextExpandedIds.has(id)) nextExpandedIds.delete(id)
  else nextExpandedIds.add(id)
  expandedIds.value = nextExpandedIds
}

function showAddDialog() {
  addDialogVisible.value = true
}

watch(
  () => ({ name: route.name, projectId: routeProjectIdParam() }),
  ({ name, projectId }) => {
    if (
      (name === 'HomeProject' || name === 'CreditReport' || name === 'InterviewRecords') &&
      projectId
    ) {
      selectedId.value = projectId
      appStore.setSelectedCustomer(projectId)

      const parentId = findParentCustomerId(customerList.value, projectId)
      if (parentId) {
        const nextExpandedIds = new Set(expandedIds.value)
        nextExpandedIds.add(parentId)
        expandedIds.value = nextExpandedIds
      }
    } else if (name === 'Home') {
      appStore.setSelectedCustomer(selectedId.value)
    }
  },
  { immediate: true }
)

provide('findCustomerName', (id: string) => findCustomerById(customerList.value, id)?.name ?? '')
/** 按 id 查找树节点（含 projectDetail），供项目页与弹窗数据联动 */
provide('findProjectNode', (id: string) => findCustomerById(customerList.value, id))

function onSelectCustomer(item: { id: string }) {
  selectedId.value = item.id
  appStore.setSelectedCustomer(item.id)

  if (isProjectRouteTarget(customerList.value, item.id)) {
    router.push({ name: 'HomeProject', params: { projectId: item.id } })
  } else {
    router.push({ name: 'Home' })
  }
}

function handleAddSuccess(data: CustomerForm) {
  console.log('新增客户成功:', data)
  customerList.value.unshift({
    id: String(Date.now()),
    name: data.name,
    count: '新',
    creditCode: data.creditCode,
    customerCode: data.customerCode,
    remark: data.remark
  })
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
}

function handleEditProjectSuccess(data: ProjectForm) {
  const targetId = editingProjectId.value
  if (!targetId) return

  const target = findCustomerById(customerList.value, targetId)
  if (!target) return

  target.name = data.name
  target.projectDetail = {
    businessType: data.businessType,
    creditTotal: data.creditTotal,
    exposureLimit: data.exposureLimit,
    reliefTotal: data.reliefTotal,
    creditTerm: data.creditTerm
  }
  editingProjectId.value = null
  editingProjectData.value = null
}

function ensureCompanyChildBeforeProject(parent: CustomerTreeItem) {
  if (!parent.children) parent.children = []
  if (parent.children.length === 0) {
    parent.children.push({
      id: `${parent.id}-c`,
      name: parent.name.length > 16 ? `${parent.name.slice(0, 14)}…` : parent.name,
      parentId: parent.id,
      creditCode: '',
      customerCode: '',
      remark: ''
    })
  }
}

function handleAddProjectSuccess(data: ProjectForm) {
  const parentId = addProjectParentCustomerId.value

  if (!parentId) {
    ElMessage.error('未找到所属客户，请从侧栏右键菜单再次选择「新增项目」')
    return
  }

  const parent = findCustomerById(customerList.value, parentId)
  if (!parent) {
    ElMessage.error('客户数据已变更，请刷新后重试')
    return
  }

  ensureCompanyChildBeforeProject(parent)

  const newId = `${parentId}-p${Date.now()}`
  parent.children!.push({
    id: newId,
    name: data.name,
    parentId: parentId,
    creditCode: '',
    customerCode: '',
    remark: '',
    projectDetail: {
      businessType: data.businessType,
      creditTotal: data.creditTotal,
      exposureLimit: data.exposureLimit,
      reliefTotal: data.reliefTotal,
      creditTerm: data.creditTerm
    }
  })

  const nextExpanded = new Set(expandedIds.value)
  nextExpanded.add(parentId)
  expandedIds.value = nextExpanded

  selectedId.value = newId
  appStore.setSelectedCustomer(newId)
  router.push({ name: 'HomeProject', params: { projectId: newId } })
}

watch(addProjectDialogVisible, visible => {
  if (!visible) addProjectParentCustomerId.value = null
})
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
  background-image: url('@/assets/images/home/bg.svg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.layout-body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.main-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: #f5f7fa;
}

.admin-layout--home .main-content {
  overflow: hidden;
  background: transparent;
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
