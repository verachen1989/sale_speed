"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { AnnualMetric, AnnualMetricGroup } from "./annual-metrics";
import {
  ANNUAL_METRIC_GROUPS,
  ANNUAL_METRIC_TOTALS,
  annualMetricDisplay,
} from "./annual-metrics";
import TechMap, { type CitySelection, type ProvinceSelection } from "./tech-map";
import {
  WENSHU_CITY_SUMMARIES,
  WENSHU_PROJECTS,
  WENSHU_VALUE_BY_ORG,
  WENSHU_VALUE_SNAPSHOT_DATE,
} from "./wenshu-projects-snapshot";
import { WENSHU_PROJECT_ATTRIBUTES } from "./wenshu-project-attributes";
import { formatMoneyFromYi } from "./money-format";
import { getMapRegionMetrics, type MapRegionMetrics } from "./map-region-metrics";
import { publicAssetPath } from "./public-path";
import {
  WENSHU_ORGANIZATION_DEVELOPMENT_3002,
  WENSHU_ORGANIZATION_DEVELOPMENT_SNAPSHOT_DATE,
  type WenshuOrganizationDevelopmentSnapshot,
} from "./wenshu-organization-development-snapshot";
import {
  WENSHU_CITY_SALES_6283,
  WENSHU_CITY_SALES_6283_SNAPSHOT_DATE,
} from "./wenshu-city-sales-snapshot";
import {
  WENSHU_FIRST_LEVEL_ORGANIZATIONS,
  WENSHU_ORGANIZATION_NAV_LABELS,
  type WenshuOrganizationSnapshot,
} from "./wenshu-snapshot";
import { useDashboardCountUp } from "./use-dashboard-count-up";
import DashboardViewSwitch, { type DashboardView } from "./dashboard-view-switch";

const STAGE_SIGNAL_METRIC_IDS: Record<AnnualMetricGroup["id"], readonly string[]> = {
  investment: ["investment-projects", "investment-new-value", "investment-saleable-area"],
  construction: ["construction-demo", "construction-launch", "construction-delivery"],
  delivery: ["delivery-satisfaction", "delivery-area", "delivery-households"],
  sales: ["sales-total-amount", "sales-self-amount", "sales-management-amount"],
  holding: ["holding-hotel", "holding-rent"],
  special: ["special-events", "special-members", "special-decoration"],
  reserve: ["reserve-projects", "reserve-tier12", "reserve-yangtze"],
};
const LEFT_MODULE_IDS = new Set<AnnualMetricGroup["id"]>(["investment", "delivery", "sales"]);
const OPERATING_ORGANIZATIONS = WENSHU_FIRST_LEVEL_ORGANIZATIONS;

function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function squareMetresToWan(value: number) {
  return value / 10_000;
}

function MetricTile({ metric }: { metric: AnnualMetric }) {
  const display = annualMetricDisplay(metric);
  const numericValue = Number(metric.value.replaceAll(",", ""));
  const progress = metric.unit === "%" && Number.isFinite(numericValue)
    ? Math.max(0, Math.min(100, numericValue))
    : null;

  return (
    <article
      className={`${metric.kind === "text" ? "is-text" : ""} ${progress === null ? "" : "is-progress"}`}
      data-metric-id={metric.id}
      data-priority={metric.priority}
      style={progress === null ? undefined : { "--metric-progress": `${progress}%` } as CSSProperties}
    >
      <span>{metric.label}</span>
      <div><strong>{display.value}</strong>{metric.unit ? <em>{metric.unit}</em> : null}</div>
      {progress !== null ? <i className="fusion-metric-progress" aria-hidden="true"><u /></i> : null}
      {display.note ? <small>{display.note}</small> : null}
    </article>
  );
}

const SALES_METRIC_SECTIONS = [
  {
    id: "scale",
    name: "销售规模",
    metricIds: ["sales-total-area", "sales-self-area", "sales-management-area", "sales-self-equity", "sales-self-price"],
  },
  {
    id: "launch",
    name: "首开表现",
    metricIds: ["sales-first-launches", "sales-first-rate", "sales-premium"],
  },
  {
    id: "structure",
    name: "城市结构",
    metricIds: ["sales-tier12", "sales-yangtze"],
  },
  {
    id: "efficiency",
    name: "去化效率",
    metricIds: ["sales-collection", "sales-old-stock", "sales-parking", "sales-digital-share", "sales-digital-rate"],
  },
] as const;

