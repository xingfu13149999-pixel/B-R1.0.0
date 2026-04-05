/**
 * 项目详情页假数据：与路由 projectId 对应的头部指标、项目概览与风险评估字段（后续可换 API）。
 * 侧栏树节点带 projectDetail 时，优先用弹窗保存的字段；已知 id 仍可用 BY_ID 精选数据。
 */

import type { CustomerTreeItem, ProjectDetailFields } from '@/views/home/mock/customerTree'

export interface ProjectField {
  label: string
  value: string
}

export interface ProjectOverviewData {
  row1: ProjectField[]
  row2: ProjectField[]
  managementLabel: string
  managementLines: string[]
}

export interface RiskAssessmentData {
  riskLevel: { label: string; value: string }
  dueDiligence: { label: string; percent: string }
  assetLiability: { label: string; percent: string }
  riskHint: { label: string; lines: string[] }
}

export interface ProjectHeaderMetric {
  label: string
  value: string
  highlight?: boolean
}

const DEFAULT_OVERVIEW: ProjectOverviewData = {
  row1: [
    { label: '申报方式', value: '常规类授信业务' },
    { label: '综合授信额度(敞口+缓释)', value: '12000万' },
    { label: '敞口额度', value: '5000万' },
    { label: '缓释额度', value: '7000万' }
  ],
  row2: [
    { label: '担保方式', value: '保证担保' },
    { label: '授信期限', value: '一年' },
    { label: '授信方式', value: '存量扩盘授信' }
  ],
  managementLabel: '管理要求',
  managementLines: [
    '为了实现组织目标而设定的行为规范和绩效标准体系。它连接了战略与执行，平衡了效率与控制，并定义了组织的运作方式。好的管理要求应当是：1. 切合实际，可执行； 2. 易于理解，无歧义；',
    '3. 不自相矛盾； 4. 与目标和价值创造相关。'
  ]
}

const DEFAULT_RISK: RiskAssessmentData = {
  riskLevel: { label: '风险等级', value: 'A+' },
  dueDiligence: { label: '尽调进度', percent: '53%' },
  assetLiability: { label: '资产负债率', percent: '80%' },
  riskHint: {
    label: '风险提示',
    lines: [
      '为了实现组织目标而设定的行为规范和绩效标准体系。它连接了战略与执行，平衡了效率与控制，并定义了组织的运作方式。好的管理要求应当是：1. 切合实际，可执行； 2. 易于理解，无歧义；',
      '3. 不自相矛盾； 4. 与目标和价值创造相关。'
    ]
  }
}

const DEFAULT_HEADER: ProjectHeaderMetric[] = [
  { label: '授信总额', value: '1.2亿' },
  { label: '敞口额度', value: '0.5亿' },
  { label: '信用评级', value: 'A' },
  { label: '担保方式', value: '保证担保', highlight: true }
]

/** 6000万元授信尽职调查 */
const PROJECT_2_3: { overview: ProjectOverviewData; risk: RiskAssessmentData; header: ProjectHeaderMetric[] } = {
  overview: {
    row1: [
      { label: '申报方式', value: '常规类授信业务' },
      { label: '综合授信额度(敞口+缓释)', value: '6000万' },
      { label: '敞口额度', value: '4000万' },
      { label: '缓释额度', value: '2000万' }
    ],
    row2: [
      { label: '担保方式', value: '保证担保' },
      { label: '授信期限', value: '两年' },
      { label: '授信方式', value: '续授信' }
    ],
    managementLabel: '管理要求',
    managementLines: [
      '续授信项目：对比上期批复条件，核实财务指标与行业政策变化；关注汇率与原材料价格波动对毛利的影响。维持现有担保结构，补充最新审计报告与纳税证明。',
    ]
  },
  risk: {
    riskLevel: { label: '风险等级', value: 'A+' },
    dueDiligence: { label: '尽调进度', percent: '45%' },
    assetLiability: { label: '资产负债率', percent: '58%' },
    riskHint: {
      label: '风险提示',
      lines: [
        '续授信审查重点为现金流覆盖倍数与行业景气度；当前尽调进度低于计划，需加快补充材料。无新增重大诉讼与对外担保，风险可控。',
      ]
    }
  },
  header: [
    { label: '授信总额', value: '0.6亿' },
    { label: '敞口额度', value: '0.4亿' },
    { label: '信用评级', value: 'A+' },
    { label: '担保方式', value: '保证担保', highlight: true }
  ]
}

