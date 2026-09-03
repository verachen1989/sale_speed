import type { CSSProperties } from "react";
export { default } from "./dashboard-shell";

const overviewMetrics = [
  { label: "累计销售额", value: "218.6", unit: "亿元", growth: "+12.4%", color: "cyan" },
  { label: "营业收入", value: "164.8", unit: "亿元", growth: "+8.7%", color: "blue" },
  { label: "可售货值", value: "412.5", unit: "亿元", growth: "+7.1%", color: "gold" },
  { label: "在建面积", value: "886", unit: "万㎡", growth: "+9.6%", color: "green" },
];

const cityDistribution = [
  { city: "杭州", projects: 32, width: 100 },
  { city: "北京", projects: 18, width: 72 },
  { city: "成都", projects: 17, width: 68 },
  { city: "西安", projects: 14, width: 56 },
];

const salesMonths = [
  { month: "1月", value: 18.2, height: 44 },
  { month: "2月", value: 21.7, height: 53 },
  { month: "3月", value: 25.4, height: 62 },
  { month: "4月", value: 23.8, height: 58 },
  { month: "5月", value: 28.6, height: 70 },
  { month: "6月", value: 31.2, height: 76 },
  { month: "7月", value: 33.9, height: 83 },
  { month: "8月", value: 35.8, height: 88 },
];

const projectProgress = [
  { label: "主体结构", value: 86, count: "42项" },
  { label: "精装施工", value: 72, count: "31项" },
  { label: "园区工程", value: 64, count: "28项" },
];

function PanelTitle({ index, title, note }: { index: string; title: string; note?: string }) {
  return (
    <div className="panel-title">
      <span className="panel-index">{index}</span>
      <h2>{title}</h2>
      <span className="title-rule" />
      {note ? <span className="panel-note">{note}</span> : null}
    </div>
  );
}