function StageSignal({ group }: { group: AnnualMetricGroup }) {
  const metric = (id: string) => group.metrics.find((item) => item.id === id);

  if (group.id === "investment") {
    return (
      <div className="fusion-stage-signal is-triad is-investment-scale">
        <div data-metric-id="investment-projects">
          <span>新增项目数量</span>
          <span className="fusion-stage-value"><b>{metric("investment-projects")?.value}</b><em>个</em></span>
        </div>
        <div data-metric-id="investment-new-value">
          <span>新增货值</span>
          <span className="fusion-stage-value"><b>{metric("investment-new-value")?.value}</b><em>亿元</em></span>
        </div>
        <div data-metric-id="investment-saleable-area">
          <span>新增可售面积</span>
          <span className="fusion-stage-value"><b>{metric("investment-saleable-area")?.value}</b><em>万㎡</em></span>
        </div>
      </div>
    );
  }

  if (group.id === "construction") {
    return (
      <div className="fusion-stage-signal is-timeline">
        {[
          ["construction-demo", "示范区"],
          ["construction-launch", "首开"],
          ["construction-delivery", "交付"],
        ].map(([id, label], index) => (
          <div key={id} data-metric-id={id}><i>{index + 1}</i><span className="fusion-stage-value"><b>{metric(id)?.value}</b><em>月</em></span><span>{label}</span></div>
        ))}
      </div>
    );
  }

  if (group.id === "delivery") {
    return (
      <div className="fusion-stage-signal is-highlight">
        <div className="fusion-highlight-value" data-metric-id="delivery-satisfaction">
          <span>整体交付满意度</span>
          <div><strong>{metric("delivery-satisfaction")?.value}</strong><em>分</em></div>
          <i aria-hidden="true"><u style={{ width: "94%" }} /></i>
        </div>
        <div className="fusion-highlight-related" data-metric-id="delivery-area">
          <span>年度交付</span>
          <div><b>{metric("delivery-area")?.value}</b><em>万㎡</em></div>
          <small data-metric-id="delivery-households">交付户数 {metric("delivery-households")?.value} 万户</small>
        </div>
      </div>
    );
  }

  if (group.id === "sales") {
    return (
      <div className="fusion-stage-signal is-sales">
        <div data-metric-id="sales-total-amount"><span>总合同销售金额</span><strong>{metric("sales-total-amount")?.value}</strong><em>亿元</em><small>行业第 2</small></div>
        <p><i style={{ width: "60.9%" }} /><em style={{ width: "39.1%" }} /></p>
        <footer><span data-metric-id="sales-self-amount">自投 {metric("sales-self-amount")?.value} 亿元</span><span data-metric-id="sales-management-amount">代建 {metric("sales-management-amount")?.value} 亿元</span></footer>
      </div>
    );
  }

  if (group.id === "holding") {
    return (
      <div className="fusion-stage-signal is-bars">
        <div data-metric-id="holding-hotel"><span>酒店运营</span><i><u style={{ width: "100%" }} /></i><b>{metric("holding-hotel")?.value}</b></div>
        <div data-metric-id="holding-rent"><span>物业租金</span><i><u style={{ width: "30%" }} /></i><b>{metric("holding-rent")?.value}</b></div>
        <small>经营收入 · 亿元</small>
      </div>
    );
  }

  if (group.id === "special") {
    return (
      <div className="fusion-stage-signal is-triad">
        <div data-metric-id="special-events"><span>IP 活动</span><span className="fusion-stage-value"><b>{metric("special-events")?.value}+</b><em>场</em></span></div>
        <div data-metric-id="special-members"><span>桂玥会</span><span className="fusion-stage-value"><b>{metric("special-members")?.value}</b><em>万</em></span></div>
        <div data-metric-id="special-decoration"><span>家装定制</span><span className="fusion-stage-value"><b>{metric("special-decoration")?.value}</b><em>亿元</em></span></div>
      </div>
    );
  }

  return (
    <div className="fusion-stage-signal is-reserve">
      <div data-metric-id="reserve-projects"><span>土储项目</span><span className="fusion-stage-value"><strong>{metric("reserve-projects")?.value}</strong><em>个</em></span></div>
      <p data-metric-id="reserve-tier12"><span>一二线货值</span><i><u style={{ width: "80%" }} /></i><b>{metric("reserve-tier12")?.value}%</b></p>
      <p data-metric-id="reserve-yangtze"><span>长三角货值</span><i><u style={{ width: "64%" }} /></i><b>{metric("reserve-yangtze")?.value}%</b></p>
    </div>
  );
}

