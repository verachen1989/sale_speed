export type Period = '当日' | '当月' | '当年'
export type IndicatorType = '协议' | '合同'
export type MetricType = '套数' | '金额'
export type PropertyType = '住宅' | '商办' | '车储'
export type VersionType = '年度经营计划版' | '首开定价会版' | '全景会版' | '经营策划会版' | '交底会版'
export type FilterCategory = 'status' | 'landYear' | 'city'

export interface ProjectRecord {
  id: string
  name: string
  landDate: string
  agreementUnits: number
  agreementAmount: number
  contractUnits: number
  contractAmount: number
  cashPayment: number
  loanPayment: number
  totalPayment: number
  city: string
  status: string
  landYear: string
}

export interface TrendPoint {
  date: string
  actual: number
  target: number
  visits?: number
}

export interface FilterSummary {
  label: string
  count: number
  amount: number
}

export interface ChartData {
  month: string
  date: string
  actual: number
  target: number
  visits?: number
}
