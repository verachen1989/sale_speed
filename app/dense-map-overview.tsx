"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AnnualMetric, AnnualMetricGroup } from "./annual-metrics";
import {
  ANNUAL_HERO_METRICS,
  ANNUAL_METRIC_GROUPS,
  annualMetricDisplay,
} from "./annual-metrics";
import TechMap, { type CitySelection, type ProvinceSelection } from "./tech-map";
import {
  WENSHU_COVERED_CITY_COUNT,
  WENSHU_DOMESTIC_PROJECT_COUNT,
  WENSHU_PROJECT_SNAPSHOT_DATE,
} from "./wenshu-projects-snapshot";

const AUTO_ROTATE_MS = 16_000;

type DenseMetricSection = {
  label: string;
  ids: string[];
};

const DENSE_METRIC_SECTIONS: Record<AnnualMetricGroup["id"], DenseMetricSection[]> = {
  investment: [
    { label: "新增规模", ids: ["investment-projects", "investment-saleable-area", "investment-new-value"] },
    { label: "投资质量", ids: ["investment-equity", "investment-conversion"] },
    { label: "城市结构", ids: ["investment-tier12", "investment-yangtze", "investment-lower-tier"] },
  ],
  construction: [
    { label: "开发节奏", ids: ["construction-demo", "construction-launch", "construction-delivery"] },
    { label: "绿色建造", ids: ["construction-prefab", "construction-green-area", "construction-green-projects"] },
  ],
  delivery: [
    { label: "交付规模", ids: ["delivery-projects", "delivery-area", "delivery-households"] },
    { label: "品质与代建", ids: ["delivery-satisfaction", "delivery-management-area", "delivery-management-households"] },
  ],
  sales: [
    { label: "销售总盘", ids: ["sales-total-area", "sales-total-amount"] },
    { label: "业务贡献", ids: ["sales-self-area", "sales-self-amount", "sales-management-area", "sales-management-amount"] },
    { label: "首开表现", ids: ["sales-first-launches", "sales-first-rate", "sales-premium"] },
    { label: "权益与区域", ids: ["sales-self-equity", "sales-self-price", "sales-tier12", "sales-yangtze"] },
    { label: "回款与存量", ids: ["sales-collection", "sales-old-stock", "sales-parking"] },
    { label: "数字营销", ids: ["sales-digital-share", "sales-digital-rate"] },
  ],
  holding: [
    { label: "经营收入", ids: ["holding-hotel", "holding-rent"] },
    { label: "资产结构", ids: ["holding-book-value", "holding-mortgaged"] },
  ],
  special: [
    { label: "小镇运营", ids: ["special-town-projects", "special-events", "special-award"] },
    { label: "产业协同", ids: ["special-epc", "special-decoration"] },
    { label: "客户与康养", ids: ["special-members", "special-senior"] },
  ],
  reserve: [
    { label: "储备规模", ids: ["reserve-projects", "reserve-total-area", "reserve-equity-area"] },
    { label: "可售资源", ids: ["reserve-saleable-area", "reserve-equity-saleable"] },
    { label: "区域结构", ids: ["reserve-tier12", "reserve-yangtze"] },
  ],
};

function DenseMetric({
  metric,
  index,
  timeline = false,
}: {
  metric: AnnualMetric;
  index: number;
  timeline?: boolean;
}) {
  const display = annualMetricDisplay(metric);
  const numericValue = Number(metric.value.replaceAll(",", ""));
  const progress = metric.unit === "%" && Number.isFinite(numericValue)
    ? Math.max(0, Math.min(100, numericValue))
    : null;
  const visualClass = metric.kind === "text"
    ? "is-statement"
    : timeline
      ? "is-timeline-node"
      : progress !== null
        ? "is-progress"
        : metric.priority === "supporting"
          ? "is-ledger"
          : index === 0
            ? "is-feature"
            : "is-stat";

  return (
    <article
      className={`${metric.priority === "supporting" ? "is-quiet" : "is-strong"} ${visualClass}`}
      data-metric-id={metric.id}
      data-priority={metric.priority}
      style={progress === null ? undefined : { "--metric-progress": `${progress}%` } as CSSProperties}
      title={[metric.label, display.note].filter(Boolean).join(" · ")}
    >
      {timeline ? <i className="dense-map-timeline-index">{index + 1}</i> : null}
      <span className="dense-map-metric-label">{metric.label}</span>
      <div className="dense-map-metric-value"><strong>{display.value}</strong>{metric.unit ? <em>{metric.unit}</em> : null}</div>
      {progress !== null ? <span className="dense-map-metric-progress" aria-hidden="true"><i /></span> : null}
      {display.note ? <small>{display.note}</small> : null}
    </article>
  );
}

