"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import TechMap from "./tech-map";
import type { CitySelection, ProvinceSelection } from "./tech-map";
import {
  WENSHU_ORGANIZATIONS,
  WENSHU_SNAPSHOT_DATE,
  type WenshuOrganizationSnapshot,
} from "./wenshu-snapshot";
import {
  WENSHU_CITY_SUMMARIES,
  WENSHU_CONSTRUCTION_PROJECT_COUNT,
  WENSHU_COVERED_CITY_COUNT,
  WENSHU_DOMESTIC_PROJECT_COUNT,
  WENSHU_PROJECTS,
  type WenshuProjectSnapshot,
} from "./wenshu-projects-snapshot";
import { WENSHU_PROJECT_ATTRIBUTES } from "./wenshu-project-attributes";

type QueryMode = "administrative" | "organization";

type DashboardScope = {
  id: string;
  name: string;
  level: "national" | "cluster" | "province";
  adcodes: number[];
};

type RegionMetrics = {
  sales: number;
  growth: number;
  projects: number;
  monthlySales: number[];
  summary: string;
};

type ScopeMetrics = RegionMetrics & {
  cityCount: number;
  newProjects: number;
  newValue: number;
  newValueGrowth: number;
  equityInvestment: number;
  revenue: number;
  assets: number;
  assetsGrowth: number;
  cashFlow: number;
  cashFlowGrowth: number;
  constructionArea: number;
  newConstructionArea: number;
  totalProjects: number;
  soilArea: number;
  investment: number;
  sellingProjects: number;
};

const NATIONAL_SCOPE: DashboardScope = {
  id: "national",
  name: "全国",
  level: "national",
  adcodes: [],
};

const SCOPE_OPTIONS: DashboardScope[] = [
  NATIONAL_SCOPE,
  { id: "yangtze-delta", name: "长三角", level: "cluster", adcodes: [310000, 320000, 330000, 340000] },
  { id: "jing-jin-ji", name: "京津冀", level: "cluster", adcodes: [110000, 120000, 130000] },
  { id: "cheng-yu", name: "成渝", level: "cluster", adcodes: [500000, 510000] },
  { id: "central", name: "华中", level: "cluster", adcodes: [410000, 420000, 430000] },
  { id: "greater-bay", name: "粤港澳大湾区", level: "cluster", adcodes: [440000] },
  { id: "northwest", name: "西北", level: "cluster", adcodes: [610000, 620000, 630000, 640000, 650000] },
];

const PROVINCE_DATA: Record<number, RegionMetrics> = {
  330000: { sales: 38.6, growth: 13.8, projects: 32, monthlySales: [3.1, 3.6, 4.2, 3.8, 4.9, 5.7, 6.1, 7.2], summary: "连续 3 个月保持增长" },
  110000: { sales: 24.7, growth: 9.4, projects: 18, monthlySales: [2.3, 2.6, 2.9, 2.7, 3.1, 3.4, 3.6, 4.1], summary: "核心项目贡献持续提升" },
  510000: { sales: 22.3, growth: 15.6, projects: 17, monthlySales: [1.8, 2.1, 2.4, 2.6, 2.8, 3.1, 3.5, 4.0], summary: "成渝区域增长动能突出" },
  610000: { sales: 18.4, growth: 11.2, projects: 14, monthlySales: [1.5, 1.8, 2.0, 2.2, 2.3, 2.7, 2.8, 3.1], summary: "销售规模稳步扩大" },
  310000: { sales: 16.8, growth: 8.6, projects: 6, monthlySales: [1.4, 1.6, 1.8, 1.9, 2.1, 2.4, 2.6, 3.0], summary: "高能级城市表现稳健" },
  420000: { sales: 14.5, growth: 10.9, projects: 5, monthlySales: [1.1, 1.3, 1.5, 1.7, 1.8, 2.1, 2.3, 2.7], summary: "重点项目带动结构改善" },
  440000: { sales: 21.6, growth: 12.7, projects: 8, monthlySales: [1.7, 2.0, 2.2, 2.5, 2.7, 3.1, 3.5, 3.9], summary: "湾区销售活力持续释放" },
};

