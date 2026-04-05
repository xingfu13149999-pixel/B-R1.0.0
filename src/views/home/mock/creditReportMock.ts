/**
 * 授信报告：目录 + 正文假数据（按 projectId，后续换 API）
 * 设计参考 Figma node 1:11998
 */

export interface CreditReportTocItem {
  id: string
  title: string
  children?: CreditReportTocItem[]
}

export interface CreditReportSection {
  id: string
  title: string
  /** 正文 HTML（仅演示，生产需 XSS 过滤） */
  bodyHtml: string
}

export interface CreditReportDoc {
  /** 报告标题（可与左侧树项目名一致） */
  reportTitle: string
  /** 顶栏指标 */
  metrics: { label: string; value: string; highlight?: boolean }[]
  toc: CreditReportTocItem[]
  sections: CreditReportSection[]
}

const SHARED_TOC: CreditReportTocItem[] = [
  {
    id: 'toc-basic',
    title: '基本信息',
    children: [
      { id: 'toc-cust', title: '一、客户信息' },
      { id: 'toc-biz', title: '二、业务信息' }
    ]
  },
  {
    id: 'toc-part1',
    title: '第一部分 客户情况',
    children: [
      { id: 'toc-p1-1', title: '一、基本情况' },
      { id: 'toc-p1-2', title: '二、经营与投资' },
      { id: 'toc-p1-3', title: '三、财务状况' }
    ]
  },
  { id: 'toc-part2', title: '第二部分 项目/产品情况' },
  { id: 'toc-part3', title: '第三部分 银企合作关系' },
  { id: 'toc-part4', title: '第四部分 客户授信方案分析' }
]

function sectionsFromProject(title: string): CreditReportSection[] {
  const intro = `${title}授信尽职调查报告（演示数据）。氟硅高分子新材料行业在政策与需求双驱动下保持增长，下游光伏、新能源汽车及高端装备领域拉动含氟聚合物需求。`
  return [
    {
      id: 'sec-cust',
      title: '客户信息',
      bodyHtml: `<p>${intro}</p><p>客户成立年限、股权结构及实际控制人情况见业务系统档案，本报告重点分析授信期内的偿债能力与现金流覆盖。</p>`
    },
    {
      id: 'sec-biz',
      title: '业务信息',
      bodyHtml: `<p>主营业务为氟硅材料研发与制造，主要收入来源于 MQ 硅树脂及配套化学品销售。近三年营收复合增长率约 12%，毛利率受原材料价格波动影响。</p>`
    },
    {
      id: 'sec-p1-1',
      title: '基本情况',
      bodyHtml: `<p>企业注册地、生产资质及环保许可齐全，无重大未决诉讼。核心管理层稳定，与主要客户签订中长期供货协议。</p>`
    },
    {
      id: 'sec-p1-2',
      title: '经营与投资',
      bodyHtml: `<p>行业方面：国内氟化工产业集中度提升，头部企业产能利用率较高。公司投资重点在技改与产能置换，资本性支出与经营现金流匹配。</p><p>商业模式：以直销为主，部分区域采用经销商覆盖；回款周期约 90–120 天。</p>`
    },
    {
      id: 'sec-p1-3',
      title: '财务状况',
      bodyHtml: `<p>资产负债率、流动比率与利息保障倍数满足我行授信准入标准。应收账款账龄结构合理，已计提坏账准备。</p>`
    },
    {
      id: 'sec-part2',
      title: '项目/产品情况',
      bodyHtml: `<p>本次授信对应项目与现有产能协同，环评与安评批复在有效期内。项目达产后预计可新增年销售收入，投资回收期在可接受范围内。</p>`
    },
    {
      id: 'sec-part3',
      title: '银企合作关系',
      bodyHtml: `<p>历史授信履约记录良好，无逾期欠息。结算账户日均存款与中间业务贡献稳定。</p>`
    },
    {
      id: 'sec-part4',
      title: '客户授信方案分析',
      bodyHtml: `<p>综合风险等级、担保方式与授信期限，建议按批复条件放款，贷后按季核查资金用途与财务报表，关注行业政策与大宗商品价格变动。</p>`
    }
  ]
}

const DOC_2_3: CreditReportDoc = {
  reportTitle: '6000万元授信尽职调查',
  metrics: [
    { label: '授信总额', value: '0.6亿' },
    { label: '敞口额度', value: '0.4亿' },
    { label: '缓释额度', value: '0.2亿' },
    { label: '授信期限', value: '两年' },
    { label: '担保方式', value: '保证担保', highlight: true }
  ],
  toc: SHARED_TOC,
  sections: sectionsFromProject('6000万元')
}

const DOC_DEFAULT: CreditReportDoc = {
  reportTitle: '授信尽职调查报告',
  metrics: [
    { label: '授信总额', value: '1.2亿' },
    { label: '敞口额度', value: '0.5亿' },
    { label: '缓释额度', value: '0.7亿' },
    { label: '授信期限', value: '一年' },
    { label: '担保方式', value: '常规类授信业务', highlight: true }
  ],
  toc: SHARED_TOC,
  sections: sectionsFromProject('本项目')
}

const BY_ID: Record<string, CreditReportDoc> = {
  '2-3': DOC_2_3
}

export function getCreditReportDoc(projectId: string | undefined | null): CreditReportDoc {
  if (!projectId) return DOC_DEFAULT
  return BY_ID[projectId] ?? DOC_DEFAULT
}

/** 将目录 id 映射到正文锚点 section id（叶子节点与 section 一一对应） */
/** 目录节点 id → 正文锚点 id（仅叶子可跳转；父级仅展开） */
export const tocToSectionId: Record<string, string> = {
  'toc-cust': 'sec-cust',
  'toc-biz': 'sec-biz',
  'toc-p1-1': 'sec-p1-1',
  'toc-p1-2': 'sec-p1-2',
  'toc-p1-3': 'sec-p1-3',
  'toc-part2': 'sec-part2',
  'toc-part3': 'sec-part3',
  'toc-part4': 'sec-part4'
}
