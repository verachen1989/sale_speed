"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import TechMap from "./tech-map";
import type { CitySelection, ProvinceSelection } from "./tech-map";
import {
  WENSHU_FIRST_LEVEL_ORGANIZATIONS,
  WENSHU_ORGANIZATION_NAV_LABELS,
  WENSHU_ORGANIZATIONS,
  type WenshuOrganizationSnapshot,
} from "./wenshu-snapshot";
import {
  WENSHU_CITY_SALES_6283,
  WENSHU_CITY_SALES_6283_SNAPSHOT_DATE,
} from "./wenshu-city-sales-snapshot";
import {
  WENSHU_CITY_SUMMARIES,
  WENSHU_COVERED_CITY_COUNT,
  WENSHU_DOMESTIC_PROJECT_COUNT,
  WENSHU_PROJECTS,
} from "./wenshu-projects-snapshot";
import { WENSHU_PROJECT_ATTRIBUTES } from "./wenshu-project-attributes";
import { WENSHU_ORGANIZATION_DEVELOPMENT_3002 } from "./wenshu-organization-development-snapshot";
import { formatMoneyFromYi } from "./money-format";
import { publicAssetPath } from "./public-path";
import { useDashboardCountUp } from "./use-dashboard-count-up";

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

type MetricFact = {
  label: string;
  value: string;
  unit: string;
};

type CompositeFact = MetricFact & {
  id: string;
  supporting?: MetricFact & { id: string };
};

