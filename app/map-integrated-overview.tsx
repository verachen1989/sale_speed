"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AnnualMetric, AnnualMetricGroup } from "./annual-metrics";
import {
  ANNUAL_HERO_METRICS,
  ANNUAL_METRIC_GROUPS,
  ANNUAL_METRIC_TOTALS,
} from "./annual-metrics";
import TechMap, { type CitySelection, type ProvinceSelection } from "./tech-map";
import { WENSHU_PROJECT_SNAPSHOT_DATE } from "./wenshu-projects-snapshot";

const AUTO_ROTATE_MS = 15_000;

function MetricTile({ metric }: { metric: AnnualMetric }) {
  return (
    <article
      className={metric.kind === "text" ? "is-text" : ""}
      data-metric-id={metric.id}
      data-priority={metric.priority}
    >
      <span>{metric.label}</span>
      <div><strong>{metric.value}</strong>{metric.unit ? <em>{metric.unit}</em> : null}</div>
      {metric.note ? <small>{metric.note}</small> : null}
    </article>
  );
}

function StageSignal({ group }: { group: AnnualMetricGroup }) {
  const metric = (id: string) => group.metrics.find((item) => item.id === id);

  if (group.id === "investment") {
    return (
      <div className="fusion-stage-signal is-ring">
        <div className="fusion-mini-ring" style={{ "--signal-progress": "69%" } as CSSProperties}>
          <strong>{metric("investment-equity")?.value}</strong><em>%</em>
        </div>
        <div><span>平均权益比例</span><b>新增货值 {metric("investment-new-value")?.value} 亿元</b><small>行业第 4</small></div>
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
          <div key={id}><i>{index + 1}</i><b>{metric(id)?.value}</b><em>月</em><span>{label}</span></div>
        ))}
      </div>
    );
  }

  if (group.id === "delivery") {
    return (
      <div className="fusion-stage-signal is-ring">
        <div className="fusion-mini-ring" style={{ "--signal-progress": "94%" } as CSSProperties}>
          <strong>{metric("delivery-satisfaction")?.value}</strong><em>分</em>
        </div>
        <div><span>整体交付满意度</span><b>交付 {metric("delivery-area")?.value} 万㎡</b><small>{metric("delivery-households")?.value} 万户</small></div>
      </div>
    );
  }

  if (group.id === "sales") {
    return (
      <div className="fusion-stage-signal is-sales">
        <div><span>总合同销售金额</span><strong>{metric("sales-total-amount")?.value}</strong><em>亿元</em><small>行业第 2</small></div>
        <p><i style={{ width: "60.9%" }} /><em style={{ width: "39.1%" }} /></p>
        <footer><span>自投 1,534</span><span>代建 985</span></footer>
      </div>
    );
  }

  if (group.id === "holding") {
    return (
      <div className="fusion-stage-signal is-bars">
        <div><span>酒店运营</span><i><u style={{ width: "100%" }} /></i><b>{metric("holding-hotel")?.value}</b></div>
        <div><span>物业租金</span><i><u style={{ width: "30%" }} /></i><b>{metric("holding-rent")?.value}</b></div>
        <small>经营收入 · 亿元</small>
      </div>
    );
  }

  if (group.id === "special") {
    return (
      <div className="fusion-stage-signal is-triad">
        <div><span>IP 活动</span><b>{metric("special-events")?.value}+</b><em>场</em></div>
        <div><span>桂玥会</span><b>{metric("special-members")?.value}</b><em>万</em></div>
        <div><span>家装定制</span><b>{metric("special-decoration")?.value}+</b><em>亿元</em></div>
      </div>
    );
  }

  return (
    <div className="fusion-stage-signal is-reserve">
      <div><span>土储项目</span><strong>{metric("reserve-projects")?.value}</strong><em>个</em></div>
      <p><span>一二线货值</span><i><u style={{ width: "80%" }} /></i><b>{metric("reserve-tier12")?.value}%</b></p>
      <p><span>长三角货值</span><i><u style={{ width: "64%" }} /></i><b>{metric("reserve-yangtze")?.value}%</b></p>
    </div>
  );
}

