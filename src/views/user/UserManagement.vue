<template>
  <div class="user-page">
    <div class="content-panel">
      <div class="top-divider" />

      <section class="filter-card">
        <div class="title-wrap">
          <button type="button" class="back-btn" aria-label="返回" @click="goBack">
            <img class="back-icon" :src="iconBack" alt="" width="32" height="32" />
          </button>
          <h2 class="title">用户列表</h2>
        </div>

        <div class="filter-actions">
          <div class="field-group">
            <label class="label">用户状态：</label>
            <div class="select-box">
              <span>{{ draftStatusLabel }}</span>
              <img :src="iconSelectArrow" alt="" />
              <select v-model="draftStatus">
                <option value="all">全部</option>
                <option value="enabled">启用</option>
                <option value="disabled">停用</option>
              </select>
            </div>
          </div>

          <div class="field-group">
            <label class="label">用户查询：</label>
            <div class="input-box">
              <input
                v-model="draftKeyword"
                type="text"
                placeholder="请输入用户名"
                @keyup.enter="applySearch"
              />
            </div>
          </div>

          <button type="button" class="btn-search" @click="applySearch">
            <img :src="iconSearchWhite" alt="" />
            <span>搜索</span>
          </button>

          <button type="button" class="btn-reset" @click="reset">
            <img :src="iconReset" alt="" />
            <span>重置</span>
          </button>
        </div>
      </section>

      <section class="list-card">
        <div class="table-shell">
          <table class="user-table user-table-head">
            <colgroup>
              <col style="width: 3.4072%" />
              <col style="width: 10.2215%" />
              <col style="width: 15.0028%" />
              <col style="width: 15.0028%" />
              <col style="width: 15.0028%" />
              <col style="width: 15.0028%" />
              <col style="width: 15.0028%" />
              <col style="width: 11.3573%" />
            </colgroup>
            <thead>
              <tr>
                <th class="col-check">
                  <input
                    type="checkbox"
                    :checked="allVisibleSelected"
                    @change="toggleSelectAll(($event.target as HTMLInputElement).checked)"
                  />
                </th>
                <th class="col-index">
                  <span class="th-inner">序号 <img :src="iconSort" alt="" /></span>
                </th>
                <th>
                  <span class="th-inner">用户名 <img :src="iconSort" alt="" /></span>
                </th>
                <th>
                  <span class="th-inner">设备编码 <img :src="iconSort" alt="" /></span>
                </th>
                <th>
                  <span class="th-inner">公司名称 <img :src="iconSort" alt="" /></span>
                </th>
                <th>
                  <span class="th-inner">用户状态 <img :src="iconSort" alt="" /></span>
                </th>
                <th>
                  <span class="th-inner">用户类型 <img :src="iconSort" alt="" /></span>
                </th>
                <th class="col-op">
                  <span class="op-title">操作</span>
                </th>
              </tr>
            </thead>
          </table>

          <div class="table-scroll">
            <table class="user-table user-table-body">
              <colgroup>
                <col style="width: 3.4072%" />
                <col style="width: 10.2215%" />
                <col style="width: 15.0028%" />
                <col style="width: 15.0028%" />
                <col style="width: 15.0028%" />
                <col style="width: 15.0028%" />
                <col style="width: 15.0028%" />
                <col style="width: 11.3573%" />
              </colgroup>
              <tbody>
                <tr
                  v-for="row in pagedRows"
                  :key="row.id"
                  :class="{
                    selected: isRowSelected(row.id)
                  }"
                >
                  <td class="col-check">
                    <input
                      type="checkbox"
                      :checked="isRowSelected(row.id)"
                      @change="toggleRowSelection(row.id, ($event.target as HTMLInputElement).checked)"
                    />
                  </td>
                  <td class="col-index">{{ row.id }}</td>
                  <td>{{ row.username }}</td>
                  <td>{{ row.deviceCode }}</td>
                  <td>{{ row.companyName }}</td>
                  <td>
                    <button
                      type="button"
                      class="status-switch"
                      :class="{ 'status-switch--off': row.status === 'disabled' }"
                      :aria-checked="row.status === 'enabled'"
                      role="switch"
                      @click="toggleStatus(row.id)"
                    >
                      <span class="status-switch__handle" />
                    </button>
                  </td>
                  <td>{{ row.userType }}</td>
                  <td class="col-op">
                    <div class="op-actions">
                      <a href="#" @click.prevent="openEditDialog(row)">编辑</a>
                      <a href="#" class="op-delete" @click.prevent="openDeleteDialog(row)">删除</a>
                    </div>
                  </td>
                </tr>
                <tr v-if="pagedRows.length === 0" class="empty-row">
                  <td colspan="8">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="pager-card">
          <div class="pager-row">
            <div class="pager-left">
              <span>共{{ filteredRows.length }}条，每页</span>
              <button type="button" class="page-size-btn">
                <span>{{ pageSize }}</span>
                <img :src="iconPageDown" alt="" />
                <select v-model.number="pageSize">
                  <option :value="10">10</option>
                </select>
              </button>
              <span>条</span>
            </div>

            <div class="pager-mid">
              <button
                type="button"
                class="page-btn page-btn-muted"
                :disabled="currentPage === 1"
                @click="goPrevPage"
              >
                <img :src="iconPageLeft" alt="" />
              </button>

              <template v-for="(item, index) in displayPages" :key="`${item}-${index}`">
                <button
                  v-if="item !== 'ellipsis'"
                  type="button"
                  class="page-btn"
                  :class="{ active: currentPage === item }"
                  @click="goPage(item)"
                >
                  {{ item }}
                </button>
                <button v-else type="button" class="page-btn-ellipsis" tabindex="-1">
                  <img :src="iconPageEllipsis" alt="" />
                </button>
              </template>

              <button
                type="button"
                class="page-btn"
                :disabled="currentPage >= totalPages"
                @click="goNextPage"
              >
                <img :src="iconPageRight" alt="" />
              </button>
            </div>

            <div class="pager-right">
              <span>跳转到</span>
              <input v-model="jumpPage" type="text" @keyup.enter="goJumpPage" />
              <span>页</span>
            </div>
          </div>
        </div>
      </section>

      <div class="panel-bottom-spacer" aria-hidden="true" />

      <EditUserDialog
        v-model:visible="editDialogVisible"
        title="编辑用户"
        :initial-data="editingUserData"
        @success="handleEditSuccess"
      />
      <el-dialog
        v-model="deleteDialogVisible"
        :show-close="false"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        align-center
        width="640px"
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import iconBack from '@/assets/images/credit-report/icon-back.svg'
import iconSearchWhite from '@/assets/images/device/icon-search-white.svg'
import iconReset from '@/assets/images/device/icon-reset.svg'
import iconSort from '@/assets/images/device/icon-sort.svg'
import iconPageDown from '@/assets/images/device/icon-page-down.svg'
import iconPageLeft from '@/assets/images/device/icon-page-left.svg'
import iconPageRight from '@/assets/images/device/icon-page-right.svg'
import iconPageEllipsis from '@/assets/images/device/icon-page-ellipsis.svg'
import iconSelectArrow from '@/assets/images/device/icon-select-arrow.svg'
import deleteDialogCloseIcon from '@/assets/images/home/dialog-close-figma.svg'
import EditUserDialog, { type UserForm, type UserStatus } from './components/EditUserDialog.vue'

