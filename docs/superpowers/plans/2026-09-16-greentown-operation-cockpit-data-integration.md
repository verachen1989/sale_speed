# 绿城中国经营驾驶舱数据治理与接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 10 个工作日内完成指标口径冻结、统一数据合同、动态数据生产化、静态快照治理、前端接入、核数验收和双渠道发布准备，使大屏每个数值都能回答“是什么、哪个范围、截至哪天、来自哪里、失败时显示什么”。

**Architecture:** 采用“统一指标注册表 + 标准数据合同 + 服务端数据适配器 + 带日期的静态快照回退 + 前端状态感知”五层结构。Sites/Worker 版本通过部署可用的服务端接口获取动态经营数据；GitHub Pages 保留纯静态快照模式。两种模式共用同一指标 ID、格式化规则和质量校验，不在 JSX 内重复硬编码业务口径。

**Tech Stack:** TypeScript 5.9、React 19、vinext/Vite、Cloudflare Worker/Sites、Node.js 22 test runner、现有 Dataset Service、GitHub Pages。

**Spec:** `docs/greentown-operation-cockpit-metrics-data-spec.md`

## Global Constraints

- 不改变当前 1920 × 960 大屏视觉结构，数据接入与样式调整分开验收。
- 不把本地代码快照描述为已核验生产真值；业务签字前保留 `pending-validation` 状态。
- 集团、经营组织、行政省市、城市和项目五种范围不可混算。
- 2026-H1、2025-FY、滚动年初至今和计划值必须携带独立周期。
- GitHub Pages 不具备服务端运行能力，必须构建为静态快照；动态能力只在有后端的部署目标启用。
- 接口失败可以回退快照，但必须暴露真实数据日期、来源与 `stale/unavailable/error` 状态。
- 不恢复已移除的“客户评价”模块，除非业务重新批准。
- 未通过核数、构建和 UAT 不发布；生产密钥不得写入仓库。

---

## 1. 基线排期与责任分工

### 1.1 10 个工作日排期

| 工作日 | 主任务 | 牵头角色 | 并行角色 | 交付物/退出条件 |
|---|---|---|---|---|
| D1 | 指标评审与范围冻结 | 数据产品/BI | 六业务负责人、前端 | v1.0 指标字典；P0 口径全部有负责人和截止时间 |
| D2 | 字段映射、统一数据合同 | 数据产品/BI | 数据工程、前端 | 指标注册表、接口 Schema、单位/空值/周期规则通过评审 |
| D3 | 数据适配器与质量校验 | 数据工程 | QA | 10802/10266/12051/6286 查询与校验测试通过 |
| D4 | 生产路由与静态模式拆分 | 数据工程 | 前端、发布负责人 | Sites 动态接口可用；Pages 明确不发请求 |
| D5 | 地图/项目快照生成与一致性校验 | 数据工程 | BI | 488/510/512 三口径均有名称、日期、排除规则 |
| D6 | 左侧重资产数据接入 | 前端 | 数据工程 | 投资、销售、交付、结转、开发效率状态完整 |
| D7 | 右侧特色业务接入与文案台账 | 前端 | 六业务负责人 | 25 项数值、产业维度、4 条文案可追溯 |
| D8 | 自动化核数与异常场景测试 | QA | 数据工程、前端 | P0/P1 规则通过；断网/空值/超期场景通过 |
| D9 | 业务 UAT 与视觉回归 | 数据产品/BI | 业务负责人、QA | UAT 签字；1920 × 960 与常见缩放无截断 |
| D10 | 发布、监控、回滚演练 | 发布负责人 | 全体 | Sites 与 GitHub Pages 分别验收；有回滚点和运营手册 |

### 1.2 角色职责

