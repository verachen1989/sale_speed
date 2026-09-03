"use client";

import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { CitySelection, ProvinceSelection } from "./tech-map";
import {
  buildSalesTrendBars,
  HALF_YEAR_2026_ALL_METRICS,
  HALF_YEAR_2026_GREEN_PLUS_GROUPS,
  HALF_YEAR_2026_MANAGED_MARKET_SHARE_METRIC,
  HALF_YEAR_2026_MANAGED_PERFORMANCE_METRICS,
  HALF_YEAR_2026_SOURCE,
  type GreenPlusGroup,
  type HalfYearMetric,
} from "./half-year-2026-metrics";
import { type EngineeringSiteProject, type HeavyAssetProjectCase } from "./heavy-asset-project-cases";
import { publicAssetPath } from "./public-path";
import {
  WENSHU_CITY_SUMMARIES,
  WENSHU_COVERED_CITY_COUNT,
  WENSHU_DOMESTIC_PROJECT_COUNT,
  WENSHU_PROJECTS,
  WENSHU_PROJECT_SNAPSHOT_DATE,
} from "./wenshu-projects-snapshot";
import {
  WENSHU_CITY_SALES_6283,
  WENSHU_CITY_SALES_6283_SNAPSHOT_DATE,
} from "./wenshu-city-sales-snapshot";
import { WENSHU_PROJECT_ATTRIBUTES } from "./wenshu-project-attributes";
import {
  WENSHU_ORGANIZATION_DEVELOPMENT_3002,
  WENSHU_ORGANIZATION_DEVELOPMENT_SNAPSHOT_DATE,
} from "./wenshu-organization-development-snapshot";
import {
  WENSHU_FIRST_LEVEL_ORGANIZATIONS,
  WENSHU_ORGANIZATION_NAV_LABELS,
  WENSHU_ORGANIZATIONS,
  WENSHU_SNAPSHOT_DATE,
  type WenshuOrganizationSnapshot,
} from "./wenshu-snapshot";
import { getMapRegionMetrics } from "./map-region-metrics";
import styles from "./half-year-2026-dashboard.module.css";

const TechMap = lazy(() => import("./tech-map"));
const CLIENT_REQUEST_TIMEOUT_MS = 16_000;
const MAP_PROJECT_CASES: readonly HeavyAssetProjectCase[] = [];
const MAP_ENGINEERING_SITES: readonly EngineeringSiteProject[] = [];

const METRIC_BY_ID = new Map(HALF_YEAR_2026_ALL_METRICS.map((metric) => [metric.id, metric]));
const GROUP_DISCLOSURE_RANKS = {
  newValue: METRIC_BY_ID.get("h1-investment-new-value")?.comparison ?? "行业 Top 4",
  selfSales: METRIC_BY_ID.get("h1-sales-self")?.comparison ?? "行业 Top 6",
} as const;
const GREEN_PLUS_FEATURED_FACT_IDS: Record<GreenPlusGroup["id"], string> = {
  "commercial-operations": "green-plus-commercial-streak",
  "town-operations": "green-plus-town-industries",
  "life-technology": "green-plus-life-deliveries",
  wellness: "green-plus-wellness-beds",
};
const GREEN_PLUS_SUBTITLES: Record<GreenPlusGroup["id"], string> = {
  "commercial-operations": "COMMERCIAL OPS",
  "town-operations": "TOWN SERVICES",
  "life-technology": "LIFE TECH",
  wellness: "WELLNESS CARE",
};
const OPERATING_ORGANIZATIONS = WENSHU_FIRST_LEVEL_ORGANIZATIONS.filter((organization) => (
  organization.dashboardAvailable !== false
  && Boolean(WENSHU_ORGANIZATION_DEVELOPMENT_3002[organization.code])
));
const CITY_SUMMARY_BY_NAME = new Map(WENSHU_CITY_SUMMARIES.map((city) => [city.name, city]));
const ROOT_ORGANIZATION = WENSHU_ORGANIZATIONS[0];
const DISPLAYED_HALF_YEAR_METRIC_IDS = [
  "h1-investment-tier12-share",
  "h1-investment-core-city-value",
  "h1-inventory-old-sales",
  "h1-inventory-old-progress",
  "h1-inventory-unsold-value",
  "h1-customer-satisfaction",
  "h1-customer-loyalty",
  "h2-resource-sold-unrecognized",
  "h2-recognition-2026-total",
  "h2-recognition-2027-total",
  "h2-recognition-2028-total",
] as const;
const DISPLAYED_HALF_YEAR_METRIC_COUNT = new Set(DISPLAYED_HALF_YEAR_METRIC_IDS).size
  + HALF_YEAR_2026_MANAGED_PERFORMANCE_METRICS.length
  + 1;
const DISPLAYED_GREEN_PLUS_FACT_COUNT = HALF_YEAR_2026_GREEN_PLUS_GROUPS.reduce((total, group) => total + group.facts.length, 0);

const KEY_NODE_SNAPSHOT = {
  sourceDate: "2026-08-31",
  scope: "2026年拿地项目",
  stages: [
    { id: "demo-zone-open", label: "示范区开放", value: "5.3", unit: "月" },
    { id: "project-launch", label: "项目首开", value: "5.9", unit: "月" },
    { id: "delivery", label: "交付", value: "26.4", unit: "月" },
  ],
} as const;

const OPERATING_DELIVERY_SNAPSHOT = {
  sourceDate: "2026-09-03",
  scope: "经营指挥交付情况",
  metrics: [
    { id: "delivery-households", label: "交付户数", value: "11,869", unit: "户", plan: "年度计划 23,516户" },
    { id: "delivery-value", label: "交付货值", value: "523.29", unit: "亿元", plan: "年度计划 1,328.83亿元" },
    { id: "delivery-area", label: "交付面积", value: "273.46", unit: "万㎡", plan: "年度计划 547.91万㎡" },
  ],
} as const;

const PROJECT_DYNAMICS_SNAPSHOT = {
  sourceDate: "2026-08-28",
  scopeLabel: "截至08月28日未注销项目",
  facts: [
    { label: "项目个数", value: "512", unit: "个" },
    { label: "土储总建面", value: "2029.61", unit: "万㎡" },
    { label: "在建总建面", value: "1440.95", unit: "万㎡" },
  ],
} as const;

const DISPLAYED_SUPPLEMENTAL_GROUP_COUNT = HALF_YEAR_2026_GREEN_PLUS_GROUPS.length + 1;
const DISPLAYED_SUPPLEMENTAL_METRIC_COUNT = DISPLAYED_GREEN_PLUS_FACT_COUNT + KEY_NODE_SNAPSHOT.stages.length;

type DashboardVisualTheme = "light" | "dark";

type LatestSalesSnapshot = {
  orgUnitCode: string;
  cityName: string;
  asOfDate: string;
  statYear: string;
  datasetCode: "6286";
  scope: "全业态实际合同";
  cumulativeContractSalesYi: number;
  monthlyContractSalesYi: number[];
  currentMonthDailyAverageYi: number;
  previousMonthDailyAverageYi: number;
  dailyAverageGrowthPct: number | null;
};

type LatestSalesState = "loading" | "ready" | "error" | "unavailable";

type LatestSalesResult = {
  requestKey: string;
  snapshot: LatestSalesSnapshot | null;
  state: "ready" | "error";
};

type OperatingOverviewSnapshot = {
  orgUnitCode: string;
  asOfDate: string;
  periodStartDate: string;
  datasetCodes: readonly ["10802", "10266", "12051"];
  scope: "经营组织年初至今实际";
  ytdCumulativeContractSalesYi: number;
  ytdNewProjectCount: number;
  ytdNewValueYi: number | null;
  ytdInvestmentYi: number | null;
  ytdNewProjectTotalBuildingAreaWan: number | null;
  ytdTier12NewValueSharePct: number | null;
  ytdTier12NewValueYi: number | null;
};

type OperatingOverviewState = "loading" | "ready" | "error" | "unavailable";

type OperatingOverviewResult = {
  requestKey: string;
  snapshot: OperatingOverviewSnapshot | null;
  state: "ready" | "error";
};

type RegionFact = {
  label: string;
  value: string | number;
  unit: string;
  detail?: string;
};

const OPERATING_OVERVIEW_FALLBACK_DATASETS = "6,3001,12022";