interface UserRow {
  id: number
  username: string
  deviceCode: string
  companyName: string
  status: UserStatus
  userType: string
}

const router = useRouter()

const draftKeyword = ref('')
const keyword = ref('')
const draftStatus = ref<'all' | UserStatus>('all')
const status = ref<'all' | UserStatus>('all')
const currentPage = ref(1)
const pageSize = ref(10)
const jumpPage = ref('')
const selectedRowIds = ref<number[]>([])
const editDialogVisible = ref(false)
const editingUserId = ref<number | null>(null)
const editingUserData = ref<Partial<UserForm> | null>(null)
const deleteDialogVisible = ref(false)
const deletingUserId = ref<number | null>(null)
const deletingUsername = ref('')

const rows = ref<UserRow[]>(
  Array.from({ length: 220 }, (_, index) => {
    const id = index + 1

    return {
      id,
      username: 'User-butter-01',
      deviceCode: 'HALLO WORD-BUYSTAND',
      companyName: '四川冰凝科技有限公司',
      status: id % 4 === 0 || id % 7 === 2 ? 'disabled' : 'enabled',
      userType: id % 6 === 0 ? '管理员' : '普通用户'
    }
  })
)

const draftStatusLabel = computed(() => {
  if (draftStatus.value === 'enabled') return '启用'
  if (draftStatus.value === 'disabled') return '停用'
  return '全部'
})

