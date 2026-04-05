/**
 * 客户首页视图假数据：与左侧树选中 customerId 对应的指标、一页纸卡片内容（后续可换 API）。
 */

export type TagType = 'blue' | 'yellow' | 'green' | 'red'

export interface CustomerDetailTag {
  text: string
  type: TagType
}

export interface CustomerDetailSection {
  title: string
  updateTime: string
  content: string
  tags: CustomerDetailTag[]
}

export interface CustomerHomeMetric {
  label: string
  value: string
  /** 对应原 metric-value--green */
  highlight?: boolean
}

export interface CustomerHomeView {
  metrics: CustomerHomeMetric[]
  metaTime: string
  metaUser: string
  detailSections: CustomerDetailSection[]
}

const DEFAULT_SECTIONS: CustomerDetailSection[] = [
  {
    title: '企业概况',
    updateTime: '10:38:57',
    content:
      '四川晨光博达新材料有限公司是成都晨光博达新材料股份有限公司(国家级专精特新"小巨人")的全资子公司，专注于氟硅高分子新材料研发制造，专注于氟硅高分子新材料研发制造，专注于氟硅高分子新材料研发制造，专注于氟硅高分子。该公司成立于2019年01月25日..',
    tags: [
      { text: '国家专精特新"小巨人"', type: 'blue' },
      { text: '省级企业技术中心', type: 'yellow' },
      { text: '核心技术国产替代', type: 'green' },
      { text: 'MQ硅树脂销量翻倍', type: 'red' }
    ]
  },
  {
    title: '股权结构',
    updateTime: '08:38:46',
    content:
      '四川晨光博达新材料有限公司是成都晨光博达新材料股份有限公司的全资子公司(持股100%)，母公司股权结构分散，主要股东包括自然人刘皓(持股约17.54%)、机构投资...',
    tags: [
      { text: '股权结构清晰', type: 'yellow' },
      { text: '法人独资子公司', type: 'blue' },
      { text: '无实际控制', type: 'red' }
    ]
  },
  {
    title: '经营状况分析',
    updateTime: '07:38:52',
    content:
      '四川晨光博达新材料有限公司的氟硅高端精细化学品项目在产业政策符合性、园区选址、环境准入及危险化学品经营资质等关键环节符合行业准入条件。公司核心产品包括打破国外...',
    tags: [
      { text: '冰芯冷却液', type: 'green' },
      { text: '销量增长显著', type: 'yellow' },
      { text: '智改数转', type: 'blue' }
    ]
  },
  {
    title: '核心竞争力',
    updateTime: '05:28:23',
    content:
      '公司主要生产全氟聚醚油(E)、环保型含氣表面活性剂(FSA)、MQ硅树脂(MQ)。全氟聚醚油(PEPF)设计产能300吨/年，该产品每年可为企业带来的收入为:8t*65w/t*12月=6240W年...',
    tags: [{ text: 'MQ硅树脂(MQ)', type: 'green' }]
  }
]

const DEFAULT_HOME: CustomerHomeView = {
  metrics: [
    { label: '综合授信', value: '1.2亿' },
    { label: '信用评级', value: 'A' },
    { label: '敞口额度', value: '0.5亿' },
    { label: '担保方式', value: '保证担保', highlight: true }
  ],
  metaTime: '10:38:57',
  metaUser: '李云',
  detailSections: DEFAULT_SECTIONS
}

/** 盟升子客户 2-1：与树节点名称对应的差异化文案 */
const HOME_2_1: CustomerHomeView = {
  metrics: [
    { label: '综合授信', value: '0.8亿' },
    { label: '信用评级', value: 'AA-' },
    { label: '敞口额度', value: '0.3亿' },
    { label: '担保方式', value: '抵押+保证', highlight: true }
  ],
  metaTime: '09:12:33',
  metaUser: '王敏',
  detailSections: [
    {
      title: '企业概况',
      updateTime: '09:15:00',
      content:
        '成都盟升电子技术股份有限公司专注于卫星导航、通信终端研发制造，具备军工资质与批量交付能力。本户为集团授信项下重点子公司，主营业务与母公司协同，现金流稳定。',
      tags: [
        { text: '军工配套', type: 'blue' },
        { text: '卫星导航', type: 'yellow' },
        { text: '研发占比高', type: 'green' }
      ]
    },
    {
      title: '股权结构',
      updateTime: '08:40:12',
      content:
        '上市公司控股结构清晰，主要股东为母公司及核心员工持股平台，表决权与收益权匹配，近两年无重大股权变动。',
      tags: [
        { text: '控股清晰', type: 'yellow' },
        { text: '无质押风险', type: 'green' }
      ]
    },
    {
      title: '经营状况分析',
      updateTime: '07:55:01',
      content:
        '近三期营收与毛利呈改善趋势，在手订单覆盖未来四个季度产能；主要风险为单一客户集中度，已要求补充分散度说明。',
      tags: [
        { text: '订单饱满', type: 'green' },
        { text: '客户集中度', type: 'red' }
      ]
    },
    {
      title: '核心竞争力',
      updateTime: '06:20:44',
      content:
        '核心专利覆盖射频链路与抗干扰算法，测试认证齐全；与主机厂合作周期长、切换成本高，具备一定壁垒。',
      tags: [{ text: '专利壁垒', type: 'blue' }]
    }
  ]
}

/** 顶层客户 id=1（四川晨光）沿用默认晨光文案；仅可微调指标展示 */
const HOME_1: CustomerHomeView = {
  ...DEFAULT_HOME,
  metrics: [
    { label: '综合授信', value: '1.2亿' },
    { label: '信用评级', value: 'A' },
    { label: '敞口额度', value: '0.5亿' },
    { label: '担保方式', value: '保证担保', highlight: true }
  ]
}

/** 父节点 2：集团维度摘要 */
const HOME_2: CustomerHomeView = {
  metrics: [
    { label: '综合授信', value: '2.1亿' },
    { label: '信用评级', value: 'AA' },
    { label: '敞口额度', value: '0.8亿' },
    { label: '担保方式', value: '组合担保', highlight: true }
  ],
  metaTime: '11:02:18',
  metaUser: '李云',
  detailSections: DEFAULT_SECTIONS.map((s, i) =>
    i === 0
      ? {
          ...s,
          content:
            '集团层面统筹授信，下属含电子制造与卫星应用等业务板块。本页为集团客户维度摘要，子客户请从左侧选择「子客户」节点查看专项一页纸。'
        }
      : s
  )
}

const BY_ID: Record<string, CustomerHomeView> = {
  '1': HOME_1,
  '2': HOME_2,
  '2-1': HOME_2_1
}

export function getCustomerHomeView(customerId: string | null | undefined): CustomerHomeView {
  if (!customerId) return DEFAULT_HOME
  return BY_ID[customerId] ?? DEFAULT_HOME
}

export function getCustomerDetailSections(customerId: string | null | undefined): CustomerDetailSection[] {
  return getCustomerHomeView(customerId).detailSections
}
