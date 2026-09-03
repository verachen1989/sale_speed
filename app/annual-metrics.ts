export type AnnualMetricPriority = "primary" | "supporting";
export type AnnualMetricKind = "number" | "text";

export type AnnualMetric = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  note?: string;
  priority: AnnualMetricPriority;
  kind?: AnnualMetricKind;
};

export type AnnualMetricGroup = {
  id: "investment" | "construction" | "delivery" | "sales" | "holding" | "special" | "reserve";
  index: string;
  name: string;
  endpoint: string;
  eyebrow: string;
  summary: string;
  period: string;
  metrics: AnnualMetric[];
};

/**
 * Keep source wording intact while removing presentation-only qualifiers that
 * repeat information already carried by the value or unit.
 */
export function annualMetricDisplay(metric: Pick<AnnualMetric, "value" | "note">) {
  const note = metric.note
    ?.split("·")
    .map((part) => part.trim())
    .filter((part) => part && !["约", "人民币", "平均", "超"].includes(part))
    .map((part) => part.replace("账面值约", "账面值").replace("中介费约", "中介费"))
    .join(" · ");

  return {
    value: metric.note?.trim() === "超" ? `${metric.value}+` : metric.value,
    note: note || undefined,
  };
}

export const ANNUAL_HERO_METRICS = [
  { id: "sales", groupId: "sales", label: "总合同销售金额", value: "2,519", unit: "亿元", note: "约 · 人民币 · 行业第 2" },
  { id: "new-value", groupId: "investment", label: "新增货值", value: "1,355", unit: "亿元", note: "约 · 人民币 · 行业第 4" },
  { id: "delivery-area", groupId: "delivery", label: "合计交付面积", value: "2,269", unit: "万㎡", note: "自投 + 代建" },
  { id: "delivery-satisfaction", groupId: "delivery", label: "整体交付满意度", value: "94", unit: "分", note: "同比提升" },
  { id: "reserve-area", groupId: "reserve", label: "土储总建筑面积", value: "2,371", unit: "万㎡", note: "截至 2025 年末" },
] as const;

