<template>
  <el-dialog v-model="dialogVisible" :show-close="false" width="740px" class="add-customer-dialog">
    <template #header>
      <div class="dialog-header">
        <span class="header-title">新增客户</span>
      </div>
    </template>

    <button class="dialog-close-btn" @click="handleClose" />

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
import { ref, reactive, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

interface CustomerForm {
  name: string
  creditCode: string
  customerCode: string
  remark: string
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [data: CustomerForm]
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})
const formRef = ref<FormInstance>()

const formData = reactive<CustomerForm>({
  name: '',
  creditCode: '',
  customerCode: '',
  remark: ''
})

const formRules: FormRules<CustomerForm> = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  creditCode: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }],
  customerCode: [{ required: true, message: '请输入客户编码', trigger: 'blur' }]
}

const handleClose = () => {
  formRef.value?.resetFields()
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
  padding-left: 120px !important;
  padding-right: 120px !important;
  padding-bottom: 120px !important;
}

.add-customer-dialog :deep(.el-dialog__headerbtn) {
  display: none;
}

.add-customer-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
  border-bottom: 1px solid #e9ecef;
}

.add-customer-dialog :deep(.el-dialog__body) {
  padding: 110px 100px 30px !important;
}

.add-customer-dialog :deep(.el-dialog__footer) {
  padding: 0 !important;
}

.dialog-header {
  padding: 24px 20px;
  min-height: 70px;
  box-sizing: border-box;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: #21243d;
  text-align: center;
  display: block;
}

.dialog-close-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ff4646;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.dialog-close-btn::before,
.dialog-close-btn::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 2px;
  background: #fff;
  border-radius: 1px;
}

.dialog-close-btn::before {
  transform: rotate(45deg);
}

.dialog-close-btn::after {
  transform: rotate(-45deg);
}

.dialog-close-btn:hover {
  background: #ff6b6b;
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
  padding: 8px 12px;
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
</style>
