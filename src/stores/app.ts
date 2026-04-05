/**
 * 全局 Pinia 仓库：深色模式、当前用户名、客户类型（集团/单一）、侧栏选中客户等。
 * 供顶栏、侧栏与各业务页注入使用。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const darkMode = ref(false)
  const currentUser = ref({ name: '李光西' })
  const customerType = ref<'group' | 'single'>('group')
  const selectedCustomerId = ref<string | null>(null)

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  function setCustomerType(type: 'group' | 'single') {
    customerType.value = type
  }

  function setSelectedCustomer(id: string | null) {
    selectedCustomerId.value = id
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
