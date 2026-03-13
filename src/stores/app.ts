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
    setSelectedCustomer,
  }
})