function buildOperatingOverviewFallbackFacts(
  organization: WenshuOrganizationSnapshot,
  cityNames: readonly string[] | null,
): readonly RegionFact[] {
  const snapshotYear = WENSHU_SNAPSHOT_DATE.slice(0, 4);
  const scopedCityNames = cityNames ? new Set(cityNames) : null;
  const newProjectTotalBuildingAreaWan = WENSHU_PROJECTS
    .filter((project) => (
      project.projectGainTime?.startsWith(`${snapshotYear}-`)
      && (scopedCityNames === null || scopedCityNames.has(project.cityName))
    ))
    .reduce((total, project) => total + project.totalBuildingAreaWan, 0);

  return [
    { label: "本年新拓项目", value: organization.newProjects, unit: "个", detail: "本地经营快照" },
    { label: "新拓总建面", value: formatNumber(newProjectTotalBuildingAreaWan), unit: "万㎡", detail: "项目台账汇总" },
    { label: "新拓货值", value: formatNumber(organization.newValue), unit: "亿元", detail: "本地经营快照" },
    { label: "投资额", value: formatNumber(organization.investment), unit: "亿元", detail: "本地经营快照" },
  ];
}

type PanelCoverItem = {
  label: string;
  value: string;
  unit?: string;
  note?: string;
};

const DashboardVisualThemeContext = createContext<DashboardVisualTheme>("dark");
const PanelCoverContext = createContext<readonly PanelCoverItem[]>([]);

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function squareMetresToWan(value: number) {
  return value / 10_000;
}

function metric(id: string) {
  const found = METRIC_BY_ID.get(id);
  if (!found) throw new Error(`Unknown 1H2026 metric: ${id}`);
  return found;
}

function metricAttributes(item: HalfYearMetric) {
  return {
    "data-metric-id": item.id,
    "data-source-period": item.sourcePeriod ?? HALF_YEAR_2026_SOURCE.period,
    "data-source-pages": item.sourcePages.join(","),
    "data-status": item.status,
    "data-tone": item.tone,
    "data-top-rank": /top/i.test(item.comparison) ? "true" : undefined,
  };
}

function greenPlusGroup(id: GreenPlusGroup["id"]) {
  const found = HALF_YEAR_2026_GREEN_PLUS_GROUPS.find((group) => group.id === id);
  if (!found) throw new Error(`Unknown Green+ group: ${id}`);
  return found;
}

function greenPlusGroupAttributes(group: GreenPlusGroup) {
  return {
    "data-green-plus-group": group.id,
    "data-green-plus-label": group.label,
    "data-source-period": group.sourcePeriod,
    "data-source-pages": group.sourcePages.join(","),
    "data-material-pages": group.materialPages.join(","),
    "data-status": group.status,
  };
}

function greenPlusFactAttributes(group: GreenPlusGroup, fact: GreenPlusGroup["facts"][number]) {
  return {
    "data-green-plus-metric-id": fact.id,
    "data-source-period": group.sourcePeriod,
    "data-source-pages": group.sourcePages.join(","),
    "data-material-pages": group.materialPages.join(","),
    "data-status": group.status,
  };
}