const filteredRows = computed(() => {
  const search = keyword.value.trim().toLowerCase()

  return rows.value.filter(item => {
    const matchesStatus = status.value === 'all' || item.status === status.value
    const matchesKeyword = search.length === 0 || item.username.toLowerCase().includes(search)

    return matchesStatus && matchesKeyword
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))
const deleteDialogMessage = computed(() =>
  deletingUsername.value
    ? `确定删除用户“${deletingUsername.value}”吗？删除后不可恢复，请确认是否继续。`
    : ''
)

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const allVisibleSelected = computed(
  () => pagedRows.value.length > 0 && pagedRows.value.every(row => selectedRowIds.value.includes(row.id))
)

const displayPages = computed<(number | 'ellipsis')[]>(() => {
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', total]
  }

  if (current >= total - 3) {
    return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total]
  }

  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total]
})

function applySearch() {
  keyword.value = draftKeyword.value
  status.value = draftStatus.value
  currentPage.value = 1
  jumpPage.value = ''
}

function goBack() {
  router.back()
}

function reset() {
  draftKeyword.value = ''
  keyword.value = ''
  draftStatus.value = 'all'
  status.value = 'all'
  pageSize.value = 10
  currentPage.value = 1
  jumpPage.value = ''
}

function goPage(page: number) {
  currentPage.value = page
}