| 角色 | 主要职责 |
|---|---|
| 数据产品/BI | 维护指标字典、组织评审、定义验收规则、签发版本 |
| 重资产业务负责人 | 确认投资、销售、交付、结转、开发效率口径 |
| 特色业务负责人 | 分别确认代建、商管、小镇、生活科技、康养数据和文案 |
| 数据工程 | 数据集查询、字段映射、服务端接口、快照任务、质量监控 |
| 前端 | 数据合同接入、状态与回退、格式化、可视化和交互 |
| QA | 自动测试、核数、异常场景、浏览器和视觉回归 |
| 发布负责人 | 环境变量、部署、监控、回滚与发布记录 |

## 2. 里程碑与决策关卡

| 关卡 | 最晚时间 | 必须回答的问题 | 未通过时处理 |
|---|---|---|---|
| G1｜口径冻结 | D1 结束 | 512/510/488 如何命名；市占率如何计算；Top 排名是否跟滚动值 | 相关指标继续标记待确认，不进入生产动态接口 |
| G2｜生产数据通路 | D2 中午 | Sites/Worker 通过何种受控凭证访问数据服务；是否允许外网访问 | 采用“生产静态快照 v1”，不宣称实时 |
| G3｜数据一致性 | D5 结束 | 集团、组织、城市、项目是否可勾稽；日期是否统一 | 阻断 UAT，保留上一版快照 |
| G4｜业务验收 | D9 结束 | 每块业务负责人是否签字 | 不发布该业务新数据，沿用已批准版本 |

## 3. 实施任务

### Task 1: 冻结指标字典和业务签字

**Files:**

- Modify: `docs/greentown-operation-cockpit-metrics-data-spec.md`
- Create: `docs/data-governance/metric-signoff.md`
- Create: `docs/data-governance/source-field-mapping.md`

- [ ] 逐项与业务负责人核对第 4–6 节的名称、定义、范围、时间、单位和来源。
- [ ] 在 `metric-signoff.md` 按业务板块记录负责人角色、评审日期、批准版本和例外项。
- [ ] 在 `source-field-mapping.md` 记录 `metricId → datasetCode → sourceField → transform → owner`。
- [ ] 将 512/510/488 分别固化为“未注销项目数/经营组织项目数/境内地图项目数”。
- [ ] 补齐代建市占率的分子、分母、市场范围、统计机构和证据附件编号。
- [ ] 决定滚动新增货值、销售额是否继续显示 H1 Top 排名；默认规则为不混用。
- [ ] 将指标字典版本升级为 v1.0，并由数据产品和各业务负责人确认。

**Acceptance:** `metric-signoff.md` 中 P0 指标无空白负责人，`source-field-mapping.md` 中所有当前展示指标均有映射或明确标记 `manual-approved`。

**Commit:**

```bash
git add docs/greentown-operation-cockpit-metrics-data-spec.md docs/data-governance
git commit -m "docs: freeze cockpit metric definitions"
```

### Task 2: 建立统一指标类型与注册表

**Files:**

- Create: `app/cockpit-data-contract.ts`
- Create: `app/cockpit-metric-registry.ts`
- Modify: `app/half-year-2026-metrics.ts`
- Create: `tests/cockpit-metric-registry.test.mjs`

- [ ] 先写测试：所有指标 ID 唯一，`value` 为数值或 `null`，单位属于受控枚举，`periodEnd` 和 `sourceSystem` 必填。
- [ ] 定义 `CockpitMetric`、`CockpitMetricStatus`、`CockpitScope`、`CockpitHighlight` 与接口响应 envelope。
- [ ] 将 canonical name、display name、单位、格式、默认周期和责任板块迁入注册表。
- [ ] 将小镇“产业布局”从 `facts` 数值数组拆为维度列表。
- [ ] 将 `+`、`约`、`近` 从 `value/unit` 拆入 `qualifier`，显示值由格式化器生成。
- [ ] 保留一次兼容映射：`green-plus-town-light-projects` 和 `green-plus-town-first-year-sales` 可读取旧 ID，但新代码只写 canonical ID。
- [ ] 运行测试并确认无重复 ID、无未知单位。

**Verify:**

```bash
node --test tests/cockpit-metric-registry.test.mjs
```

