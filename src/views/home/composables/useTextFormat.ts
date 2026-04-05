/**
 * 富文本格式化 composable：contenteditable 选区状态查询与 document.execCommand 封装。
 * 供授信报告 CreditReportFormatToolbar 等使用。
 */

export type FormatCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'justifyFull'
  | 'outdent'
  | 'indent'

export interface FormatState {
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrike: boolean
  isBulletList: boolean
  isNumberList: boolean
  fontSize: string | null
  fontFamily: string | null
  foreColor: string | null
  backColor: string | null
  blockType: string | null
}

let savedRange: Range | null = null

/**
 * 捕获当前选区
 */
export function captureSelection(): boolean {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    savedRange = sel.getRangeAt(0).cloneRange()
    return true
  }
  return false
}

/**
 * 恢复选区
 */
export function restoreSelection(): boolean {
  if (!savedRange) return false
  const sel = window.getSelection()
  if (!sel) return false
  sel.removeAllRanges()
  try {
    sel.addRange(savedRange)
    return true
  } catch {
    savedRange = null
    return false
  }
}

/**
 * 执行格式化命令
 */
export function runFormatCommand(cmd: string, value?: string): boolean {
  try {
    if (cmd === 'fontName' || cmd === 'formatBlock') {
      document.execCommand(cmd, false, value)
    } else {
      document.execCommand('styleWithCSS', false, 'true')
      document.execCommand(cmd, false, value)
    }
    return true
  } catch {
    return false
  }
}

/**
 * 查询格式化状态
 */
export function queryFormatState(cmd: string): boolean {
  try {
    return document.queryCommandState(cmd)
  } catch {
    return false
  }
}

/**
 * 获取当前选区的格式状态
 */
export function getFormatState(): FormatState {
  return {
    isBold: queryFormatState('bold'),
    isItalic: queryFormatState('italic'),
    isUnderline: queryFormatState('underline'),
    isStrike: queryFormatState('strikeThrough'),
    isBulletList: queryFormatState('insertUnorderedList'),
    isNumberList: queryFormatState('insertOrderedList'),
    fontSize: getCurrentFontSize(),
    fontFamily: getCurrentFontFamily(),
    foreColor: getCurrentForeColor(),
    backColor: getCurrentBackColor(),
    blockType: getCurrentBlockType()
  }
}

/**
 * 获取当前字号
 */
export function getCurrentFontSize(): string | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)

  // 先检查是否有内联 font-size 样式（最准确）
  const container = range.commonAncestorContainer
  const el = container.nodeType === Node.TEXT_NODE
    ? container.parentElement
    : container as HTMLElement

  if (el) {
    // 检查直接元素的内联样式
    const inlineSize = el.style.fontSize
    if (inlineSize) return inlineSize

    // 向上查找有 font-size 的祖先元素
    let parent = el.parentElement
    while (parent) {
      const style = parent.style.fontSize
      if (style) return style
      // 检查是否有 font 标签（旧的 deprecated 方式）
      if (parent.tagName === 'FONT' && parent.getAttribute('size')) {
        const size = parseInt(parent.getAttribute('size') || '3')
        // font 标签的 size: 1=10px, 2=12px, 3=16px, 4=18px, 5=24px, 6=32px, 7=48px
        const sizeMap: Record<number, string> = { 1: '10px', 2: '12px', 3: '16px', 4: '18px', 5: '24px', 6: '32px', 7: '48px' }
        return sizeMap[size] || `${size}px`
      }
      parent = parent.parentElement
    }

    // 最后用计算样式
    const computed = window.getComputedStyle(el).fontSize
    if (computed) return computed
  }

  return null
}

/**
 * 获取当前字体
 */