function goPrevPage() {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

function goNextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

function goJumpPage() {
  const page = Number.parseInt(jumpPage.value, 10)

  if (Number.isNaN(page)) return

  if (page < 1) {
    currentPage.value = 1
    return
  }

  if (page > totalPages.value) {
    currentPage.value = totalPages.value
    return
  }

  currentPage.value = page
}

function isRowSelected(rowId: number) {
  return selectedRowIds.value.includes(rowId)
}

function toggleRowSelection(rowId: number, checked: boolean) {
  if (checked) {
    if (!selectedRowIds.value.includes(rowId)) {
      selectedRowIds.value = [...selectedRowIds.value, rowId]
    }
    return
  }

  selectedRowIds.value = selectedRowIds.value.filter(id => id !== rowId)
}

function toggleSelectAll(checked: boolean) {
  const visibleIds = pagedRows.value.map(row => row.id)

  if (checked) {
    selectedRowIds.value = Array.from(new Set([...selectedRowIds.value, ...visibleIds]))
    return
  }

  selectedRowIds.value = selectedRowIds.value.filter(id => !visibleIds.includes(id))
}

function toggleStatus(rowId: number) {
  rows.value = rows.value.map(row =>
    row.id === rowId
      ? {
          ...row,
          status: row.status === 'enabled' ? 'disabled' : 'enabled'
        }
      : row
  )
}

function openEditDialog(row: UserRow) {
  editingUserId.value = row.id
  editingUserData.value = {
    username: row.username,
    deviceCode: row.deviceCode,
    companyName: row.companyName,
    status: row.status,
    userType: row.userType
  }
  editDialogVisible.value = true
}

function openDeleteDialog(row: UserRow) {
  deletingUserId.value = row.id
  deletingUsername.value = row.username
  deleteDialogVisible.value = true
}

function handleEditSuccess(data: UserForm) {
  const targetId = editingUserId.value
  if (targetId == null) return

  rows.value = rows.value.map(row =>
    row.id === targetId
      ? {
          ...row,
          username: data.username,
          deviceCode: data.deviceCode,
          companyName: data.companyName,
          status: data.status,
          userType: data.userType
        }
      : row
  )

  editingUserId.value = null
  editingUserData.value = null
}

function handleDeleteCancel() {
  deleteDialogVisible.value = false
  deletingUserId.value = null
  deletingUsername.value = ''
}

function handleDeleteConfirm() {
  const targetId = deletingUserId.value
  if (targetId == null) return

  rows.value = rows.value.filter(row => row.id !== targetId)
  selectedRowIds.value = selectedRowIds.value.filter(id => id !== targetId)

  if (editingUserId.value === targetId) {
    editDialogVisible.value = false
    editingUserId.value = null
    editingUserData.value = null
  }

  handleDeleteCancel()
  ElMessage.success('用户删除成功')
}

watch(filteredRows, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

watch(pageSize, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})
</script>

<style scoped>
.user-page {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  padding: 13px 30px 30px 12px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: transparent;
  font-family: inherit;
}

.user-page button,
.user-page input,
.user-page select {
  font-family: inherit;
}

.content-panel {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  max-height: 100%;
  box-sizing: border-box;
  padding: 20px 24px 40px;
  overflow: hidden;
  background: linear-gradient(180deg, #eef2ff 0%, #f5f7ff 40%, #f5f7ff 30%);
  border-radius: 6px;
  box-shadow: 0 0 20px hwb(226 28% 19% / 0.15);
}

.top-divider {
  display: none;
}

.panel-bottom-spacer {
  width: 100%;
  height: 60px;
  flex-shrink: 0;
}

.filter-card,
.list-card {
  width: 100%;
  margin: 0;
  flex: 0 0 auto;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-card {
  min-height: 72px;
  margin-top: 0;
  background: #fff;
  border-radius: 4px;
  padding: 12px 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title {
  margin: 0;
  color: #303030;
  font-size: 20px;
  font-weight: 500;
  line-height: 20px;
}

.back-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.back-icon {
  display: block;
  width: 32px;
  height: 32px;
  transform: rotate(90deg);
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.field-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.label {
  color: #303030;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0.28px;
  white-space: nowrap;
}

.select-box,
.input-box {
  position: relative;
  height: 36px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
}

.select-box {
  width: 240px;
  justify-content: space-between;
  padding: 5px 12px;
}

.select-box span {
  color: #21243d;
  font-size: 14px;
  line-height: 22px;
}

.select-box img {
  width: 14px;
  height: 8px;
  flex-shrink: 0;
}

.select-box select {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.input-box {
  width: 240px;
  padding: 0 8px;
}

.input-box input {
  width: 100%;
  border: none;
  outline: none;
  color: #21243d;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0.28px;
}

.input-box input::placeholder {
  color: #bec4d3;
}

.btn-search,
.btn-reset {
  height: 36px;
  padding: 0 24px;
  border-radius: 4px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.btn-search {
  border: none;
  background: #2036ca;
  color: #fff;
}

.btn-search:hover {
  background: #1a2ba8;
}

.btn-reset {
  border: 1px solid #e0e5f0;
  background: #fff;
  color: #303030;
}

.btn-search img,
.btn-reset img {
  width: 16px;
  height: 16px;
  transition: filter 0.2s;
}

.btn-reset:hover {
  background: #2036ca;
  border-color: #2036ca;
  color: #fff;
}

.btn-reset:hover img {
  filter: brightness(0) invert(1);
}

.list-card {
  margin-top: 14px;
  margin-bottom: 40px;
  background: #fff;
  border-radius: 6px;
  padding: 20px 20px 37px;
  box-sizing: border-box;
}

.table-shell {
  width: 100%;
  margin: 0 auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-family: inherit;
}

.user-table th,
.user-table td {
  height: 50px;
  box-sizing: border-box;
  padding: 0 16px;
  font-size: 14px;
  line-height: 22px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-table-head th {
  background: #f3f3f3;
  color: #8a92a6;
  font-weight: 400;
  border: 0.5px solid #f3f3f3;
}

.user-table-body td {
  color: #21243d;
  border-top: 0.5px solid #e4e9ee;
  border-bottom: 0.5px solid #e4e9ee;
}

.user-table-body tr:hover td {
  background: #edf3f7;
}

.user-table-body tr.selected td {
  background: #e9f1ff;
}

.table-scroll {
  height: 501px;
  overflow: hidden;
}

.th-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.th-inner img {
  width: 8px;
  height: 11px;
}

.col-check {
  width: 60px;
  text-align: center;
  padding: 0;
}

.col-index {
  width: 180px;
}

.col-op {
  width: 200px;
  text-align: left;
}

.op-title {
  display: inline-block;
}

.user-table input[type='checkbox'] {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid #8a92a6;
  border-radius: 2px;
  background: #fff;
  cursor: pointer;
  vertical-align: middle;
}

.user-table input[type='checkbox']:checked {
  background: #2036ca;
  border-color: #2036ca;
}

.status-switch {
  width: 44px;
  height: 22px;
  padding: 2px;
  border: none;
  border-radius: 16px;
  background: #78e1a2;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  box-sizing: border-box;
  cursor: pointer;
  transition: background 0.2s;
}

.status-switch--off {
  background: #d8dfeb;
  justify-content: flex-start;
}

.status-switch__handle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 2px rgba(0, 35, 11, 0.2);
  flex-shrink: 0;
}

.op-actions {
  display: inline-flex;
  align-items: center;
  gap: 18px;
}

.col-op a {
  color: #2036ca;
  text-decoration: none;
}

.col-op .op-delete {
  color: #fc5a5a;
}

.empty-row td {
  height: 500px;
  text-align: center;
  color: #8a92a6;
  border-bottom: 0.5px solid #e4e9ee;
}

.pager-card {
  margin-top: 40px;
  flex-shrink: 0;
}

.pager-row {
  width: 100%;
  max-width: 1761px;
  min-height: 32px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.pager-left,
.pager-mid,
.pager-right {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #21243d;
  font-size: 14px;
  line-height: 22px;
}

.pager-mid {
  gap: 8px;
}

.page-size-btn {
  position: relative;
  width: 54px;
  height: 32px;
  padding: 5px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: #21243d;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  cursor: pointer;
}

.page-size-btn select {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.page-size-btn img {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.page-btn,
.page-btn-ellipsis {
  width: 32px;
  height: 32px;
  padding: 0;
  box-sizing: border-box;
}

.page-btn {
  border: 1px solid #21243d;
  border-radius: 2px;
  background: #fff;
  color: #21243d;
  font-size: 14px;
  line-height: 22px;
  cursor: pointer;
}

.page-btn:hover:not(.active):not(:disabled) {
  background: #f5f7ff;
  border-color: #2036ca;
  color: #2036ca;
}

.page-btn img {
  width: 14px;
  height: 14px;
}

.page-btn.active {
  background: #2036ca;
  border-color: #2036ca;
  color: #fff;
}

.page-btn.active:hover {
  background: #1a2ba8;
  border-color: #1a2ba8;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn-muted {
  background: #f6f6f6;
  border-color: #f6f6f6;
}

.page-btn-muted:hover:not(:disabled) {
  background: #f5f7ff;
  border-color: #2036ca;
}

.page-btn-ellipsis {
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page-btn-ellipsis img {
  width: 24px;
  height: 24px;
}

.pager-right input {
  width: 40px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #4f4f4f;
  border-radius: 2px;
  box-sizing: border-box;
  color: #7d7d7d;
  font-size: 14px;
  line-height: 22px;
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
  padding: 10px 20px 0;
  font-size: 16px;
  line-height: 26px;
  color: #21243d;
  min-height: 74px;
  box-sizing: border-box;
}

.delete-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding: 17px 28px 20px 0;
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

:global(.delete-confirm-overlay) {
  background: rgba(0, 0, 0, 0.26);
}

@media (max-width: 1600px) {
  .filter-card {
    align-items: flex-start;
  }

  .title-wrap {
    min-height: 36px;
  }

  .filter-actions {
    gap: 12px;
  }

  .user-table th,
  .user-table td {
    padding: 0 12px;
  }
}

@media (max-width: 1400px) {
  .user-page {
    padding: 12px 16px 16px;
  }

  .content-panel {
    padding: 16px 16px 36px;
  }

  .list-card {
    margin-bottom: 36px;
    padding: 16px 16px 34px;
  }

  .filter-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .field-group {
    flex-wrap: wrap;
  }

  .select-box,
  .input-box {
    width: 220px;
  }

  .user-table th,
  .user-table td {
    padding: 0 10px;
    font-size: 13px;
  }

  .pager-row {
    justify-content: space-between;
  }

  .panel-bottom-spacer {
    height: 56px;
  }
}
</style>
