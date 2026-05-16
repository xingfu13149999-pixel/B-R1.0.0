/**
 * 本地启发式关键热词（无 API Key 时的回退）：字 n-gram + 频次，与历史行为一致。
 */
const DOMAIN_KEYWORDS = new Set([
  '营收', '负债率', '现金流', '担保', '行业周期', '订单', '利润', '毛利',
  '净利', '资产', '负债', '应收', '应付', '成本', '收入', '融资',
  '贷款', '还款', '授信', '风险', '合同', '客户', '供应商', '产能',
  '产量', '库存', '账期', '逾期', '坏账', '税收', '税务', '股东',
  '股权', '分红', '投资', '回款', '预算', '费用', '销售', '市场',
  '政务', '游泳', '股票', '基金', '公司', '项目', '技术', '产品',
  '方案', '需求', '目标', '计划', '进度', '质量', '数据', '系统',
  '服务', '管理', '运营', '研发', '设计', '测试', '部署', '团队'
])

const STOP_WORDS = new Set([
  '我们', '你们', '他们', '她们', '自己', '大家', '这个', '那个',
  '什么', '怎么', '可以', '已经', '就是', '不是', '因为', '所以',
  '如果', '虽然', '但是', '而且', '或者', '以及', '对于', '关于',
  '通过', '进行', '可能', '应该', '需要', '一下', '一些', '一个',
  '这些', '那些', '现在', '今天', '明天', '昨天', '时候', '地方',
  '问题', '事情', '东西', '方面', '情况', '然后', '这样', '那样',
  '比较', '其实', '还是', '你好', '能听', '听到', '知道', '觉得',
  '说的', '的话', '好的', '就好', '没有', '有没', '对吧', '是吧',
  '嗯嗯', '哈哈', '那么', '这么', '怎样', '哪些', '哪个', '为什么'
])

export function extractKeywords(text: string): string[] {
  if (!text || text.length < 4) return []
  const clean = text.replace(/[，。！？、；：""''（）【】《》\s\d.,:;!?'"()\[\]{}]+/g, '')
  if (clean.length < 4) return []

  const freq = new Map<string, number>()
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= clean.length - len; i++) {
      const gram = clean.slice(i, i + len)
      if (STOP_WORDS.has(gram)) continue
      freq.set(gram, (freq.get(gram) || 0) + 1)
    }
  }

  const domain: string[] = []
  /** 2 字词噪声大，仍要求至少出现 2 次；3～4 字短语出现 1 次也可入选（访谈里多数实体只提一次） */
  const scored: Array<{ term: string; score: number }> = []
  for (const [term, count] of freq) {
    if (DOMAIN_KEYWORDS.has(term)) {
      domain.push(term)
      continue
    }
    if (term.length <= 2 && count < 2) continue
    const score = count * term.length * term.length
    scored.push({ term, score })
  }

  scored.sort((a, b) => b.score - a.score)

  const result: string[] = [...new Set(domain)]
  for (const { term } of scored) {
    if (result.length >= 8) break
    if (result.some(r => r.includes(term) || term.includes(r))) continue
    result.push(term)
  }
  return result.slice(0, 8)
}