export default function MapIntegratedOverview({
  onSwitchToDense,
  onSwitchToProjects,
}: {
  onSwitchToDense?: () => void;
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
            {onSwitchToDense ? <button type="button" aria-pressed="false" onClick={onSwitchToDense}>密集地图</button> : null}
            <button type="button" className="is-active" aria-pressed="true">融合地图</button>
            <button type="button" aria-pressed="false" onClick={onSwitchToProjects}>项目驾驶舱</button>
          </div>
          <div className="fusion-period"><i /><span>2025 年度展示口径</span></div>
        </div>
      </header>

      <section className="fusion-hero-strip" aria-label="年度核心经营指标">
        {ANNUAL_HERO_METRICS.map((metric, index) => (
          <button type="button" key={metric.id} onClick={() => selectGroup(metric.groupId)}>
            <span>0{index + 1}</span>
            <p>{metric.label}</p>
            <div><strong>{metric.value}</strong><em>{metric.unit}</em></div>
            <small>{metric.note}</small>
          </button>
        ))}
      </section>

      <nav className="fusion-lifecycle" aria-label="全经营链路">
        {ANNUAL_METRIC_GROUPS.map((group) => (
          <button
            type="button"
            key={group.id}
            className={group.id === activeGroup.id ? "is-active" : ""}
            aria-pressed={group.id === activeGroup.id}
            onClick={() => selectGroup(group.id)}
          >
            <i>{group.index}</i><span><b>{group.name}</b><small>{group.endpoint}</small></span>
          </button>
        ))}
        <span
          key={`${activeGroup.id}-${autoRotate ? "running" : "paused"}`}
          className={`fusion-cycle-progress ${autoRotate ? "is-running" : ""}`}
          aria-hidden="true"
        />
      </nav>

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
            viewOffsetX={4}
            interactionMode="locate"
            onProvinceSelect={handleProvinceSelect}
            onCitySelect={handleCitySelect}
          />
        </div>

        <aside className="fusion-stage-panel">
          <span className="fusion-stage-index">{activeGroup.index}</span>
          <p>{activeGroup.eyebrow}</p>
          <h2 id="fusion-stage-title">{activeGroup.name}</h2>
          <strong>{activeGroup.summary}</strong>
          <StageSignal group={activeGroup} />
          <div className="fusion-stage-count">
            <span>本章指标</span><b>{activeGroup.metrics.length}</b><em>项</em>
            <small>{primaryMetrics.length} 项重点维度 · {supportingMetrics.length} 项结构维度</small>
          </div>
          <div className="fusion-scope-lock">
            <i />
            <div><b>指标 · 2025 集团年度口径</b><span>地图 · {WENSHU_PROJECT_SNAPSHOT_DATE} 中国境内有效项目点位，仅作空间定位</span></div>
          </div>
          <div className="fusion-stage-controls">
            <button type="button" aria-label="上一章节" onClick={() => moveGroup(-1)}>←</button>
            <span>{activeGroup.index} / 07</span>
            <button type="button" aria-label="下一章节" onClick={() => moveGroup(1)}>→</button>
            <button
              type="button"
              className={autoRotate ? "is-active" : ""}
              aria-pressed={autoRotate}
              onClick={() => setAutoRotate((value) => !value)}
            >{autoRotate ? "自动轮播" : "继续轮播"}</button>
          </div>
        </aside>

        <div className="fusion-map-caption">
          <p>PROJECT DISTRIBUTION · 3D MAP</p>
          <h3>{mapScopeName}</h3>
          <span>{activeCity ? `${activeCity.count} 个项目` : activeProvince ? "已定位行政区 · 可继续点击城市" : "点击行政区或城市节点查看空间分布"}</span>
          <small>问数中国境内有效项目快照 {WENSHU_PROJECT_SNAPSHOT_DATE} · 年度指标仍为集团口径</small>
          {activeProvince ? <button type="button" onClick={() => { setActiveCity(null); setActiveProvince(null); setAutoRotate(false); }}>返回全国</button> : null}
        </div>

        <aside className="fusion-metric-panel">
          <section className="fusion-primary-metrics">
            <header><div><p>ANNUAL PERFORMANCE</p><h3>年度表现</h3></div><span>{primaryMetrics.length} 项 · {activeGroup.period}</span></header>
            <div>{primaryMetrics.map((metric) => <MetricTile key={metric.id} metric={metric} />)}</div>
          </section>
          {supportingMetrics.length > 0 ? (
            <section className="fusion-supporting-metrics">
              <header><div><p>BUSINESS STRUCTURE</p><h3>结构与效率</h3></div><span>{supportingMetrics.length} 项 · 经营观察</span></header>
              <div>{supportingMetrics.map((metric) => <MetricTile key={metric.id} metric={metric} />)}</div>
            </section>
          ) : null}
        </aside>
      </section>

      <footer className="fusion-footer">
        <span>经营概览 · 地图融合展示 · 共 {ANNUAL_METRIC_TOTALS.total} 项指标</span>
        <span>7 大经营板块 · {ANNUAL_METRIC_TOTALS.total} 项年度经营指标</span>
        <span>指标来自初步意向稿 · 正式上屏前需统一核验数据源与口径</span>
      </footer>
    </main>
  );
}
