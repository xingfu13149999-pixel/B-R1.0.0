<!--
  顶栏：Logo、标语、AI 助手入口、设备/主题/用户菜单；事件向 AdminLayout 上抛。
-->
<template>
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
        @click="emit('open-ai-panel')"
      >
        <img class="header-ai-icon" :src="aiPanelOpen ? headerIconAiActive : headerIconAi" alt="" />
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
        @visible-change="handleUserDropdownVisible"
      >
        <span
          class="header-user-trigger"
          :class="{ 'header-user-trigger--active': userDropdownVisible }"
        >
          Hi，{{ currentUserName }}
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
            <el-dropdown-item @click="emit('logout')">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <img class="header-divider header-divider-right" :src="headerDivider" alt="" />
      <button
        type="button"
        class="header-theme-btn"
        :class="{ 'header-theme-btn--selected': darkMode }"
        aria-label="主题切换"
        @click="emit('toggle-dark-mode')"
      >
        <img class="header-theme-icon-default" :src="headerIconTheme" alt="" />
        <img class="header-theme-icon-selected" :src="headerIconThemeSelected" alt="" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

defineProps<{
  aiPanelOpen: boolean
  currentUserName: string
  darkMode: boolean
}>()

const emit = defineEmits<{
  'open-ai-panel': []
  logout: []
  'toggle-dark-mode': []
}>()

const userDropdownVisible = ref(false)

function handleUserDropdownVisible(visible: boolean) {
  userDropdownVisible.value = visible
}
</script>

<style scoped>
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

.header-theme-btn:hover:not(.header-theme-btn--selected) {
  background: #2036ca;
}

.header-theme-btn:hover:not(.header-theme-btn--selected) .header-theme-icon-default {
  display: none;
}

.header-theme-btn:hover:not(.header-theme-btn--selected) .header-theme-icon-selected {
  display: block;
}

.header-theme-btn--selected {
  background: #2036ca;
}

.header-theme-btn--selected .header-theme-icon-default {
  display: none;
}

.header-theme-btn--selected .header-theme-icon-selected {
  display: block;
}

.header-theme-btn--selected:hover {
  background: #1a2da8;
}
</style>