export function getCurrentFontFamily(): string | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const node = sel.anchorNode
  if (!node) return null
  const el = node.parentElement
  if (!el) return null
  return window.getComputedStyle(el).fontFamily.replace(/['"]/g, '') || null
}

/**
 * 获取当前文字颜色
 */
export function getCurrentForeColor(): string | null {
  try {
    const state = document.queryCommandValue('foreColor')
    if (state) {
      return rgbToHex(state)
    }
  } catch { /* ignore */ }
  return null
}

/**
 * 获取当前背景颜色
 */
export function getCurrentBackColor(): string | null {
  try {
    const state = document.queryCommandValue('hiliteColor')
    if (state) {
      return rgbToHex(state)
    }
  } catch { /* ignore */ }
  return null
}

/**
 * 获取当前块的标签类型（如 p, h1, h2, h3, h4, blockquote 等）
 */
export function getCurrentBlockType(): string | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  let container = range.commonAncestorContainer
  // 如果是文本节点，获取其父元素
  if (container.nodeType === Node.TEXT_NODE) {
    container = container.parentElement as Element
  }
  // 向上查找块级元素
  let el: Element | null = container as Element
  while (el) {
    const tagName = el.tagName?.toLowerCase()
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'div'].includes(tagName || '')) {
      return tagName
    }
    el = el.parentElement
  }
  return null
}

/**
 * RGB 转 Hex
 */
function rgbToHex(rgb: string): string {
  // 匹配 rgb(r, g, b) 格式
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match || !match[1] || !match[2] || !match[3]) return rgb
  const r = parseInt(match[1]).toString(16).padStart(2, '0')
  const g = parseInt(match[2]).toString(16).padStart(2, '0')
  const b = parseInt(match[3]).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`.toUpperCase()
}

/**
 * 设置字体
 */
export function setFontFamily(family: string): boolean {
  if (!family) return false
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (range.collapsed) return false

  try {
    // 创建一个临时容器来包裹选区
    const tempSpan = document.createElement('span')
    tempSpan.style.fontFamily = family

    // 尝试使用 surroundContents（简单选区）
    try {
      range.surroundContents(tempSpan)
    } catch {
      // surroundContents 失败（跨多种元素），使用包裹方式
      const contents = range.extractContents()
      tempSpan.appendChild(contents)

      // 在选区起始位置插入
      const startContainer = range.startContainer
      if (startContainer.nodeType === Node.TEXT_NODE) {
        startContainer.parentNode?.insertBefore(tempSpan, startContainer)
      } else {
        const parent = startContainer.parentNode
        if (parent) {
          parent.insertBefore(tempSpan, startContainer)
        }
      }
    }

    // 恢复选区到新 span 内
    sel.removeAllRanges()
    const newRange = document.createRange()
    newRange.selectNodeContents(tempSpan)
    newRange.collapse(false)
    sel.addRange(newRange)
    return true
  } catch {
    return false
  }
}

/**
 * 设置字号
 */
export function setFontSize(px: string): boolean {
  restoreSelection()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (range.collapsed) return false

  const span = document.createElement('span')
  span.style.fontSize = px
  try {
    range.surroundContents(span)
  } catch {
    const contents = range.extractContents()
    span.appendChild(contents)
    range.insertNode(span)
  }
  sel.removeAllRanges()
  const nr = document.createRange()
  nr.selectNodeContents(span)
  nr.collapse(false)
  sel.addRange(nr)
  return true
}

/**
 * 清除格式
 */
export function clearFormatting(): boolean {
  restoreSelection()
  try {
    document.execCommand('removeFormat', false)
    document.execCommand('cleanInlineStyles', false)
    return true
  } catch {
    // Fallback: 手动移除内联样式
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return false
    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer as Element
    const elements = container.querySelectorAll
      ? container.querySelectorAll('span,b,i,u,s,strike,a')
      : []
    elements.forEach((el: Element) => {
      if (el.tagName === 'SPAN' && el.parentElement) {
        const parent = el.parentElement
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el)
        }
        parent.removeChild(el)
      }
    })
    return true
  }
}

/**
 * 撤销
 */
export function undo(): boolean {
  try {
    document.execCommand('undo', false)
    return true
  } catch {
    return false
  }
}

/**
 * 重做
 */
export function redo(): boolean {
  try {
    document.execCommand('redo', false)
    return true
  } catch {
    return false
  }
}