const ROOT_ORGANIZATION = WENSHU_ORGANIZATIONS[0];

const NATIONAL_METRICS: ScopeMetrics = {
  sales: ROOT_ORGANIZATION.sales,
  growth: ROOT_ORGANIZATION.salesMomentum,
  projects: WENSHU_CONSTRUCTION_PROJECT_COUNT,
  monthlySales: ROOT_ORGANIZATION.monthlySales,
  summary: "全国实际签约及项目快照已接入问数",
  cityCount: WENSHU_COVERED_CITY_COUNT,
  newProjects: ROOT_ORGANIZATION.newProjects,
  newValue: ROOT_ORGANIZATION.newValue,
  newValueGrowth: ROOT_ORGANIZATION.newValueGrowth,
  equityInvestment: ROOT_ORGANIZATION.equityInvestment ?? 0,
  revenue: 164.8,
  assets: 1280.6,
  assetsGrowth: 6.8,
  cashFlow: ROOT_ORGANIZATION.cashFlow,
  cashFlowGrowth: 0,
  constructionArea: ROOT_ORGANIZATION.constructionArea,
  newConstructionArea: 312,
  totalProjects: WENSHU_DOMESTIC_PROJECT_COUNT,
  soilArea: ROOT_ORGANIZATION.soilArea,
  investment: ROOT_ORGANIZATION.investment,
  sellingProjects: ROOT_ORGANIZATION.sellingProjects,
};