export const ANNUAL_METRIC_GROUPS: AnnualMetricGroup[] = [
  {
    id: "investment",
    index: "01",
    name: "投资拿地",
    endpoint: "投拓端",
    eyebrow: "INVESTMENT DEVELOPMENT",
    summary: "聚焦核心城市，保持规模、质量与权益平衡",
    period: "指标初步意向",
    metrics: [
      { id: "investment-projects", label: "新增项目数量", value: "50", unit: "个", priority: "primary" },
      { id: "investment-saleable-area", label: "新增可售面积", value: "318", unit: "万㎡", note: "约", priority: "primary" },
      { id: "investment-new-value", label: "新增货值", value: "1,355", unit: "亿元", note: "约 · 人民币 · 行业第 4", priority: "primary" },
      { id: "investment-equity", label: "平均权益比例", value: "69", unit: "%", note: "约", priority: "primary" },
      { id: "investment-conversion", label: "新拓项目转化率", value: "33", unit: "%", note: "同比 +3pct", priority: "supporting" },
      { id: "investment-tier12", label: "一二线城市货值占比", value: "86", unit: "%", priority: "supporting" },
      { id: "investment-yangtze", label: "长三角货值占比", value: "81", unit: "%", note: "其中杭州占 38%", priority: "supporting" },
      { id: "investment-lower-tier", label: "三四线城市新增项目", value: "11", unit: "宗", priority: "supporting" },
    ],
  },
  {
    id: "construction",
    index: "02",
    name: "项目建设",
    endpoint: "建设端",
    eyebrow: "CONSTRUCTION DELIVERY",
    summary: "以更短开发周期兑现产品力与绿色建造能力",
    period: "指标初步意向",
    metrics: [
      { id: "construction-demo", label: "拿地 → 实景示范区开放", value: "5.4", unit: "个月", note: "平均", priority: "primary" },
      { id: "construction-launch", label: "拿地 → 首开", value: "6.1", unit: "个月", note: "平均", priority: "primary" },
      { id: "construction-delivery", label: "拿地 → 交付", value: "26.2", unit: "个月", note: "平均", priority: "primary" },
      { id: "construction-prefab", label: "装配式建筑应用占比（在建）", value: "85", unit: "%", note: "同比 +5pct", priority: "supporting" },
      { id: "construction-green-area", label: "新增绿色建筑认证面积", value: "246", unit: "万㎡", note: "约", priority: "supporting" },
      { id: "construction-green-projects", label: "累计绿色建筑项目", value: "364", unit: "个", priority: "supporting" },
    ],
  },
  {
    id: "delivery",
    index: "03",
    name: "交付运营",
    endpoint: "交付端",
    eyebrow: "CUSTOMER DELIVERY",
    summary: "规模交付与客户满意度同步兑现",
    period: "指标初步意向",
    metrics: [
      { id: "delivery-projects", label: "自投 + 代建合计交付项目", value: "210", unit: "个", priority: "primary" },
      { id: "delivery-area", label: "合计交付面积", value: "2,269", unit: "万㎡", note: "约", priority: "primary" },
      { id: "delivery-households", label: "合计交付户数", value: "11.9", unit: "万户", note: "约", priority: "primary" },
      { id: "delivery-satisfaction", label: "整体交付满意度", value: "94", unit: "分", note: "同比提升", priority: "primary" },
      { id: "delivery-management-area", label: "绿城管理交付面积", value: "1,451", unit: "万㎡", note: "连续 5 年超千万方", priority: "primary" },
      { id: "delivery-management-households", label: "绿城管理交付户数", value: "8", unit: "万户", note: "超", priority: "primary" },
    ],
  },
  {
    id: "sales",
    index: "04",
    name: "销售去化",
    endpoint: "销售端",
    eyebrow: "SALES PERFORMANCE",
    summary: "自投与代建协同贡献，规模与首开质量并重",
    period: "指标初步意向",
    metrics: [
      { id: "sales-total-area", label: "总合同销售面积", value: "1,208", unit: "万㎡", note: "约", priority: "primary" },
      { id: "sales-total-amount", label: "总合同销售金额", value: "2,519", unit: "亿元", note: "约 · 人民币 · 行业第 2", priority: "primary" },
      { id: "sales-self-area", label: "自投项目合同销售面积", value: "466", unit: "万㎡", note: "约", priority: "primary" },
      { id: "sales-self-amount", label: "自投项目合同销售金额", value: "1,534", unit: "亿元", note: "约 · 人民币", priority: "primary" },
      { id: "sales-management-area", label: "代建管理项目销售面积", value: "742", unit: "万㎡", note: "约", priority: "primary" },
      { id: "sales-management-amount", label: "代建管理项目销售金额", value: "985", unit: "亿元", note: "约 · 人民币", priority: "primary" },
      { id: "sales-first-launches", label: "首开项目数量", value: "54", unit: "个", priority: "primary" },
      { id: "sales-first-rate", label: "平均首开去化率", value: "69", unit: "%", priority: "primary" },
      { id: "sales-premium", label: "首开溢价项目", value: "25", unit: "个", priority: "primary" },
      { id: "sales-self-equity", label: "自投权益金额", value: "1,043", unit: "亿元", note: "约 · 人民币 · 行业第 5", priority: "supporting" },
      { id: "sales-self-price", label: "自投销售均价", value: "32,924", unit: "元/㎡", note: "约 · 人民币", priority: "supporting" },
      { id: "sales-tier12", label: "一二线城市销售占比", value: "84", unit: "%", note: "同比 +5pct", priority: "supporting" },
      { id: "sales-yangtze", label: "长三角销售占比", value: "71", unit: "%", priority: "supporting" },
      { id: "sales-collection", label: "年度回款率", value: "101", unit: "%", priority: "supporting" },
      { id: "sales-old-stock", label: "2021 年及以前库存去化", value: "327.6", unit: "亿元", note: "约 · 人民币", priority: "supporting" },
      { id: "sales-parking", label: "车位去化比", value: "1.51", unit: "倍", priority: "supporting" },
      { id: "sales-digital-share", label: "数字化营销成交占比", value: "21.5", unit: "%", note: "同比 +9.4pct", priority: "supporting" },
      { id: "sales-digital-rate", label: "数字化营销费率", value: "0.52", unit: "%", note: "节约中介费约 2.7 亿元", priority: "supporting" },
    ],
  },
  {
    id: "holding",
    index: "05",
    name: "持有物业经营",
    endpoint: "持有端",
    eyebrow: "ASSET OPERATIONS",
    summary: "酒店与投资性物业形成稳定经营收益",
    period: "指标初步意向",
    metrics: [
      { id: "holding-hotel", label: "酒店运营收入", value: "9.93", unit: "亿元", note: "人民币", priority: "primary" },
      { id: "holding-rent", label: "投资性物业租金收入", value: "2.98", unit: "亿元", note: "人民币 · 同比 +4.6%", priority: "primary" },
      { id: "holding-book-value", label: "投资物业账面值", value: "117.28", unit: "亿元", note: "约 · 人民币", priority: "supporting" },
      { id: "holding-mortgaged", label: "抵押投资物业", value: "52.56", unit: "亿元", note: "账面值约 · 用于银行融资", priority: "supporting" },
    ],
  },
  {
    id: "special",
    index: "06",
    name: "核心小镇及特色业务",
    endpoint: "特色端",
    eyebrow: "DIVERSIFIED BUSINESSES",
    summary: "小镇、家装、会员与康养业务构建多元生态",
    period: "指标初步意向",
    metrics: [
      { id: "special-town-projects", label: "小镇新签约产业服务项目", value: "3", unit: "个", priority: "primary" },
      { id: "special-events", label: "全年 IP 活动", value: "400", unit: "场", note: "超", priority: "primary" },
      { id: "special-award", label: "小镇品牌荣誉", value: "“2025中国特色小镇运营领先品牌”", priority: "primary", kind: "text" },
      { id: "special-epc", label: "EPC 业务", value: "全周期管控", note: "持续强化", priority: "primary", kind: "text" },
      { id: "special-decoration", label: "家装定制业务规模", value: "10", unit: "亿元", note: "首次突破 · 人民币", priority: "primary" },
      { id: "special-members", label: "会员平台“桂玥会”", value: "117", unit: "万", note: "首年上线会员数突破", priority: "primary" },
      { id: "special-senior", label: "康养业务模式", value: "轻资产运营", note: "能力持续提升", priority: "primary", kind: "text" },
    ],
  },
  {
    id: "reserve",
    index: "07",
    name: "土地储备结构",
    endpoint: "发展底盘",
    eyebrow: "LAND BANK STRUCTURE",
    summary: "充足土储支撑中长期开发与核心区域深耕",
    period: "截至 2025 年末",
    metrics: [
      { id: "reserve-projects", label: "土地储备项目总数", value: "146", unit: "个", note: "在建 + 待建", priority: "primary" },
      { id: "reserve-total-area", label: "总建筑面积", value: "2,371", unit: "万㎡", note: "约", priority: "primary" },
      { id: "reserve-equity-area", label: "权益总建筑面积", value: "1,506", unit: "万㎡", note: "约", priority: "primary" },
      { id: "reserve-saleable-area", label: "总可售面积", value: "1,567", unit: "万㎡", note: "约", priority: "primary" },
      { id: "reserve-equity-saleable", label: "权益可售面积", value: "972", unit: "万㎡", note: "约", priority: "primary" },
      { id: "reserve-tier12", label: "一二线城市货值占比", value: "80", unit: "%", note: "约", priority: "primary" },
      { id: "reserve-yangtze", label: "长三角区域货值占比", value: "64", unit: "%", note: "约", priority: "primary" },
    ],
  },
];

export const ANNUAL_METRIC_TOTALS = ANNUAL_METRIC_GROUPS.reduce(
  (totals, group) => {
    group.metrics.forEach((metric) => {
      totals.total += 1;
      totals[metric.priority] += 1;
    });
    return totals;
  },
  { total: 0, primary: 0, supporting: 0 },
);
