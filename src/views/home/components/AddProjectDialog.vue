<template>
  <el-dialog v-model="dialogVisible" :show-close="false" width="740px" class="add-project-dialog">
    <template #header>
      <div class="dialog-header">
        <div class="header-left">
          <img class="header-icon" :src="iconAdd" alt="" />
          <span class="header-title">新增项目</span>
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

        <el-form-item label="业务类型" prop="businessType" required class="form-item-half">
          <el-select
            v-model="formData.businessType"
            placeholder="请选择业务类型"
            class="business-select"
          >
            <el-option label="常规类授信业务" value="常规类授信业务" />
            <el-option label="特别类授信业务" value="特别类授信业务" />
            <el-option label="其他类授信业务" value="其他类授信业务" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="授信总额" prop="creditTotal" required>
        <el-input v-model="formData.creditTotal" placeholder="请输入授信总额" clearable>
          <template #suffix>
            <span class="input-suffix">万元</span>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="敞口额度" prop="exposureLimit" required>
        <el-input v-model="formData.exposureLimit" placeholder="请输入敞口额度" clearable>
          <template #suffix>
            <span class="input-suffix">万元</span>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="缓释总额" prop="reliefTotal" required>
        <el-input v-model="formData.reliefTotal" placeholder="请输入缓释总额" clearable>
          <template #suffix>
            <span class="input-suffix">万元</span>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="授信期限" prop="creditTerm" required>
        <el-input v-model="formData.creditTerm" placeholder="请输入授信期限" clearable>
          <template #suffix>
            <span class="input-suffix">个月</span>
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="handleClose">取消</el-button>
        <el-button class="confirm-btn" type="primary" @click="handleConfirm">新增</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import iconAdd from '@/assets/images/home/dialog-add.svg'
import iconClose from '@/assets/images/home/dialog-close.svg'

interface ProjectForm {
  name: string
  businessType: string
  creditTotal: string
  exposureLimit: string
  reliefTotal: string
  creditTerm: string
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [data: ProjectForm]
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const formRef = ref<FormInstance>()

const formData = reactive<ProjectForm>({
  name: '',
  businessType: '',
  creditTotal: '',
  exposureLimit: '',
  reliefTotal: '',
  creditTerm: ''
})

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
  emit('update:visible', false)
}

const handleConfirm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(valid => {
    if (valid) {
      emit('success', { ...formData })
      ElMessage.success('项目添加成功')
      handleClose()
    }
  })
}
</script>

<style scoped>
.add-project-dialog :deep(.el-dialog) {
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 3px 10px rgba(24, 31, 103, 0.1);
  overflow: hidden;
}

.add-project-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
}

.add-project-dialog :deep(.el-dialog__body) {
  padding: 0 !important;
}

.add-project-dialog :deep(.el-dialog__footer) {
  padding: 0 !important;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: #2d3149;
  letter-spacing: 0;
}

.close-icon {
  width: 18px;
  height: 18px;
  cursor: pointer;
  object-fit: contain;
  opacity: 0.6;
}

.close-icon:hover {
  opacity: 1;
}

.project-form {
  display: flex;
  flex-direction: column;
  padding: 24px 28px;
  gap: 0;
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
  margin-bottom: 20px;
}

.project-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.project-form :deep(.el-form-item__label) {
  font-size: 14px;
  color: #2d3149;
  font-weight: 400;
  line-height: 22px;
  margin-bottom: 8px;
  padding: 0;
}

.project-form :deep(.el-form-item__label::before) {
  content: '';
  margin-right: 0;
}

.project-form :deep(.el-input__wrapper) {
  padding: 10px 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  box-shadow: none;
  background: #fff;
}

.project-form :deep(.el-input__inner) {
  font-size: 14px;
  color: #303030;
  height: 22px;
  line-height: 22px;
}

.project-form :deep(.el-input__inner::placeholder) {
  color: #bfbfbf;
  font-size: 14px;
}

.project-form :deep(.el-select__wrapper) {
  padding: 10px 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  box-shadow: none;
  background: #fff;
  min-height: 44px;
}

.project-form :deep(.el-select__placeholder) {
  font-size: 14px;
  color: #bfbfbf;
}

.input-suffix {
  font-size: 14px;
  color: #8c8c8c;
  margin-left: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 20px 28px;
  border-top: 1px solid #e9ecef;
  background: #fafafa;
}

.cancel-btn,
.confirm-btn {
  min-width: 80px;
  height: 36px;
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
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
</style>
