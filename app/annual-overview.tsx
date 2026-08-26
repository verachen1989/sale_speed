"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnnualMetric, AnnualMetricGroup } from "./annual-metrics";
import {
  ANNUAL_HERO_METRICS,
  ANNUAL_METRIC_GROUPS,
  ANNUAL_METRIC_TOTALS,
} from "./annual-metrics";
import { publicAssetPath } from "./public-path";

const AUTO_ROTATE_MS = 14_000;

function MetricCard({ metric }: { metric: AnnualMetric }) {
  return (
    <article className={metric.kind === "text" ? "is-text" : ""}>
      <span>{metric.label}</span>
      <div><strong>{metric.value}</strong>{metric.unit ? <em>{metric.unit}</em> : null}</div>
      {metric.note ? <small>{metric.note}</small> : null}
    </article>
  );
}

function SupportingMetric({ metric }: { metric: AnnualMetric }) {
  return (
    <article>
      <span>{metric.label}</span>
      <div><strong>{metric.value}</strong>{metric.unit ? <em>{metric.unit}</em> : null}</div>
      {metric.note ? <small>{metric.note}</small> : null}
    </article>
  );
}

function StageVisual({ group }: { group: AnnualMetricGroup }) {
  const metric = (id: string) => group.metrics.find((item) => item.id === id);

  if (group.id === "investment") {
    return (
      <div className="annual-visual annual-visual-investment">
        <div className="annual-ring is-69">
          <div><strong>69</strong><em>%</em><span>平均权益比例</span></div>
        </div>
        <div className="annual-visual-note"><i />行业第 4<span>新增货值 1,355 亿元</span></div>
      </div>
    );
  }

  if (group.id === "construction") {
    const steps = [
      { metric: metric("construction-demo"), label: "示范区开放" },
      { metric: metric("construction-launch"), label: "首开" },
      { metric: metric("construction-delivery"), label: "交付" },
    ];
    return (
      <div className="annual-visual annual-visual-construction" aria-label="拿地至关键开发节点平均周期">
        <div className="annual-cycle-origin"><i />拿地</div>
        <div className="annual-cycle-line" />
        <div className="annual-cycle-steps">
          {steps.map((step, index) => (
            <div key={step.label}>
              <i><b>{index + 1}</b></i>
              <strong>{step.metric?.value}</strong><em>个月</em>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (group.id === "delivery") {
    return (
      <div className="annual-visual annual-visual-delivery">
        <div className="annual-score-orbit"><div><strong>94</strong><em>分</em><span>整体交付满意度</span></div></div>
        <div className="annual-delivery-tracks">
          <div><span>合计交付面积</span><b>2,269<em>万㎡</em></b><i><u style={{ width: "100%" }} /></i></div>
          <div><span>绿城管理交付面积</span><b>1,451<em>万㎡</em></b><i><u style={{ width: "64%" }} /></i></div>
          <div><span>合计交付户数</span><b>11.9<em>万户</em></b><i><u style={{ width: "100%" }} /></i></div>
          <div><span>绿城管理交付户数</span><b>超 8<em>万户</em></b><i><u style={{ width: "67%" }} /></i></div>
        </div>
      </div>
    );
  }

  if (group.id === "sales") {
    return (
      <div className="annual-visual annual-visual-sales">
        <div className="annual-sales-total"><span>总合同销售金额</span><strong>2,519</strong><em>亿元</em><small>行业第 2</small></div>
        <div className="annual-composition">
          <div className="annual-composition-label"><span>金额构成</span><b>亿元</b></div>
          <div className="annual-stacked-bar"><i style={{ width: "60.9%" }}><span>自投 1,534</span></i><em style={{ width: "39.1%" }}><span>代建 985</span></em></div>
          <div className="annual-composition-label"><span>面积构成</span><b>万㎡</b></div>
          <div className="annual-stacked-bar is-area"><i style={{ width: "38.6%" }}><span>自投 466</span></i><em style={{ width: "61.4%" }}><span>代建 742</span></em></div>
        </div>
      </div>
    );
  }

  if (group.id === "holding") {
    return (
      <div className="annual-visual annual-visual-holding">
        <div className="annual-income-heading"><span>经营收入</span><b>亿元</b></div>
        <div className="annual-income-bars">
          <div><span>酒店运营</span><i><u style={{ width: "100%" }} /></i><strong>9.93</strong></div>
          <div><span>投资性物业租金</span><i><u style={{ width: "30%" }} /></i><strong>2.98</strong></div>
        </div>
        <p><i />租金收入同比 <strong>+4.6%</strong></p>
      </div>
    );
  }

  if (group.id === "special") {
    return (
      <div className="annual-visual annual-visual-special">
        <div><span>IP 活动</span><strong>400<em>+</em></strong><small>场 / 年</small></div>
        <div><span>桂玥会会员</span><strong>117</strong><small>万</small></div>
        <div><span>家装定制</span><strong>10<em>+</em></strong><small>亿元</small></div>
        <p><i />2025 中国特色小镇运营领先品牌</p>
      </div>
    );
  }

  return (
    <div className="annual-visual annual-visual-reserve">
      <div className="annual-reserve-total"><span>土地储备项目</span><strong>146</strong><em>个</em><small>在建 + 待建</small></div>
      <div className="annual-reserve-pairs">
        <div><span>总建筑面积</span><b>2,371<em>万㎡</em></b><i><u style={{ width: "100%" }} /></i></div>
        <div><span>权益总建筑面积</span><b>1,506<em>万㎡</em></b><i><u style={{ width: "63.5%" }} /></i></div>
        <div><span>总可售面积</span><b>1,567<em>万㎡</em></b><i><u style={{ width: "100%" }} /></i></div>
        <div><span>权益可售面积</span><b>972<em>万㎡</em></b><i><u style={{ width: "62%" }} /></i></div>
      </div>
    </div>
  );
}

export default function AnnualOverview({ onSwitchToLive }: { onSwitchToLive: () => void }) {
  const [activeGroupId, setActiveGroupId] = useState<AnnualMetricGroup["id"]>("investment");
  const [autoRotate, setAutoRotate] = useState(true);
  const activeIndex = ANNUAL_METRIC_GROUPS.findIndex((group) => group.id === activeGroupId);
  const activeGroup = ANNUAL_METRIC_GROUPS[activeIndex] ?? ANNUAL_METRIC_GROUPS[0];
  const primaryMetrics = useMemo(
    () => activeGroup.metrics.filter((metric) => metric.priority === "primary"),
    [activeGroup],
  );
  const supportingMetrics = useMemo(
    () => activeGroup.metrics.filter((metric) => metric.priority === "supporting"),
    [activeGroup],
  );
  const cardMetrics = activeGroup.id === "investment"
    ? primaryMetrics.filter((metric) => metric.id !== "investment-equity")
    : activeGroup.id === "delivery"
      ? primaryMetrics.filter((metric) => metric.id !== "delivery-satisfaction")
      : activeGroup.id === "sales"
        ? primaryMetrics.filter((metric) => [
          "sales-total-area",
          "sales-first-launches",
          "sales-first-rate",
          "sales-premium",
        ].includes(metric.id))
      : primaryMetrics;

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
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      setAutoRotate(false);
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (activeIndex + direction + ANNUAL_METRIC_GROUPS.length) % ANNUAL_METRIC_GROUPS.length;
      setActiveGroupId(ANNUAL_METRIC_GROUPS[nextIndex].id);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex]);

  const selectGroup = (groupId: AnnualMetricGroup["id"]) => {
    setActiveGroupId(groupId);
    setAutoRotate(false);
  };

  const moveGroup = (direction: number) => {
    const nextIndex = (activeIndex + direction + ANNUAL_METRIC_GROUPS.length) % ANNUAL_METRIC_GROUPS.length;
    setActiveGroupId(ANNUAL_METRIC_GROUPS[nextIndex].id);
    setAutoRotate(false);
  };

  return (
    <main className="annual-cockpit" data-active-stage={activeGroup.id}>
      <div className="annual-ambient-grid" aria-hidden="true" />
      <header className="annual-header">
        <div className="annual-brand">
          {/* Existing project asset; native sizing avoids a dependency on the Next image loader in vinext. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={publicAssetPath("/greentown-logo-full.png")} alt="绿城中国 GREENTOWN" />
        </div>
        <div className="annual-heading">
          <p>ANNUAL OPERATIONS · PUBLIC SHOWCASE</p>
          <h1>绿城中国经营概览</h1>
        </div>
        <div className="annual-header-actions">
          <div className="annual-view-switch" role="group" aria-label="大屏视图切换">
            <button type="button" className="is-active" aria-pressed="true">年度全景</button>
            <button type="button" aria-pressed="false" onClick={onSwitchToLive}>实时地图</button>
          </div>
          <div className="annual-period">
            <i aria-hidden="true" />
            <div><span>展示状态</span><b>2025 年度 · 展示方案</b></div>
          </div>
        </div>
      </header>

      <section className="annual-hero-strip" aria-label="年度核心经营指标">
        {ANNUAL_HERO_METRICS.map((metric, index) => (
          <button type="button" key={metric.id} onClick={() => selectGroup(metric.groupId)}>
            <span>0{index + 1}</span>
            <p>{metric.label}</p>
            <div><strong>{metric.value}</strong><em>{metric.unit}</em></div>
            <small>{metric.note}</small>
          </button>
        ))}
      </section>

      <nav className="annual-lifecycle" aria-label="全经营链路">
        {ANNUAL_METRIC_GROUPS.map((group) => (
          <button
            type="button"
            className={group.id === activeGroup.id ? "is-active" : ""}
            aria-pressed={group.id === activeGroup.id}
            key={group.id}
            onClick={() => selectGroup(group.id)}
          >
            <i>{group.index}</i><span><b>{group.name}</b><small>{group.endpoint}</small></span>
          </button>
        ))}
        <span
          key={`${activeGroup.id}-${autoRotate ? "running" : "paused"}`}
          className={`annual-cycle-progress ${autoRotate ? "is-running" : ""}`}
          aria-hidden="true"
        />
      </nav>

      <section
        className={`annual-stage-deck ${supportingMetrics.length === 0 ? "has-no-support" : ""}`}
        aria-labelledby="annual-stage-title"
        aria-live={autoRotate ? "off" : "polite"}
      >
        <article className="annual-stage-focus">
          <div className="annual-section-index">{activeGroup.index}</div>
          <div className="annual-stage-copy">
            <p>{activeGroup.eyebrow}</p>
            <h2 id="annual-stage-title">{activeGroup.name}</h2>
            <span>{activeGroup.summary}</span>
          </div>
          <StageVisual group={activeGroup} />
          <div className="annual-stage-controls">
            <button type="button" aria-label="上一章节" onClick={() => moveGroup(-1)}>←</button>
            <span>{activeGroup.index} / 07</span>
            <button type="button" aria-label="下一章节" onClick={() => moveGroup(1)}>→</button>
            <button
              type="button"
              className={`annual-autoplay ${autoRotate ? "is-active" : ""}`}
              aria-pressed={autoRotate}
              onClick={() => setAutoRotate((value) => !value)}
            >{autoRotate ? "自动轮播中" : "继续轮播"}</button>
          </div>
        </article>

        <section className={`annual-primary-metrics cards-${cardMetrics.length}`} aria-label={`${activeGroup.name}核心展示指标`}>
          <header>
            <div><p>CORE METRICS</p><h3>核心展示指标</h3></div>
            <span>本章 {primaryMetrics.length} 项 · 含主题图 · {activeGroup.period}</span>
          </header>
          <div>
            {cardMetrics.map((metric) => <MetricCard key={metric.id} metric={metric} />)}
          </div>
        </section>

        {supportingMetrics.length > 0 ? (
          <section className={`annual-supporting-metrics items-${supportingMetrics.length}`} aria-label={`${activeGroup.name}补充指标`}>
            <header>
              <div><p>SUPPORTING METRICS</p><h3>补充指标</h3></div>
              <span>结构与效率 · 补充呈现 {supportingMetrics.length} 项</span>
            </header>
            <div>{supportingMetrics.map((metric) => <SupportingMetric key={metric.id} metric={metric} />)}</div>
          </section>
        ) : null}
      </section>

      <footer className="annual-footer">
        <span>经营概览 · 全业态 · {ANNUAL_METRIC_TOTALS.total} 项指标</span>
        <span>{ANNUAL_METRIC_TOTALS.primary} 项核心展示 · {ANNUAL_METRIC_TOTALS.supporting} 项补充展示</span>
        <span>指标来自初步意向稿 · 正式上屏前需统一核验报告期、数据源与口径</span>
      </footer>
    </main>
  );
}