function Panel({
  index,
  title,
  children,
  className = "",
  style,
  sourceLabel,
  sourcePeriod,
  sourceScope,
  sourceKind,
  mapOcclusion = false,
  layoutRole,
}: {
  index: string;
  title: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  sourceLabel?: string;
  sourcePeriod?: string;
  sourceScope?: string;
  sourceKind?: "live" | "rolling" | "operating-snapshot" | "disclosure" | "annual-intent" | "mixed";
  mapOcclusion?: boolean;
  layoutRole?: string;
}) {
  const visualTheme = useContext(DashboardVisualThemeContext);
  const coverItems = useContext(PanelCoverContext);
  const flipEnabled = visualTheme === "light" && coverItems.length > 0;
  const [isFlipped, setIsFlipped] = useState(false);

  const renderHeader = (face: "front" | "back") => (
    <header className={styles.panelHeader}>
      <div className={styles.panelTitle}>
        <span>{index}</span>
        <h2 id={(face === "front") !== isFlipped ? `half-year-panel-${index}` : undefined}>{title}</h2>
      </div>
      {face === "back" ? (
        <button
          type="button"
          className={`${styles.flipButton} ${styles.flipBackButton}`}
          onClick={() => setIsFlipped(false)}
          aria-label={`返回${title}摘要`}
          tabIndex={isFlipped ? 0 : -1}
        >
          <span>返回摘要</span><i aria-hidden="true">↶</i>
        </button>
      ) : null}
    </header>
  );

  if (flipEnabled) {
    return (
      <section
        className={`fusion-module-card ${styles.panel} ${styles.flipPanel} ${className}`}
        aria-labelledby={`half-year-panel-${index}`}
        data-panel-index={index}
        data-source-period={sourcePeriod}
        data-source-label={sourceLabel}
        data-scope={sourceScope}
        data-source-kind={sourceKind}
        data-half-map-occlusion={mapOcclusion ? "true" : undefined}
        data-layout-role={layoutRole}
        data-flip-enabled="true"
        data-flipped={isFlipped ? "true" : "false"}
        style={style}
      >
        <div className={styles.flipStage}>
          <div className={`${styles.flipFace} ${styles.flipFront}`} aria-hidden={isFlipped}>
            {renderHeader("front")}
            <div className={styles.flipCover}>
              <div className={styles.flipCoverMark} aria-hidden="true"><i /><i /><i /><i /></div>
              <p>核心经营摘要</p>
              <div className={styles.flipCoverMetrics}>
                {coverItems.map((item) => (
                  <article key={`${item.label}-${item.value}`}>
                    <span>{item.label}</span>
                    <div><strong>{item.value}</strong>{item.unit ? <em>{item.unit}</em> : null}</div>
                    {item.note ? <small>{item.note}</small> : null}
                  </article>
                ))}
              </div>
              <button
                type="button"
                className={styles.flipButton}
                onClick={() => setIsFlipped(true)}
                aria-label={`翻转卡片查看${title}完整数据`}
                aria-expanded={isFlipped}
                tabIndex={isFlipped ? -1 : 0}
              >
                <span>查看完整数据</span><i aria-hidden="true">↗</i>
              </button>
            </div>
          </div>
          <div className={`${styles.flipFace} ${styles.flipBack}`} aria-hidden={!isFlipped}>
            {renderHeader("back")}
            <div className={styles.panelBody}>{children}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`fusion-module-card ${styles.panel} ${className}`}
      aria-labelledby={`half-year-panel-${index}`}
      data-panel-index={index}
      data-source-period={sourcePeriod}
      data-source-label={sourceLabel}
      data-scope={sourceScope}
      data-source-kind={sourceKind}
      data-half-map-occlusion={mapOcclusion ? "true" : undefined}
      data-layout-role={layoutRole}
      style={style}
    >
      <header className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <span>{index}</span>
          <h2 id={`half-year-panel-${index}`}>{title}</h2>
        </div>
      </header>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

function ValueLine({ item, compact = false }: { item: HalfYearMetric; compact?: boolean }) {
  return (
    <div className={compact ? styles.valueLineCompact : styles.valueLine}>
      <strong>{item.value}</strong><em>{item.unit}</em>
    </div>
  );
}

type KpiLevel = "primary" | "secondary" | "detail";

function MetricCard({
  item,
  compact = false,
  kpiLevel,
  showComparison = true,
}: {
  item: HalfYearMetric;
  compact?: boolean;
  kpiLevel?: KpiLevel;
  showComparison?: boolean;
}) {
  return (
    <article
      className={compact ? styles.metricCardCompact : styles.metricCard}
      {...metricAttributes(item)}
      {...(kpiLevel ? { "data-kpi-level": kpiLevel } : {})}
      title={item.note}
    >
      <span>{item.label}</span>
      <ValueLine item={item} compact={compact} />
      {showComparison && item.comparison ? <small>{item.comparison}</small> : null}
    </article>
  );
}

function LatestSalesStrip({
  latestSales,
  operatingOverview,
  operatingState,
  state,
  scopeName,
  rollingFallback,
  showGroupRank,
}: {
  latestSales: LatestSalesSnapshot | null;
  operatingOverview: OperatingOverviewSnapshot | null;
  operatingState: OperatingOverviewState;
  state: LatestSalesState;
  scopeName: string;
  rollingFallback: number | null;
  showGroupRank: boolean;
}) {
  const cumulativeSales = operatingState === "ready" && operatingOverview
    ? operatingOverview.ytdCumulativeContractSalesYi
    : latestSales?.cumulativeContractSalesYi ?? rollingFallback;
  const usesLiveData = state === "ready" && latestSales !== null;
  const usesOperatingData = operatingState === "ready" && operatingOverview !== null;
  const usesRollingFallback = !usesLiveData && rollingFallback !== null;

  return (
    <section
      className={styles.latestSalesStrip}
      aria-label={`${scopeName}最新销售经营数据`}
      data-source-kind={usesLiveData || usesOperatingData ? "live" : "rolling"}
      data-source-dataset={usesOperatingData && usesLiveData ? "10266,6286" : usesOperatingData ? "10266" : usesLiveData ? "6286" : usesRollingFallback ? "6283" : undefined}
      data-source-date={usesOperatingData ? operatingOverview.asOfDate : usesLiveData ? latestSales.asOfDate : usesRollingFallback ? WENSHU_PROJECT_SNAPSHOT_DATE : undefined}
      data-query-state={state}
    >
      <div className={styles.latestSalesTitle}>
        <span><i />动态销售</span>
      </div>
      <div className={styles.latestSalesFacts}>
        <article data-kpi-level="primary">
          <span>累计合同销售额</span>
          <div><strong>{cumulativeSales === null ? "—" : formatNumber(cumulativeSales, 2)}</strong><em>亿元</em></div>
          {showGroupRank ? (
            <small
              className={styles.rankBadge}
              data-rank-badge="sales-performance"
              title={`2026中期披露：自投销售${GROUP_DISCLOSURE_RANKS.selfSales}；当前金额仍为动态实际合同销售额`}
            >自投销售 {GROUP_DISCLOSURE_RANKS.selfSales.replace("行业 ", "")}</small>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function SalesTrendChart({
  latestSales,
  state,
  scopeName,
  fallbackMonthlySales,
  fallbackSourceDate,
  fallbackDataset,
  onRetry,
}: {
  latestSales: LatestSalesSnapshot | null;
  state: LatestSalesState;
  scopeName: string;
  fallbackMonthlySales: readonly number[];
  fallbackSourceDate: string | null;
  fallbackDataset: "6283" | "6286" | null;
  onRetry: () => void;
}) {
  const liveMonthlySales = state === "ready" && latestSales?.monthlyContractSalesYi.length
    ? latestSales.monthlyContractSalesYi
    : null;
  const trend = buildSalesTrendBars(liveMonthlySales ?? fallbackMonthlySales);
  const usesFallbackTrend = liveMonthlySales === null && trend.bars.length > 0;
  const canRenderTrend = state !== "unavailable" && trend.bars.length > 0;
  const statusLabel = state === "loading"
    ? "正在获取月度销售趋势"
    : state === "unavailable"
      ? "省级范围暂不提供月度销售趋势"
      : state === "error"
        ? "月度销售趋势暂不可用"
        : "暂无月度销售数据";
  const chartSummary = trend.bars
    .map((bar) => `${bar.label}${formatNumber(bar.value, 2)}亿元`)
    .join("，");

  return (
    <section
      className={styles.salesTrendCard}
      aria-label={`${scopeName}销售业绩趋势`}
      data-sales-trend-state={state}
      data-source-dataset={liveMonthlySales ? "6286" : fallbackDataset ?? undefined}
      data-source-date={liveMonthlySales ? latestSales?.asOfDate : fallbackSourceDate ?? undefined}
      data-trend-month-count={trend.bars.length}
      data-trend-display-mode={usesFallbackTrend ? "snapshot" : "live"}
    >
      {canRenderTrend ? (
        <div
          className={styles.salesTrendChart}
          role="img"
          aria-label={`${scopeName}月度实际合同销售额：${chartSummary}`}
        >
          <div
            className={styles.salesTrendPlot}
            style={{
              "--trend-zero-top": `${trend.zeroPct}%`,
              "--trend-month-count": trend.bars.length,
            } as CSSProperties}
          >
            <ol className={styles.salesTrendBars}>
              {trend.bars.map((bar) => (
                <li
                  key={bar.label}
                  data-direction={bar.direction}
                  data-tone={bar.tone}
                  aria-label={`${bar.label}销售额${formatNumber(bar.value, 2)}亿元`}
                  title={`${bar.label} · ${formatNumber(bar.value, 2)} 亿元`}
                  style={{
                    "--trend-bar-top": `${bar.topPct}%`,
                    "--trend-bar-height": `${bar.heightPct}%`,
                  } as CSSProperties}
                >
                  <b>{formatNumber(bar.value, 2)}</b>
                  <i aria-hidden="true" />
                  <span>{bar.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <div className={styles.salesTrendEmpty} role="status">
          <i />
          <span>{statusLabel}</span>
          {state === "error" ? (
            <button type="button" className={styles.dataRetryButton} data-retry-action="latest-sales" onClick={onRetry}>
              重新获取
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

function SalesPanel({
  latestSales,
  operatingOverview,
  operatingOverviewState,
  salesState,
  salesScopeName,
  rollingSalesFallback,
  rollingMonthlySalesFallback,
  rollingSalesFallbackDate,
  rollingSalesFallbackDataset,
  showGroupRank,
  onRetrySales,
}: {
  latestSales: LatestSalesSnapshot | null;
  operatingOverview: OperatingOverviewSnapshot | null;
  operatingOverviewState: OperatingOverviewState;
  salesState: LatestSalesState;
  salesScopeName: string;
  rollingSalesFallback: number | null;
  rollingMonthlySalesFallback: readonly number[];
  rollingSalesFallbackDate: string | null;
  rollingSalesFallbackDataset: "6283" | "6286" | null;
  showGroupRank: boolean;
  onRetrySales: () => void;
}) {
  const oldSales = metric("h1-inventory-old-sales");
  const oldProgress = metric("h1-inventory-old-progress");
  const unsold = metric("h1-inventory-unsold-value");
  const cumulativeSales = operatingOverviewState === "ready" && operatingOverview
    ? operatingOverview.ytdCumulativeContractSalesYi
    : latestSales?.cumulativeContractSalesYi ?? rollingSalesFallback;

  return (
    <PanelCoverContext.Provider value={[
      { label: "累计合同销售额", value: cumulativeSales === null ? "—" : formatNumber(cumulativeSales, 2), unit: cumulativeSales === null ? "" : "亿元" },
    ]}>
    <Panel
      index="03"
      title="销售去化"
      sourceLabel="最新销售 + 2026中期披露"
      sourcePeriod="mixed"
      sourceScope="group-and-map-scope"
      sourceKind="mixed"
    >
      <div className={styles.salesOverviewRow}>
        <LatestSalesStrip
          latestSales={latestSales}
          operatingOverview={operatingOverview}
          operatingState={operatingOverviewState}
          state={salesState}
          scopeName={salesScopeName}
          rollingFallback={rollingSalesFallback}
          showGroupRank={showGroupRank}
        />
        <SalesTrendChart
          latestSales={latestSales}
          state={salesState}
          scopeName={salesScopeName}
          fallbackMonthlySales={rollingMonthlySalesFallback}
          fallbackSourceDate={rollingSalesFallbackDate}
          fallbackDataset={rollingSalesFallbackDataset}
          onRetry={onRetrySales}
        />
      </div>
      <div className={styles.inventoryLine}>
        <article {...metricAttributes(oldSales)}>
          <span>{oldSales.label}</span><ValueLine item={oldSales} compact /><small>{oldSales.comparison}</small>
        </article>
        <article className={styles.progressMetric} {...metricAttributes(oldProgress)}>
          <div><span>{oldProgress.label}</span><b>{oldProgress.value}%</b></div>
          <i aria-hidden="true"><u style={{ "--bar-width": `${oldProgress.numericValue}%` } as CSSProperties} /></i>
        </article>
        <MetricCard item={unsold} compact showComparison={false} />
      </div>
    </Panel>
    </PanelCoverContext.Provider>
  );
}

function DeliveryPanel() {
  return (
    <Panel
      index="10"
      title="项目交付"
      className={styles.deliveryPanel}
      sourceLabel="经营指挥交付情况"
      sourcePeriod="operating-snapshot"
      sourceScope={OPERATING_DELIVERY_SNAPSHOT.scope}
      sourceKind="operating-snapshot"
      style={{ paddingBottom: 6 }}
    >
      <div
        className={styles.salesDeliveryGrid}
        aria-label="经营指挥交付情况"
        data-delivery-snapshot="operating-command"
        data-source-kind="operating-snapshot"
        data-source-date={OPERATING_DELIVERY_SNAPSHOT.sourceDate}
        data-scope={OPERATING_DELIVERY_SNAPSHOT.scope}
      >
        {OPERATING_DELIVERY_SNAPSHOT.metrics.map((item) => (
          <article key={item.id} data-delivery-metric-id={item.id} title={item.plan}>
            <span>{item.label}</span>
            <b>{item.value}<em>{item.unit}</em></b>
            <small>{item.plan}</small>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function CustomerEvaluationPanel() {
  const customerEvaluation = [
    metric("h1-customer-satisfaction"),
    metric("h1-customer-loyalty"),
  ];

  return (
    <Panel
      index="11"
      title="集团客户评价"
      className={styles.customerEvaluationPanel}
      sourceLabel="2026中期披露"
      sourcePeriod={HALF_YEAR_2026_SOURCE.period}
      sourceScope="group"
      sourceKind="disclosure"
    >
      <div
        className={styles.salesCustomerEvaluationGrid}
        aria-label="集团客户评价"
        data-sales-customer-evaluation="group-disclosure"
        data-source-kind="disclosure"
        data-source-period={HALF_YEAR_2026_SOURCE.period}
        data-scope="group"
      >
        {customerEvaluation.map((item) => (
          <article key={item.id} {...metricAttributes(item)} title={item.note}>
            <span>{item.label}</span>
            <ValueLine item={item} compact />
            <small>{item.comparison}</small>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function InvestmentPanel({
  operatingOverview,
  state,
  scopeName,
  facts,
  sourceDataset,
  sourceDate,
  showGroupRank,
  onRetry,
}: {
  operatingOverview: OperatingOverviewSnapshot | null;
  state: OperatingOverviewState;
  scopeName: string;
  facts: readonly RegionFact[];
  sourceDataset: string;
  sourceDate: string;
  showGroupRank: boolean;
  onRetry: () => void;
}) {
  const tier12Share = metric("h1-investment-tier12-share");
  const coreCityValue = metric("h1-investment-core-city-value");
  const usesOperatingOverview = state === "ready" && operatingOverview !== null;
  const liveFacts: readonly RegionFact[] = usesOperatingOverview
    ? [
        {
          label: "本年新拓项目",
          value: operatingOverview.ytdNewProjectCount,
          unit: "个",
          detail: "年初至今",
        },
        {
          label: "新拓总建面",
          value: operatingOverview.ytdNewProjectTotalBuildingAreaWan === null
            ? "—"
            : formatNumber(operatingOverview.ytdNewProjectTotalBuildingAreaWan, 2),
          unit: operatingOverview.ytdNewProjectTotalBuildingAreaWan === null ? "" : "万㎡",
          detail: "经营指挥口径",
        },
        {
          label: "新拓货值",
          value: operatingOverview.ytdNewValueYi === null ? "—" : formatNumber(operatingOverview.ytdNewValueYi, 2),
          unit: operatingOverview.ytdNewValueYi === null ? "" : "亿元",
          detail: "年初至今",
        },
        {
          label: "投资额",
          value: operatingOverview.ytdInvestmentYi === null ? "—" : formatNumber(operatingOverview.ytdInvestmentYi, 2),
          unit: operatingOverview.ytdInvestmentYi === null ? "" : "亿元",
          detail: "年初至今",
        },
      ]
    : facts;
  const activeDataset = usesOperatingOverview
    ? operatingOverview.datasetCodes.join(",")
    : state === "unavailable"
      ? sourceDataset
      : OPERATING_OVERVIEW_FALLBACK_DATASETS;
  const activeDate = usesOperatingOverview
    ? operatingOverview.asOfDate
    : state === "unavailable"
      ? sourceDate
      : WENSHU_SNAPSHOT_DATE;
  const dynamicTier12Share = usesOperatingOverview && operatingOverview.ytdTier12NewValueSharePct !== null
    ? operatingOverview.ytdTier12NewValueSharePct
    : null;

  return (
    <PanelCoverContext.Provider value={liveFacts.slice(0, 3).map((fact) => ({
      label: fact.label,
      value: String(fact.value),
      unit: fact.unit,
    }))}>
    <Panel
      index="01"
      title="投资与土储"
      sourceLabel="动态经营 + 2026中期披露"
      sourcePeriod="mixed"
      sourceScope="group-and-map-scope"
      sourceKind="mixed"
    >
      <section
        className={styles.investmentLive}
        aria-label={`${scopeName}动态投资经营数据`}
        data-source-dataset={activeDataset}
        data-source-date={activeDate}
        data-query-state={state}
      >
        {state === "error" ? (
          <button
            type="button"
            className={`${styles.dataRetryButton} ${styles.investmentRetryButton}`}
            data-retry-action="operating-overview"
            onClick={onRetry}
          >
            重新获取
          </button>
        ) : null}
        <div className={styles.investmentLiveGrid} data-fact-count={liveFacts.length}>
          {liveFacts.map((fact, index) => {
            const showsNewValueRank = showGroupRank && usesOperatingOverview && fact.label === "新拓货值";
            return (
              <article
                key={fact.label}
                data-live-metric="true"
                data-kpi-level={index === 0 ? "primary" : "secondary"}
              >
                <span>{fact.label}</span>
                <div><strong>{fact.value}</strong><em>{fact.unit}</em></div>
                {showsNewValueRank ? (
                  <small className={styles.rankDetail}>
                    <b
                      className={styles.rankBadge}
                      data-rank-badge="new-value"
                      title={`2026中期披露：新增货值${GROUP_DISCLOSURE_RANKS.newValue}`}
                    >{GROUP_DISCLOSURE_RANKS.newValue}</b>
                  </small>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
      <section
        className={styles.projectDynamics}
        aria-label={`项目动态，${PROJECT_DYNAMICS_SNAPSHOT.scopeLabel}`}
        data-project-dynamics="true"
        data-source-kind="operating-snapshot"
        data-source-date={PROJECT_DYNAMICS_SNAPSHOT.sourceDate}
      >
        <div className={styles.projectDynamicsGrid}>
          {PROJECT_DYNAMICS_SNAPSHOT.facts.map((fact) => (
            <article key={fact.label}>
              <span>{fact.label}</span>
              <div><strong>{fact.value}</strong><em>{fact.unit}</em></div>
            </article>
          ))}
        </div>
      </section>
      <div className={styles.ratioRow}>
        <article
          {...metricAttributes(tier12Share)}
          data-source-kind={dynamicTier12Share === null ? "disclosure" : "live"}
          data-source-dataset={dynamicTier12Share === null ? undefined : "12051"}
          data-source-date={dynamicTier12Share === null ? HALF_YEAR_2026_SOURCE.reportingDate : operatingOverview?.asOfDate}
          title={dynamicTier12Share === null ? tier12Share.note : "经营指挥项目明细按城市能级动态汇总"}
        >
          <span>{tier12Share.label}</span>
          <div className={styles.valueLineCompact}>
            <strong>{dynamicTier12Share === null ? tier12Share.value : formatNumber(dynamicTier12Share, 1)}</strong><em>%</em>
          </div>
          <small>{dynamicTier12Share === null ? tier12Share.comparison : `一二线货值${formatNumber(operatingOverview?.ytdTier12NewValueYi ?? 0, 2)}亿元`}</small>
        </article>
        <article {...metricAttributes(coreCityValue)} title={coreCityValue.note}>
          <span>{coreCityValue.label}</span><ValueLine item={coreCityValue} compact />
          {coreCityValue.comparison ? <small>{coreCityValue.comparison}</small> : null}
        </article>
      </div>
    </Panel>
    </PanelCoverContext.Provider>
  );
}

function ConstructionPanel() {
  return (
    <PanelCoverContext.Provider value={[
      ...KEY_NODE_SNAPSHOT.stages.map((stage) => ({ label: stage.label, value: stage.value, unit: stage.unit })),
    ]}>
    <Panel
      index="02"
      title="开发效率"
      className={styles.developmentDock}
      sourceLabel="2026年拿地项目 · 截至08月31日"
      sourcePeriod="operating-snapshot"
      sourceScope="2026-land-acquisition-projects"
      sourceKind="operating-snapshot"
      layoutRole="left-rail-development"
    >
      <div
        className={styles.annualTimeline}
        aria-label="经营指挥关键节点"
        data-source-system="经营指挥"
        data-source-date={KEY_NODE_SNAPSHOT.sourceDate}
        data-scope={KEY_NODE_SNAPSHOT.scope}
      >
        {KEY_NODE_SNAPSHOT.stages.map((stage, index) => (
          <article
            key={stage.id}
            data-key-node-id={stage.id}
            data-source-period="operating-snapshot"
            data-source-date={KEY_NODE_SNAPSHOT.sourceDate}
            data-scope={KEY_NODE_SNAPSHOT.scope}
            title={`${stage.label}：${stage.value}${stage.unit}`}
          >
            <i aria-hidden="true">{index + 1}</i>
            <b>{stage.value}<em>{stage.unit}</em></b>
            <span>{stage.label}</span>
          </article>
        ))}
      </div>
    </Panel>
    </PanelCoverContext.Provider>
  );
}

function ResourcesPanel() {
  const sold = metric("h2-resource-sold-unrecognized");
  const recognition = [
    metric("h2-recognition-2026-total"),
    metric("h2-recognition-2027-total"),
    metric("h2-recognition-2028-total"),
  ];
  const recognitionMax = Math.max(...recognition.map((item) => item.numericValue));

  return (
    <PanelCoverContext.Provider value={[
      { label: sold.label, value: sold.value, unit: sold.unit },
      ...recognition.slice(0, 2).map((item) => ({ label: item.label, value: item.value, unit: item.unit })),
    ]}>
    <Panel
      index="05"
      title="结转资源"
      className={styles.resourceDock}
      sourceLabel="2026中期披露 · 下半年计划"
      sourcePeriod={HALF_YEAR_2026_SOURCE.period}
      sourceScope="group"
      sourceKind="disclosure"
    >
      {/* <div className={styles.subsectionTitle}><span>已售未结与预计结转</span></div> */}
      <div className={styles.recognitionBlock}>
        <div className={styles.recognitionSummary}>
          <MetricCard item={sold} compact kpiLevel="primary" showComparison={false} />
        </div>
        <div className={styles.recognitionChart} aria-label="已售未结预计结转金额对比">
          {recognition.map((item) => (
            <article key={item.id} {...metricAttributes(item)} data-kpi-level="detail" title={item.note}>
              <div aria-hidden="true"><i style={{ "--column-height": `${Math.max(3, (item.numericValue / recognitionMax) * 100)}%` } as CSSProperties} /></div>
              <span>{item.id === "h2-recognition-2026-total" ? "2H2026" : item.id === "h2-recognition-2027-total" ? "2027" : "2028及以后"}</span>
              <b>{item.value}<em>{item.unit}</em></b>
            </article>
          ))}
        </div>
      </div>
    </Panel>
    </PanelCoverContext.Provider>
  );
}

function GreenPlusGroupBody({ group, showHeading = false }: { group: GreenPlusGroup; showHeading?: boolean }) {
  const featuredFactId = GREEN_PLUS_FEATURED_FACT_IDS[group.id];

  return (
    <section
      className={styles.greenPlusGroup}
      {...greenPlusGroupAttributes(group)}
      data-green-plus-variant={group.id}
      data-green-plus-layout={group.id === "town-operations" ? "metric-matrix" : undefined}
      data-green-plus-frame="command-module"
      aria-label={`${group.label}：${group.summary}`}
    >
      <small className={styles.greenPlusSubtitle}>{GREEN_PLUS_SUBTITLES[group.id]}</small>
      {showHeading ? (
        <div className={styles.greenPlusGroupHeading}>
          <span>{group.label}</span><small>{group.summary}</small>
        </div>
      ) : null}
      <div className={styles.greenPlusFacts}>
        {group.facts.map((fact) => (
          <article
            key={fact.id}
            {...greenPlusFactAttributes(group, fact)}
            data-green-plus-featured={fact.id === featuredFactId ? "true" : undefined}
            data-green-plus-kpi-card="beacon"
          >
            <span>{fact.label}</span>
            <b>{fact.value}<em>{fact.unit}</em></b>
          </article>
        ))}
      </div>
      {group.id !== "town-operations" ? (
      <div className={styles.greenPlusNarrative} data-green-plus-narrative="profile">
        <div className={styles.greenPlusDescription} title={group.detail}>
          <small>业务进展</small>
          <p>{group.detail}</p>
        </div>
        <ul className={styles.greenPlusHighlights} aria-label={`${group.label}案例与荣誉`}>
          {group.highlights.map((highlight) => (
            <li key={highlight.label} data-green-plus-highlight={highlight.kind} title={highlight.label}>
              <small>{highlight.kind === "case" ? "项目" : "荣誉"}</small>
              <span>{highlight.label}</span>
            </li>
          ))}
        </ul>
      </div>
      ) : null}
    </section>
  );
}

function CommercialOperationsPanel() {
  const group = greenPlusGroup("commercial-operations");
  return (
    <Panel
      index="06"
      title="商管"
      className={styles.greenPlusPanel}
      sourceLabel="2026中期披露 · 绿城+"
      sourcePeriod={HALF_YEAR_2026_SOURCE.period}
      sourceScope="group"
      sourceKind="disclosure"
    >
      <GreenPlusGroupBody group={group} />
    </Panel>
  );
}

function TownOperationsPanel() {
  const group = greenPlusGroup("town-operations");
  return (
    <Panel
      index="07"
      title="小镇"
      className={styles.greenPlusPanel}
      sourceLabel="2026中期披露 · 绿城+"
      sourcePeriod={HALF_YEAR_2026_SOURCE.period}
      sourceScope="group"
      sourceKind="disclosure"
    >
      <GreenPlusGroupBody group={group} />
    </Panel>
  );
}

function LifeTechnologyPanel() {
  const group = greenPlusGroup("life-technology");
  return (
    <Panel
      index="08"
      title="生活科技"
      className={styles.greenPlusPanel}
      sourceLabel="2026中期披露 · 绿城+"
      sourcePeriod={HALF_YEAR_2026_SOURCE.period}
      sourceScope="group"
      sourceKind="disclosure"
    >
      <GreenPlusGroupBody group={group} />
    </Panel>
  );
}

function WellnessPanel() {
  const group = greenPlusGroup("wellness");
  return (
    <Panel
      index="09"
      title="康养"
      className={styles.greenPlusPanel}
      sourceLabel="2026中期披露 · 绿城+"
      sourcePeriod={HALF_YEAR_2026_SOURCE.period}
      sourceScope="group"
      sourceKind="disclosure"
    >
      <GreenPlusGroupBody group={group} />
    </Panel>
  );
}

function ManagedBusinessPanel() {
  const managed = HALF_YEAR_2026_MANAGED_PERFORMANCE_METRICS;
  const marketShare = HALF_YEAR_2026_MANAGED_MARKET_SHARE_METRIC;

  return (
    <PanelCoverContext.Provider value={managed.slice(0, 3).map((item) => ({
      label: item.label,
      value: item.value,
      unit: item.unit,
      note: item.displayPeriod,
    }))}>
    <Panel
      index="04"
      title="代建"
      sourceLabel="绿城管理业绩大屏 · 半年/年度口径"
      sourcePeriod="2025-FY/2026-H1"
      sourceScope="group"
      sourceKind="disclosure"
    >
      <div className={styles.managedPerformanceBoard}>
        <div className={styles.managedGrid} aria-label="代建业绩指标">
          {managed.map((item, index) => (
            <article
              key={item.id}
              className={styles.metricCardCompact}
              {...metricAttributes(item)}
              data-kpi-level={index < 3 ? "primary" : "secondary"}
              title={item.note}
            >
              <span className={styles.managedMetricTitle}>
                {item.label}<small>（{item.displayPeriod}）</small>
              </span>
              <ValueLine item={item} compact />
              {item.note ? <small className={styles.managedMetricNote}>{item.note}</small> : null}
            </article>
          ))}
        </div>
        <div className={styles.managedInsightStrip} aria-label="代建行业表现">
          <article
            data-managed-insight="market-share"
            data-card-treatment="gold"
            {...metricAttributes(marketShare)}
          >
            <span>{marketShare.label}<small>（{marketShare.displayPeriod}）</small></span>
            <strong>
              <b>{marketShare.value}<em>{marketShare.unit}</em></b>
              <small className={styles.managedInsightNote}>市场份额连续十年超过20%</small>
            </strong>
          </article>
        </div>
      </div>
    </Panel>
    </PanelCoverContext.Provider>
  );
}

function RegionControl({
  activeOrganization,
  scopeLabel,
  scopeName,
  sourceDataset,
  sourceDate,
  projectCount,
  projectCityName,
  onSelectOrganization,
  onViewProjects,
  onReset,
}: {
  activeOrganization: WenshuOrganizationSnapshot | null;
  scopeLabel: string;
  scopeName: string;
  sourceDataset: string;
  sourceDate: string;
  projectCount: number | null;
  projectCityName: string | null;
  onSelectOrganization: (organization: WenshuOrganizationSnapshot) => void;
  onViewProjects: () => void;
  onReset: () => void;
}) {
  return (
    <section
      className={styles.regionPanel}
      aria-label="区域公司与地图经营指标"
      aria-live="polite"
      data-half-map-occlusion="true"
      data-source-kind="rolling"
      data-source-dataset={sourceDataset}
      data-source-snapshot={sourceDate}
    >
      <div className={styles.regionPanelTopline}>
        <div className={styles.regionScope}>
          <span>{scopeLabel}</span>
          <h2>{scopeName}</h2>
        </div>
        <div className={styles.regionPanelActions}>
          {projectCount !== null ? (
            <button
              type="button"
              data-source-dataset="6,3001"
              data-source-snapshot={WENSHU_PROJECT_SNAPSHOT_DATE}
              aria-label={`查看${projectCityName}行政城市项目清单，共${projectCount}个项目`}
              title={`查看${projectCityName}全部项目`}
              onClick={onViewProjects}
            >
              查看{projectCityName}行政项目 <b>{projectCount}</b> →
            </button>
          ) : null}
        </div>
      </div>

      <nav className={styles.organizationNav} aria-label="选择区域公司">
        <button
          type="button"
          className={activeOrganization === null && scopeName === "全国" ? styles.isActive : ""}
          aria-pressed={activeOrganization === null && scopeName === "全国"}
          onClick={onReset}
        >全国</button>
        {OPERATING_ORGANIZATIONS.map((organization) => {
          const isActive = activeOrganization?.code === organization.code;
          return (
            <button
              key={organization.code}
              type="button"
              className={isActive ? styles.isActive : ""}
              aria-pressed={isActive}
              data-organization-code={organization.code}
              onClick={() => isActive ? onReset() : onSelectOrganization(organization)}
            >{WENSHU_ORGANIZATION_NAV_LABELS[organization.code] ?? organization.name}</button>
          );
        })}
      </nav>

    </section>
  );
}

function NationalMapLegend() {
  return (
    <aside
      className={styles.mapCoverageLegend}
      aria-label={`全国项目覆盖图例：覆盖${WENSHU_COVERED_CITY_COUNT}个城市，共${WENSHU_DOMESTIC_PROJECT_COUNT}个境内有效项目`}
      data-half-map-occlusion="true"
      data-map-coverage-legend="true"
      data-source-dataset="6,3001"
      data-source-snapshot={WENSHU_PROJECT_SNAPSHOT_DATE}
    >
      <span><i />全国项目覆盖</span>
      <dl>
        <div><dt>城市</dt><dd><strong>{WENSHU_COVERED_CITY_COUNT}</strong><em>城</em></dd></div>
        <div><dt>项目</dt><dd><strong>{WENSHU_DOMESTIC_PROJECT_COUNT}</strong><em>个</em></dd></div>
      </dl>
    </aside>
  );
}

function CityProjectDrilldown({
  city,
  projects,
  focusedProjectId,
  onShowCityProjects,
  onClose,
}: {
  city: CitySelection;
  projects: readonly (typeof WENSHU_PROJECTS)[number][];
  focusedProjectId: string | null;
  onShowCityProjects: () => void;
  onClose: () => void;
}) {
  const focusedProject = focusedProjectId
    ? projects.find((project) => project.id === focusedProjectId) ?? null
    : null;
  const displayedProjects = focusedProject ? [focusedProject] : projects;

  return (
    <section
      className={`fusion-project-drilldown ${styles.projectDrilldown}`}
      aria-label={focusedProject ? `${focusedProject.name}项目详情` : `${city.name}境内有效项目清单`}
      data-half-map-occlusion="true"
      data-source-dataset="6,3001,1016"
      data-source-snapshot={WENSHU_PROJECT_SNAPSHOT_DATE}
      data-active-city-adcode={city.cityAdcode}
      data-focused-project-id={focusedProject?.id}
    >
      <header>
        <div>
          <p>全国 <i /> {city.provinceName} <i /> {city.name}{focusedProject ? <><i /> 项目直达</> : null}</p>
          <h3>{focusedProject?.name ?? `${city.name}境内有效项目`}</h3>
          <span>{focusedProject ? "重资产案例 · 项目级穿透" : `共 ${projects.length} 个项目`}</span>
        </div>
        <div className="fusion-project-actions">
          <button type="button" onClick={focusedProject ? onShowCityProjects : onClose}>
            {focusedProject ? "查看城市全部项目" : "返回城市指标"}
          </button>
          <button
            type="button"
            className="fusion-project-close"
            aria-label="关闭项目清单"
            title="关闭项目清单"
            onClick={onClose}
          >×</button>
        </div>
      </header>

      <div className="fusion-project-table-head" aria-hidden="true">
        <span>项目名称 / 业态</span>
        <span>总建面</span>
        <span>销售状态</span>
      </div>
      <div className="fusion-project-list" role="list" data-project-count={projects.length}
        data-visible-project-count={displayedProjects.length}
        data-project-focus={focusedProject ? "direct" : "city-list"}>
        {displayedProjects.map((project) => {
          const attribute = WENSHU_PROJECT_ATTRIBUTES[project.id];
          return (
            <article key={project.id} role="listitem" data-project-id={project.id}
              className={focusedProject ? styles.focusedProjectRow : undefined}
              data-project-case-focus={focusedProject ? "true" : undefined}
            >
              <div>
                <b>{project.name}</b>
                <span>{project.developmentStatus} · {attribute?.propertyTypes ?? "业态未接入"}</span>
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
  );
}

function MapLoadingState() {
  return (
    <div className={styles.mapLoadingState} role="status" aria-live="polite" data-map-load-state="loading">
      <i aria-hidden="true" />
      <span>地图加载中 · 首次打开约需数秒</span>
    </div>
  );
}

export default function HalfYear2026Dashboard() {
  const [activeProvince, setActiveProvince] = useState<ProvinceSelection | null>(null);
  const [activeCity, setActiveCity] = useState<CitySelection | null>(null);
  const [activeOrganizationCode, setActiveOrganizationCode] = useState<string | null>(null);
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);
  const [latestSalesRetryToken, setLatestSalesRetryToken] = useState(0);
  const [operatingOverviewRetryToken, setOperatingOverviewRetryToken] = useState(0);
  const [latestSalesResult, setLatestSalesResult] = useState<LatestSalesResult>({
    requestKey: "",
    snapshot: null,
    state: "error",
  });
  const [operatingOverviewResult, setOperatingOverviewResult] = useState<OperatingOverviewResult>({
    requestKey: "",
    snapshot: null,
    state: "error",
  });
  const activeOrganization = useMemo(() => (
    OPERATING_ORGANIZATIONS.find((organization) => organization.code === activeOrganizationCode) ?? null
  ), [activeOrganizationCode]);
  const isAdministrativeMapScope = Boolean(activeProvince || activeCity);
  const operatingOverviewRequestKey = isAdministrativeMapScope
    ? `unavailable::${activeCity?.cityAdcode ?? activeProvince?.adcode ?? "map"}`
    : `fetch::${activeOrganization?.code ?? ROOT_ORGANIZATION.code}`;
  const operatingOverview = operatingOverviewResult.requestKey === operatingOverviewRequestKey
    ? operatingOverviewResult.snapshot
    : null;
  const operatingOverviewState: OperatingOverviewState = isAdministrativeMapScope
    ? "unavailable"
    : operatingOverviewResult.requestKey === operatingOverviewRequestKey
      ? operatingOverviewResult.state
      : "loading";
  const isProvinceOnlyScope = Boolean(activeProvince && !activeCity && !activeOrganization);
  const latestSalesRequestKey = isProvinceOnlyScope
    ? `unavailable::${activeProvince?.adcode ?? activeProvince?.name ?? "province"}`
    : `fetch::${activeOrganization?.code ?? ROOT_ORGANIZATION.code}::${activeCity?.name ?? ""}`;
  const latestSales = latestSalesResult.requestKey === latestSalesRequestKey
    ? latestSalesResult.snapshot
    : null;
  const salesState: LatestSalesState = isProvinceOnlyScope
    ? "unavailable"
    : latestSalesResult.requestKey === latestSalesRequestKey
      ? latestSalesResult.state
      : "loading";

  useEffect(() => {
    if (latestSalesRequestKey.startsWith("unavailable::")) return;

    const abortController = new AbortController();
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      abortController.abort();
    }, CLIENT_REQUEST_TIMEOUT_MS);
    const [, orgUnitCode, cityName] = latestSalesRequestKey.split("::");
    const params = new URLSearchParams({ orgUnitCode });
    if (cityName) params.set("cityName", cityName);

    fetch(`/api/latest-sales?${params.toString()}`, {
      cache: "no-store",
      signal: abortController.signal,
    })
      .then(async (response) => {
        const body = await response.json() as LatestSalesSnapshot & { error?: string };
        if (!response.ok) throw new Error(body.error || `最新销售数据查询失败（${response.status}）`);
        return body;
      })
      .then((body) => {
        if (abortController.signal.aborted) return;
        setLatestSalesResult({
          requestKey: latestSalesRequestKey,
          snapshot: body,
          state: "ready",
        });
      })
      .catch(() => {
        if (abortController.signal.aborted && !didTimeout) return;
        setLatestSalesResult({
          requestKey: latestSalesRequestKey,
          snapshot: null,
          state: "error",
        });
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [latestSalesRequestKey, latestSalesRetryToken]);

  useEffect(() => {
    if (operatingOverviewRequestKey.startsWith("unavailable::")) return;

    const abortController = new AbortController();
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      abortController.abort();
    }, CLIENT_REQUEST_TIMEOUT_MS);
    const [, orgUnitCode] = operatingOverviewRequestKey.split("::");
    const params = new URLSearchParams({ orgUnitCode });

    fetch(`/api/operating-overview?${params.toString()}`, {
      cache: "no-store",
      signal: abortController.signal,
    })
      .then(async (response) => {
        const body = await response.json() as OperatingOverviewSnapshot & { error?: string };
        if (!response.ok) throw new Error(body.error || `经营指挥概览数据查询失败（${response.status}）`);
        return body;
      })
      .then((body) => {
        if (abortController.signal.aborted) return;
        setOperatingOverviewResult({
          requestKey: operatingOverviewRequestKey,
          snapshot: body,
          state: "ready",
        });
      })
      .catch(() => {
        if (abortController.signal.aborted && !didTimeout) return;
        setOperatingOverviewResult({
          requestKey: operatingOverviewRequestKey,
          snapshot: null,
          state: "error",
        });
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [operatingOverviewRequestKey, operatingOverviewRetryToken]);
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
  const activeOrganizationCityProjectCounts = useMemo<Record<number, number>>(() => {
    if (!activeOrganizationDevelopment) return {};
    return activeOrganizationDevelopment.cities.reduce<Record<number, number>>((counts, city) => {
      const citySummary = CITY_SUMMARY_BY_NAME.get(city.name);
      if (citySummary) counts[citySummary.cityAdcode] = city.totalProjects;
      return counts;
    }, {});
  }, [activeOrganizationDevelopment]);
  const operatingOverviewFallbackFacts = useMemo(() => buildOperatingOverviewFallbackFacts(
    activeOrganization ?? ROOT_ORGANIZATION,
    activeOrganization ? activeOrganizationCities.map((city) => city.name) : null,
  ), [activeOrganization, activeOrganizationCities]);
  const activeAdcodes = useMemo(() => (
    activeProvince
      ? [activeProvince.adcode]
      : activeOrganizationCities.length > 0
        ? [...new Set(activeOrganizationCities.map((city) => city.provinceAdcode))]
        : (activeOrganization?.adcodes ?? [])
  ), [activeOrganization, activeOrganizationCities, activeProvince]);
  const mapScopeName = activeCity?.name ?? activeProvince?.name ?? activeOrganization?.name ?? "全国";
  const isNationalMapScope = !activeOrganization && !activeProvince && !activeCity;
  const activeOrganizationCityDevelopment = useMemo(() => (
    activeOrganizationDevelopment && activeCity
      ? activeOrganizationDevelopment.cities.find((city) => city.name === activeCity.name) ?? null
      : null
  ), [activeCity, activeOrganizationDevelopment]);
  const administrativeRegionMetrics = useMemo(() => (
    activeProvince && !activeOrganization
      ? getMapRegionMetrics({
        provinceAdcode: activeProvince.adcode,
        cityAdcode: activeCity?.cityAdcode,
      })
      : null
  ), [activeCity, activeOrganization, activeProvince]);
  const regionFacts = useMemo<readonly RegionFact[]>(() => {
    if (activeOrganizationCityDevelopment) {
      return [
        {
          label: "土储总建面",
          value: formatNumber(squareMetresToWan(activeOrganizationCityDevelopment.soilAreaM2)),
          unit: "万㎡",
          detail: `${activeOrganizationCityDevelopment.totalProjects} 个项目`,
        },
        {
          label: "在建总建面",
          value: formatNumber(squareMetresToWan(activeOrganizationCityDevelopment.constructionAreaM2)),
          unit: "万㎡",
          detail: `${activeOrganizationCityDevelopment.constructionProjects} 个在建`,
        },
        {
          label: "未开发建面",
          value: formatNumber(squareMetresToWan(activeOrganizationCityDevelopment.pendingAreaM2)),
          unit: "万㎡",
          detail: `纯待开发项目 ${activeOrganizationCityDevelopment.pendingProjects} 个`,
        },
        {
          label: "组织城市项目",
          value: activeOrganizationCityDevelopment.totalProjects,
          unit: "个",
          detail: `${activeOrganization?.name ?? "经营组织"}·城市口径`,
        },
      ];
    }
    if (activeOrganization && activeOrganizationDevelopment) {
      return [
        {
          label: "土储总建面",
          value: formatNumber(squareMetresToWan(activeOrganizationDevelopment.soilAreaM2)),
          unit: "万㎡",
          detail: `${activeOrganizationDevelopment.totalProjects} 个项目`,
        },
        {
          label: "在建总建面",
          value: formatNumber(squareMetresToWan(activeOrganizationDevelopment.constructionAreaM2)),
          unit: "万㎡",
          detail: `${activeOrganizationDevelopment.constructionProjects} 个在建`,
        },
        {
          label: "未开发建面",
          value: formatNumber(squareMetresToWan(activeOrganizationDevelopment.pendingAreaM2)),
          unit: "万㎡",
          detail: `纯待开发项目 ${activeOrganizationDevelopment.pendingProjects} 个`,
        },
        {
          label: "覆盖城市",
          value: activeOrganizationDevelopment.cities.length,
          unit: "城",
          detail: "点击城市可查看组织城市口径",
        },
      ];
    }
    if (administrativeRegionMetrics) {
      return [
        {
          label: "项目总建面",
          value: formatNumber(administrativeRegionMetrics.projectBuildingAreaWan),
          unit: "万㎡",
          detail: `${administrativeRegionMetrics.projectCount} 个境内项目`,
        },
        {
          label: "在建及待开发建面",
          value: formatNumber(administrativeRegionMetrics.activeDevelopmentBuildingAreaWan),
          unit: "万㎡",
          detail: `${administrativeRegionMetrics.activeDevelopmentProjectCount} 个项目`,
        },
        { label: "境内项目", value: administrativeRegionMetrics.projectCount, unit: "个", detail: "地图项目快照" },
        { label: "覆盖城市", value: administrativeRegionMetrics.cityCount, unit: "城", detail: "行政区口径" },
      ];
    }
    return [
      {
        label: "集团经营项目",
        value: ROOT_ORGANIZATION.totalProjects,
        unit: "个",
        detail: "滚动经营项目台账",
      },
      {
        label: "在建项目",
        value: ROOT_ORGANIZATION.constructionProjects,
        unit: "个",
        detail: `在建总建面 ${formatNumber(ROOT_ORGANIZATION.constructionArea)} 万㎡`,
      },
      {
        label: "纯待开发项目",
        value: ROOT_ORGANIZATION.pendingProjects,
        unit: "个",
        detail: `未开发建面 ${formatNumber(ROOT_ORGANIZATION.pendingArea)} 万㎡`,
      },
      {
        label: "经营项目土储总建面",
        value: formatNumber(ROOT_ORGANIZATION.soilArea),
        unit: "万㎡",
        detail: "与中期披露总建面分口径展示",
      },
    ];
  }, [activeOrganization, activeOrganizationCityDevelopment, activeOrganizationDevelopment, administrativeRegionMetrics]);
  const regionSourceDate = activeOrganization
    ? WENSHU_ORGANIZATION_DEVELOPMENT_SNAPSHOT_DATE
    : administrativeRegionMetrics
      ? WENSHU_PROJECT_SNAPSHOT_DATE
      : WENSHU_SNAPSHOT_DATE;
  const regionSourceDataset = activeOrganization || !administrativeRegionMetrics ? "3002" : "6,3001";
  const salesScopeName = activeCity?.name ?? activeOrganization?.name ?? activeProvince?.name ?? "全国";
  const activeCitySalesFallback = activeCity ? WENSHU_CITY_SALES_6283[activeCity.name] ?? null : null;
  const scopedOrganizationSalesFallback = activeOrganization ?? (isAdministrativeMapScope ? null : ROOT_ORGANIZATION);
  const rollingSalesFallback = administrativeRegionMetrics?.contractSalesYi
    ?? activeCitySalesFallback?.contractSalesYi
    ?? scopedOrganizationSalesFallback?.sales
    ?? null;
  const rollingMonthlySalesFallback = activeCitySalesFallback?.monthlyContractSalesYi
    ?? scopedOrganizationSalesFallback?.monthlySales
    ?? [];
  const rollingSalesFallbackDate = activeCitySalesFallback
    ? WENSHU_CITY_SALES_6283_SNAPSHOT_DATE
    : scopedOrganizationSalesFallback
      ? WENSHU_SNAPSHOT_DATE
      : null;
  const rollingSalesFallbackDataset = activeCitySalesFallback
    ? "6283" as const
    : scopedOrganizationSalesFallback
      ? "6286" as const
      : null;
  const cityProjects = useMemo(() => (
    activeCity
      ? WENSHU_PROJECTS
        .filter((project) => project.cityAdcode === activeCity.cityAdcode)
        .sort((left, right) => (
          (right.projectGainTime ?? "").localeCompare(left.projectGainTime ?? "")
          || left.name.localeCompare(right.name, "zh-CN")
        ))
      : []
  ), [activeCity]);
  const visibleProjectRows = focusedProjectId ? 1 : Math.min(Math.max(cityProjects.length, 1), 5);
  const projectPanelContentHeight = focusedProjectId ? 318 : 170 + visibleProjectRows * 64;

  useEffect(() => {
    if (!isProjectListOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFocusedProjectId(null);
        setIsProjectListOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProjectListOpen]);

  const handleProvinceSelect = (province: ProvinceSelection) => {
    setFocusedProjectId(null);
    setIsProjectListOpen(false);
    setActiveOrganizationCode(null);
    setActiveCity(null);
    setActiveProvince((current) => activeCity === null && current?.adcode === province.adcode ? null : province);
  };

  const handleCitySelect = (city: CitySelection) => {
    const isCurrentCity = activeCity?.cityAdcode === city.cityAdcode;
    const belongsToActiveOrganization = activeOrganizationCityAdcodes.includes(city.cityAdcode);
    setFocusedProjectId(null);
    if (isCurrentCity) {
      setIsProjectListOpen(true);
      return;
    }
    setIsProjectListOpen(false);
    if (!belongsToActiveOrganization) setActiveOrganizationCode(null);
    setActiveProvince({ adcode: city.provinceAdcode, name: city.provinceName });
    setActiveCity(city);
  };

  const handleProjectCaseSelect = (projectCase: HeavyAssetProjectCase) => {
    const project = WENSHU_PROJECTS.find((item) => item.id === projectCase.projectRecordId);
    if (!project) return;
    const citySummary = CITY_SUMMARY_BY_NAME.get(project.cityName);
    setActiveOrganizationCode(null);
    setActiveProvince({ adcode: project.provinceAdcode, name: project.provinceName });
    setActiveCity({
      cityAdcode: project.cityAdcode,
      provinceAdcode: project.provinceAdcode,
      provinceName: project.provinceName,
      name: project.cityName,
      count: citySummary?.count ?? 1,
    });
    setFocusedProjectId(projectCase.projectRecordId);
    setIsProjectListOpen(true);
  };

  const handleOrganizationSelect = (organization: WenshuOrganizationSnapshot) => {
    setFocusedProjectId(null);
    setIsProjectListOpen(false);
    setActiveOrganizationCode(organization.code);
    setActiveProvince(null);
    setActiveCity(null);
  };

  const resetMapScope = () => {
    setFocusedProjectId(null);
    setIsProjectListOpen(false);
    setActiveOrganizationCode(null);
    setActiveProvince(null);
    setActiveCity(null);
  };

  return (
    <DashboardVisualThemeContext.Provider value="dark">
    <main
      className={`fusion-cockpit ${styles.dashboard}`}
      data-layout="disclosure-map"
      data-dashboard-view="half-year-2026"
      data-visual-theme="dark"
      data-flip-card-count={0}
      data-source-period="mixed"
      data-source-periods={`${HALF_YEAR_2026_SOURCE.period},operating-snapshot`}
      data-source-date={HALF_YEAR_2026_SOURCE.reportingDate}
      data-metric-count={DISPLAYED_HALF_YEAR_METRIC_COUNT}
      data-source-metric-count={HALF_YEAR_2026_ALL_METRICS.length}
      data-supplemental-group-count={DISPLAYED_SUPPLEMENTAL_GROUP_COUNT}
      data-supplemental-metric-count={DISPLAYED_SUPPLEMENTAL_METRIC_COUNT}
    >
      <div className="fusion-grid" aria-hidden="true" />
      <header className="fusion-header">
        <div className="fusion-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={publicAssetPath("/greentown-logo-header.png")} alt="绿城中国 GREENTOWN" />
        </div>
        <div className="fusion-heading">
          <h1>绿城中国经营驾驶舱</h1>
        </div>
      </header>

      <section
        className={`fusion-workspace ${styles.workspace}`}
        aria-label="滚动经营与集团披露融合驾驶舱"
        data-active-organization-code={activeOrganizationCode ?? "none"}
        data-project-list-open={isProjectListOpen ? "true" : "false"}
        style={{ "--fusion-project-content-height": `${projectPanelContentHeight}px` } as CSSProperties}
      >
        <div className={`fusion-map-field ${styles.mapField}`}>
          <Suspense fallback={<MapLoadingState />}>
            <TechMap
              presentationMode="business"
              visualTheme="dark"
              projectCases={MAP_PROJECT_CASES}
              engineeringSites={MAP_ENGINEERING_SITES}
              activeAdcodes={activeAdcodes}
              activeCityAdcode={activeCity?.cityAdcode ?? null}
              scopedCityAdcodes={activeOrganizationCityAdcodes}
              scopedCityProjectCounts={activeOrganizationCityProjectCounts}
              scopeName={`${mapScopeName}经营地图`}
              viewOffsetX={0}
              labelOcclusionSelector='[data-half-map-occlusion="true"], .fusion-module-rail'
              viewportOcclusionSelector='.fusion-module-rail'
              interactionMode="metrics"
              selectedCityActionLabel="再次点击查看项目清单"
              onProjectCaseSelect={handleProjectCaseSelect}
              onProvinceSelect={handleProvinceSelect}
              onCitySelect={handleCitySelect}
            />
          </Suspense>
        </div>

        {isNationalMapScope ? <NationalMapLegend /> : null}

        <RegionControl
          activeOrganization={activeOrganization}
          scopeLabel={activeCity || activeProvince ? "地图范围" : "区域公司"}
          scopeName={mapScopeName}
          sourceDataset={regionSourceDataset}
          sourceDate={regionSourceDate}
          projectCount={activeCity ? cityProjects.length : null}
          projectCityName={activeCity?.name ?? null}
          onSelectOrganization={handleOrganizationSelect}
          onViewProjects={() => {
            setFocusedProjectId(null);
            setIsProjectListOpen(true);
          }}
          onReset={resetMapScope}
        />

        {isProjectListOpen && activeCity ? (
          <CityProjectDrilldown
            city={activeCity}
            projects={cityProjects}
            focusedProjectId={focusedProjectId}
            onShowCityProjects={() => setFocusedProjectId(null)}
            onClose={() => {
              setFocusedProjectId(null);
              setIsProjectListOpen(false);
            }}
          />
        ) : null}

        <aside className={`fusion-module-rail is-left ${styles.rail}`} aria-label="重资产项目">
          <div className={styles.railHeading}>
            <span>重资产项目</span>
          </div>
          <InvestmentPanel
            operatingOverview={operatingOverview}
            state={operatingOverviewState}
            scopeName={mapScopeName}
            facts={isAdministrativeMapScope ? regionFacts : operatingOverviewFallbackFacts}
            sourceDataset={regionSourceDataset}
            sourceDate={regionSourceDate}
            showGroupRank={isNationalMapScope}
            onRetry={() => {
              setOperatingOverviewResult({ requestKey: operatingOverviewRequestKey, snapshot: null, state: "loading" });
              setOperatingOverviewRetryToken((token) => token + 1);
            }}
          />
          <SalesPanel
            latestSales={latestSales}
            operatingOverview={operatingOverview}
            operatingOverviewState={operatingOverviewState}
            salesState={salesState}
            salesScopeName={salesScopeName}
            rollingSalesFallback={rollingSalesFallback}
            rollingMonthlySalesFallback={rollingMonthlySalesFallback}
            rollingSalesFallbackDate={rollingSalesFallbackDate}
            rollingSalesFallbackDataset={rollingSalesFallbackDataset}
            showGroupRank={isNationalMapScope}
            onRetrySales={() => {
              setLatestSalesResult({ requestKey: latestSalesRequestKey, snapshot: null, state: "loading" });
              setLatestSalesRetryToken((token) => token + 1);
            }}
          />
          <DeliveryPanel />
          <CustomerEvaluationPanel />
          <ResourcesPanel />
          <ConstructionPanel />
        </aside>

        <aside className={`fusion-module-rail is-right ${styles.rail}`} aria-labelledby="specialty-business-heading">
          <div className={styles.railHeading}>
            <span id="specialty-business-heading" role="heading" aria-level={2}>特色业务</span>
          </div>
          <ManagedBusinessPanel />
          <CommercialOperationsPanel />
          <TownOperationsPanel />
          <LifeTechnologyPanel />
          <WellnessPanel />
        </aside>
      </section>

    </main>
    </DashboardVisualThemeContext.Provider>
  );
}