const BY_ID: Record<string, { overview: ProjectOverviewData; risk: RiskAssessmentData; header: ProjectHeaderMetric[] }> = {
  '2-3': PROJECT_2_3
}

const DASH = '—'

function lineOrDash(s: string | undefined): string {
  const t = s?.trim()
  return t ? t : DASH
}

/** 由「新增/编辑项目」弹窗保存的 projectDetail 生成项目概览（与弹窗字段一致） */
export function buildOverviewFromProjectDetail(detail: ProjectDetailFields): ProjectOverviewData {
  return {
    row1: [
      { label: '申报方式', value: lineOrDash(detail.businessType) },
      { label: '综合授信额度(敞口+缓释)', value: lineOrDash(detail.creditTotal) },
      { label: '敞口额度', value: lineOrDash(detail.exposureLimit) },
      { label: '缓释额度', value: lineOrDash(detail.reliefTotal) }
    ],
    row2: [
      { label: '担保方式', value: '保证担保' },
      { label: '授信期限', value: lineOrDash(detail.creditTerm) },
      { label: '授信方式', value: DASH }
    ],
    managementLabel: '管理要求',
    managementLines: ['暂无补充说明。']
  }
}

/** 由 projectDetail 生成顶栏授信指标（展示弹窗中的额度文案） */
export function buildHeaderFromProjectDetail(detail: ProjectDetailFields): ProjectHeaderMetric[] {
  return [
    { label: '授信总额', value: lineOrDash(detail.creditTotal) },
    { label: '敞口额度', value: lineOrDash(detail.exposureLimit) },
    { label: '信用评级', value: 'A' },
    { label: '担保方式', value: '保证担保', highlight: true }
  ]
}

/** BY_ID 优先；否则树节点有 projectDetail 时用弹窗数据；再否则默认 mock */
export function resolveProjectOverview(
  projectId: string | undefined | null,
  node: CustomerTreeItem | null
): ProjectOverviewData {
  if (projectId && BY_ID[projectId]) {
    return BY_ID[projectId].overview
  }
  if (node?.projectDetail) {
    return buildOverviewFromProjectDetail(node.projectDetail)
  }
  return getProjectBundle(projectId).overview
}

export function resolveProjectRisk(
  projectId: string | undefined | null,
  _node: CustomerTreeItem | null
): RiskAssessmentData {
  if (projectId && BY_ID[projectId]) {
    return BY_ID[projectId].risk
  }
  return getProjectBundle(projectId).risk
}

export function resolveProjectHeader(
  projectId: string | undefined | null,
  node: CustomerTreeItem | null
): ProjectHeaderMetric[] {
  if (projectId && BY_ID[projectId]) {
    return BY_ID[projectId].header
  }
  if (node?.projectDetail) {
    return buildHeaderFromProjectDetail(node.projectDetail)
  }
  return getProjectBundle(projectId).header
}

export function getProjectBundle(projectId: string | undefined | null) {
  if (!projectId) {
    return {
      overview: DEFAULT_OVERVIEW,
      risk: DEFAULT_RISK,
      header: DEFAULT_HEADER
    }
  }
  return BY_ID[projectId] ?? {
    overview: DEFAULT_OVERVIEW,
    risk: DEFAULT_RISK,
    header: DEFAULT_HEADER
  }
}

export function getProjectHeaderMetrics(
  projectId: string | undefined | null,
  node?: CustomerTreeItem | null
): ProjectHeaderMetric[] {
  return resolveProjectHeader(projectId, node ?? null)
}
