import { ref } from 'vue'
import { createInitialCustomerList, type CustomerTreeItem } from '@/views/home/mock/customerTree'

/**
 * 与 AdminLayout 侧栏共用同一份客户/项目树。
 * 全屏访谈等路由在 AdminLayout 之外，必须使用本 ref，勿单独调用 createInitialCustomerList()，
 * 否则新建项目等节点仅存在于侧栏内存树，校验会失败并错误跳回首页。
 */
export const liveCustomerTreeItems = ref<CustomerTreeItem[]>(createInitialCustomerList())