Expected: all registry tests pass; no duplicate ID or invalid unit is reported.

**Commit:**

```bash
git add app/cockpit-data-contract.ts app/cockpit-metric-registry.ts app/half-year-2026-metrics.ts tests/cockpit-metric-registry.test.mjs
git commit -m "feat: add governed cockpit metric registry"
```

### Task 3: 抽取可复用的数据集客户端与校验器

**Files:**

- Create: `app/server/dataset-service-client.ts`
- Create: `app/server/cockpit-data-adapter.ts`
- Create: `app/server/cockpit-data-validation.ts`
- Modify: `vite.config.ts`
- Create: `tests/cockpit-data-adapter.test.mjs`

- [ ] 先写测试覆盖 10802、10266、12051、6286 正常响应、缺字段、重复行、负面积、占比越界、累计与月度不一致。
- [ ] 从 `vite.config.ts` 抽出数据服务 URL、MCP 调用、超时、数值读取和错误类型。
- [ ] 在适配器中实现 `getOperatingOverview(scope, date)` 与 `getLatestSales(scope, date)`。
- [ ] 保留现有一二线新增货值合计校验，容差固定为 0.05 亿元。
- [ ] 所有返回值写入 `sourceSystem`、`sourceDataset`、`periodEnd`、`scopeCode`、`refreshedAt` 和状态。
- [ ] 统一错误分类为输入错误、上游不可用、质量失败和超时，禁止把异常值当作 0。
- [ ] 本地 Vite 中间件改为调用共享适配器，不再包含一份独立业务逻辑。

**Verify:**

```bash
node --test tests/cockpit-data-adapter.test.mjs
```

Expected: normal fixtures return standardized envelopes; every malformed fixture returns the expected typed error.

**Commit:**

```bash
git add app/server vite.config.ts tests/cockpit-data-adapter.test.mjs
git commit -m "refactor: share cockpit dataset adapters"
```

### Task 4: 将动态接口迁移到可部署路由，并保留 Pages 静态模式

**Files:**

- Create: `app/api/latest-sales/route.ts`
- Create: `app/api/operating-overview/route.ts`
- Modify: `worker/index.ts`
- Modify: `app/half-year-2026-dashboard.tsx`
- Modify: `scripts/prepare-github-pages.mjs`
- Modify: `scripts/verify-github-pages.mjs`
- Create: `tests/cockpit-api-contract.test.mjs`

- [ ] 在路由测试中固定输入校验、响应字段、Cache-Control、超时和错误码。
- [ ] 路由只调用 Task 3 的适配器，不复制 SQL/数据集逻辑。
- [ ] 生产密钥通过部署环境变量/Secret 注入；缺少凭证时返回结构化 `unavailable`，不读取开发机 `~/.codex/config.toml`。
- [ ] 为客户端增加显式运行模式：`dynamic`、`static-snapshot`。
- [ ] GitHub Pages 构建写入 `static-snapshot`，页面不发起 `/api/*` 请求，也不显示“重新获取”。
- [ ] Sites/Worker 构建写入 `dynamic`；失败时回退快照并显示真实快照日期。
- [ ] 验证 Worker 路由和静态 Pages 均能独立打开。

**Verify:**

```bash
node --test tests/cockpit-api-contract.test.mjs
npm run build
npm run build:pages
npm run prepare:pages
npm run verify:pages
```

Expected: API contract tests pass; production build contains server routes; Pages verification confirms no runtime `/api/` dependency.

**Commit:**

```bash
git add app/api app/half-year-2026-dashboard.tsx worker/index.ts scripts tests/cockpit-api-contract.test.mjs
git commit -m "feat: deploy cockpit APIs with static fallback mode"
```

### Task 5: 生成并校验地图、组织和项目快照

**Files:**

- Create: `scripts/generate-cockpit-snapshots.mjs`
- Create: `app/cockpit-snapshot-metadata.ts`
- Modify: `app/wenshu-snapshot.ts`
- Modify: `app/wenshu-organization-development-snapshot.ts`
- Modify: `app/wenshu-projects-snapshot.ts`
- Modify: `app/wenshu-city-sales-snapshot.ts`
- Create: `tests/cockpit-snapshot-integrity.test.mjs`

