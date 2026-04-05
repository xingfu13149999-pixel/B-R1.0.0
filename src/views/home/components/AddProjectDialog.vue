<!--
  新增/编辑项目弹窗（由 AdminLayout 侧栏「添加项目」等触发）：表单字段与校验，成功后回写侧栏树。
-->
<template>
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    width="740px"
    top="266px"
    class="add-project-dialog"
    modal-class="add-project-overlay"
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
      class="project-form"
    >
      <div class="form-row">
        <el-form-item label="项目名称" prop="name" required class="form-item-half">
          <el-input v-model="formData.name" placeholder="请输入项目名称" clearable />
        </el-form-item>

        <el-form-item label="申报方式" prop="businessType" class="form-item-half form-item-half--select">
          <el-select
            v-model="formData.businessType"
            placeholder="请选择申报方式"
            class="business-select"
          >
            <el-option label="常规类授信业务" value="常规类授信业务" />
            <el-option label="特别类授信业务" value="特别类授信业务" />
            <el-option label="其他类授信业务" value="其他类授信业务" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="授信总额" prop="creditTotal" required>
        <el-input v-model="formData.creditTotal" placeholder="请输入授信总额" clearable />
      </el-form-item>

      <el-form-item label="敞口额度" prop="exposureLimit" required>
        <el-input v-model="formData.exposureLimit" placeholder="请输入敞口额度" clearable />
      </el-form-item>

      <el-form-item label="缓释总额" prop="reliefTotal" required>
        <el-input v-model="formData.reliefTotal" placeholder="请输入缓释总额" clearable />
      </el-form-item>

      <el-form-item label="授信期限" prop="creditTerm" required>
        <el-input v-model="formData.creditTerm" placeholder="请输入授信期限" clearable />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="handleClose">取消</el-button>
        <el-button class="confirm-btn" type="primary" @click="handleConfirm">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import iconAdd from '@/assets/images/home/dialog-add-figma.svg'
import iconClose from '@/assets/images/home/dialog-close-figma.svg'

export interface ProjectForm {
  name: string
  businessType: string
  creditTotal: string
  exposureLimit: string
  reliefTotal: string
  creditTerm: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    initialData?: Partial<ProjectForm> | null
  }>(),
  {
    title: '新增项目',
    initialData: null
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [data: ProjectForm]
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const dialogTitle = computed(() => props.title)

const formRef = ref<FormInstance>()

const createEmptyForm = (): ProjectForm => ({
  name: '',
  businessType: '常规类授信业务',
  creditTotal: '',
  exposureLimit: '',
  reliefTotal: '',
  creditTerm: ''
})

const formData = reactive<ProjectForm>(createEmptyForm())

function fillForm(data?: Partial<ProjectForm> | null) {
  const next = { ...createEmptyForm(), ...(data ?? {}) }
  formData.name = next.name
  formData.businessType = next.businessType || '常规类授信业务'
  formData.creditTotal = next.creditTotal
  formData.exposureLimit = next.exposureLimit
  formData.reliefTotal = next.reliefTotal
  formData.creditTerm = next.creditTerm
}

watch(
  () => props.visible,
  visible => {
    if (visible) fillForm(props.initialData)
  }
)

const formRules: FormRules<ProjectForm> = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
  creditTotal: [{ required: true, message: '请输入授信总额', trigger: 'blur' }],
  exposureLimit: [{ required: true, message: '请输入敞口额度', trigger: 'blur' }],
  reliefTotal: [{ required: true, message: '请输入缓释总额', trigger: 'blur' }],
  creditTerm: [{ required: true, message: '请输入授信期限', trigger: 'blur' }]
}

const handleClose = () => {
  formRef.value?.resetFields()
  fillForm(null)
  emit('update:visible', false)
}

const handleConfirm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(valid => {
    if (valid) {
      emit('success', { ...formData })
      ElMessage.success(props.title.includes('编辑') ? '项目编辑成功' : '项目添加成功')
      handleClose()
    }
  })
}
</script>

<style scoped>
.add-project-dialog :deep(.el-dialog) {
  border-radius: 0;
  background: #fff;
  height: 460px;
  box-shadow: 0 3px 10px 0 rgba(36, 31, 164, 0.1);
  margin-bottom: 0;
  padding: 23px 26px 33px;
}

.add-project-dialog :deep(.el-dialog__header) {
  padding: 24px 20px 20px;
  margin: 0;
}

.add-project-dialog :deep(.el-dialog__body) {
  padding: 30px 48px 0 !important;
}

.add-project-dialog :deep(.el-dialog__footer) {
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
  cursor: pointer;
  object-fit: contain;
}

.close-icon:hover {
  opacity: 0.75;
}

.project-form {
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

.project-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.project-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.form-item-half--select :deep(.el-form-item__label::before) {
  content: '';
  margin-right: 0;
}

.project-form :deep(.el-form-item__label) {
  font-size: 14px;
  color: #21243d;
  font-weight: 400;
  line-height: 22px;
  margin-bottom: 5px;
}

.project-form :deep(.el-form-item__label::before) {
  content: '*';
  color: #ff4646;
  margin-right: 4px;
}

.project-form :deep(.el-input__wrapper) {
  padding: 5px 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  box-shadow: none;
}

.project-form :deep(.el-input__inner) {
  font-size: 14px;
  color: #303030;
}

.project-form :deep(.el-input__inner::placeholder) {
  color: #bfbfbf;
  font-size: 14px;
}

.project-form :deep(.el-select__wrapper) {
  padding: 5px 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  box-shadow: none;
}

.project-form :deep(.el-select__selection) {
  min-height: 22px;
}

.project-form :deep(.el-select__placeholder) {
  font-size: 14px;
  color: #bfbfbf;
}

.project-form :deep(.el-select__selected-item) {
  font-size: 14px;
  color: #21243d;
  line-height: 22px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
}

.cancel-btn,
.confirm-btn {
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

.confirm-btn {
  background: #2036ca;
  border: none;
  color: #fff;
}

.confirm-btn:hover {
  background: #1a2ba8;
}

::global(.add-project-overlay) {
  background: rgba(0, 0, 0, 0.26);
}
</style>
