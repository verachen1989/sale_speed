"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AnnualMetric, AnnualMetricGroup } from "./annual-metrics";
import {
  ANNUAL_HERO_METRICS,
  ANNUAL_METRIC_GROUPS,
  ANNUAL_METRIC_TOTALS,
} from "./annual-metrics";
import TechMap, { type CitySelection, type ProvinceSelection } from "./tech-map";
import { WENSHU_PROJECT_SNAPSHOT_DATE } from "./wenshu-projects-snapshot";

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

function DenseMetric({ metric }: { metric: AnnualMetric }) {
  return (
    <article
      className={`${metric.priority === "supporting" ? "is-quiet" : "is-strong"} ${metric.kind === "text" ? "is-text" : ""}`}
      data-metric-id={metric.id}
      data-priority={metric.priority}
      title={[metric.label, metric.note].filter(Boolean).join(" · ")}
    >
      <span>{metric.label}</span>
      <div><strong>{metric.value}</strong>{metric.unit ? <em>{metric.unit}</em> : null}</div>
      {metric.note ? <small>{metric.note}</small> : null}
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
        <nav className="dense-map-chapters" aria-label="经营板块">
          <header><p>BUSINESS</p><h2>经营板块</h2><span>07 CHAPTERS</span></header>
          <div>
            {ANNUAL_METRIC_GROUPS.map((group) => (
              <button
                type="button"
                key={group.id}
                className={group.id === activeGroup.id ? "is-active" : ""}
                aria-pressed={group.id === activeGroup.id}
                onClick={() => selectGroup(group.id)}
              >
                <i>{group.index}</i>
                <span><b>{group.name}</b><small>{group.endpoint}</small></span>
                <em>{group.metrics.length}</em>
              </button>
            ))}
          </div>
          <footer><strong>{ANNUAL_METRIC_TOTALS.total}</strong><span>年度经营指标</span></footer>
        </nav>

        <aside
          className={`dense-map-workbench is-${activeGroup.id}`}
          data-group-id={activeGroup.id}
          data-metric-count={activeGroup.metrics.length}
        >
          <header className="dense-map-stage-header">
            <div><span>{activeGroup.index}</span><p>ANNUAL PERFORMANCE</p></div>
            <h2>{activeGroup.name}</h2>
            <strong>{activeGroup.summary}</strong>
            <footer><span>{activeGroup.period}</span><b>本章 {activeGroup.metrics.length} 项</b></footer>
          </header>

          <div className="dense-map-metric-ledger" aria-label={`${activeGroup.name}年度指标`}>
            {activeSections.map((section) => {
              const metrics = section.ids
                .map((id) => activeGroup.metrics.find((metric) => metric.id === id))
                .filter((metric): metric is AnnualMetric => Boolean(metric));
              return (
                <section key={section.label} className={`dense-map-metric-section items-${metrics.length}`}>
                  <header><h3>{section.label}</h3><span>{metrics.length}</span></header>
                  <div>{metrics.map((metric) => <DenseMetric key={metric.id} metric={metric} />)}</div>
                </section>
              );
            })}
          </div>

          <footer className="dense-map-workbench-footer">
            <div><button type="button" aria-label="上一章节" onClick={() => moveGroup(-1)}>←</button><span>{activeGroup.index} / 07</span><button type="button" aria-label="下一章节" onClick={() => moveGroup(1)}>→</button></div>
            <button
              type="button"
              className={autoRotate ? "is-active" : ""}
              aria-pressed={autoRotate}
              onClick={() => setAutoRotate((value) => !value)}
            ><i />{autoRotate ? "展播模式" : "启动展播"}</button>
          </footer>
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
            {ANNUAL_HERO_METRICS.map((metric, index) => (
              <button type="button" key={metric.id} onClick={() => selectGroup(metric.groupId)}>
                <i>0{index + 1}</i><span>{metric.label}</span>
                <div><strong>{metric.value}</strong><em>{metric.unit}</em></div>
                <small>{metric.note}</small>
              </button>
            ))}
          </section>

          <div className="dense-map-title"><p>GEOGRAPHIC PRESENCE</p><h2>全国经营布局</h2><span>地图定位 · 年度指标保持集团口径</span></div>

          <div className="dense-map-scope">
            <i />
            <div><span>当前地图范围</span><b>{mapScopeName}</b><small>{activeCity ? `${activeCity.count} 个中国境内有效项目` : activeProvince ? "已定位行政区 · 可继续选择城市" : "点击行政区或城市节点进行空间定位"}</small></div>
            {activeProvince ? <button type="button" onClick={() => { setActiveCity(null); setActiveProvince(null); setAutoRotate(false); }}>返回全国</button> : null}
          </div>

          <div className="dense-map-source">问数中国境内有效项目快照 {WENSHU_PROJECT_SNAPSHOT_DATE}</div>
          <div className="dense-map-stage-status"><span>{activeGroup.index}</span><b>{activeGroup.name}</b><small>当前经营章节</small></div>
        </section>
      </section>
    </main>
  );
}
