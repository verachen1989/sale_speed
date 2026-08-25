"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AnnualMetric, AnnualMetricGroup } from "./annual-metrics";
import {
  ANNUAL_HERO_METRICS,
  ANNUAL_METRIC_GROUPS,
  ANNUAL_METRIC_TOTALS,
  annualMetricDisplay,
} from "./annual-metrics";
import TechMap, { type CitySelection, type ProvinceSelection } from "./tech-map";
import {
  WENSHU_COVERED_CITY_COUNT,
  WENSHU_DOMESTIC_PROJECT_COUNT,
  WENSHU_PROJECT_SNAPSHOT_DATE,
} from "./wenshu-projects-snapshot";

const AUTO_ROTATE_MS = 15_000;
const STAGE_SIGNAL_METRIC_IDS: Record<AnnualMetricGroup["id"], readonly string[]> = {
  investment: ["investment-equity", "investment-new-value"],
  construction: ["construction-demo", "construction-launch", "construction-delivery"],
  delivery: ["delivery-satisfaction", "delivery-area", "delivery-households"],
  sales: ["sales-total-amount", "sales-self-amount", "sales-management-amount"],
  holding: ["holding-hotel", "holding-rent"],
  special: ["special-events", "special-members", "special-decoration"],
  reserve: ["reserve-projects", "reserve-tier12", "reserve-yangtze"],
};

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

function StageSignal({ group }: { group: AnnualMetricGroup }) {
  const metric = (id: string) => group.metrics.find((item) => item.id === id);

  if (group.id === "investment") {
    return (
      <div className="fusion-stage-signal is-highlight">
        <div className="fusion-highlight-value" data-metric-id="investment-equity">
          <span>平均权益比例</span>
          <div><strong>{metric("investment-equity")?.value}</strong><em>%</em></div>
          <i aria-hidden="true"><u style={{ width: "69%" }} /></i>
        </div>
        <div className="fusion-highlight-related" data-metric-id="investment-new-value">
          <span>新增货值</span>
          <div><b>{metric("investment-new-value")?.value}</b><em>亿元</em></div>
          <small>行业第 4</small>
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
          <div key={id} data-metric-id={id}><i>{index + 1}</i><b>{metric(id)?.value}</b><em>月</em><span>{label}</span></div>
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
        <div data-metric-id="special-events"><span>IP 活动</span><b>{metric("special-events")?.value}+</b><em>场</em></div>
        <div data-metric-id="special-members"><span>桂玥会</span><b>{metric("special-members")?.value}</b><em>万</em></div>
        <div data-metric-id="special-decoration"><span>家装定制</span><b>{metric("special-decoration")?.value}</b><em>亿元</em></div>
      </div>
    );
  }

  return (
    <div className="fusion-stage-signal is-reserve">
      <div data-metric-id="reserve-projects"><span>土储项目</span><strong>{metric("reserve-projects")?.value}</strong><em>个</em></div>
      <p data-metric-id="reserve-tier12"><span>一二线货值</span><i><u style={{ width: "80%" }} /></i><b>{metric("reserve-tier12")?.value}%</b></p>
      <p data-metric-id="reserve-yangtze"><span>长三角货值</span><i><u style={{ width: "64%" }} /></i><b>{metric("reserve-yangtze")?.value}%</b></p>
    </div>
  );
}

