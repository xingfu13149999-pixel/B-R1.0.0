/**
 * 客户/项目侧栏树：类型定义、初始 mock 数据、列表筛选与树节点查找等工具函数。
 * 供 AdminLayout、侧栏组件与弹窗增删改后同步树数据。
 */
export interface CustomerForm {
  name: string
  creditCode: string
  customerCode: string
  remark: string
}

export interface ProjectDetailFields {
  businessType: string
  creditTotal: string
  exposureLimit: string
  reliefTotal: string
  creditTerm: string
}

export interface CustomerTreeItem extends CustomerForm {
  id: string
  name: string
  count?: string
  parentId?: string
  projectDetail?: ProjectDetailFields
  children?: CustomerTreeItem[]
}

export type CustomerNodeType = 'parent' | 'child'

export interface SidebarContextMenuTarget {
  id: string
  name: string
  type: CustomerNodeType
}

export interface SidebarContextMenuState {
  visible: boolean
  x: number
  y: number
  targetItem: SidebarContextMenuTarget | null
}

export function createInitialCustomerList(): CustomerTreeItem[] {
  return [
    {
      id: '1',
      name: '四川晨光博达新材...',
      count: '新',
      creditCode: '',
      customerCode: '',
      remark: ''
    },
    {
      id: '2',
      name: '成都盟升电子技术...',
      count: '1/1',
      creditCode: '',
      customerCode: '',
      remark: '',
      children: [
        {
          id: '2-1',
          name: '成都盟升电子技术科',
          parentId: '2',
          creditCode: '',
          customerCode: '',
          remark: ''
        },
        {
          id: '2-3',
          name: '6000万元授信尽职调查',
          parentId: '2',
          creditCode: '',
          customerCode: '',
          remark: '',
          projectDetail: {
            businessType: '常规类授信业务',
            creditTotal: '6000万',
            exposureLimit: '4000万',
            reliefTotal: '2000万',
            creditTerm: '两年'
          }
        }
      ]
    },
    {
      id: '3',
      name: '杭州宇树科技股份...',
      count: '4/6',
      creditCode: '',
      customerCode: '',
      remark: ''
    },
    {
      id: '4',
      name: '惠州市赢合智能...',
      count: '0/5',
      creditCode: '',
      customerCode: '',
      remark: ''
    },
    {
      id: '5',
      name: '惠州市知合行...',
      count: '0/3',
      creditCode: '',
      customerCode: '',
      remark: ''
    },
    {
      id: '6',
      name: '杭州宇树科技股份...',
      count: '4/6',
      creditCode: '',
      customerCode: '',
      remark: ''
    }
  ]
}

export function filterCustomerList(items: CustomerTreeItem[], keyword: string): CustomerTreeItem[] {
  if (!keyword.trim()) return items

  const normalizedKeyword = keyword.toLowerCase()

  return items
    .map(item => {
      const nameMatch = item.name.toLowerCase().includes(normalizedKeyword)
      const childMatch = item.children?.some(child =>
        child.name.toLowerCase().includes(normalizedKeyword)
      )

      if (nameMatch || childMatch) {
        if (item.children && childMatch) {
          const filteredChildren = item.children.filter(child =>
            child.name.toLowerCase().includes(normalizedKeyword)
          )

          return { ...item, children: filteredChildren }
        }

        return item
      }

      return null
    })
    .filter((item): item is CustomerTreeItem => item !== null)
}

export function countBadgeClass(count?: string): string {
  const value = count ?? ''

  if (value === '新' || /^\d+\.\d+$/.test(value)) return 'badge-new'

  if (/^\d+\/\d+$/.test(value)) {
    const current = parseInt(value.split('/')[0] ?? '0', 10)
    return current > 0 ? 'badge-orange' : 'badge-gray'
  }

  return 'badge-orange'
}

export function findCustomerById(items: CustomerTreeItem[], id: string): CustomerTreeItem | null {
  for (const item of items) {
    if (item.id === id) return item

    if (item.children) {
      const child = findCustomerById(item.children, id)
      if (child) return child
    }
  }

  return null
}

/**
 * findCustomerById 遍历时只读 id / children，不读 projectDetail。
 * 仅原地更新弹窗字段时，依赖「先 find 再展示」的 computed 可能不刷新；在取到节点后调用本函数，显式订阅 name、projectDetail。
 */
export function trackProjectNodeForDisplay(node: CustomerTreeItem | null): void {
  if (!node) return
  void node.name
  void node.projectDetail
}

export function isProjectRouteTarget(items: CustomerTreeItem[], id: string): boolean {
  for (const parent of items) {
    if (!parent.children?.length) continue

    const index = parent.children.findIndex(child => child.id === id)
    if (index > 0) return true
  }

  return false
}

export function findParentCustomerId(items: CustomerTreeItem[], childId: string): string | null {
  for (const item of items) {
    if (item.children?.some(child => child.id === childId)) return item.id
  }

  return null
}

export function containsCustomerId(item: CustomerTreeItem, id: string): boolean {
  if (!id) return false
  if (item.id === id) return true
  return item.children?.some(child => containsCustomerId(child, id)) ?? false
}

export function findFirstSelectableCustomer(items: CustomerTreeItem[]): CustomerTreeItem | null {
  for (const item of items) {
    if (item.children?.length) return item.children[0] ?? null
    return item
  }

  return null
}

export function deleteCustomerById(
  items: CustomerTreeItem[],
  id: string
): { deleted: boolean; clearedExpandedId?: string } {
  const index = items.findIndex(item => item.id === id)

  if (index !== -1) {
    items.splice(index, 1)
    return { deleted: true, clearedExpandedId: id }
  }

  for (const item of items) {
    if (!item.children?.length) continue

    const childIndex = item.children.findIndex(child => child.id === id)

    if (childIndex !== -1) {
      item.children.splice(childIndex, 1)

      if (item.children.length === 0) {
        delete item.children
        return { deleted: true, clearedExpandedId: item.id }
      }

      return { deleted: true }
    }

    const nestedResult = deleteCustomerById(item.children, id)
    if (nestedResult.deleted) return nestedResult
  }

  return { deleted: false }
}