export default function DenseMapOverview({
  onSwitchToIntegrated,
  onSwitchToProjects,
}: {
  onSwitchToIntegrated: () => void;
  onSwitchToProjects: () => void;
}) {
  const [activeGroupId, setActiveGroupId] = useState<AnnualMetricGroup["id"]>("investment");
  const [activeProvince, setActiveProvince] = useState<ProvinceSelection | null>(null);
  const [activeCity, setActiveCity] = useState<CitySelection | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const activeGroup = ANNUAL_METRIC_GROUPS.find((group) => group.id === activeGroupId) ?? ANNUAL_METRIC_GROUPS[0];
  const activeSections = DENSE_METRIC_SECTIONS[activeGroup.id];
  const activeMapAdcodes = useMemo(() => activeProvince ? [activeProvince.adcode] : [], [activeProvince]);
  const mapScopeName = activeCity?.name ?? activeProvince?.name ?? "全国";

  const selectGroup = useCallback((groupId: AnnualMetricGroup["id"]) => {
    setActiveGroupId(groupId);
    setAutoRotate(false);
  }, []);

  const moveGroup = useCallback((direction: number) => {
    setActiveGroupId((currentId) => {
      const currentIndex = ANNUAL_METRIC_GROUPS.findIndex((group) => group.id === currentId);
      return ANNUAL_METRIC_GROUPS[(currentIndex + direction + ANNUAL_METRIC_GROUPS.length) % ANNUAL_METRIC_GROUPS.length].id;
    });
    setAutoRotate(false);
  }, []);

  const handleProvinceSelect = useCallback((province: ProvinceSelection) => {
    setActiveProvince(province);
    setActiveCity(null);
    setAutoRotate(false);
  }, []);

  const handleCitySelect = useCallback((city: CitySelection) => {
    setActiveProvince({ adcode: city.provinceAdcode, name: city.provinceName });
    setActiveCity(city);
    setAutoRotate(false);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setTimeout(() => {
      if (reducedMotion.matches) setAutoRotate(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!autoRotate) return;
    const timer = window.setInterval(() => {
      setActiveGroupId((currentId) => {
        const currentIndex = ANNUAL_METRIC_GROUPS.findIndex((group) => group.id === currentId);
        return ANNUAL_METRIC_GROUPS[(currentIndex + 1) % ANNUAL_METRIC_GROUPS.length].id;
      });
    }, AUTO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [autoRotate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        moveGroup(event.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (event.key !== "Escape") return;
      if (activeCity) setActiveCity(null);
      else setActiveProvince(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCity, moveGroup]);

  return (
    <main className="dense-map-cockpit" data-concept="dense-workbench" data-active-stage={activeGroup.id}>
      <header className="dense-map-header">
        <div className="dense-map-brand">
          {/* Existing project asset; native sizing keeps this dashboard compatible with vinext. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/greentown-logo-full.png" alt="绿城中国 GREENTOWN" />
        </div>
        <div className="dense-map-heading">
          <p>ANNUAL OPERATIONS · DENSE MAP WORKBENCH</p>
          <h1>绿城中国经营工作台</h1>
        </div>
        <div className="dense-map-header-actions">
          <div className="dense-map-view-switch" role="group" aria-label="设计方案切换">
            <button type="button" className="is-active" aria-pressed="true">密集地图</button>
            <button type="button" aria-pressed="false" onClick={onSwitchToIntegrated}>融合地图</button>
            <button type="button" aria-pressed="false" onClick={onSwitchToProjects}>项目驾驶舱</button>
          </div>
          <div className="dense-map-period"><i /><span>指标口径</span><b>2025 年度</b></div>
        </div>
      </header>

      <section className="dense-map-body">
        <aside
          className={`dense-map-workbench is-${activeGroup.id}`}
          data-group-id={activeGroup.id}
          data-metric-count={activeGroup.metrics.length}
        >
          <header className="dense-map-stage-header">
            <div className="dense-map-stage-kicker">
              <p>ANNUAL PERFORMANCE</p>
              <nav className="dense-map-stage-pager" aria-label="经营章节快速切换">
                {ANNUAL_METRIC_GROUPS.map((group) => (
                  <button
                    type="button"
                    key={group.id}
                    className={group.id === activeGroup.id ? "is-active" : ""}
                    aria-label={`${group.index} ${group.name}`}
                    aria-pressed={group.id === activeGroup.id}
                    title={group.name}
                    onClick={() => selectGroup(group.id)}
                  >{group.index}</button>
                ))}
              </nav>
              <button
                type="button"
                className={`dense-map-rotate ${autoRotate ? "is-active" : ""}`}
                aria-label={autoRotate ? "暂停展播" : "启动展播"}
                aria-pressed={autoRotate}
                title={autoRotate ? "暂停展播" : "启动展播"}
                onClick={() => setAutoRotate((value) => !value)}
              ><i /></button>
            </div>
            <h2>{activeGroup.name}</h2>
            <strong>{activeGroup.summary}</strong>
          </header>

          <div className="dense-map-metric-ledger" aria-label={`${activeGroup.name}年度指标`}>
            {activeSections.map((section) => {
              const metrics = section.ids
                .map((id) => activeGroup.metrics.find((metric) => metric.id === id))
                .filter((metric): metric is AnnualMetric => Boolean(metric));
              const timeline = activeGroup.id === "construction" && section.label === "开发节奏";
              return (
                <section key={section.label} className={`dense-map-metric-section items-${metrics.length} ${timeline ? "is-timeline" : ""}`}>
                  <header><h3>{section.label}</h3></header>
                  <div>{metrics.map((metric, index) => <DenseMetric key={metric.id} metric={metric} index={index} timeline={timeline} />)}</div>
                </section>
              );
            })}
          </div>
        </aside>

        <section className="dense-map-stage" aria-label="全国经营布局">
          <div className="dense-map-field" aria-live="polite">
            <TechMap
              activeAdcodes={activeMapAdcodes}
              activeCityAdcode={activeCity?.cityAdcode ?? null}
              scopeName={mapScopeName}
              viewOffsetX={0}
              interactionMode="locate"
              onProvinceSelect={handleProvinceSelect}
              onCitySelect={handleCitySelect}
            />
          </div>

          <section className="dense-map-hero-rail" aria-label="年度关键值">
            {ANNUAL_HERO_METRICS.map((metric, index) => {
              const display = annualMetricDisplay(metric);
              return (
                <button type="button" key={metric.id} onClick={() => selectGroup(metric.groupId)}>
                  <i>0{index + 1}</i><span>{metric.label}</span>
                  <div><strong>{display.value}</strong><em>{metric.unit}</em></div>
                  {display.note ? <small>{display.note}</small> : null}
                </button>
              );
            })}
          </section>

          <div className="dense-map-title"><p>PROJECT SCALE CLOUD</p><h2>全国项目布局</h2><span>{WENSHU_COVERED_CITY_COUNT} 城聚合 · 年度指标保持集团口径</span></div>

          <div className="dense-map-scope">
            <i />
            <div><span>当前地图范围</span><b>{mapScopeName}</b><small>{activeCity ? `${activeCity.count} 个中国境内有效项目` : activeProvince ? "已定位行政区 · 项目点簇按城市聚合" : `${WENSHU_DOMESTIC_PROJECT_COUNT} 个境内有效项目 · ${WENSHU_COVERED_CITY_COUNT} 个城市锚点`}</small></div>
            {activeProvince ? <button type="button" onClick={() => { setActiveCity(null); setActiveProvince(null); setAutoRotate(false); }}>返回全国</button> : null}
          </div>

          <div className="dense-map-source">{WENSHU_PROJECT_SNAPSHOT_DATE} · 项目规模点簇按城市锚点聚合，非精确地址</div>
        </section>
      </section>
    </main>
  );
}