- [ ] 先写完整性测试：项目 ID 唯一、行政代码可匹配、城市汇总合计等于地图项目数、组织城市可关联、状态枚举受控、面积非负。
- [ ] 生成脚本一次拉取组织、组织城市、项目、城市销售和项目属性，并使用同一业务日。
- [ ] 在元数据中记录每个快照的 `asOfDate`、数据集、生成时间、行数、校验摘要和 Git 版本。
- [ ] 输出前明确应用地图排除规则：已注销、待注销、股权退出、海外项目不进入中国地图。
- [ ] 生成后打印 488/510/512 对应口径，不要求三者相等，但名称、日期和排除条件必须完整。
- [ ] 对城市名称关联失败、项目零建面和缺拿地时间生成显式告警清单。

**Verify:**

```bash
node scripts/generate-cockpit-snapshots.mjs --check
node --test tests/cockpit-snapshot-integrity.test.mjs
```

Expected: no duplicate IDs or unmapped administrative codes; totals and snapshot metadata are internally consistent.

**Commit:**

```bash
git add scripts/generate-cockpit-snapshots.mjs app/wenshu-*.ts app/cockpit-snapshot-metadata.ts tests/cockpit-snapshot-integrity.test.mjs
git commit -m "feat: generate validated cockpit snapshots"
```

### Task 6: 接入左侧重资产并统一状态/格式

**Files:**

- Create: `app/use-cockpit-data.ts`
- Create: `app/cockpit-format.ts`
- Modify: `app/half-year-2026-dashboard.tsx`
- Modify: `app/half-year-2026-dashboard.module.css`
- Modify: `tests/rendered-html.test.mjs`

- [ ] 先补测试：静态模式不发请求；动态成功展示动态日期；超时回退快照；空值显示“—”；客户评价不回归。
- [ ] 将 16 秒超时、请求 key、回退选择和数据状态移入 `use-cockpit-data.ts`。
- [ ] 将金额、面积、百分比、千分位、修饰符统一移入 `cockpit-format.ts`。
- [ ] 投资、销售只在同一范围和日期下组合；Top 标签与其来源周期绑定。
- [ ] 交付、结转、开发效率增加可读的数据日期/周期元数据，不改变主视觉层级。
- [ ] 过期快照使用低干扰状态提示，不显示误导性的刷新按钮。

**Verify:**

```bash
node --test tests/rendered-html.test.mjs
npm run lint
```

Expected: rendered HTML assertions pass; no customer evaluation panel; static/dynamic states and accessibility labels are present.

**Commit:**

```bash
git add app/use-cockpit-data.ts app/cockpit-format.ts app/half-year-2026-dashboard.tsx app/half-year-2026-dashboard.module.css tests/rendered-html.test.mjs
git commit -m "feat: bind governed heavy-asset metrics"
```

### Task 7: 接入特色业务与项目/荣誉台账

**Files:**

- Create: `app/specialty-business-snapshot.ts`
- Modify: `app/half-year-2026-metrics.ts`
- Modify: `app/half-year-2026-dashboard.tsx`
- Modify: `tests/rendered-html.test.mjs`

- [ ] 先补测试覆盖 25 项数值、1 个产业维度和 4 条项目/荣誉文案。
- [ ] 每个业务组增加 `periodEnd`、`sourceSystem`、`owner`、`refreshedAt` 和状态。
- [ ] 代建市占率说明与数值存入同一对象；市占率保持 2025-FY，不伪装为 2026-H1。
- [ ] 商管、小镇、生活科技、康养名称与单位使用注册表，不在 JSX 重复文案。
- [ ] 项目/荣誉文案使用 `CockpitHighlight`，记录日期、来源和有效期。
- [ ] 产业布局保持独立维度，不参与数值指标数量、排序或聚合。