export function LegacyHome() {
  return (
    <main className="dashboard">
      <div className="ambient-grid" aria-hidden="true" />

      <header className="topbar">
        <div className="brand-symbol" aria-hidden="true"><span /></div>
        <div className="page-title">
          <p>BUSINESS PERFORMANCE OVERVIEW</p>
          <h1>区域经营实力全景</h1>
        </div>
        <div className="data-scope" aria-label="数据展示口径">
          <span className="status-dot" />
          <b>2026年 1—8月</b>
          <span>全业态</span>
          <span>展示样例</span>
        </div>
      </header>

      <section className="screen-grid">
        <aside className="left-wing">
          <article className="panel investment-card">
            <PanelTitle index="01" title="投资拓展" note="年度实际" />
            <div className="investment-hero">
              <div className="investment-count">
                <span>年内新拓项目</span>
                <strong>24</strong><em>个</em>
                <b><i /> 同比增长 20.0%</b>
              </div>
              <div className="growth-orbit" aria-label="同比增长20%">
                <span><strong>20.0%</strong><em>同比增长</em></span>
              </div>
            </div>
            <div className="investment-scale">
              <div><span>新增货值</span><b>326.4</b><em>亿元</em></div>
              <div><span>权益投资额</span><b>186.2</b><em>亿元</em></div>
            </div>
          </article>

          <article className="panel map-card">
            <PanelTitle index="02" title="项目布局" note="核心城市分布" />
            <div className="map-area" aria-label="核心城市项目分布示意">
              <div className="map-silhouette" />
              <span className="map-node node-beijing"><i /><b>北京</b><em>18</em></span>
              <span className="map-node node-xian"><i /><b>西安</b><em>14</em></span>
              <span className="map-node node-chengdu"><i /><b>成都</b><em>17</em></span>
              <span className="map-node node-hangzhou"><i /><b>杭州</b><em>32</em></span>
              <span className="map-node node-guangzhou"><i /><b>广州</b><em>11</em></span>
              <div className="map-scale"><strong>16</strong><span>覆盖城市</span></div>
            </div>
            <div className="city-ranking">
              {cityDistribution.map((item) => (
                <div className="city-row" key={item.city}>
                  <span>{item.city}</span>
                  <div><i style={{ "--width": `${item.width}%` } as CSSProperties} /></div>
                  <b>{item.projects}个</b>
                </div>
              ))}
            </div>
          </article>
        </aside>

        <section className="center-stage">
          <div className="overview-strip" aria-label="经营核心规模指标">
            {overviewMetrics.map((metric, index) => (
              <article className={`overview-metric metric-${metric.color}`} key={metric.label}>
                <span className="metric-number">0{index + 1}</span>
                <p>{metric.label}</p>
                <div><strong>{metric.value}</strong><em>{metric.unit}</em></div>
                <b><i />同比 {metric.growth}</b>
              </article>
            ))}
          </div>

          <div className="city-showcase" aria-label="经营规模展示">
            <div className="showcase-copy">
              <span className="showcase-eyebrow">稳健经营 · 持续增长</span>
              <strong>126</strong><em>个在建项目</em>
              <p>深耕核心城市，经营规模与质量协同提升</p>
            </div>
            <div className="showcase-facts">
              <span><b>24</b>新增项目</span>
              <i />
              <span><b>16</b>核心城市</span>
              <i />
              <span><b>886万㎡</b>在建规模</span>
            </div>
          </div>

          <article className="panel sales-card">
            <PanelTitle index="03" title="销售表现" note="实际值趋势" />
            <div className="sales-body">
              <div className="sales-total">
                <span>累计销售额</span>
                <div><strong>218.6</strong><em>亿元</em></div>
                <b><i />同比增长 12.4%</b>
                <p>连续 3 个月保持增长</p>
              </div>
              <div className="sales-chart">
                <div className="chart-grid"><span>40亿</span><span>20亿</span><span>0</span></div>
                <div className="bars">
                  {salesMonths.map((item) => (
                    <div className="month-bar" key={item.month}>
                      <i style={{ "--height": `${item.height}%` } as CSSProperties}><b>{item.value}</b></i>
                      <span>{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </section>

        <aside className="right-wing">
          <article className="panel finance-card">
            <PanelTitle index="04" title="财务表现" note="公开财报口径" />
            <div className="finance-main">
              <div className="finance-value">
                <span>营业收入</span>
                <strong>164.8</strong><em>亿元</em>
                <b><i />同比增长 8.7%</b>
              </div>
              <div className="mini-growth" aria-label="营业收入近三期增长趋势">
                <span style={{ "--h": "46%" } as CSSProperties}><i>24</i></span>
                <span style={{ "--h": "68%" } as CSSProperties}><i>25</i></span>
                <span style={{ "--h": "88%" } as CSSProperties}><i>26</i></span>
              </div>
            </div>
            <div className="finance-kpis">
              <div><span>资金余额</span><b>318.4<em>亿元</em></b><i>同比 +7.6%</i></div>
              <div><span>总资产</span><b>1,280.6<em>亿元</em></b><i>同比 +6.8%</i></div>
            </div>
            <div className="finance-footer"><span>经营性现金流</span><b>42.6亿元</b><em>同比 +15.3%</em></div>
          </article>

          <article className="panel engineering-card">
            <PanelTitle index="05" title="工程进展" note="一体化平台" />
            <div className="video-frame" role="img" aria-label="杭州云栖项目工程现场影像占位图">
              <span className="video-source"><i />工程现场影像</span>
              <span className="play-button" aria-hidden="true"><i /></span>
              <div><b>杭州云栖项目</b><span>主体结构施工 · 08:42</span></div>
            </div>
            <div className="engineering-scale">
              <div><span>在建项目</span><b>126</b><em>个</em></div>
              <div><span>在建面积</span><b>886</b><em>万㎡</em></div>
              <div><span>节点按期率</span><b>96.8</b><em>%</em></div>
            </div>
            <div className="progress-list">
              {projectProgress.map((row) => (
                <div className="progress-row" key={row.label}>
                  <span>{row.label}</span>
                  <div><i style={{ "--progress": `${row.value}%` } as CSSProperties} /></div>
                  <b>{row.value}%</b>
                  <em>{row.count}</em>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <footer>
        <span>数据范围：区域经营概览 · 全业态</span>
        <span>示例数据仅用于大屏视觉展示，正式发布前接入经营指挥平台与公开财报数据</span>
        <span>更新于 2026-08-24 09:30</span>
      </footer>
    </main>
  );
}
