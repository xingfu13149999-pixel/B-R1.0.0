<template>
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    align-center
    width="740px"
    class="edit-user-dialog"
    modal-class="edit-user-overlay"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-left">
          <img class="header-icon" :src="iconAdd" alt="" />
          <span class="header-title">{{ dialogTitle }}</span>
        </div>
        <img class="close-icon" :src="iconClose" alt="" @click="handleClose" />
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      class="user-form"
    >
      <div class="form-row">
        <el-form-item label="用户名称" prop="username" required class="form-item-half">
          <el-input v-model="formData.username" placeholder="请输入用户名称" clearable />
        </el-form-item>

        <el-form-item label="设备编码" prop="deviceCode" required class="form-item-half">
          <el-input v-model="formData.deviceCode" placeholder="请输入设备编码" clearable />
        </el-form-item>
      </div>

      <div class="form-row">
        <el-form-item label="公司名称" prop="companyName" required class="form-item-half">
          <el-input v-model="formData.companyName" placeholder="请输入公司名称" clearable />
        </el-form-item>

        <el-form-item
          label="用户类型"
          prop="userType"
          required
          class="form-item-half form-item-half--select"
        >
          <el-select v-model="formData.userType" placeholder="请选择用户类型">
            <el-option label="管理员" value="管理员" />
            <el-option label="普通用户" value="普通用户" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="用户状态" class="status-item">
        <div class="status-field">
          <button
            type="button"
            class="status-switch"
            :class="{ 'status-switch--off': formData.status === 'disabled' }"
            :aria-checked="formData.status === 'enabled'"
            role="switch"
            @click="toggleStatus"
          >
            <span class="status-switch__handle" />
          </button>
          <span class="status-text">{{ formData.status === 'enabled' ? '启用' : '停用' }}</span>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="handleClose">取消</el-button>
        <el-button class="save-btn" type="primary" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import iconAdd from '@/assets/images/home/dialog-add-figma.svg'
import iconClose from '@/assets/images/home/dialog-close-figma.svg'

export type UserStatus = 'enabled' | 'disabled'

export interface UserForm {
  username: string
  deviceCode: string
  companyName: string
  status: UserStatus
  userType: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    initialData?: Partial<UserForm> | null
  }>(),
  {
    title: '编辑用户',
    initialData: null
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [data: UserForm]
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const dialogTitle = computed(() => props.title)
const formRef = ref<FormInstance>()

const createEmptyForm = (): UserForm => ({
  username: '',
  deviceCode: '',
  companyName: '',
  status: 'enabled',
  userType: '普通用户'
})

const formData = reactive<UserForm>(createEmptyForm())

const formRules: FormRules<UserForm> = {
  username: [{ required: true, message: '请输入用户名称', trigger: 'blur' }],
  deviceCode: [{ required: true, message: '请输入设备编码', trigger: 'blur' }],
  companyName: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  userType: [{ required: true, message: '请选择用户类型', trigger: 'change' }]
}

function fillForm(data?: Partial<UserForm> | null) {
  const next = { ...createEmptyForm(), ...(data ?? {}) }
  formData.username = next.username
  formData.deviceCode = next.deviceCode
  formData.companyName = next.companyName
  formData.status = next.status ?? 'enabled'
  formData.userType = next.userType || '普通用户'
}

watch(
  () => props.visible,
  visible => {
    if (visible) fillForm(props.initialData)
  }
)

function toggleStatus() {
  formData.status = formData.status === 'enabled' ? 'disabled' : 'enabled'
}

const handleClose = () => {
  formRef.value?.resetFields()
  fillForm(null)
  emit('update:visible', false)
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(valid => {
    if (valid) {
      emit('success', { ...formData })
      ElMessage.success(props.title.includes('编辑') ? '用户编辑成功' : '用户保存成功')
      handleClose()
    }
  })
}
</script>

<style scoped>
.edit-user-dialog {
  position: relative;
}

.edit-user-dialog :deep(.el-dialog) {
  border-radius: 0;
  background: #fff;
  height: 460px;
  box-shadow: 0 3px 10px 0 rgba(36, 31, 164, 0.1);
  margin-bottom: 0;
  padding: 23px 26px 33px;
}

.edit-user-dialog :deep(.el-dialog__header) {
  padding: 24px 20px 20px;
  margin: 0;
}

.edit-user-dialog :deep(.el-dialog__body) {
  padding: 30px 48px 0 !important;
}

.edit-user-dialog :deep(.el-dialog__footer) {
  padding: 22px 88px 30px 48px !important;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 22px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  width: 20px;
  height: 20px;
  display: block;
  flex-shrink: 0;
  object-fit: contain;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #21243d;
  line-height: 22px;
}

.close-icon {
  width: 18.34px;
  height: 18.33px;
  display: block;
  flex-shrink: 0;
  object-fit: contain;
  cursor: pointer;
}

.close-icon:hover {
  opacity: 0.75;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-item-half {
  flex: 1;
  min-width: 0;
}

.user-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.user-form :deep(.el-form-item__label) {
  font-size: 14px;
  color: #21243d;
  font-weight: 400;
  line-height: 22px;
  margin-bottom: 5px;
}

.user-form :deep(.el-form-item__label::before) {
  content: '*';
  color: #ff4646;
  margin-right: 4px;
}

.form-item-half--select :deep(.el-form-item__label::before) {
  content: '*';
  margin-right: 4px;
}

.user-form :deep(.el-input__wrapper) {
  padding: 5px 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  box-shadow: none;
}

.user-form :deep(.el-input__inner) {
  font-size: 14px;
  color: #303030;
}

.user-form :deep(.el-input__inner::placeholder) {
  color: #bfbfbf;
  font-size: 14px;
}

.user-form :deep(.el-select__wrapper) {
  padding: 5px 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  box-shadow: none;
  justify-content: center;
  align-items: center;
  gap: 0;
  height: 30px;
  box-sizing: content-box;
}

.user-form :deep(.el-select__selection) {
  min-height: 22px;
}

.user-form :deep(.el-select__placeholder) {
  font-size: 14px;
  color: #bfbfbf;
}

.user-form :deep(.el-select__selected-item) {
  font-size: 14px;
  color: #21243d;
  line-height: 22px;
}

.status-item {
  margin-top: 2px;
}

.status-item :deep(.el-form-item__label::before) {
  content: '';
  margin-right: 0;
}

.status-field {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
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

.status-text {
  color: #21243d;
  font-size: 14px;
  line-height: 22px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
}

.cancel-btn,
.save-btn {
  min-width: 80px;
  height: 36px;
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
}

.cancel-btn {
  background: #fff;
  border: 1px solid #d9d9d9;
  color: #303030;
}

.cancel-btn:hover {
  border-color: #2036ca;
  color: #2036ca;
}

.save-btn {
  background: #2036ca;
  border: none;
  color: #fff;
}

.save-btn:hover {
  background: #1a2ba8;
}

:global(.edit-user-overlay) {
  background: rgba(0, 0, 0, 0.26);
}
</style>