function roundOne(value: number) {
  return Number(value.toFixed(1));
}

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatSignedPercentage(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function metricsForProvince(adcode: number): RegionMetrics {
  if (PROVINCE_DATA[adcode]) return PROVINCE_DATA[adcode];
  const seed = adcode % 997;
  const projects = 3 + (seed % 12);
  const sales = roundOne(8 + (seed % 115) / 10);
  const growth = roundOne(6.2 + (seed % 83) / 10);
  const monthlySales = Array.from({ length: 8 }, (_, index) => (
    roundOne(sales * (.07 + index * .011 + ((seed + index * 7) % 9) / 200))
  ));
  return { sales, growth, projects, monthlySales, summary: "区域经营数据已同步联动" };
}

function metricsForScope(scope: DashboardScope): ScopeMetrics {
  if (scope.level === "national") return NATIONAL_METRICS;

  const rows = scope.adcodes.map(metricsForProvince);
  const sales = roundOne(rows.reduce((total, row) => total + row.sales, 0));
  const scopedProjects = WENSHU_PROJECTS.filter((project) => scope.adcodes.includes(project.provinceAdcode));
  const projects = scopedProjects.filter((project) => project.developmentStatus === "在建").length;
  const weightedGrowth = rows.reduce((total, row) => total + row.growth * row.sales, 0) / Math.max(1, sales);
  const monthlySales = Array.from({ length: 8 }, (_, index) => (
    roundOne(rows.reduce((total, row) => total + row.monthlySales[index], 0))
  ));
  const cityCount = new Set(scopedProjects.map((project) => project.cityName)).size;
  const scale = Math.max(.04, projects / NATIONAL_METRICS.projects);

  return {
    sales,
    growth: roundOne(weightedGrowth),
    projects,
    monthlySales,
    summary: scope.level === "province" ? rows[0].summary : `${scope.name}重点城市协同增长`,
    cityCount,
    newProjects: Math.max(1, Math.round(projects * .19)),
    newValue: roundOne(sales * 1.49),
    newValueGrowth: roundOne(weightedGrowth + 3.2),
    equityInvestment: roundOne(sales * .86),
    revenue: roundOne(sales * .754),
    assets: roundOne(NATIONAL_METRICS.assets * Math.pow(scale, .82)),
    assetsGrowth: roundOne(Math.max(3.8, weightedGrowth * .55)),
    cashFlow: roundOne(sales * .195),
    cashFlowGrowth: roundOne(weightedGrowth + 2.4),
    constructionArea: Math.max(1, Math.round(projects * (NATIONAL_METRICS.constructionArea / NATIONAL_METRICS.projects))),
    newConstructionArea: Math.max(1, Math.round(projects * (NATIONAL_METRICS.newConstructionArea / NATIONAL_METRICS.projects))),
    totalProjects: scopedProjects.length,
    soilArea: Math.max(1, Math.round(projects * (NATIONAL_METRICS.soilArea / NATIONAL_METRICS.projects))),
    investment: roundOne(sales * .86),
    sellingProjects: Math.max(1, Math.round(projects * .65)),
  };
}

function metricsForCity(city: CitySelection): ScopeMetrics {
  const provinceScope: DashboardScope = {
    id: `province-${city.provinceAdcode}`,
    name: city.provinceName,
    level: "province",
    adcodes: [city.provinceAdcode],
  };
  const province = metricsForScope(provinceScope);
  const cityRows = WENSHU_PROJECTS.filter((project) => project.cityAdcode === city.cityAdcode);
  const constructionProjects = cityRows.filter((project) => project.developmentStatus === "在建").length;
  const share = Math.min(1, city.count / Math.max(city.count, province.totalProjects));
  const growth = roundOne(province.growth + ((city.cityAdcode % 7) - 3) * .35);

  return {
    ...province,
    sales: roundOne(province.sales * share),
    growth,
    projects: constructionProjects,
    monthlySales: province.monthlySales.map((value) => roundOne(value * share)),
    summary: `${city.name}全部 ${city.count} 个项目已展开`,
    cityCount: 1,
    newProjects: Math.max(1, Math.round(city.count * .19)),
    newValue: roundOne(province.newValue * share),
    newValueGrowth: roundOne(growth + 3.2),
    equityInvestment: roundOne(province.equityInvestment * share),
    revenue: roundOne(province.revenue * share),
    assets: roundOne(province.assets * share),
    assetsGrowth: roundOne(Math.max(3.8, growth * .55)),
    cashFlow: roundOne(province.cashFlow * share),
    cashFlowGrowth: roundOne(growth + 2.4),
    constructionArea: Math.max(1, Math.round(province.constructionArea * share)),
    newConstructionArea: Math.max(1, Math.round(province.newConstructionArea * share)),
    totalProjects: cityRows.length,
    soilArea: Math.max(1, Math.round(province.soilArea * share)),
    investment: roundOne(province.investment * share),
    sellingProjects: Math.max(1, Math.round(province.sellingProjects * share)),
  };
}

function metricsForOrganization(organization: WenshuOrganizationSnapshot): ScopeMetrics {
  const cityCount = organization.adcodes.length === 0
    ? WENSHU_COVERED_CITY_COUNT
    : WENSHU_CITY_SUMMARIES.filter((city) => organization.adcodes.includes(city.provinceAdcode)).length;
  return {
    sales: organization.sales,
    growth: organization.salesMomentum,
    projects: organization.constructionProjects,
    monthlySales: organization.monthlySales,
    summary: `${organization.name}月度实际签约趋势`,
    cityCount,
    newProjects: organization.newProjects,
    newValue: organization.newValue,
    newValueGrowth: organization.newValueGrowth,
    equityInvestment: organization.equityInvestment ?? 0,
    revenue: 0,
    assets: 0,
    assetsGrowth: 0,
    cashFlow: organization.cashFlow,
    cashFlowGrowth: 0,
    constructionArea: organization.constructionArea,
    newConstructionArea: 0,
    totalProjects: organization.totalProjects,
    soilArea: organization.soilArea,
    investment: organization.investment,
    sellingProjects: organization.sellingProjects,
  };
}

function projectsForCity(city: CitySelection): WenshuProjectSnapshot[] {
  return WENSHU_PROJECTS
    .filter((project) => project.cityAdcode === city.cityAdcode)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export default function GrandDashboard() {
  const [queryMode, setQueryMode] = useState<QueryMode>("administrative");
  const [activeScope, setActiveScope] = useState<DashboardScope>(NATIONAL_SCOPE);
  const [activeCity, setActiveCity] = useState<CitySelection | null>(null);
  const [activeOrganizationCode, setActiveOrganizationCode] = useState(WENSHU_ORGANIZATIONS[0].code);
  const activeOrganization = useMemo(
    () => WENSHU_ORGANIZATIONS.find((organization) => organization.code === activeOrganizationCode) ?? WENSHU_ORGANIZATIONS[0],
    [activeOrganizationCode],
  );
  const scopeMetrics = useMemo(() => metricsForScope(activeScope), [activeScope]);
  const organizationMetrics = useMemo(() => metricsForOrganization(activeOrganization), [activeOrganization]);
  const metrics = useMemo(
    () => queryMode === "organization"
      ? organizationMetrics
      : (activeCity ? metricsForCity(activeCity) : scopeMetrics),
    [activeCity, organizationMetrics, queryMode, scopeMetrics],
  );
  const cityProjects = useMemo(() => activeCity ? projectsForCity(activeCity) : [], [activeCity]);
  const chartMax = Math.max(5, Math.ceil((Math.max(...metrics.monthlySales) * 1.2) / 2) * 2);
  const displayScopeName = queryMode === "organization"
    ? activeOrganization.name
    : (activeCity?.name ?? activeScope.name);
  const activeMapAdcodes = queryMode === "organization" ? activeOrganization.adcodes : activeScope.adcodes;
  const usesActualSales = queryMode === "organization"
    || (activeScope.level === "national" && activeCity === null);
  const scopedProjectRows = useMemo(() => {
    if (activeCity) return WENSHU_PROJECTS.filter((project) => project.cityAdcode === activeCity.cityAdcode);
    if (queryMode === "organization") {
      return activeOrganization.adcodes.length === 0
        ? WENSHU_PROJECTS
        : WENSHU_PROJECTS.filter((project) => activeOrganization.adcodes.includes(project.provinceAdcode));
    }
    return activeScope.level === "national"
      ? WENSHU_PROJECTS
      : WENSHU_PROJECTS.filter((project) => activeScope.adcodes.includes(project.provinceAdcode));
  }, [activeCity, activeOrganization.adcodes, activeScope, queryMode]);
  const showProjectDrilldown = queryMode === "administrative" && activeScope.level === "province";
  const drilldownProjects = useMemo(() => {
    if (!showProjectDrilldown) return [];
    return [...(activeCity ? cityProjects : scopedProjectRows)]
      .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  }, [activeCity, cityProjects, scopedProjectRows, showProjectDrilldown]);
  const usesOrganizationScale = queryMode === "organization"
    || (activeScope.level === "national" && activeCity === null);
  const scaleOrganization = queryMode === "organization" ? activeOrganization : ROOT_ORGANIZATION;
  const administrativeTotalArea = roundOne(scopedProjectRows.reduce((total, project) => total + project.totalBuildingAreaWan, 0));
  const administrativeConstructionArea = roundOne(scopedProjectRows
    .filter((project) => project.developmentStatus === "在建")
    .reduce((total, project) => total + project.totalBuildingAreaWan, 0));
  const scaleFacts = usesOrganizationScale ? [
    { label: "项目总数", value: String(scaleOrganization.totalProjects), unit: "个" },
    { label: "待开发", value: String(scaleOrganization.pendingProjects), unit: "个" },
    { label: "在建", value: String(scaleOrganization.constructionProjects), unit: "个" },
    { label: "土储总建面", value: formatNumber(scaleOrganization.soilArea), unit: "万㎡" },
    { label: "在建总建面", value: formatNumber(scaleOrganization.constructionArea), unit: "万㎡" },
  ] : [
    { label: "项目总数", value: String(scopedProjectRows.length), unit: "个" },
    { label: "待开发", value: String(scopedProjectRows.filter((project) => project.developmentStatus === "待开发").length), unit: "个" },
    { label: "在建", value: String(scopedProjectRows.filter((project) => project.developmentStatus === "在建").length), unit: "个" },
    { label: "项目总建面", value: formatNumber(administrativeTotalArea), unit: "万㎡" },
    { label: "在建总建面", value: formatNumber(administrativeConstructionArea), unit: "万㎡" },
  ];
  const investmentOrganization = queryMode === "organization" ? activeOrganization : ROOT_ORGANIZATION;
  const investmentFacts = [
    { label: "年度新拓项目", value: String(investmentOrganization.newProjects), unit: "个" },
    { label: "新拓货值", value: formatNumber(investmentOrganization.newValue, 2), unit: "亿元" },
    { label: "权益货值", value: investmentOrganization.equityValue === null ? "—" : formatNumber(investmentOrganization.equityValue, 2), unit: "亿元" },
    { label: "投资额", value: formatNumber(investmentOrganization.investment, 2), unit: "亿元" },
    { label: "权益投资额", value: investmentOrganization.equityInvestment === null ? "—" : formatNumber(investmentOrganization.equityInvestment, 2), unit: "亿元" },
  ];

  const selectScope = useCallback((scope: DashboardScope) => {
    setActiveCity(null);
    setActiveScope(scope);
  }, []);

  const selectQueryMode = useCallback((mode: QueryMode) => {
    setActiveCity(null);
    setQueryMode(mode);
  }, []);

  const selectOrganization = useCallback((organization: WenshuOrganizationSnapshot) => {
    setActiveCity(null);
    setActiveOrganizationCode(organization.code);
    setQueryMode("organization");
  }, []);

  const handleProvinceSelect = useCallback((province: ProvinceSelection) => {
    setQueryMode("administrative");
    setActiveCity(null);
    setActiveScope({
      id: `province-${province.adcode}`,
      name: province.name,
      level: "province",
      adcodes: [province.adcode],
    });
  }, []);

  const handleCitySelect = useCallback((city: CitySelection) => {
    setQueryMode("administrative");
    setActiveScope({
      id: `province-${city.provinceAdcode}`,
      name: city.provinceName,
      level: "province",
      adcodes: [city.provinceAdcode],
    });
    setActiveCity(city);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (activeCity) setActiveCity(null);
      else if (queryMode === "organization" && activeOrganization.code !== WENSHU_ORGANIZATIONS[0].code) {
        selectOrganization(WENSHU_ORGANIZATIONS[0]);
      } else if (queryMode === "organization") {
        setQueryMode("administrative");
      } else selectScope(NATIONAL_SCOPE);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCity, activeOrganization.code, queryMode, selectOrganization, selectScope]);

  return (
    <main className="grand-dashboard grand-map-dashboard vision-cockpit">
      <div className="grand-grid" aria-hidden="true" />

      <div className="grand-cockpit-map-layer" aria-live="polite">
        <TechMap
          activeAdcodes={activeMapAdcodes}
          activeCityAdcode={activeCity?.cityAdcode ?? null}
          scopeName={displayScopeName}
          viewOffsetX={0}
          onProvinceSelect={handleProvinceSelect}
          onCitySelect={handleCitySelect}
        />
      </div>

      <header className="grand-header grand-unified-header">
        <div className="grand-brand grand-logo-brand">
          <img src="/greentown-logo-full.png" alt="绿城中国 GREENTOWN" />
        </div>
        <div className="grand-heading">
          <p className="vision-heading-kicker">EXECUTIVE OPERATIONS · REALTIME VIEW</p>
          <h1>绿城中国经营驾驶舱</h1>
        </div>
        <div className="grand-data-date">
          <i className="vision-live-dot" aria-hidden="true" />
          <div><span>数据截至</span><b>{WENSHU_SNAPSHOT_DATE}</b></div>
        </div>

        <div className="grand-header-filterbar">
          <div className="grand-query-mode" role="group" aria-label="地图查询口径">
            <button
              type="button"
              className={queryMode === "administrative" ? "is-active" : ""}
              aria-pressed={queryMode === "administrative"}
              onClick={() => selectQueryMode("administrative")}
            >行政区划</button>
            <button
              type="button"
              className={queryMode === "organization" ? "is-active" : ""}
              aria-pressed={queryMode === "organization"}
              onClick={() => selectQueryMode("organization")}
            >经营组织</button>
          </div>

          <nav className="grand-scope-switch" aria-label={queryMode === "organization" ? "经营组织选择" : "经营范围选择"}>
            {queryMode === "organization" ? WENSHU_ORGANIZATIONS.map((organization) => (
              <button
                key={organization.code}
                type="button"
                className={activeOrganization.code === organization.code ? "is-active" : ""}
                aria-pressed={activeOrganization.code === organization.code}
                onClick={() => selectOrganization(organization)}
              >
                {organization.name}
              </button>
            )) : SCOPE_OPTIONS.map((scope) => (
              <button
                key={scope.id}
                type="button"
                className={activeScope.id === scope.id ? "is-active" : ""}
                aria-pressed={activeScope.id === scope.id}
                onClick={() => selectScope(scope)}
              >
                {scope.name}
              </button>
            ))}
            {queryMode === "administrative" && activeScope.level === "province" && (
              <button type="button" className="is-active is-province" aria-pressed="true">
                <span>当前</span>{activeScope.name}
              </button>
            )}
          </nav>
        </div>
      </header>

      <section className="grand-overlay-layout">
        <aside className="grand-command-panel" aria-label={`${displayScopeName}经营指标`}>
          <section className="grand-metric-group is-scale" aria-labelledby="scale-title">
            <header className="grand-group-heading">
              <span>01</span>
              <div><p>OPERATING SCALE</p><h2 id="scale-title">经营规模</h2></div>
              <em>项目开发状态 · {usesOrganizationScale ? "集团台账口径" : "行政区有效项目口径"}</em>
            </header>
            <div className="grand-metric-group-grid grand-five-metrics">
              {scaleFacts.map((fact) => (
                <article key={fact.label}>
                  <span>{fact.label}</span>
                  <div><strong>{fact.value}</strong><em>{fact.unit}</em></div>
                </article>
              ))}
            </div>
          </section>

          <section className="grand-metric-group is-investment" aria-labelledby="investment-title">
            <header className="grand-group-heading">
              <span>02</span>
              <div><p>INVESTMENT DEVELOPMENT</p><h2 id="investment-title">投资发展</h2></div>
              <em>{queryMode === "organization"
                ? `${activeOrganization.name}口径 · 实际获取`
                : (activeScope.level === "national" && activeCity === null
                  ? "全国台账口径 · 实际获取"
                  : "全国台账口径 · 不随行政区联动")}</em>
            </header>
            <div className="grand-metric-group-grid grand-five-metrics">
              {investmentFacts.map((fact) => (
                <article key={fact.label}>
                  <span>{fact.label}</span>
                  <div><strong>{fact.value}</strong><em>{fact.unit}</em></div>
                </article>
              ))}
            </div>
          </section>

          <section className="grand-metric-group is-sales" aria-labelledby="sales-title">
            <header className="grand-group-heading">
              <span>03</span>
              <div><p>SALES PERFORMANCE</p><h2 id="sales-title">销售业绩</h2></div>
              <em>问数实际签约口径</em>
            </header>
            {usesActualSales ? (
              <div className="grand-sales-story">
                <div className="grand-sales-kpi">
                  <span>累计合同销售额</span>
                  <div><strong>{formatNumber(metrics.sales, 2)}</strong><em>亿元</em></div>
                  <i className={metrics.growth < 0 ? "is-negative" : ""}>
                    本月日均环比 {formatSignedPercentage(metrics.growth)}
                  </i>
                  <small>全业态实际签约，不含目标及预测</small>
                </div>
                <div className="grand-story-chart" aria-label={`${displayScopeName}1至8月销售趋势`}>
                  {metrics.monthlySales.map((value, index) => {
                    const barHeight = `${Math.max(10, (value / chartMax) * 100)}%`;
                    return (
                      <div key={index} style={{ "--bar-height": barHeight } as CSSProperties}>
                        <b>{value.toFixed(1)}</b>
                        <i title={`${index + 1}月 ${value.toFixed(1)}亿元`} />
                        <span>{index + 1}月</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grand-sales-story is-unavailable">
                <div className="grand-sales-kpi">
                  <span>累计合同销售额</span>
                  <div><strong>—</strong></div>
                  <i>行政区销售数据暂未接入</i>
                  <small>请切换“经营组织”查看问数实际金额与月度趋势</small>
                </div>
                <div className="grand-story-empty">当前仅联动行政区项目规模与项目明细</div>
              </div>
            )}
          </section>
        </aside>

        <section className="grand-map-ui" aria-label="行政区经营地图与筛选">
          <header className="vision-map-header">
            <span>04</span>
            <div>
              <p>PROJECT DISTRIBUTION</p>
              <h2>项目布局</h2>
            </div>
            <em><i aria-hidden="true" />3D 交互地图</em>
          </header>
          {showProjectDrilldown ? (
            <section className="grand-project-drilldown" aria-label={`${activeCity?.name ?? activeScope.name}项目列表`}>
              <header>
                <div>
                  <p>全国 <i /> {activeScope.name}{activeCity && <><i /> {activeCity.name}</>}</p>
                  <h3>{activeCity?.name ?? activeScope.name}项目列表</h3>
                  <span>共 {drilldownProjects.length} 个项目 · {activeCity ? "点击其他城市可切换" : "点击城市节点可继续下钻"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => activeCity ? setActiveCity(null) : selectScope(NATIONAL_SCOPE)}
                >{activeCity ? "返回省级" : "返回全国"}</button>
              </header>
              <div className="grand-project-table-head" aria-hidden="true">
                <span>项目名称</span>
                <span>业态</span>
                <span>绿城方权益股比</span>
                <span>总建面</span>
                <span>销售状态</span>
              </div>
              <div className="grand-project-list" role="list">
                {drilldownProjects.map((project) => {
                  const attribute = WENSHU_PROJECT_ATTRIBUTES[project.id];
                  const equityRatio = attribute?.greentownEquityRatio;
                  return (
                    <article key={project.id} role="listitem">
                      <div><b>{project.name}</b><span>{project.cityName} · {project.developmentStatus}</span></div>
                      <span>{attribute?.propertyTypes ?? "—"}</span>
                      <span className="grand-project-number"><b>{equityRatio == null ? "—" : `${formatNumber(equityRatio, Number.isInteger(equityRatio) ? 0 : 1)}%`}</b></span>
                      <span className="grand-project-number"><b>{project.totalBuildingAreaWan > 0 ? formatNumber(project.totalBuildingAreaWan, 2) : "—"}</b>{project.totalBuildingAreaWan > 0 ? " 万㎡" : ""}</span>
                      <em className={`is-status-${project.saleStatus}`}>{project.saleStatus}</em>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : (
            <div className="grand-map-caption">
              <b>{displayScopeName}</b>
              <span>{queryMode === "organization"
                ? `${metrics.cityCount} 座覆盖城市 · ${metrics.totalProjects} 个项目 · ${metrics.projects} 个在建`
                : `已点亮 ${metrics.cityCount} 座覆盖城市 · 已定位 ${scopedProjectRows.length} 个有效项目`}</span>
              <small>{queryMode === "organization"
                ? "经营组织已映射至行政区；点击地图行政区可切换到行政查询"
                : "点击行政区，再点击城市节点查看全部项目"}</small>
            </div>
          )}
        </section>
      </section>

      <footer className="grand-footer">
        <span>{displayScopeName}经营概览 · 全业态</span>
        <span>行政区划 / 经营组织双口径 · {WENSHU_COVERED_CITY_COUNT} 城 · {WENSHU_DOMESTIC_PROJECT_COUNT} 个国内有效项目</span>
        <span>问数实际快照 · 不含目标及预测</span>
      </footer>
    </main>
  );
}
