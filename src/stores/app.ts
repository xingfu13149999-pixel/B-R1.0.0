/**
 * 全局 Pinia 仓库：深色模式、当前用户名、客户类型（集团/单一）、侧栏选中客户等。
 * 供顶栏、侧栏与各业务页注入使用。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 刷新后仍能恢复侧栏/访谈页当前项目，与访谈 localStorage 使用同一套 trim 后的 id */
const SELECTED_CUSTOMER_STORAGE_KEY = 'pd-admin-selected-customer-id'

function loadSelectedCustomerId(): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const v = localStorage.getItem(SELECTED_CUSTOMER_STORAGE_KEY)
    if (v == null || v === '') return null
    const t = v.trim()
    return t || null
  } catch {
    return null
  }
}

export const useAppStore = defineStore('app', () => {
  const darkMode = ref(false)
  const currentUser = ref({ name: '李光西' })
  const customerType = ref<'group' | 'single'>('group')
  const selectedCustomerId = ref<string | null>(loadSelectedCustomerId())

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  function setCustomerType(type: 'group' | 'single') {
    customerType.value = type
  }

  function setSelectedCustomer(id: string | null) {
    const next = id?.trim() || null
    selectedCustomerId.value = next
    try {
      if (typeof localStorage === 'undefined') return
      if (next) localStorage.setItem(SELECTED_CUSTOMER_STORAGE_KEY, next)
      else localStorage.removeItem(SELECTED_CUSTOMER_STORAGE_KEY)
    } catch {
      /* ignore quota */
    }
  }

  return {
    darkMode,
    currentUser,
    customerType,
    selectedCustomerId,
    toggleDarkMode,
    setCustomerType,
    setSelectedCustomer
  }
})