**Verify:**

```bash
node --test tests/rendered-html.test.mjs
```

Expected: all specialty values, units, periods and highlights match the signed-off snapshot.

**Commit:**

```bash
git add app/specialty-business-snapshot.ts app/half-year-2026-metrics.ts app/half-year-2026-dashboard.tsx tests/rendered-html.test.mjs
git commit -m "feat: govern specialty business metrics"
```

### Task 8: 完成数据核数、异常场景与视觉回归

**Files:**

- Create: `docs/data-governance/uat-checklist.md`
- Create: `tests/cockpit-reconciliation.test.mjs`
- Modify: `design-qa.md`

- [ ] 编写集团、9 个组织、至少 5 个重点城市的对数样本。
- [ ] 核对月度销售合计、投资合计、一二线货值占比、结转分期合计、城市项目合计。
- [ ] 测试正常、空值、0、负月销售、接口 400/502、15 秒超时、快照过期、未知状态枚举。
- [ ] 在 1920 × 960、浏览器 80%/100%/125% 缩放和手机横屏远程查看时做视觉检查。
- [ ] 核查所有标签、单位、日期和来源提示没有遮挡、截断或重叠。
- [ ] 业务负责人按板块签署 `uat-checklist.md`。

**Verify:**

```bash
node --test tests/cockpit-reconciliation.test.mjs
npm test
```

Expected: all automated checks pass; UAT checklist has no open P0/P1 issue.

**Commit:**

```bash
git add docs/data-governance/uat-checklist.md design-qa.md tests/cockpit-reconciliation.test.mjs
git commit -m "test: reconcile cockpit metrics and snapshots"
```

### Task 9: 发布、监控与回滚

**Files:**

- Create: `docs/data-governance/release-runbook.md`
- Modify: `.openai/hosting.json` only if a new binding is approved
- Modify: `README.md`

- [ ] 在运行手册中记录动态 Sites 和静态 GitHub Pages 的构建、验收、发布与回滚步骤。
- [ ] 记录 Secret 名称和配置位置，但不记录 Secret 值。
- [ ] 为动态接口监控成功率、P95 延迟、超时率、回退率、快照新鲜度和质量失败数。
- [ ] Sites 发布后用集团、浙江、杭州三个范围做冒烟核数。
- [ ] GitHub Pages 发布后确认静态模式不请求 `/api/*`，刷新和深链均可用。
- [ ] 保存上一发布版本与上一份已批准快照，完成一次回滚演练。

**Final Verify:**

```bash
npm run lint
npm test
npm run build:pages
npm run prepare:pages
npm run verify:pages
git status --short
```

Expected: all commands pass; only intended release files are changed; both deployment targets are accessible and display their declared data dates.

**Commit:**

```bash
git add README.md docs/data-governance .openai/hosting.json
git commit -m "docs: add cockpit release and rollback runbook"
```

## 4. Definition of Done

- [ ] 指标字典 v1.0 已签字，所有 P0 指标有权威来源和责任人；
- [ ] 动态与静态发布模式行为明确且自动测试；
- [ ] 每个指标可追溯到来源系统、字段、范围和日期；
- [ ] 488/510/512 三种项目口径名称清晰且页面不混用；
- [ ] 接口失败、数据过期和空值不会显示成“最新正常值”；
- [ ] 特色业务 25 项数值、产业维度、4 条文案均可追溯；
- [ ] 自动化测试、构建、UAT 和视觉回归全部通过；
- [ ] Sites 与 GitHub Pages 均有独立发布和回滚说明；
- [ ] 监控和快照更新责任已移交到明确角色。

## 5. 建议后续节奏

- 每日：动态销售、投资接口新鲜度与失败率检查；
- 每周：地图项目/城市异常和快照差异报告；
- 每月：指标责任人确认特殊业务手工值与文案；
- 每季度：指标字典、项目/荣誉有效性和数据权限复核；
- 半年度：随正式披露材料更新 H1/FY 指标，并归档旧版本。