const ROOT_ORGANIZATION = WENSHU_ORGANIZATIONS[0];
const NAV_ORGANIZATIONS = [ROOT_ORGANIZATION, ...WENSHU_FIRST_LEVEL_ORGANIZATIONS];
const PUBLIC_DISPLAY_DATE = "2025.8.6";

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function CompositeMetricFacts({ facts }: { facts: CompositeFact[] }) {
  return (
    <div className="grand-composite-facts">
      {facts.map((fact) => (
        <article
          key={fact.id}
          className={fact.supporting ? "has-supporting" : "is-standalone"}
          data-metric-id={fact.id}
          data-tier="primary"
          data-has-supporting={fact.supporting ? "true" : "false"}
        >
          <span className="grand-composite-label">{fact.label}</span>
          <div className="grand-composite-value">
            <strong>{fact.value}</strong><em>{fact.unit}</em>
          </div>
          {fact.supporting && (
            <div
              className="grand-embedded-fact"
              data-metric-id={fact.supporting.id}
              data-tier="supporting"
              data-parent-metric-id={fact.id}
            >
              <span>{fact.supporting.label}</span>
              <strong>{fact.supporting.value}</strong>
              <em>{fact.supporting.unit}</em>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function formatSignedPercentage(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
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

export default function GrandDashboard({
  onSwitchToShowcase,
}: {
  onSwitchToShowcase: () => void;
}) {
  const cockpitRef = useRef<HTMLElement>(null);
  const [activeCity, setActiveCity] = useState<CitySelection | null>(null);
  const [activeProvince, setActiveProvince] = useState<ProvinceSelection | null>(null);
  const [activeOrganizationCode, setActiveOrganizationCode] = useState(WENSHU_ORGANIZATIONS[0].code);
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  useDashboardCountUp(
    cockpitRef,
    "initial-dashboard-entry",
    ".grand-composite-value strong, .grand-embedded-fact strong, .grand-sales-kpi strong",
  );
  const activeOrganization = useMemo(
    () => WENSHU_ORGANIZATIONS.find((organization) => organization.code === activeOrganizationCode) ?? WENSHU_ORGANIZATIONS[0],
    [activeOrganizationCode],
  );
  const activeOrganizationDevelopment = useMemo(
    () => WENSHU_ORGANIZATION_DEVELOPMENT_3002[activeOrganization.code] ?? null,
    [activeOrganization.code],
  );
  const activeOrganizationCities = useMemo(() => {
    if (activeOrganization.code === ROOT_ORGANIZATION.code) {
      return [...WENSHU_CITY_SUMMARIES]
        .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh-CN"));
    }
    const managedCityNames = new Set(activeOrganizationDevelopment?.cities.map((city) => city.name) ?? []);
    return WENSHU_CITY_SUMMARIES
      .filter((city) => managedCityNames.has(city.name))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh-CN"));
  }, [activeOrganization.code, activeOrganizationDevelopment]);
  const activeOrganizationCityAdcodes = useMemo(
    () => activeOrganizationCities.map((city) => city.cityAdcode),
    [activeOrganizationCities],
  );
  const activeOrganizationCityAdcodeSet = useMemo(
    () => new Set(activeOrganizationCityAdcodes),
    [activeOrganizationCityAdcodes],
  );
  const activeOrganizationProvinceAdcodes = useMemo(
    () => [...new Set(activeOrganizationCities.map((city) => city.provinceAdcode))],
    [activeOrganizationCities],
  );
  const visibleMapCities = useMemo(
    () => activeProvince
      ? activeOrganizationCities.filter((city) => city.provinceAdcode === activeProvince.adcode)
      : activeOrganizationCities,
    [activeOrganizationCities, activeProvince],
  );
  const scopedCityAdcodes = useMemo(
    () => visibleMapCities.map((city) => city.cityAdcode),
    [visibleMapCities],
  );
  const activeMapAdcodes = useMemo(
    () => activeProvince ? [activeProvince.adcode] : activeOrganizationProvinceAdcodes,
    [activeOrganizationProvinceAdcodes, activeProvince],
  );
  const organizationProjectRows = useMemo(() => {
    if (activeOrganization.code === ROOT_ORGANIZATION.code) return WENSHU_PROJECTS;
    return WENSHU_PROJECTS.filter((project) => activeOrganizationCityAdcodeSet.has(project.cityAdcode));
  }, [activeOrganization.code, activeOrganizationCityAdcodeSet]);
  const drilldownProjects = useMemo(() => (
    organizationProjectRows
      .filter((project) => !activeProvince || project.provinceAdcode === activeProvince.adcode)
      .filter((project) => !activeCity || project.cityAdcode === activeCity.cityAdcode)
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, "zh-CN"))
  ), [activeCity, activeProvince, organizationProjectRows]);
  const organizationMetrics = useMemo(() => metricsForOrganization(activeOrganization), [activeOrganization]);
  const activeCitySales = activeCity ? WENSHU_CITY_SALES_6283[activeCity.name] : undefined;
  const usesCitySales6283 = Boolean(activeCity && activeCitySales);
  const metrics = useMemo(() => {
    if (!activeCitySales || !activeCity) return organizationMetrics;
    const julySales = activeCitySales.monthlyContractSalesYi[6] ?? 0;
    const augustSales = activeCitySales.monthlyContractSalesYi[7] ?? 0;
    const growth = julySales > 0
      ? ((augustSales / 24) / (julySales / 31) - 1) * 100
      : 0;
    return {
      ...organizationMetrics,
      sales: activeCitySales.contractSalesYi,
      growth,
      monthlySales: activeCitySales.monthlyContractSalesYi,
      summary: `${activeCity.name}合同销售趋势`,
    };
  }, [activeCity, activeCitySales, organizationMetrics]);
  const chartPeak = Math.max(...metrics.monthlySales.map((value) => Math.abs(value)));
  const chartMax = Math.max(5, Math.ceil((chartPeak * 1.2) / 2) * 2);
  const salesScaleAnchor = Math.max(Math.abs(metrics.sales), chartPeak);
  const salesUnit = formatMoneyFromYi(salesScaleAnchor).unit;
  const salesDisplay = formatMoneyFromYi(metrics.sales, { unit: salesUnit });
  const displayScopeName = activeCity?.name ?? activeProvince?.name ?? activeOrganization.name;
  const mapScopeName = activeCity?.name ?? activeProvince?.name ?? activeOrganization.name;
  const showProjectDrilldown = isProjectListOpen;
  const visibleProjectRows = Math.min(Math.max(drilldownProjects.length, 1), 5);
  const projectListTitle = activeCity
    ? `${activeOrganization.name} · ${activeCity.name}项目清单`
    : activeProvince
      ? `${activeOrganization.name} · ${activeProvince.name}项目清单`
      : `${activeOrganization.name}覆盖城市项目`;
  const scaleFacts: CompositeFact[] = [
    {
      id: "total-projects",
      label: "项目总数",
      value: String(activeOrganization.totalProjects),
      unit: "个",
      supporting: {
        id: "total-land-area",
        label: "土储总建面",
        value: formatNumber(activeOrganization.soilArea),
        unit: "万㎡",
      },
    },
    {
      id: "construction-projects",
      label: "在建",
      value: String(activeOrganization.constructionProjects),
      unit: "个",
      supporting: {
        id: "construction-area",
        label: "在建总建面",
        value: formatNumber(activeOrganization.constructionArea),
        unit: "万㎡",
      },
    },
    {
      id: "pending-projects",
      label: "待开发",
      value: String(activeOrganization.pendingProjects),
      unit: "个",
      supporting: {
        id: "pending-area",
        label: "待开发建面",
        value: formatNumber(activeOrganization.pendingArea),
        unit: "万㎡",
      },
    },
  ];
  const investmentFacts: CompositeFact[] = [
    {
      id: "new-projects",
      label: "年度新拓项目",
      value: String(activeOrganization.newProjects),
      unit: "个",
    },
    {
      id: "new-value",
      label: "新拓货值",
      value: formatNumber(activeOrganization.newValue, 2),
      unit: "亿元",
      supporting: {
        id: "equity-value",
        label: "权益货值",
        value: activeOrganization.equityValue !== null
          ? formatNumber(activeOrganization.equityValue, 2)
          : "—",
        unit: "亿元",
      },
    },
    {
      id: "investment",
      label: "投资额",
      value: formatNumber(activeOrganization.investment, 2),
      unit: "亿元",
      supporting: {
        id: "equity-investment",
        label: "权益投资额",
        value: activeOrganization.equityInvestment !== null
          ? formatNumber(activeOrganization.equityInvestment, 2)
          : "—",
        unit: "亿元",
      },
    },
  ];

  const selectOrganization = useCallback((organization: WenshuOrganizationSnapshot) => {
    setActiveCity(null);
    setActiveProvince(null);
    setIsProjectListOpen(false);
    setActiveOrganizationCode(organization.code);
  }, []);

  const handleProvinceSelect = useCallback((province: ProvinceSelection) => {
    if (!activeOrganizationProvinceAdcodes.includes(province.adcode)) return;
    setActiveCity(null);
    setActiveProvince(province);
    setIsProjectListOpen(true);
  }, [activeOrganizationProvinceAdcodes]);

  const handleCitySelect = useCallback((city: CitySelection) => {
    if (!activeOrganizationCityAdcodeSet.has(city.cityAdcode)) return;
    setActiveProvince({ adcode: city.provinceAdcode, name: city.provinceName });
    setActiveCity(city);
    setIsProjectListOpen(true);
  }, [activeOrganizationCityAdcodeSet]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showProjectDrilldown) setIsProjectListOpen(false);
      else if (activeCity) setActiveCity(null);
      else if (activeProvince) setActiveProvince(null);
      else if (activeOrganization.code !== ROOT_ORGANIZATION.code) {
        selectOrganization(WENSHU_ORGANIZATIONS[0]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCity, activeOrganization.code, activeProvince, selectOrganization, showProjectDrilldown]);

  return (
    <main
      ref={cockpitRef}
      className="grand-dashboard grand-map-dashboard vision-cockpit"
      data-query-mode="organization"
      data-active-organization-code={activeOrganization.code}
      data-active-province-adcode={activeProvince?.adcode ?? ""}
      data-active-city-adcode={activeCity?.cityAdcode ?? ""}
      data-display-scope={displayScopeName}
      data-project-list-open={showProjectDrilldown ? "true" : "false"}
      style={{ "--grand-project-content-height": `${176 + visibleProjectRows * 64}px` } as CSSProperties}
    >
      <div className="grand-grid" aria-hidden="true" />

      <div className="grand-cockpit-map-layer" aria-live="polite">
        <TechMap
          activeAdcodes={activeMapAdcodes}
          activeCityAdcode={activeCity?.cityAdcode ?? null}
          scopedCityAdcodes={scopedCityAdcodes}
          scopeName={mapScopeName}
          viewOffsetX={-7}
          labelOcclusionSelector=".vision-cockpit .grand-command-panel"
          interactionMode="drilldown"
          onProvinceSelect={handleProvinceSelect}
          onCitySelect={handleCitySelect}
        />
      </div>

      <header className="grand-header grand-unified-header">
        <div className="grand-brand grand-logo-brand">
          <img src={publicAssetPath("/greentown-logo-header.png")} alt="绿城中国 GREENTOWN" />
        </div>
        <div className="grand-heading">
          <p className="vision-heading-kicker">EXECUTIVE OPERATIONS · REALTIME VIEW</p>
          <h1>绿城中国经营驾驶舱</h1>
        </div>
        <div className="grand-header-actions">
          <div className="fusion-view-switch" role="group" aria-label="大屏视图切换">
            <button type="button" aria-pressed="false" onClick={onSwitchToShowcase}>融合地图</button>
            <button type="button" className="is-active" aria-pressed="true">项目驾驶舱</button>
          </div>
          <div className="grand-data-date">
            <i className="vision-live-dot" aria-hidden="true" />
            <div><span>数据截至</span><b>{PUBLIC_DISPLAY_DATE}</b></div>
          </div>
        </div>

        <div className="grand-header-filterbar">
          <nav className="grand-scope-switch" aria-label="经营组织选择">
            {NAV_ORGANIZATIONS.map((organization) => (
              <button
                key={organization.code}
                type="button"
                className={activeOrganization.code === organization.code ? "is-active" : ""}
                aria-pressed={activeOrganization.code === organization.code}
                aria-label={organization.dashboardAvailable === false ? `${organization.name}，当前暂无可展示内容` : organization.name}
                disabled={organization.dashboardAvailable === false}
                onClick={() => selectOrganization(organization)}
              >
                {WENSHU_ORGANIZATION_NAV_LABELS[organization.code] ?? organization.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <section className="grand-overlay-layout">
        <aside className="grand-command-panel" aria-label={`${displayScopeName}经营指标`}>
          <section
            className="grand-metric-group is-scale"
            aria-labelledby="scale-title"
            data-metric-group="operating-scale"
            data-composition="embedded-supporting"
            data-primary-count="3"
            data-supporting-count="3"
          >
            <header className="grand-group-heading">
              <span>01</span>
              <div><p>OPERATING SCALE</p><h2 id="scale-title">经营规模</h2></div>
            </header>
            <CompositeMetricFacts facts={scaleFacts} />
          </section>

          <section
            className="grand-metric-group is-investment"
            aria-labelledby="investment-title"
            data-metric-group="investment-development"
            data-composition="embedded-supporting"
            data-primary-count="3"
            data-supporting-count="2"
            data-data-status="actual"
          >
            <header className="grand-group-heading">
              <span>02</span>
              <div><p>INVESTMENT DEVELOPMENT</p><h2 id="investment-title">投资发展</h2></div>
            </header>
            <CompositeMetricFacts facts={investmentFacts} />
          </section>

          <section
            className="grand-metric-group is-sales"
            aria-labelledby="sales-title"
            data-data-status="actual"
            data-source-dataset={usesCitySales6283 ? "6283" : undefined}
          >
            <header className="grand-group-heading">
              <span>03</span>
              <div><p>SALES PERFORMANCE</p><h2 id="sales-title">销售业绩</h2></div>
            </header>
            <div className="grand-sales-story">
              <div className="grand-sales-kpi">
                <span>累计合同销售额</span>
                <div><strong>{salesDisplay.value}</strong><em>{salesDisplay.unit}</em></div>
                <i className={!usesCitySales6283 && metrics.growth < 0 ? "is-negative" : ""}>
                  {usesCitySales6283
                    ? "城市累计合同销售"
                    : <>本月日均环比 {formatSignedPercentage(metrics.growth)}</>}
                </i>
                <small>{usesCitySales6283
                  ? `住宅、商办及车储在售项目 · 截至 ${WENSHU_CITY_SALES_6283_SNAPSHOT_DATE}`
                  : "全业态实际签约，不含目标及预测"}</small>
              </div>
              <div className="grand-story-chart" aria-label={`${displayScopeName}1至8月销售趋势`}>
                <small className="grand-story-unit">单位：{salesDisplay.unit}</small>
                {metrics.monthlySales.map((value, index) => {
                  const barMagnitude = Math.abs(value);
                  const formattedValue = formatMoneyFromYi(value, { unit: salesUnit }).value;
                  const barLabel = `${index + 1}月 ${formattedValue}${salesUnit}${value < 0 ? "，合同冲减" : ""}`;
                  const barHeight = barMagnitude === 0
                    ? "0%"
                    : `${Math.max(usesCitySales6283 ? 4 : 10, (barMagnitude / chartMax) * 100)}%`;
                  return (
                    <div
                      key={index}
                      className={value === 0 ? "is-zero" : (value < 0 ? "is-negative" : "")}
                      style={{ "--bar-height": barHeight } as CSSProperties}
                    >
                      <b>{formattedValue}</b>
                      <i role="img" aria-label={barLabel} title={barLabel} />
                      <span>{index + 1}月</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </aside>

        <section className="grand-map-ui" aria-label="经营组织覆盖地图与项目穿透">
          {showProjectDrilldown ? (
            <section
              className="grand-project-drilldown"
              aria-label={projectListTitle}
              data-organization-code={activeOrganization.code}
              data-province-adcode={activeProvince?.adcode ?? ""}
              data-active-city-adcode={activeCity?.cityAdcode ?? ""}
            >
              <header>
                <div>
                  <p>
                    全国
                    {activeOrganization.code !== ROOT_ORGANIZATION.code && <><i /> {activeOrganization.name}</>}
                    {activeProvince && <><i /> {activeProvince.name}</>}
                    {activeCity && <><i /> {activeCity.name}</>}
                  </p>
                  <h3>{projectListTitle}</h3>
                  <span>
                    共 {drilldownProjects.length} 个项目 · {activeCity ? "可切换其他覆盖城市" : "点击城市继续下钻"}
                  </span>
                </div>
                <div className="grand-project-actions">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeCity) setActiveCity(null);
                      else if (activeProvince) setActiveProvince(null);
                      else setIsProjectListOpen(false);
                    }}
                  >{activeCity
                      ? `返回${activeProvince?.name ?? activeOrganization.name}`
                      : activeProvince
                        ? `返回${activeOrganization.name}`
                        : "收起列表"}</button>
                  <button
                    type="button"
                    className="grand-project-close"
                    aria-label="关闭项目列表"
                    title="关闭项目列表"
                    onClick={() => setIsProjectListOpen(false)}
                  >×</button>
                </div>
              </header>
              <nav
                className="grand-city-directory"
                aria-label={`${activeOrganization.name}覆盖城市选择`}
                data-city-count={activeOrganizationCities.length}
              >
                <button
                  type="button"
                  className={activeCity === null && activeProvince === null ? "is-active" : ""}
                  aria-pressed={activeCity === null && activeProvince === null}
                  onClick={() => {
                    setActiveCity(null);
                    setActiveProvince(null);
                  }}
                >
                  <b>全部项目</b><span>{organizationProjectRows.length}</span>
                </button>
                {activeOrganizationCities.map((city) => (
                  <button
                    type="button"
                    key={city.cityAdcode}
                    className={activeCity?.cityAdcode === city.cityAdcode ? "is-active" : ""}
                    aria-pressed={activeCity?.cityAdcode === city.cityAdcode}
                    data-city-adcode={city.cityAdcode}
                    onClick={() => handleCitySelect({
                      cityAdcode: city.cityAdcode,
                      provinceAdcode: city.provinceAdcode,
                      provinceName: city.provinceName,
                      name: city.name,
                      count: city.count,
                    })}
                  >
                    <b>{city.name}</b><span>{city.count}</span>
                  </button>
                ))}
              </nav>
              <div className="grand-project-table-head" aria-hidden="true">
                <span>项目名称</span>
                <span>业态</span>
                <span>绿城方权益股比</span>
                <span>总建面</span>
                <span>销售状态</span>
              </div>
              <div className="grand-project-list" role="list" data-project-count={drilldownProjects.length}>
                {drilldownProjects.map((project) => {
                  const attribute = WENSHU_PROJECT_ATTRIBUTES[project.id];
                  const equityRatio = attribute?.greentownEquityRatio;
                  return (
                    <article key={project.id} role="listitem">
                      <div><b>{project.name}</b><span>{project.cityName} · {project.developmentStatus}</span></div>
                      <span>{attribute?.propertyTypes ?? "—"}</span>
                      <span className="grand-project-number">
                        <b>{equityRatio == null ? "—" : formatNumber(equityRatio, Number.isInteger(equityRatio) ? 0 : 1)}</b>
                        {equityRatio == null ? null : <small>%</small>}
                      </span>
                      <span className="grand-project-number">
                        <b>{project.totalBuildingAreaWan > 0 ? formatNumber(project.totalBuildingAreaWan, 2) : "—"}</b>
                        {project.totalBuildingAreaWan > 0 ? <small>万㎡</small> : null}
                      </span>
                      <em className={`is-status-${project.saleStatus}`}>{project.saleStatus}</em>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : (
            <div className="grand-map-caption">
              <b>{activeCity
                ? `${activeOrganization.name} · ${activeCity.name}`
                : activeProvince
                  ? `${activeOrganization.name} · ${activeProvince.name}`
                  : activeOrganization.name}</b>
              <span>
                {activeOrganizationCities.length} 座覆盖城市 · {drilldownProjects.length} 个项目
              </span>
              <small>经营组织 → 覆盖行政区 → 城市 → 项目清单</small>
              <button
                type="button"
                className="grand-map-caption-action"
                onClick={() => setIsProjectListOpen(true)}
              >查看{activeCity ? "城市" : activeProvince ? "行政区" : "覆盖城市"}项目 →</button>
            </div>
          )}
        </section>
      </section>

      <footer className="grand-footer">
        <span>{displayScopeName}经营概览 · 全业态</span>
        <span>经营组织 → 覆盖行政区 → 城市 → 项目清单 · {WENSHU_COVERED_CITY_COUNT} 城 · {WENSHU_DOMESTIC_PROJECT_COUNT} 个国内有效项目</span>
        <span>数据截至 {PUBLIC_DISPLAY_DATE} · 不含目标及预测</span>
      </footer>
    </main>
  );
}
