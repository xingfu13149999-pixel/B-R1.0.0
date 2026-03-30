<template>
  <div class="login-page">
    <div class="login-bg" aria-hidden="true">
      <div class="login-bg-fill" />
      <div class="login-bg-masked" :style="maskedBgStyle">
        <img :src="loginBg" alt="" class="login-bg-img" />
      </div>
    </div>

    <header class="login-brand">
      <img :src="loginLogo" alt="语纪 Phono Memo" class="login-brand-logo" />
      <img :src="loginDividerUrl" alt="" class="login-brand-divider" />
      <p class="login-brand-slogan">语之所及&nbsp;&nbsp;纪之成册</p>
    </header>

    <main class="login-card-wrap">
      <div class="login-card">
        <h1 class="login-title">欢迎登录</h1>
        <p class="login-field-label">用户密码</p>
        <el-form class="login-form">
          <el-form-item class="login-form-item">
            <el-select
              v-model="form.authType"
              placeholder="接口认证"
              class="login-select full-width"
            >
              <template #suffix>
                <img :src="loginChevronUrl" alt="" class="login-select-chevron" />
              </template>
              <el-option label="密码认证" value="password" />
              <el-option label="指纹认证" value="fingerprint" />
              <el-option label="接口认证" value="api" />
            </el-select>
          </el-form-item>
          <el-form-item class="login-form-item">
            <el-input v-model="form.account" placeholder="请输入账号" />
          </el-form-item>
          <el-form-item class="login-form-item">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
            />
          </el-form-item>
          <el-form-item class="login-form-item login-form-item--btn">
            <el-button type="primary" class="login-btn" @click="onLogin">登录</el-button>
          </el-form-item>
        </el-form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import loginBg from '@/assets/images/login/login-bg.jpg'
import loginLogo from '@/assets/images/login/login-logo.png'
import loginMaskUrl from '@/assets/images/login/login-mask.svg?url'
import loginChevronUrl from '@/assets/images/login/login-chevron.svg?url'
import loginDividerUrl from '@/assets/images/login/login-divider.svg?url'

const router = useRouter()

const maskedBgStyle = {
  maskImage: `url(${loginMaskUrl})`,
  WebkitMaskImage: `url(${loginMaskUrl})`,
  maskSize: 'cover',
  maskPosition: 'center',
  maskRepeat: 'no-repeat'
} as const

const form = reactive({
  authType: 'password',
  account: '',
  password: ''
})

function onLogin() {
  router.push('/')
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #f1f0f7;
}

.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login-bg-fill {
  position: absolute;
  inset: 0;
  background: #fff;
}

.login-bg-masked {
  position: absolute;
  inset: 0;
  opacity: 0.9;
}

.login-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.login-brand {
  position: absolute;
  z-index: 2;
  left: clamp(24px, 3.4vw, 65px);
  top: clamp(40px, 3.2vw, 61px);
  display: flex;
  align-items: center;
  gap: 24px;
}

.login-brand-logo {
  width: 195px;
  height: 78px;
  object-fit: contain;
  flex-shrink: 0;
}

.login-brand-divider {
  width: 1px;
  height: 58px;
  flex-shrink: 0;
  display: block;
}

.login-brand-slogan {
  margin: 0;
  font-size: clamp(22px, 2.1vw, 40px);
  font-weight: 500;
  color: #21243d;
  letter-spacing: 0.8px;
  line-height: 1.2;
}

.login-card-wrap {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 100px clamp(24px, 6.25vw, 120px) 48px;
  box-sizing: border-box;
}

.login-card {
  width: 620px;
  max-width: min(620px, calc(100vw - 48px));
  box-sizing: border-box;
  padding: 48px 80px 56px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 2px 40px 1px #e5eef4;
}

.login-title {
  margin: 0;
  text-align: center;
  font-size: 42px;
  font-weight: 700;
  color: #21243d;
  letter-spacing: 2.1px;
  line-height: 1.2;
}

.login-field-label {
  margin: 28px 0 16px;
  font-size: 22px;
  color: #21243d;
  line-height: 1.2;
}

.login-form {
  margin: 0;
}

.login-form-item {
  margin-bottom: 32px;
}

.login-form-item--btn {
  margin-bottom: 0;
  margin-top: 8px;
}

.full-width {
  width: 100%;
}

.login-form :deep(.el-form-item__content) {
  line-height: normal;
}

.login-form :deep(.el-input__wrapper),
.login-form :deep(.el-select__wrapper) {
  min-height: 60px;
  padding: 0 20px;
  background-color: #f3f4f8;
  border: none;
  border-radius: 6px;
  box-shadow: none;
}

.login-form :deep(.el-input__wrapper:hover),
.login-form :deep(.el-select__wrapper:hover) {
  box-shadow: none;
}

.login-form :deep(.el-input__wrapper.is-focus),
.login-form :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px #2036ca inset;
}

.login-form :deep(.el-input__inner) {
  height: 60px;
  font-size: 18px;
  color: #21243d;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #bfbfbf;
}

.login-form :deep(.el-select__placeholder) {
  font-size: 18px;
  color: #bfbfbf;
}

.login-form :deep(.el-select__selected-item) {
  font-size: 18px;
  color: #21243d;
}

.login-form :deep(.el-select .el-input__wrapper) {
  min-height: 60px;
}

.login-form :deep(.el-select__caret) {
  display: none;
}

.login-select-chevron {
  display: block;
  width: 17px;
  height: 10px;
  object-fit: contain;
}

.login-btn {
  width: 100%;
  height: 60px;
  margin: 0;
  padding: 0;
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 1.2px;
  color: #fff;
  background: #2036ca;
  border: none;
  border-radius: 6px;
  opacity: 0.9;
}

.login-btn:hover,
.login-btn:focus {
  color: #fff;
  background: #1a2db3;
  opacity: 1;
}

@media (max-width: 900px) {
  .login-card-wrap {
    justify-content: center;
    padding-top: 160px;
  }

  .login-brand {
    right: 24px;
    flex-wrap: wrap;
    max-width: calc(100vw - 48px);
  }

  .login-brand-slogan {
    width: 100%;
    margin-left: 0;
    white-space: normal;
  }
}
</style>