export default function MapIntegratedOverview({
  onSwitchToProjects,
}: {
  onSwitchToProjects: () => void;
}) {
  const [activeGroupId, setActiveGroupId] = useState<AnnualMetricGroup["id"]>("investment");
  const [activeProvince, setActiveProvince] = useState<ProvinceSelection | null>(null);
  const [activeCity, setActiveCity] = useState<CitySelection | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const activeGroup = ANNUAL_METRIC_GROUPS.find((group) => group.id === activeGroupId) ?? ANNUAL_METRIC_GROUPS[0];
  const primaryMetrics = useMemo(
    () => activeGroup.metrics.filter((metric) => metric.priority === "primary"),
    [activeGroup],
  );
  const supportingMetrics = useMemo(
    () => activeGroup.metrics.filter((metric) => metric.priority === "supporting"),
    [activeGroup],
  );
  const stageMetricIds = STAGE_SIGNAL_METRIC_IDS[activeGroup.id];
  const cardMetrics = activeGroup.metrics.filter((metric) => !stageMetricIds.includes(metric.id));
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        moveGroup(event.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (event.key === "Escape") {
        if (activeCity) setActiveCity(null);
        else setActiveProvince(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCity, moveGroup]);

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

  return (
    <main className="fusion-cockpit" data-active-stage={activeGroup.id}>
      <div className="fusion-grid" aria-hidden="true" />

      <header className="fusion-header">
        <div className="fusion-brand">
          {/* Existing project asset; native sizing keeps this dashboard compatible with vinext. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/greentown-logo-full.png" alt="绿城中国 GREENTOWN" />
        </div>
        <div className="fusion-heading">
          <p>ANNUAL OPERATIONS · MAP INTEGRATED VIEW</p>
          <h1>绿城中国经营概览</h1>
        </div>
        <div className="fusion-header-actions">
          <div className="fusion-view-switch" role="group" aria-label="大屏视图切换">
            <button type="button" className="is-active" aria-pressed="true">融合地图</button>
            <button type="button" aria-pressed="false" onClick={onSwitchToProjects}>项目驾驶舱</button>
          </div>
          <div className="fusion-period"><i /><span>2025 年度展示口径</span></div>
        </div>
      </header>

      <section className="fusion-hero-strip" aria-label="年度核心经营指标">
        {ANNUAL_HERO_METRICS.map((metric, index) => {
          const display = annualMetricDisplay(metric);
          return (
            <button type="button" key={metric.id} onClick={() => selectGroup(metric.groupId)}>
              <span>0{index + 1}</span>
              <p>{metric.label}</p>
              <div><strong>{display.value}</strong><em>{metric.unit}</em></div>
              {display.note ? <small>{display.note}</small> : null}
            </button>
          );
        })}
      </section>

      <section
        className="fusion-workspace"
        aria-labelledby="fusion-stage-title"
        data-group-id={activeGroup.id}
        data-metric-count={activeGroup.metrics.length}
        data-primary-count={primaryMetrics.length}
        data-supporting-count={supportingMetrics.length}
      >
        <div className="fusion-map-field" aria-live="polite">
          <TechMap
            activeAdcodes={activeMapAdcodes}
            activeCityAdcode={activeCity?.cityAdcode ?? null}
            scopeName={mapScopeName}
            viewOffsetX={7}
            interactionMode="locate"
            onProvinceSelect={handleProvinceSelect}
            onCitySelect={handleCitySelect}
          />
        </div>

        <aside className="fusion-combined-panel">
          <div className="fusion-combined-meta">
            <div className="fusion-scope-lock">
              <i />
              <div><b>2025 集团年度口径</b><span>{WENSHU_DOMESTIC_PROJECT_COUNT} 个境内有效项目 / {WENSHU_COVERED_CITY_COUNT} 个城市锚点</span></div>
            </div>
            <div className="fusion-stage-controls">
              <button type="button" aria-label="上一章节" onClick={() => moveGroup(-1)}>←</button>
              <nav aria-label="经营章节快速切换">
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
              <button type="button" aria-label="下一章节" onClick={() => moveGroup(1)}>→</button>
              <button
                type="button"
                className={autoRotate ? "is-active" : ""}
                aria-pressed={autoRotate}
                onClick={() => setAutoRotate((value) => !value)}
              >{autoRotate ? "自动轮播" : "继续轮播"}</button>
            </div>
          </div>

          <section className="fusion-combined-overview">
            <div className="fusion-combined-heading">
              <div><span className="fusion-stage-index">{activeGroup.index}</span><p>{activeGroup.eyebrow}</p></div>
              <h2 id="fusion-stage-title">{activeGroup.name}</h2>
              <strong>{activeGroup.summary}</strong>
            </div>
            <StageSignal group={activeGroup} />
          </section>

          <div
            className="fusion-combined-metrics"
            data-rendered-metric-count={activeGroup.metrics.length}
            data-feature-metric-count={stageMetricIds.length}
            data-card-metric-count={cardMetrics.length}
          >
            <section className="fusion-unified-metrics">
              <header><div><p>ANNUAL PERFORMANCE</p><h3>年度表现</h3></div></header>
              <div>{cardMetrics.map((metric) => <MetricTile key={metric.id} metric={metric} />)}</div>
            </section>
          </div>
        </aside>

        <div className="fusion-map-caption">
          <p>PROJECT SCALE CLOUD · 3D MAP</p>
          <h3>{mapScopeName}</h3>
          <span>{activeCity ? `${activeCity.count} 个境内有效项目` : activeProvince ? "已定位行政区 · 项目点簇按城市聚合" : `${WENSHU_DOMESTIC_PROJECT_COUNT} 个境内有效项目 · ${WENSHU_COVERED_CITY_COUNT} 个城市锚点`}</span>
          <small>{WENSHU_PROJECT_SNAPSHOT_DATE} · 点簇表达项目数量，不代表精确地址</small>
          {activeProvince ? <button type="button" onClick={() => { setActiveCity(null); setActiveProvince(null); setAutoRotate(false); }}>返回全国</button> : null}
        </div>

      </section>

      <footer className="fusion-footer">
        <span>经营概览 · 地图融合展示</span>
        <span>7 大经营板块 · {ANNUAL_METRIC_TOTALS.total} 项年度经营指标</span>
        <span>正式上屏前统一核验数据源与口径</span>
      </footer>
    </main>
  );
}
