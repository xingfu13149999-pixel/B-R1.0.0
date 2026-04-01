<template>
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    width="740px"
    top="266px"
    class="add-customer-dialog"
    modal-class="add-customer-overlay"
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
      class="customer-form"
    >
      <el-form-item label="客户名称" prop="name" required>
        <el-input v-model="formData.name" placeholder="请输入公司名称" clearable />
      </el-form-item>

      <div class="form-row">
        <el-form-item label="统一社会信用代码" prop="creditCode" required class="form-item-half">
          <el-input v-model="formData.creditCode" placeholder="请输入统一社会信用代码" clearable />
        </el-form-item>

        <el-form-item label="客户编码" prop="customerCode" required class="form-item-half">
          <el-input v-model="formData.customerCode" placeholder="请输入客户编码" clearable />
        </el-form-item>
      </div>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          placeholder="请输入客户备注"
          type="textarea"
          :rows="3"
          clearable
        />
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
import { ref, reactive, computed, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import iconAdd from '@/assets/images/home/dialog-add-figma.svg'
import iconClose from '@/assets/images/home/dialog-close-figma.svg'

interface CustomerForm {
  name: string
  creditCode: string
  customerCode: string
  remark: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    initialData?: Partial<CustomerForm> | null
  }>(),
  {
    title: '新增客户',
    initialData: null
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [data: CustomerForm]
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})
const dialogTitle = computed(() => props.title)
const formRef = ref<FormInstance>()

const createEmptyForm = (): CustomerForm => ({
  name: '',
  creditCode: '',
  customerCode: '',
  remark: ''
})
const formData = reactive<CustomerForm>(createEmptyForm())

const formRules: FormRules<CustomerForm> = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  creditCode: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }],
  customerCode: [{ required: true, message: '请输入客户编码', trigger: 'blur' }]
}

function fillForm(data?: Partial<CustomerForm> | null) {
  const next = { ...createEmptyForm(), ...(data ?? {}) }
  formData.name = next.name
  formData.creditCode = next.creditCode
  formData.customerCode = next.customerCode
  formData.remark = next.remark
}

watch(
  () => props.visible,
  visible => {
    if (visible) fillForm(props.initialData)
  }
)

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
      ElMessage.success('客户添加成功')
      handleClose()
    }
  })
}
</script>

<style scoped>
.add-customer-dialog {
  position: relative;
}

.add-customer-dialog :deep(.el-dialog) {
  border-radius: 0;
  background: #fff;
  height: 460px;
  box-shadow: 0 3px 10px 0 rgba(36, 31, 164, 0.1);
  margin-bottom: 0;
  padding: 23px 26px 33px;
}

.add-customer-dialog :deep(.el-dialog__header) {
  padding: 24px 20px 20px;
  margin: 0;
}

.add-customer-dialog :deep(.el-dialog__body) {
  padding: 30px 48px 0 !important;
}

.add-customer-dialog :deep(.el-dialog__footer) {
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

.customer-form {
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

.customer-form :deep(.el-form-item__label) {
  font-size: 14px;
  color: #21243d;
  font-weight: 400;
  line-height: 22px;
  margin-bottom: 5px;
}

.customer-form :deep(.el-form-item__label::before) {
  content: '*';
  color: #ff4646;
  margin-right: 4px;
}

.customer-form :deep(.el-form-item:last-child .el-form-item__label::before) {
  content: '';
  margin-right: 0;
}

.customer-form :deep(.el-input__wrapper) {
  padding: 5px 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  box-shadow: none;
}

.customer-form :deep(.el-input__inner) {
  font-size: 14px;
  color: #303030;
}

.customer-form :deep(.el-input__inner::placeholder) {
  color: #bfbfbf;
  font-size: 14px;
}

.customer-form :deep(.el-textarea__inner) {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
  color: #303030;
}

.customer-form :deep(.el-textarea__inner::placeholder) {
  color: #bfbfbf;
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

:global(.add-customer-overlay) {
  background: rgba(0, 0, 0, 0.26);
}
</style>
