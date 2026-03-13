<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="welcome">欢迎登录</h1>
      <el-form class="login-form" label-position="top">
        <el-form-item label="用户密码">
          <el-select v-model="form.authType" placeholder="接口认证" class="full-width">
            <el-option label="密码认证" value="password" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn full-width" @click="onLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = reactive({
  authType: 'password',
  account: '',
  password: '',
})

function onLogin() {
  router.push('/')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.welcome {
  margin: 0 0 24px;
  font-size: 24px;
  color: #262626;
  text-align: center;
}

.login-form {
  margin-top: 16px;
}

.full-width {
  width: 100%;
}

.login-btn {
  width: 100%;
  margin-top: 16px;
}
</style>