function AnnualModulePanel({ group }: { group: AnnualMetricGroup }) {
  const stageMetricIds = STAGE_SIGNAL_METRIC_IDS[group.id];
  const cardMetrics = group.metrics.filter((metric) => !stageMetricIds.includes(metric.id));

  return (
    <section
      className={`fusion-module-card is-${group.id}`}
      data-group-id={group.id}
      data-metric-count={group.metrics.length}
      data-feature-metric-count={stageMetricIds.length}
      data-card-metric-count={cardMetrics.length}
    >
      <header>
        <div><span>{group.index}</span><p>{group.eyebrow}</p><h2>{group.name}</h2></div>
      </header>
      <StageSignal group={group} />
      {group.id === "sales" ? (
        <div className="fusion-sales-sections">
          {SALES_METRIC_SECTIONS.map((section) => {
            const sectionMetrics = section.metricIds
              .map((id) => cardMetrics.find((metric) => metric.id === id))
              .filter((metric): metric is AnnualMetric => Boolean(metric));
            if (sectionMetrics.length === 0) return null;
            return (
              <section className={`fusion-sales-section is-${section.id}`} key={section.id}>
                <h3>{section.name}</h3>
                <div className="fusion-module-metrics">
                  {sectionMetrics.map((metric) => <MetricTile key={metric.id} metric={metric} />)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="fusion-module-metrics">
          {cardMetrics.map((metric) => <MetricTile key={metric.id} metric={metric} />)}
        </div>
      )}
    </section>
  );
}

function OrganizationBoard({
  activeOrganizationCode,
  onSelect,
  onReset,
}: {
  activeOrganizationCode: string | null;
  onSelect: (organization: WenshuOrganizationSnapshot) => void;
  onReset: () => void;
}) {
  const organizationGridRef = useRef<HTMLDivElement>(null);

  const scrollOrganizations = () => {
    const grid = organizationGridRef.current;
    if (!grid) return;

    const maxScrollLeft = Math.max(0, grid.scrollWidth - grid.clientWidth);
    const isAtEnd = grid.scrollLeft >= maxScrollLeft - 4;
    grid.scrollTo({
      left: isAtEnd
        ? 0
        : Math.min(maxScrollLeft, grid.scrollLeft + Math.max(280, grid.clientWidth * .68)),
      behavior: "smooth",
    });
  };

  return (
    <section
      className="fusion-organization-board"
      aria-label="经营组织总览"
      data-organization-count={OPERATING_ORGANIZATIONS.length}
      data-active-organization-code={activeOrganizationCode ?? "national"}
      data-source-dataset="10300"
      data-source-snapshot={WENSHU_VALUE_SNAPSHOT_DATE}
    >
      <header>
        <div>
          <span>OPERATING ORGANIZATIONS</span>
          <h2>经营组织总览</h2>
        </div>
        <div>
          <small>未售货值 · {WENSHU_VALUE_SNAPSHOT_DATE}</small>
          <button
            type="button"
            className={activeOrganizationCode === null ? "is-active" : ""}
            aria-pressed={activeOrganizationCode === null}
            onClick={onReset}
          >全国</button>
        </div>
      </header>

      <div ref={organizationGridRef} className="fusion-organization-grid">
        {OPERATING_ORGANIZATIONS.map((organization, index) => {
          const isActive = activeOrganizationCode === organization.code;
          const isAvailable = organization.dashboardAvailable !== false;
          const valueSnapshot = WENSHU_VALUE_BY_ORG[organization.code];
          return (
            <button
              key={organization.code}
              type="button"
              data-organization-code={organization.code}
              className={`${isActive ? "is-active" : ""}${isAvailable ? "" : " is-unavailable"}`}
              aria-pressed={isActive}
              aria-label={isAvailable ? organization.name : `${organization.name}，当前暂无可展示内容`}
              disabled={!isAvailable}
              onClick={() => isActive ? onReset() : onSelect(organization)}
            >
              <div className="fusion-organization-name">
                <i>{String(index + 1).padStart(2, "0")}</i>
                <strong title={organization.name}>{WENSHU_ORGANIZATION_NAV_LABELS[organization.code] ?? organization.name}</strong>
              </div>
              <div className="fusion-organization-sales">
                <span>未售</span>
                <b>{valueSnapshot ? formatNumber(valueSnapshot.saleableValue, 2) : "—"}</b>
                {valueSnapshot ? <em>亿元</em> : null}
              </div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="fusion-organization-scroll-next"
        aria-label="查看更多经营组织"
        title="查看更多经营组织"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          scrollOrganizations();
        }}
      ><span aria-hidden="true">›</span></button>
    </section>
  );
}

function OrganizationScopeFacts({
  organization,
  development,
  cities,
  onCitySelect,
  cityCount,
  onViewProjects,
  onClose,
}: {
  organization: WenshuOrganizationSnapshot;
  development: WenshuOrganizationDevelopmentSnapshot;
  cities: readonly (typeof WENSHU_CITY_SUMMARIES)[number][];
  onCitySelect: (city: CitySelection) => void;
  cityCount: number;
  onViewProjects: () => void;
  onClose: () => void;
}) {
  return (
    <aside
      className="fusion-region-facts is-organization"
      aria-label={`${organization.name}经营概览`}
      data-scope-kind="organization"
      data-scope-code={organization.code}
      data-source-dataset="3002"
      data-source-snapshot={WENSHU_ORGANIZATION_DEVELOPMENT_SNAPSHOT_DATE}
    >
      <header>
        <div>
          <span>ORGANIZATION OVERVIEW</span>
          <h3>{organization.name}</h3>
          <p>经营范围</p>
        </div>
        <button type="button" aria-label="关闭经营概览" title="切换经营组织" onClick={onClose}>×</button>
      </header>
      <dl>
        <div className="is-hero">
          <dt>土储总建面</dt>
          <dd><strong>{formatNumber(squareMetresToWan(development.soilAreaM2), 2)}</strong><em>万㎡</em></dd>
        </div>
        <div>
          <dt>在建总建面</dt>
          <dd>
            <strong>{formatNumber(squareMetresToWan(development.constructionAreaM2), 2)}</strong><em>万㎡</em>
            <small>{development.constructionProjects} 个在建</small>
          </dd>
        </div>
        <div>
          <dt>未开发建面</dt>
          <dd>
            <strong>{formatNumber(squareMetresToWan(development.pendingAreaM2), 2)}</strong><em>万㎡</em>
            <small>纯待开发 {development.pendingProjects} 个</small>
          </dd>
        </div>
      </dl>
      <nav className="fusion-organization-city-nav" aria-label={`${organization.name}城市指标选择`}>
        {cities.map((city) => (
          <button
            key={city.cityAdcode}
            type="button"
            aria-label={`${city.name}，查看城市指标`}
            onClick={() => onCitySelect({
              cityAdcode: city.cityAdcode,
              provinceAdcode: city.provinceAdcode,
              provinceName: city.provinceName,
              name: city.name,
              count: city.count,
            })}
          >{city.name}</button>
        ))}
      </nav>
      <footer>
        <div>
          <span>{development.totalProjects} 个项目 · 覆盖 {cityCount} 城</span>
          <small>数据截至 {WENSHU_ORGANIZATION_DEVELOPMENT_SNAPSHOT_DATE}</small>
          <small>点击城市查看详情</small>
        </div>
        <button type="button" onClick={onViewProjects}>查看覆盖城市项目 →</button>
      </footer>
    </aside>
  );
}

export default function MapIntegratedOverview({
  onSelectView,
}: {
  onSelectView: (view: DashboardView) => void;
}) {
  const cockpitRef = useRef<HTMLElement>(null);
  const [activeProvince, setActiveProvince] = useState<ProvinceSelection | null>(null);
  const [activeCity, setActiveCity] = useState<CitySelection | null>(null);
  const [activeOrganizationCode, setActiveOrganizationCode] = useState<string | null>(null);
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  useDashboardCountUp(
    cockpitRef,
    "initial-dashboard-entry",
    ".fusion-module-card strong, .fusion-module-card b, .fusion-organization-board b, .fusion-region-facts strong",
  );
  const activeOrganization = useMemo(() => (
    OPERATING_ORGANIZATIONS.find((organization) => organization.code === activeOrganizationCode) ?? null
  ), [activeOrganizationCode]);
  const activeOrganizationDevelopment = useMemo(() => (
    activeOrganization ? WENSHU_ORGANIZATION_DEVELOPMENT_3002[activeOrganization.code] ?? null : null
  ), [activeOrganization]);
  const activeOrganizationCities = useMemo(() => {
    if (!activeOrganizationDevelopment) return [];
    const managedCityNames = new Set(activeOrganizationDevelopment.cities.map((city) => city.name));
    return WENSHU_CITY_SUMMARIES
      .filter((city) => managedCityNames.has(city.name))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh-CN"));
  }, [activeOrganizationDevelopment]);
  const activeOrganizationCityAdcodes = useMemo(
    () => activeOrganizationCities.map((city) => city.cityAdcode),
    [activeOrganizationCities],
  );
  const activeMapAdcodes = useMemo(() => (
    activeProvince
      ? [activeProvince.adcode]
      : activeOrganizationCities.length > 0
        ? [...new Set(activeOrganizationCities.map((city) => city.provinceAdcode))]
        : (activeOrganization?.adcodes ?? [])
  ), [activeOrganization, activeOrganizationCities, activeProvince]);
  const mapScopeName = activeCity?.name ?? activeProvince?.name ?? activeOrganization?.name ?? "全国";
  const activeProvinceCities = useMemo(() => (
    activeProvince
      ? WENSHU_CITY_SUMMARIES
        .filter((city) => city.provinceAdcode === activeProvince.adcode)
        .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh-CN"))
      : []
  ), [activeProvince]);
  const activeProvinceProjects = useMemo(() => (
    activeProvince
      ? WENSHU_PROJECTS.filter((project) => project.provinceAdcode === activeProvince.adcode)
      : []
  ), [activeProvince]);
  const drilldownCities = activeOrganization ? activeOrganizationCities : activeProvinceCities;
  const drilldownProjects = useMemo(() => (
    (activeCity
      ? WENSHU_PROJECTS.filter((project) => project.cityAdcode === activeCity.cityAdcode)
      : activeOrganization
        ? WENSHU_PROJECTS.filter((project) => activeOrganizationCityAdcodes.includes(project.cityAdcode))
        : activeProvinceProjects)
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, "zh-CN"))
  ), [activeCity, activeOrganization, activeOrganizationCityAdcodes, activeProvinceProjects]);
  const drilldownScopeProjectCount = useMemo(
    () => drilldownCities.reduce((total, city) => total + city.count, 0),
    [drilldownCities],
  );
  const showProjectDrilldown = isProjectListOpen && (activeProvince !== null || activeOrganization !== null);
  const administrativeRegionMetrics = useMemo(() => (
    activeProvince
      ? getMapRegionMetrics({
        provinceAdcode: activeProvince.adcode,
        cityAdcode: activeCity?.cityAdcode,
      })
      : null
  ), [activeCity, activeProvince]);
  const activeOrganizationCityDevelopment = useMemo(() => (
    activeOrganizationDevelopment && activeCity
      ? activeOrganizationDevelopment.cities.find((city) => city.name === activeCity.name) ?? null
      : null
  ), [activeCity, activeOrganizationDevelopment]);
  const activeRegionMetrics = useMemo<MapRegionMetrics | null>(() => {
    if (!activeOrganizationCityDevelopment || !activeCity) return administrativeRegionMetrics;
    return {
      projectCount: activeOrganizationCityDevelopment.totalProjects,
      cityCount: 1,
      projectBuildingAreaWan: squareMetresToWan(activeOrganizationCityDevelopment.soilAreaM2),
      activeDevelopmentProjectCount:
        activeOrganizationCityDevelopment.constructionProjects + activeOrganizationCityDevelopment.pendingProjects,
      activeDevelopmentBuildingAreaWan: squareMetresToWan(
        activeOrganizationCityDevelopment.constructionAreaM2 + activeOrganizationCityDevelopment.pendingAreaM2,
      ),
      contractSalesYi: WENSHU_CITY_SALES_6283[activeCity.name]?.contractSalesYi ?? 0,
      projectSnapshotDate: WENSHU_ORGANIZATION_DEVELOPMENT_SNAPSHOT_DATE,
      salesSnapshotDate: WENSHU_CITY_SALES_6283_SNAPSHOT_DATE,
    };
  }, [activeCity, activeOrganizationCityDevelopment, administrativeRegionMetrics]);
  const activeRegionSalesDisplay = activeRegionMetrics
    ? formatMoneyFromYi(activeRegionMetrics.contractSalesYi)
    : null;
  const activeRegionName = activeCity?.name ?? activeProvince?.name ?? "";
  const activeRegionParentName = activeOrganization?.name ?? activeCity?.provinceName ?? "行政区经营概览";
  const visibleProjectRows = Math.min(Math.max(drilldownProjects.length, 1), 5);

  const handleProvinceSelect = useCallback((province: ProvinceSelection) => {
    // A province click changes the analytical dimension back to the
    // administrative view; organization context is preserved only for an
    // explicit city point that belongs to that organization.
    setActiveOrganizationCode(null);
    setActiveProvince(province);
    setActiveCity(null);
    setIsProjectListOpen(false);
  }, []);

  const handleCitySelect = useCallback((city: CitySelection, openProjectList = false) => {
    if (!activeOrganizationCityAdcodes.includes(city.cityAdcode)) setActiveOrganizationCode(null);
    setActiveProvince({ adcode: city.provinceAdcode, name: city.provinceName });
    setActiveCity(city);
    setIsProjectListOpen(openProjectList);
  }, [activeOrganizationCityAdcodes]);

  const handleOrganizationSelect = useCallback((organization: WenshuOrganizationSnapshot) => {
    setActiveProvince(null);
    setActiveCity(null);
    setIsProjectListOpen(false);
    setActiveOrganizationCode(organization.code);
  }, []);

  const resetMapScope = useCallback(() => {
    setActiveOrganizationCode(null);
    setActiveProvince(null);
    setActiveCity(null);
    setIsProjectListOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isProjectListOpen) setIsProjectListOpen(false);
        else if (activeCity) {
          setActiveCity(null);
          if (activeOrganization) setActiveProvince(null);
        }
        else if (activeProvince) setActiveProvince(null);
        else setActiveOrganizationCode(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCity, activeOrganization, activeProvince, isProjectListOpen]);

  return (
    <main ref={cockpitRef} className="fusion-cockpit" data-layout="all-modules">
      <div className="fusion-grid" aria-hidden="true" />

      <header className="fusion-header">
        <div className="fusion-brand">
          {/* Existing project asset; native sizing keeps this dashboard compatible with vinext. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={publicAssetPath("/greentown-logo-header.png")} alt="绿城中国 GREENTOWN" />
        </div>
        <div className="fusion-heading">
          <p>ANNUAL OPERATIONS · MAP INTEGRATED VIEW</p>
          <h1>绿城中国经营驾驶舱</h1>
        </div>
        <div className="fusion-header-actions">
          <DashboardViewSwitch activeView="showcase" onSelectView={onSelectView} />
          <div className="fusion-period"><i /><span>2025 年度经营概览</span></div>
        </div>
      </header>

      <section
        className="fusion-workspace"
        aria-label="年度经营模块与项目地图"
        data-module-count={ANNUAL_METRIC_GROUPS.length}
        data-metric-count={ANNUAL_METRIC_TOTALS.total}
        data-project-list-open={showProjectDrilldown ? "true" : "false"}
        data-region-metrics-active={activeRegionMetrics ? "true" : "false"}
        data-active-organization-code={activeOrganizationCode ?? "none"}
        style={{ "--fusion-project-content-height": `${170 + visibleProjectRows * 64}px` } as CSSProperties}
      >
        <div className="fusion-map-field" aria-live="polite">
          <TechMap
            activeAdcodes={activeMapAdcodes}
            activeCityAdcode={activeCity?.cityAdcode ?? null}
            scopedCityAdcodes={activeOrganizationCityAdcodes}
            scopeName={mapScopeName}
            viewOffsetX={0}
            labelOcclusionSelector=".fusion-module-rail, .fusion-organization-board, .fusion-region-facts"
            viewportOcclusionSelector=".fusion-module-rail"
            interactionMode="metrics"
            onProvinceSelect={handleProvinceSelect}
            onCitySelect={handleCitySelect}
          />
        </div>

        {!activeProvince && !showProjectDrilldown ? (
          activeOrganization && activeOrganizationDevelopment ? (
            <OrganizationScopeFacts
              organization={activeOrganization}
              development={activeOrganizationDevelopment}
              cities={activeOrganizationCities}
              onCitySelect={handleCitySelect}
              cityCount={activeOrganizationCities.length}
              onViewProjects={() => setIsProjectListOpen(true)}
              onClose={resetMapScope}
            />
          ) : (
            <OrganizationBoard
              activeOrganizationCode={activeOrganizationCode}
              onSelect={handleOrganizationSelect}
              onReset={resetMapScope}
            />
          )
        ) : null}

        <aside className="fusion-module-rail is-left" aria-label="年度经营模块左列">
          {ANNUAL_METRIC_GROUPS.filter((group) => LEFT_MODULE_IDS.has(group.id)).map((group) => (
            <AnnualModulePanel key={group.id} group={group} />
          ))}
        </aside>

        <aside className="fusion-module-rail is-right" aria-label="年度经营模块右列">
          {ANNUAL_METRIC_GROUPS.filter((group) => !LEFT_MODULE_IDS.has(group.id)).map((group) => (
            <AnnualModulePanel key={group.id} group={group} />
          ))}
        </aside>

        {activeRegionMetrics && activeProvince && !showProjectDrilldown ? (
          <aside
            className="fusion-region-facts"
            aria-label={`${activeRegionName}区域经营概览`}
            aria-live="polite"
            data-scope-kind={activeOrganizationCityDevelopment ? "organization-city" : activeCity ? "city" : "province"}
            data-scope-adcode={activeCity?.cityAdcode ?? activeProvince.adcode}
            data-source-dataset={activeOrganizationCityDevelopment ? "3002,6283" : "6,3001,6283"}
            data-source-snapshot={activeRegionMetrics.projectSnapshotDate}
          >
            <header>
              <div>
                <span>REGIONAL SNAPSHOT</span>
                <h3>{activeRegionName}</h3>
                <p>{activeRegionParentName}</p>
              </div>
              <button
                type="button"
                aria-label="关闭区域经营概览"
                title={activeOrganization ? `返回${activeOrganization.name}` : "返回全国"}
                onClick={() => {
                  setActiveCity(null);
                  setActiveProvince(null);
                  setIsProjectListOpen(false);
                }}
              >×</button>
            </header>
            <dl>
              <div className="is-hero">
                <dt>{activeOrganizationCityDevelopment ? "土储总建面" : "项目总建面"}</dt>
                <dd><strong>{formatNumber(activeRegionMetrics.projectBuildingAreaWan, 2)}</strong><em>万㎡</em></dd>
              </div>
              {activeOrganizationCityDevelopment ? (
                <>
                  <div>
                    <dt>在建项目</dt>
                    <dd>
                      <strong>{activeOrganizationCityDevelopment.constructionProjects}</strong><em>个</em>
                      <small>{formatNumber(squareMetresToWan(activeOrganizationCityDevelopment.constructionAreaM2), 2)} 万㎡</small>
                    </dd>
                  </div>
                  <div>
                    <dt>未开发建面</dt>
                    <dd>
                      <strong>{formatNumber(squareMetresToWan(activeOrganizationCityDevelopment.pendingAreaM2), 2)}</strong><em>万㎡</em>
                      <small>纯待开发 {activeOrganizationCityDevelopment.pendingProjects} 个</small>
                    </dd>
                  </div>
                </>
              ) : (
                <div>
                  <dt>在建＋待开发项目</dt>
                  <dd>
                    <strong>{activeRegionMetrics.activeDevelopmentProjectCount}</strong><em>个</em>
                    <small>{formatNumber(activeRegionMetrics.activeDevelopmentBuildingAreaWan, 2)} 万㎡</small>
                  </dd>
                </div>
              )}
              <div>
                <dt>本年合同销售额</dt>
                <dd><strong>{activeRegionSalesDisplay?.value}</strong><em>{activeRegionSalesDisplay?.unit}</em></dd>
              </div>
            </dl>
            <footer>
              <div>
                <span>{activeOrganizationCityDevelopment && activeOrganization
                  ? `${activeOrganization.name} · ${activeRegionMetrics.projectCount} 个项目`
                  : `${activeRegionMetrics.cityCount} 城 · ${activeRegionMetrics.projectCount} 个境内项目`}</span>
                <small>数据截至 {activeRegionMetrics.salesSnapshotDate}</small>
                <small>点击查看项目明细</small>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProjectListOpen(true);
                }}
              >{activeCity ? "查看可定位项目" : "查看项目"} →</button>
            </footer>
          </aside>
        ) : null}

        {showProjectDrilldown && (activeProvince || activeOrganization) ? (
          <section
            className="fusion-project-drilldown"
            aria-label={`${activeCity?.name ?? activeProvince?.name ?? activeOrganization?.name}${activeOrganization ? "覆盖城市项目" : "项目列表"}`}
            data-province-adcode={activeProvince?.adcode ?? ""}
            data-organization-code={activeOrganization?.code ?? ""}
            data-active-city-adcode={activeCity?.cityAdcode ?? ""}
          >
            <header>
              <div>
                <p>全国 {activeOrganization && <><i /> {activeOrganization.name}</>}{activeProvince && !activeOrganization && <><i /> {activeProvince.name}</>}{activeCity && <><i /> {activeCity.name}</>}</p>
                <h3>{activeCity?.name ?? activeProvince?.name ?? activeOrganization?.name}{activeOrganization ? "覆盖城市项目" : "项目列表"}</h3>
                <span>共 {drilldownProjects.length} 个项目 · {activeCity ? "可切换其他城市" : "点击城市继续下钻"}</span>
              </div>
              <div className="fusion-project-actions">
                <button
                  type="button"
                  onClick={() => {
                    if (activeOrganization) {
                      setActiveCity(null);
                      setActiveProvince(null);
                      setIsProjectListOpen(false);
                    }
                    else if (activeCity) setActiveCity(null);
                    else {
                      setActiveProvince(null);
                      setIsProjectListOpen(false);
                    }
                  }}
                >{activeOrganization ? `返回${activeOrganization.name}` : activeCity ? "返回省级" : "返回全国"}</button>
                <button
                  type="button"
                  className="fusion-project-close"
                  aria-label="关闭项目列表"
                  title="关闭项目列表"
                  onClick={() => setIsProjectListOpen(false)}
                >×</button>
              </div>
            </header>

            <nav className="fusion-city-directory" aria-label={`${activeOrganization?.name ?? activeProvince?.name}城市选择`}>
              <button
                type="button"
                className={activeCity === null ? "is-active" : ""}
                aria-pressed={activeCity === null}
                onClick={() => {
                  setActiveCity(null);
                  if (activeOrganization) setActiveProvince(null);
                }}
              >
                <b>{activeOrganization ? "覆盖城市" : "全省"}</b><span>{drilldownScopeProjectCount}</span>
              </button>
              {drilldownCities.map((city) => (
                <button
                  type="button"
                  key={city.cityAdcode}
                  className={activeCity?.cityAdcode === city.cityAdcode ? "is-active" : ""}
                  aria-pressed={activeCity?.cityAdcode === city.cityAdcode}
                  onClick={() => handleCitySelect({
                    cityAdcode: city.cityAdcode,
                    provinceAdcode: city.provinceAdcode,
                    provinceName: city.provinceName,
                    name: city.name,
                    count: city.count,
                  }, true)}
                >
                  <b>{city.name}</b><span>{city.count}</span>
                </button>
              ))}
            </nav>

            <div className="fusion-project-table-head" aria-hidden="true">
              <span>项目名称 / 业态 / 权益</span>
              <span>总建面</span>
              <span>销售状态</span>
            </div>
            <div className="fusion-project-list" role="list" data-project-count={drilldownProjects.length}>
              {drilldownProjects.map((project) => {
                const attribute = WENSHU_PROJECT_ATTRIBUTES[project.id];
                const equityRatio = attribute?.greentownEquityRatio;
                return (
                  <article key={project.id} role="listitem">
                    <div>
                      <b>{project.name}</b>
                      <span>{project.cityName} · {project.developmentStatus} · {attribute?.propertyTypes ?? "业态未接入"} · 权益 {equityRatio == null ? "—" : `${formatNumber(equityRatio, Number.isInteger(equityRatio) ? 0 : 1)}%`}</span>
                    </div>
                    <span className="fusion-project-number">
                      <b>{project.totalBuildingAreaWan > 0 ? formatNumber(project.totalBuildingAreaWan, 2) : "—"}</b>
                      {project.totalBuildingAreaWan > 0 ? <small>万㎡</small> : null}
                    </span>
                    <em className={`is-status-${project.saleStatus}`}>{project.saleStatus}</em>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

      </section>

      <footer className="fusion-footer">
        <span>经营概览 · 地图融合展示</span>
        <span>7 大经营板块 · {ANNUAL_METRIC_TOTALS.total} 项年度经营指标</span>
        <span>数据截至 {WENSHU_VALUE_SNAPSHOT_DATE}</span>
      </footer>
    </main>
  );
}
