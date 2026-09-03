import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://dashboard.example/", {
      headers: {
        accept: "text/html",
        host: "dashboard.example",
        "x-forwarded-host": "dashboard.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function importTypeScriptDataModule(relativeUrl) {
  const [{ default: ts }, source] = await Promise.all([
    import("typescript"),
    readFile(relativeUrl, "utf8"),
  ]);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

test("map safe area keeps centered bottom occluders out of the interactive stage", async () => {
  const {
    resolveMapSafeArea,
    resolveMapViewportFit,
    resolveOcclusionShift,
  } = await importTypeScriptDataModule(new URL("../app/map-occlusion.ts", import.meta.url));
  const mountBounds = { left: 100, top: 40, right: 1100, bottom: 640 };
  const safeArea = resolveMapSafeArea(mountBounds, [
    { left: 100, top: 40, right: 300, bottom: 640 },
    { left: 900, top: 40, right: 1100, bottom: 640 },
    { left: 310, top: 520, right: 890, bottom: 640 },
  ]);

  assert.deepEqual(safeArea, { left: 200, top: 0, right: 800, bottom: 480 });
  const fit = resolveMapViewportFit(1000, 600, safeArea);
  assert.equal(fit.fittedWidth, 640);
  assert.equal(fit.fittedHeight, 480);
  assert.equal(fit.centerOffsetYPx, -60);
  assert.ok(fit.fov > 30, "a bottom dock must widen the vertical field of view");

  assert.deepEqual(
    resolveOcclusionShift(
      { left: 450, top: 500, right: 550, bottom: 530 },
      [{ left: 300, top: 480, right: 700, bottom: 600 }],
      { left: 0, top: 0, right: 1000, bottom: 600 },
    ),
    { x: 0, y: -62 },
    "a label over a centered bottom dock should move above it instead of becoming non-interactive",
  );
});

test("server-renders one fused operating cockpit", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const visibleHtml = html.replaceAll("<!-- -->", "");
  assert.match(html, /<title>绿城中国经营工作台<\/title>/);
  assert.match(html, /绿城中国经营驾驶舱/);
  assert.doesNotMatch(html, /经营驾驶舱1|经营驾驶舱2|经营驾驶舱3|<button[^>]*data-dashboard-view=/);
  assert.doesNotMatch(visibleHtml, /INTERIM RESULTS · DISCLOSURE COCKPIT/);
  assert.match(html, /data-layout="disclosure-map"/);
  assert.match(html, /data-dashboard-view="half-year-2026"/);
  assert.match(html, /data-metric-count="18"/);
  assert.match(html, /data-source-metric-count="63"/);
  assert.match(html, /data-supplemental-group-count="5"/);
  assert.match(html, /data-supplemental-metric-count="11"/);
  assert.doesNotMatch(visibleHtml, /2026 中期业绩/);
  assert.match(html, /aria-label="重资产项目"/);
  assert.match(visibleHtml, /重资产项目/);
  assert.doesNotMatch(visibleHtml, /经营概况|动态经营 \+ 中期计划|代建 \+ 绿城\+/);
  assert.match(visibleHtml, /投资与土储/);
  assert.match(visibleHtml, /销售业绩趋势/);
  assert.match(visibleHtml, /地图加载中 · 首次打开约需数秒/);
  assert.match(html, /data-sales-trend-state="loading"/);
  assert.doesNotMatch(visibleHtml, /滚动经营指标/);
  assert.match(visibleHtml, /结转资源/);
  assert.match(html, /data-project-cloud-count="488"/);
  assert.match(html, /data-city-anchor-count="55"/);
  assert.match(html, /data-project-case-count="0"/);
  assert.match(html, /data-project-case-location="city"/);
  assert.doesNotMatch(visibleHtml, /上海潮鸣外滩|苏州玫瑰园二期|北京朗月和风/);
  assert.match(html, /data-engineering-site-count="0"/);
  assert.match(visibleHtml, /工程现场（城市级定位）/);
  assert.doesNotMatch(visibleHtml, /杭州枫丹玫瑰园|义乌海上潮鸣/);
  assert.doesNotMatch(html, /data-project-destination="engineering-site"/);
  assert.doesNotMatch(visibleHtml, /杭州蕙澜月华/);
  const renderedMetricIds = [...html.matchAll(/data-metric-id="([a-z0-9-]+)"/g)].map((match) => match[1]);
  assert.equal(renderedMetricIds.length, 18);
  assert.equal(new Set(renderedMetricIds).size, 18);
  const renderedGreenPlusMetricIds = [...html.matchAll(/data-green-plus-metric-id="([a-z0-9-]+)"/g)].map((match) => match[1]);
  assert.equal(renderedGreenPlusMetricIds.length, 8);
  assert.equal(new Set(renderedGreenPlusMetricIds).size, 8);
  assert.doesNotMatch(html, /data-annual-metric-id=/);
  const renderedKeyNodeIds = [...html.matchAll(/data-key-node-id="([a-z0-9-]+)"/g)].map((match) => match[1]);
  assert.deepEqual(renderedKeyNodeIds, ["demo-zone-open", "project-launch", "delivery"]);
  assert.doesNotMatch(visibleHtml, /7 大经营板块 · 56 项年度经营指标|MAP INTEGRATED VIEW/);
  assert.match(html, /https:\/\/verachen1989\.github\.io\/sale_speed\/og\.png/);
  assert.match(html, /href="\/favicon\.svg"/);
  assert.match(html, /rel="preload" href="\/china-geo\.json" as="fetch" crossorigin="anonymous"/);
  assert.doesNotMatch(visibleHtml, /密集地图|DENSE MAP WORKBENCH|BUSINESS STRUCTURE|结构与效率|补充指标|次级展示|原稿灰底|本章|07 CHAPTERS|人民币|自动轮播|继续轮播/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|codex-preview/);
});

test("metric configuration preserves the source priority split", async () => {
  const source = await readFile(new URL("../app/annual-metrics.ts", import.meta.url), "utf8");
  const groupSource = source.slice(
    source.indexOf("export const ANNUAL_METRIC_GROUPS"),
    source.indexOf("export const ANNUAL_METRIC_TOTALS"),
  );
  const primaryCount = (groupSource.match(/priority:\s*"primary"/g) ?? []).length;
  const supportingCount = (groupSource.match(/priority:\s*"supporting"/g) ?? []).length;
  const ids = [...groupSource.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((match) => match[1]);

  assert.equal(primaryCount, 38);
  assert.equal(supportingCount, 18);
  assert.equal(primaryCount + supportingCount, 56);
  assert.equal((groupSource.match(/\beyebrow:/g) ?? []).length, 7);
  assert.equal(ids.length, 63, "seven group ids plus 56 metric ids are expected");
  assert.equal(new Set(ids).size, ids.length, "group and metric ids must be unique");

  for (const requiredLabel of [
    "新拓项目转化率",
    "装配式建筑应用占比（在建）",
    "年度回款率",
    "数字化营销费率",
    "抵押投资物业",
  ]) {
    assert.match(groupSource, new RegExp(requiredLabel));
  }
});

test("sales trend places positive, negative, and zero months around one baseline", async () => {
  const metrics = await importTypeScriptDataModule(
    new URL("../app/half-year-2026-metrics.ts", import.meta.url),
  );
  assert.equal(typeof metrics.buildSalesTrendBars, "function");

  const trend = metrics.buildSalesTrendBars([10, 20, -10, 0]);
  assert.equal(trend.zeroPct, 66.6667);
  assert.deepEqual(
    trend.bars.map(({ label, value, direction, tone, topPct, heightPct }) => ({
      label,
      value,
      direction,
      tone,
      topPct,
      heightPct,
    })),
    [
      { label: "1月", value: 10, direction: "positive", tone: "default", topPct: 33.3333, heightPct: 33.3333 },
      { label: "2月", value: 20, direction: "positive", tone: "default", topPct: 0, heightPct: 66.6667 },
      { label: "3月", value: -10, direction: "negative", tone: "default", topPct: 66.6667, heightPct: 33.3333 },
      { label: "4月", value: 0, direction: "zero", tone: "latest", topPct: 66.6667, heightPct: 0 },
    ],
  );

  const allZero = metrics.buildSalesTrendBars([0, 0]);
  assert.equal(allZero.zeroPct, 100);
  assert.deepEqual(allZero.bars.map(({ heightPct, tone }) => ({ heightPct, tone })), [
    { heightPct: 0, tone: "default" },
    { heightPct: 0, tone: "latest" },
  ]);
});

test("dashboard data requests time out instead of remaining pending forever", async (t) => {
  let requestModule = {};
  try {
    const moduleUrl = new URL("../scripts/dashboard-request.mjs", import.meta.url);
    moduleUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
    requestModule = await import(moduleUrl.href);
  } catch {
    // The first RED run reaches the behavior assertion below before the helper exists.
  }
  assert.equal(typeof requestModule.fetchJsonWithTimeout, "function");

  const server = createServer((request, response) => {
    if (request.url === "/slow") {
      setTimeout(() => {
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ state: "late" }));
      }, 200);
      return;
    }
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ state: "ready" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections?.();
    server.close();
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  await assert.rejects(
    requestModule.fetchJsonWithTimeout(`${origin}/slow`, { timeoutMs: 25 }),
    (error) => error instanceof Error && error.name === "TimeoutError",
  );
  assert.deepEqual(
    await requestModule.fetchJsonWithTimeout(`${origin}/ready`, { timeoutMs: 500 }),
    { state: "ready" },
  );
});

test("integrated map renders all seven modules with no carousel or dense-map runtime", async () => {
  const annualSource = await readFile(new URL("../app/annual-metrics.ts", import.meta.url), "utf8");
  const annualGroupSource = annualSource.slice(
    annualSource.indexOf("export const ANNUAL_METRIC_GROUPS"),
    annualSource.indexOf("export const ANNUAL_METRIC_TOTALS"),
  );
  const annualMetricIds = [...annualGroupSource.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)]
    .map((match) => match[1])
    .filter((id) => id.includes("-"))
    .sort();
  assert.equal(annualMetricIds.length, 56);
  assert.equal(new Set(annualMetricIds).size, 56);
  const integratedSource = await readFile(new URL("../app/map-integrated-overview.tsx", import.meta.url), "utf8");
  const integratedCss = await readFile(new URL("../app/map-integrated-overview.css", import.meta.url), "utf8");
  assert.match(integratedSource, /function AnnualModulePanel/);
  assert.match(integratedSource, /function OrganizationBoard/);
  assert.match(integratedSource, /function OrganizationScopeFacts/);
  assert.match(integratedSource, /const OPERATING_ORGANIZATIONS = WENSHU_FIRST_LEVEL_ORGANIZATIONS/);
  assert.match(integratedSource, /WENSHU_ORGANIZATION_DEVELOPMENT_3002\[activeOrganization\.code\]/);
  assert.match(integratedSource, /const activeOrganizationCities = useMemo/);
  assert.match(integratedSource, /scopedCityAdcodes=\{activeOrganizationCityAdcodes\}/);
  assert.match(integratedSource, /interactionMode="metrics"/);
  assert.match(integratedSource, /fusion-module-rail is-left/);
  assert.match(integratedSource, /fusion-module-rail is-right/);
  assert.match(integratedSource, /const STAGE_SIGNAL_METRIC_IDS/);
  assert.match(integratedSource, /const cardMetrics = group\.metrics\.filter\(\(metric\) => !stageMetricIds\.includes\(metric\.id\)\)/);
  const featureConfigSource = integratedSource.slice(
    integratedSource.indexOf("const STAGE_SIGNAL_METRIC_IDS"),
    integratedSource.indexOf("function MetricTile"),
  );
  const featureGroups = [...featureConfigSource.matchAll(/^\s*(investment|construction|delivery|sales|holding|special|reserve): \[([^\]]+)\]/gm)];
  const expectedFeatureCounts = { investment: 3, construction: 3, delivery: 3, sales: 3, holding: 2, special: 3, reserve: 3 };
  const featureMetricIds = featureGroups.flatMap(([, groupId, ids]) => {
    const parsedIds = [...ids.matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1]);
    assert.equal(parsedIds.length, expectedFeatureCounts[groupId], `${groupId} feature metric count must stay intentional`);
    const groupStart = annualGroupSource.indexOf(`\n    id: "${groupId}",`);
    const nextGroupStart = [...Object.keys(expectedFeatureCounts)]
      .map((candidateId) => annualGroupSource.indexOf(`\n    id: "${candidateId}",`, groupStart + 1))
      .filter((position) => position > groupStart)
      .sort((left, right) => left - right)[0] ?? annualGroupSource.length;
    const groupMetricIds = [...annualGroupSource.slice(groupStart, nextGroupStart).matchAll(/\bid:\s*"([a-z0-9-]+)"/g)]
      .map((match) => match[1])
      .filter((id) => id.includes("-"));
    for (const featureMetricId of parsedIds) assert.ok(groupMetricIds.includes(featureMetricId), `${featureMetricId} must belong to ${groupId}`);
    return parsedIds;
  });
  assert.equal(featureGroups.length, 7);
  assert.equal(featureMetricIds.length, 20);
  assert.equal(new Set(featureMetricIds).size, featureMetricIds.length);
  for (const featureMetricId of featureMetricIds) assert.ok(annualMetricIds.includes(featureMetricId), `${featureMetricId} must exist in annual metrics`);
  assert.match(integratedSource, /data-metric-id="delivery-households"/);
  assert.equal((integratedSource.match(/cardMetrics\.map/g) ?? []).length, 1);
  assert.match(integratedSource, /fusion-module-metrics/);
  assert.doesNotMatch(integratedSource, /activeGroupId|setActiveGroup|autoRotate|setAutoRotate|AUTO_ROTATE_MS|selectGroup|moveGroup|ANNUAL_HERO_METRICS|fusion-hero-strip|fusion-stage-controls|自动轮播|继续轮播|primaryMetrics\.map|supportingMetrics\.map|fusion-primary-metrics|fusion-supporting-metrics|BUSINESS STRUCTURE|结构与效率|本章指标|密集地图/);
  assert.match(integratedCss, /\.fusion-module-card > header h2 \{[^}]*font-weight:\s*500;/s);
  assert.match(integratedCss, /\.fusion-module-metrics article strong \{[^}]*font-weight:\s*600;/s);
  assert.match(integratedCss, /\.fusion-organization-grid \{[^}]*grid-template-columns: repeat\(9, minmax\(0, 1fr\)\);/s);
  assert.match(integratedCss, /\.fusion-organization-sales b \{[^}]*font-weight:\s*600;/s);
  assert.match(integratedCss, /@media \(min-width: 1181px\) and \(max-aspect-ratio: 27 \/ 20\)[\s\S]*?\.fusion-cockpit \{ grid-template-rows: 84px minmax\(0, 1fr\) 24px;/);
  assert.match(integratedCss, /\.fusion-cockpit \{[\s\S]*?height: 100dvh;[\s\S]*?min-height: 0;/);
  assert.match(integratedCss, /\.fusion-workspace \{ grid-template-columns: clamp\(360px, 28vw, 520px\) minmax\(0, 1fr\) clamp\(360px, 28vw, 520px\);/);
  assert.doesNotMatch(integratedSource, /className="fusion-map-caption"/);
  assert.match(integratedSource, /labelOcclusionSelector="\.fusion-module-rail, \.fusion-organization-board, \.fusion-region-facts"/);
  assert.match(integratedCss, /\.fusion-organization-board \{[^}]*background: linear-gradient\(145deg, rgba\(4, 27, 58, \.78\), rgba\(2, 16, 37, \.68\)\);/s);
  assert.match(integratedCss, /\.fusion-organization-grid > button \{[^}]*min-height: 54px;/s);
  assert.match(integratedCss, /data-active-organization-code="none"\]\) \.three-city-label span \{ display: none; \}/);
  assert.match(integratedCss, /\.fusion-stage-signal\.is-sales > div > em \{[^}]*white-space: nowrap;/s);
  const shellSource = await readFile(new URL("../app/dashboard-shell.tsx", import.meta.url), "utf8");
  assert.match(shellSource, /import HalfYear2026Dashboard from "\.\/half-year-2026-dashboard"/);
  assert.match(shellSource, /<HalfYear2026Dashboard\s*\/>/);
  assert.doesNotMatch(shellSource, /useState|lazy\(|Suspense|DashboardView|grand-page|GrandDashboard|onSelectView/);
  assert.doesNotMatch(shellSource, /MapIntegratedOverview|\.\/map-integrated-overview/);
  assert.doesNotMatch(shellSource, /DenseMapOverview|dense-map-overview|密集地图|"dense"/);
  const layoutSource = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(layoutSource, /dense-map-overview|高密度地图/);
  await assert.rejects(access(new URL("../app/dense-map-overview.tsx", import.meta.url)), { code: "ENOENT" });
  await assert.rejects(access(new URL("../app/dense-map-overview.css", import.meta.url)), { code: "ENOENT" });
  await access(new URL("../app/map-integrated-overview.css", import.meta.url));
});

test("adds a source-backed 1H2026 cockpit without changing the 2025 metric model", async () => {
  const dataModule = await importTypeScriptDataModule(new URL("../app/half-year-2026-metrics.ts", import.meta.url));
  const organizationModule = await importTypeScriptDataModule(new URL("../app/wenshu-snapshot.ts", import.meta.url));
  const developmentModule = await importTypeScriptDataModule(new URL("../app/wenshu-organization-development-snapshot.ts", import.meta.url));
  const projectModule = await importTypeScriptDataModule(new URL("../app/wenshu-projects-snapshot.ts", import.meta.url));
  const projectAttributeModule = await importTypeScriptDataModule(new URL("../app/wenshu-project-attributes.ts", import.meta.url));
  const annualDataModule = await importTypeScriptDataModule(new URL("../app/annual-metrics.ts", import.meta.url));
  const metrics = dataModule.HALF_YEAR_2026_ALL_METRICS;
  assert.equal(dataModule.HALF_YEAR_2026_SOURCE.period, "2026-H1");
  assert.equal(dataModule.HALF_YEAR_2026_SOURCE.reportingDate, "2026-06-30");
  const greenPlusGroups = dataModule.HALF_YEAR_2026_GREEN_PLUS_GROUPS;
  assert.ok(Array.isArray(greenPlusGroups), "the 1H2026 source module must expose the Green+ business groups");
  assert.deepEqual(greenPlusGroups.map((group) => group.id), [
    "life-technology",
    "commercial-operations",
    "wellness",
    "town-operations",
  ]);
  const greenPlusFacts = greenPlusGroups.flatMap((group) => group.facts);
  assert.deepEqual(greenPlusFacts.map((fact) => [fact.id, fact.value, fact.unit]), [
    ["green-plus-life-showrooms", "13", "个"],
    ["green-plus-life-deliveries", "61", "个项目"],
    ["green-plus-commercial-projects", "2", "个"],
    ["green-plus-commercial-streak", "18", "个月"],
    ["green-plus-wellness-projects", "5", "个"],
    ["green-plus-wellness-beds", "1.4", "万+"],
    ["green-plus-town-industries", "商业、教育、文旅、康养、农业", ""],
    ["green-plus-town-members", "4万+", ""],
    ["green-plus-town-first-year-sales", "4万", "套"],
    ["green-plus-town-exposure", "1亿+", ""],
    ["green-plus-town-light-projects", "9", "个"],
    ["green-plus-town-honors", "60+", "项"],
  ]);
  assert.deepEqual(greenPlusGroups.map((group) => [
    group.id,
    group.highlights?.map((highlight) => [highlight.kind, highlight.label]),
  ]), [
    ["life-technology", [["case", "杭州晓风朗月｜在浙首个施工大总包项目·品质兑现"]]],
    ["commercial-operations", [["case", "上海北中环中心｜长租公寓轻资产运营项目"]]],
    ["wellness", [["honor", "入选“2026银发消费服务商Top50”"]]],
    ["town-operations", [["honor", "小镇IP运营获“产业综合运营优秀企业”"]]],
  ], "every Green+ panel must retain its source-backed PPT case or honor");
  assert.ok(greenPlusGroups.every((group) => (
    group.status === "actual"
    && group.sourcePeriod === "2026-H1"
    && group.sourcePages.join(",") === "13"
    && group.materialPages.join(",") === "12"
  )), "every Green+ group must retain the PDF/material page offset and 1H2026 actual status");
  assert.equal(metrics.length, 63);
  assert.equal(dataModule.HALF_YEAR_2026_METRIC_TOTALS.actual, 50);
  assert.equal(dataModule.HALF_YEAR_2026_METRIC_TOTALS.plan, 10);
  assert.equal(dataModule.HALF_YEAR_2026_METRIC_TOTALS.postPeriod, 3);
  assert.equal(new Set(metrics.map((metric) => metric.id)).size, metrics.length, "1H2026 metric ids must be unique");
  for (const metric of metrics) {
    assert.ok(metric.sourcePages.length > 0, `${metric.id} needs a PDF source page`);
    assert.ok(metric.materialPages.length > 0, `${metric.id} needs a material page`);
    assert.ok(["actual", "plan", "post-period"].includes(metric.status), `${metric.id} needs a disclosure status`);
    assert.deepEqual(metric.materialPages, metric.sourcePages.map((page) => page - 1), `${metric.id} page references must preserve the PDF/material offset`);
  }

  const byId = new Map(metrics.map((metric) => [metric.id, metric]));
  assert.equal(byId.get("h1-sales-operating")?.numericValue, 947);
  assert.equal(byId.get("h1-investment-new-value")?.numericValue, 459);
  assert.equal(byId.get("h1-financial-revenue")?.numericValue, 394.81);
  assert.equal(byId.get("h1-finance-cash")?.note, "财务表精确值 618.65 亿元");
  assert.equal(byId.get("h1-finance-net-gearing")?.numericValue, 63.9);
  const maturityMetrics = [
    byId.get("h1-finance-debt-within-year"),
    byId.get("h1-finance-debt-one-to-two"),
    byId.get("h1-finance-debt-over-two"),
  ];
  assert.deepEqual(maturityMetrics.map((item) => item?.numericValue), [303, 508, 497]);
  assert.ok(maturityMetrics.every((item) => item?.unit === "亿元" && item?.status === "actual"));
  assert.equal(
    maturityMetrics.reduce((total, item) => total + (item?.numericValue ?? 0), 0),
    byId.get("h1-finance-interest-bearing-debt")?.numericValue,
    "debt maturity columns must reconcile to displayed interest-bearing debt",
  );
  assert.equal(byId.get("h2-resource-saleable-value")?.status, "plan");
  assert.equal(byId.get("h2-resource-sold-unrecognized")?.status, "actual");
  assert.equal(byId.get("post-investment-new-value")?.status, "post-period");
  assert.equal(byId.get("post-investment-new-value")?.numericValue, 640);

  const operatingOrganizations = organizationModule.WENSHU_FIRST_LEVEL_ORGANIZATIONS.filter((organization) => (
    organization.dashboardAvailable !== false
    && Boolean(developmentModule.WENSHU_ORGANIZATION_DEVELOPMENT_3002[organization.code])
  ));
  assert.equal(operatingOrganizations.length, 9, "eight regional companies plus the town group must have a development snapshot");
  for (const organization of operatingOrganizations) {
    const development = developmentModule.WENSHU_ORGANIZATION_DEVELOPMENT_3002[organization.code];
    assert.ok(development, `${organization.name} needs Dataset 3002 development data`);
    assert.equal(
      development.cities.reduce((total, city) => total + city.totalProjects, 0),
      development.totalProjects,
      `${organization.name} city project totals must reconcile to the organization total`,
    );
    for (const [field, digits] of [
      ["soilAreaM2", 2],
      ["constructionProjects", 0],
      ["constructionAreaM2", 2],
      ["pendingProjects", 0],
      ["pendingAreaM2", 2],
    ]) {
      const cityTotal = development.cities.reduce((total, city) => total + city[field], 0);
      assert.equal(
        Number(cityTotal.toFixed(digits)),
        Number(development[field].toFixed(digits)),
        `${organization.name} ${field} must reconcile from city to organization`,
      );
    }
  }
  assert.equal(new Set(projectModule.WENSHU_PROJECTS.map((project) => project.id)).size, projectModule.WENSHU_PROJECTS.length);
  assert.equal(new Set(projectModule.WENSHU_PROJECTS.map((project) => project.projectId)).size, projectModule.WENSHU_PROJECTS.length);
  assert.deepEqual(
    Object.keys(projectAttributeModule.WENSHU_PROJECT_ATTRIBUTES).sort(),
    projectModule.WENSHU_PROJECTS.map((project) => project.id).sort(),
    "project attributes must cover the administrative project register without orphan rows",
  );
  for (const project of projectModule.WENSHU_PROJECTS) {
    assert.ok(Number.isFinite(project.totalBuildingAreaWan) && project.totalBuildingAreaWan >= 0, `${project.id} needs a valid building area`);
    assert.ok(project.developmentStatus.length > 0 && project.saleStatus.length > 0, `${project.id} needs development and sale statuses`);
    const attribute = projectAttributeModule.WENSHU_PROJECT_ATTRIBUTES[project.id];
    assert.ok(attribute.propertyTypes.length > 0, `${project.id} needs a property-type display value`);
    assert.ok(
      attribute.greentownEquityRatio === null
      || (Number.isFinite(attribute.greentownEquityRatio) && attribute.greentownEquityRatio >= 0 && attribute.greentownEquityRatio <= 100),
      `${project.id} needs a valid Greentown equity ratio`,
    );
  }
  for (const city of projectModule.WENSHU_CITY_SUMMARIES) {
    assert.equal(
      projectModule.WENSHU_PROJECTS.filter((project) => project.cityAdcode === city.cityAdcode).length,
      city.count,
      `${city.name} project register must reconcile to the map city count`,
    );
  }

  const [dashboardSource, dashboardCss, shellSource, annualSource, techMapSource] = await Promise.all([
    readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/annual-metrics.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/tech-map.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(dashboardSource, /data-dashboard-view="half-year-2026"/);
  assert.match(dashboardSource, /data-source-period="mixed"/);
  assert.match(dashboardSource, /data-source-periods=\{`\$\{HALF_YEAR_2026_SOURCE\.period\},operating-snapshot`\}/);
  assert.match(dashboardSource, /data-metric-count=\{DISPLAYED_HALF_YEAR_METRIC_COUNT\}/);
  assert.match(dashboardSource, /data-source-metric-count=\{HALF_YEAR_2026_ALL_METRICS\.length\}/);
  assert.match(dashboardSource, /data-supplemental-group-count=\{DISPLAYED_SUPPLEMENTAL_GROUP_COUNT\}/);
  assert.match(dashboardSource, /data-supplemental-metric-count=\{DISPLAYED_SUPPLEMENTAL_METRIC_COUNT\}/);
  assert.doesNotMatch(dashboardSource, /<footer className="fusion-footer">|DISPLAYED_HALF_YEAR_ACTUAL_COUNT|DISPLAYED_HALF_YEAR_PLAN_COUNT/);
  assert.doesNotMatch(dashboardSource, /SourceBadge|PANEL_STATUS_LABELS|formatPageRanges|页面角标为 PDF 页码/);
  assert.doesNotMatch(dashboardCss, /\.sourceBadge/);
  assert.match(dashboardSource, /<h1>绿城中国经营驾驶舱<\/h1>/);
  assert.doesNotMatch(dashboardSource, /setVisualTheme|role="group" aria-label="驾驶舱视觉主题"|>\s*亮色\s*<|>\s*深色\s*</);
  assert.match(dashboardSource, /data-visual-theme="dark"/);
  assert.match(dashboardSource, /data-flip-card-count=\{0\}/);
  assert.match(dashboardSource, /data-flip-enabled="true"/);
  assert.match(dashboardSource, /data-flipped=\{isFlipped \? "true" : "false"\}/);
  assert.match(dashboardSource, /aria-label=\{`翻转卡片查看\$\{title\}完整数据`\}/);
  assert.match(dashboardSource, /aria-label=\{`返回\$\{title\}摘要`\}/);
  assert.match(dashboardSource, /visualTheme="dark"/);
  assert.doesNotMatch(dashboardSource, /INTERIM RESULTS|DISCLOSURE COCKPIT|SALES & CASH COLLECTION|INVESTMENT & LAND BANK|MANAGEMENT & QUALITY|LIQUIDITY & DEBT|2H RESOURCES & RECOGNITION|EARNINGS & COST CONTROL|POST-PERIOD UPDATE|eyebrow=/);
  assert.doesNotMatch(dashboardCss, /\.panelTitle p|\.postPeriodPanel > header span|\.dashboard :global\(\.fusion-heading p\)/);
  assert.doesNotMatch(dashboardSource, /function HeroCard|function LiquidityPanel|function EarningsPanel|function PostPeriodStrip/);
  assert.doesNotMatch(dashboardSource, /<Panel index="04" title="现金与债务"|<Panel index="06" title="损益与费控"|<header><b>期后事项<\/b><\/header>|summaryStrip/);
  assert.match(dashboardSource, /<InvestmentPanel[\s\S]*?\/>[\s\S]*?<SalesPanel[\s\S]*?\/>[\s\S]*?<ResourcesPanel \/>[\s\S]*?<ConstructionPanel \/>/);
  assert.match(dashboardSource, /<RegionControl[\s\S]*?\/>[\s\S]*?<aside className=\{`fusion-module-rail is-left[\s\S]*?<ResourcesPanel \/>[\s\S]*?<ConstructionPanel \/>[\s\S]*?<\/aside>/);
  assert.match(dashboardSource, /<ConstructionPanel \/>[\s\S]*?<ManagedBusinessPanel \/>[\s\S]*?<CommercialOperationsPanel \/>[\s\S]*?<TownOperationsPanel \/>[\s\S]*?<LifeTechnologyPanel \/>[\s\S]*?<WellnessPanel \/>/);
  assert.match(dashboardSource, /<Panel\s+index="01"\s+title="投资与土储"/);
  assert.match(dashboardSource, /<Panel\s+index="02"\s+title="开发效率"/);
  assert.match(dashboardSource, /<Panel\s+index="03"\s+title="销售去化"/);
  assert.match(dashboardSource, /<Panel\s+index="04"\s+title="代建"/);
  assert.match(dashboardSource, /<Panel\s+index="05"\s+title="结转资源"/);
  assert.match(dashboardSource, /<Panel\s+index="06"\s+title="商管"/);
  assert.match(dashboardSource, /<Panel\s+index="07"\s+title="小镇"/);
  assert.match(dashboardSource, /<Panel\s+index="08"\s+title="生活科技"/);
  assert.match(dashboardSource, /<Panel\s+index="09"\s+title="康养"/);
  assert.match(dashboardSource, /<aside className=\{`fusion-module-rail is-right[^>]+aria-labelledby="specialty-business-heading">[\s\S]*?<span id="specialty-business-heading" role="heading" aria-level=\{2\}>特色业务<\/span>/);
  assert.doesNotMatch(dashboardSource, /<small>代建 \+ 绿城\+<\/small>/);
  assert.doesNotMatch(dashboardSource, /SpecialtyBusinessPanel|specialtyBusinessGrid/);
  assert.match(dashboardSource, /sourceLabel="2026中期披露 · 绿城\+"/);
  assert.match(dashboardSource, /data-green-plus-metric-id/);
  assert.doesNotMatch(dashboardSource, /data-annual-metric-id/);
  assert.doesNotMatch(dashboardSource, /data-metric-ref/);

  const displayedIdsSource = dashboardSource.match(/const DISPLAYED_HALF_YEAR_METRIC_IDS = \[([\s\S]*?)\] as const;/);
  assert.ok(displayedIdsSource, "the fused cockpit needs an explicit displayed 1H2026 metric set");
  const displayedIds = [...displayedIdsSource[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.equal(displayedIds.length, 11);
  assert.equal(new Set(displayedIds).size, 11);
  assert.ok(displayedIds.every((id) => byId.has(id)), "every fused-cockpit display metric must belong to the 63-item source catalog");
  for (const removedInvestmentMetricId of [
    "h1-investment-projects",
    "h1-investment-saleable-area",
    "h1-investment-new-value",
    "h1-landbank-value",
    "h1-landbank-total-gfa",
    "h1-landbank-saleable-gfa",
  ]) {
    assert.equal(displayedIds.includes(removedInvestmentMetricId), false, `${removedInvestmentMetricId} must not remain in the fused cockpit`);
  }
  for (const removedLaunchPlanMetricId of [
    "h2-resource-brand-new",
    "h2-resource-q3",
    "h2-resource-q4",
  ]) {
    assert.equal(displayedIds.includes(removedLaunchPlanMetricId), false, `${removedLaunchPlanMetricId} must leave the resource panel`);
  }
  const displayedStatusTotals = displayedIds.reduce((totals, id) => {
    totals[byId.get(id).status] += 1;
    return totals;
  }, { actual: 0, plan: 0, "post-period": 0 });
  assert.deepEqual(displayedStatusTotals, { actual: 13, plan: 3, "post-period": 0 });
  const boundMetricIds = [...dashboardSource.matchAll(/\bmetric\("([^"]+)"\)/g)].map((match) => match[1]);
  assert.equal(boundMetricIds.length, 16, "the fused cockpit should bind every displayed H1 metric exactly once");
  assert.equal(new Set(boundMetricIds).size, 16, "the fused cockpit must not duplicate H1 metric bindings");
  assert.deepEqual([...boundMetricIds].sort(), [...displayedIds].sort());

  const retainedAnnualGroups = annualDataModule.ANNUAL_METRIC_GROUPS.filter((group) => ["holding", "special"].includes(group.id));
  assert.deepEqual(retainedAnnualGroups.map((group) => group.id), ["holding", "special"]);
  assert.equal(retainedAnnualGroups.flatMap((group) => group.metrics).length, 11, "the 2025 source model remains intact even when it is no longer rendered in this screen");
  assert.doesNotMatch(dashboardSource, /annualGroup\(|annualMetric\(|from "\.\/annual-metrics"/);
  assert.match(dashboardSource, /aria-label="经营指挥关键节点"/);
  assert.match(dashboardSource, /"示范区开放"[\s\S]*?"项目首开"[\s\S]*?"交付"/);
  assert.doesNotMatch(dashboardSource, /construction-prefab|construction-green-area|construction-green-projects/);
  assert.match(dashboardCss, /url\("\/dashboard-bg-cityscape\.png"\) center bottom \/ cover fixed no-repeat/);
  assert.match(dashboardCss, /\.panel \{[\s\S]*?border: 1px solid var\(--half-line\);[\s\S]*?background: linear-gradient\(145deg, var\(--half-panel\), var\(--half-panel-deep\)\);[\s\S]*?backdrop-filter: blur\(10px\);/);
  assert.match(dashboardSource, /className=\{`fusion-cockpit \$\{styles\.dashboard\}`\}/);
  assert.match(dashboardSource, /className=\{`fusion-workspace \$\{styles\.workspace\}`\}/);
  assert.match(dashboardSource, /import type \{ CitySelection, ProvinceSelection \} from "\.\/tech-map"/);
  assert.match(dashboardSource, /const TechMap = lazy\(\(\) => import\("\.\/tech-map"\)\)/);
  assert.match(dashboardSource, /presentationMode="business"/);
  assert.match(dashboardSource, /interactionMode="metrics"/);
  assert.match(dashboardSource, /selectedCityActionLabel="再次点击查看项目清单"/);
  assert.match(dashboardSource, /scopedCityAdcodes=\{activeOrganizationCityAdcodes\}/);
  assert.match(dashboardSource, /scopedCityProjectCounts=\{activeOrganizationCityProjectCounts\}/);
  assert.match(dashboardSource, /data-active-organization-code=\{activeOrganizationCode \?\? "none"\}/);
  assert.match(dashboardSource, /labelOcclusionSelector='\[data-half-map-occlusion="true"\], \.fusion-module-rail'/);
  assert.match(dashboardSource, /WENSHU_COVERED_CITY_COUNT/);
  assert.match(dashboardSource, /WENSHU_DOMESTIC_PROJECT_COUNT/);
  assert.match(dashboardSource, /WENSHU_PROJECT_SNAPSHOT_DATE/);
  assert.match(dashboardSource, /function NationalMapLegend/);
  assert.match(dashboardSource, /aria-label=\{`全国项目覆盖图例：覆盖\$\{WENSHU_COVERED_CITY_COUNT\}个城市，共\$\{WENSHU_DOMESTIC_PROJECT_COUNT\}个境内有效项目`\}/);
  assert.match(dashboardSource, /data-map-coverage-legend="true"/);
  assert.match(dashboardSource, /data-source-dataset="6,3001"/);
  assert.match(dashboardSource, /const isNationalMapScope = !activeOrganization && !activeProvince && !activeCity/);
  assert.match(dashboardSource, /\{isNationalMapScope \? <NationalMapLegend \/> : null\}/);
  assert.doesNotMatch(dashboardSource, /title="滚动经营指标"/);
  assert.match(dashboardSource, /if \(administrativeRegionMetrics\)[\s\S]*?项目总建面[\s\S]*?label: "集团经营项目"/);
  assert.match(dashboardSource, /WENSHU_ORGANIZATION_DEVELOPMENT_3002/);
  assert.match(dashboardSource, /WENSHU_ORGANIZATION_DEVELOPMENT_SNAPSHOT_DATE/);
  assert.match(dashboardSource, /"data-top-rank": \/top\/i\.test\(item\.comparison\) \? "true" : undefined/);
  assert.match(dashboardSource, /aria-label="区域公司与地图经营指标"/);
  assert.match(dashboardSource, /土储总建面/);
  assert.match(dashboardSource, /在建总建面/);
  assert.match(dashboardSource, /未开发建面/);
  assert.match(dashboardSource, /function SalesTrendChart/);
  assert.match(dashboardSource, /buildSalesTrendBars\(liveMonthlySales \?\? fallbackMonthlySales\)/);
  assert.match(dashboardSource, /data-source-dataset="6286"/);
  assert.match(dashboardSource, /function CityProjectDrilldown/);
  assert.match(dashboardSource, /const \[isProjectListOpen, setIsProjectListOpen\] = useState\(false\)/);
  assert.match(dashboardSource, /WENSHU_PROJECTS[\s\S]*?filter\(\(project\) => project\.cityAdcode === activeCity\.cityAdcode\)/);
  assert.match(dashboardSource, /data-source-dataset="6,3001,1016"/);
  assert.match(dashboardSource, /data-source-snapshot=\{WENSHU_PROJECT_SNAPSHOT_DATE\}/);
  assert.match(dashboardSource, /role="list" data-project-count=\{projects\.length\}/);
  assert.match(dashboardSource, /role="listitem" data-project-id=\{project\.id\}/);
  assert.doesNotMatch(dashboardSource, /不表示项目组织归属|Dataset 6 \/ 3001|· 获取于 \{project\.projectGainTime\}|城市行政口径/);
  assert.match(dashboardSource, /aria-label=\{`查看\$\{projectCityName\}行政城市项目清单，共\$\{projectCount\}个项目`\}/);
  assert.match(dashboardSource, /查看\{projectCityName\}行政项目 <b>\{projectCount\}<\/b> →/);
  assert.match(dashboardSource, /if \(isCurrentCity\) \{\s*setIsProjectListOpen\(true\);\s*return;\s*\}/);
  assert.match(dashboardSource, /projectCount=\{activeCity \? cityProjects\.length : null\}/);
  assert.doesNotMatch(dashboardSource, /PROJECT DISTRIBUTION|AUXILIARY LAYER|指标口径：|点簇＝|地图仅示境内项目/);
  assert.doesNotMatch(dashboardSource, /<span>新推计划<\/span>|resourcePlanFacts/);
  assert.match(dashboardSource, /<span>已售未结与预计结转<\/span>/);
  assert.doesNotMatch(dashboardSource, /截至6月30日实际|代建与自投口径分列展示，不作加总。/);
  assert.doesNotMatch(dashboardSource, /行业荣誉来源：中国房协、中指院；/);
  assert.doesNotMatch(dashboardSource, /from "\.\/annual-metrics"/);
  assert.doesNotMatch(dashboardSource, /OrganizationBoard/);
  assert.match(dashboardSource, /from "\.\/map-region-metrics"/);
  assert.match(dashboardCss, /grid-template-columns: clamp\(360px, 27vw, 520px\) minmax\(0, 1fr\) clamp\(360px, 27vw, 520px\)/);
  assert.match(dashboardCss, /\.panel\[data-panel-index="01"\] \.panelBody,[\s\S]*?\.panel\[data-panel-index="03"\] \.panelBody \{ display: grid; align-content: space-between; \}/);
  assert.match(dashboardCss, /--half-cyan:\s*#28dbf7/);
  assert.match(dashboardCss, /--half-gold:\s*#f5af3e/);
  assert.match(dashboardCss, /--half-mint:\s*#5adcaf/);
  assert.match(dashboardCss, /--half-blue:\s*#3695ff/);
  assert.match(dashboardCss, /--half-label:\s*#d3e6f0/);
  const parseHexColor = (hex) => hex.match(/[0-9a-f]{2}/gi).map((channel) => parseInt(channel, 16) / 255);
  const relativeLuminance = (hex) => parseHexColor(hex)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((luminance, channel, index) => luminance + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const contrastRatio = (foreground, background) => {
    const foregroundLuminance = relativeLuminance(foreground);
    const backgroundLuminance = relativeLuminance(background);
    return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
      / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  };
  const darkTokenBlock = dashboardCss.match(/\.dashboard \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const tokenColor = (name) => darkTokenBlock.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  const dashboardBackground = tokenColor("half-bg");
  assert.ok(dashboardBackground, "dark cockpit needs a background token for contrast checks");
  for (const tokenName of ["half-muted", "half-label", "half-label-muted", "half-label-note"]) {
    const color = tokenColor(tokenName);
    assert.ok(color, `${tokenName} must remain a concrete dark-theme color`);
    assert.ok(
      contrastRatio(color, dashboardBackground) >= 4.5,
      `${tokenName} must stay readable for older viewers against the cockpit background`,
    );
  }
  assert.match(dashboardCss, /\.dashboard :global\(\.fusion-footer\),[\s\S]*?\.managedHonorCaption > small,[\s\S]*?\.mapCoverageLegend dt \{[^}]*font-weight: 500;/s);
  assert.match(dashboardCss, /\.mapField :global\(\.three-city-label > span\) \{[^}]*color: var\(--half-label-muted\);[^}]*font-weight: 550;/s);
  assert.match(dashboardCss, /\.managedHonorCaption > small \{[^}]*color: var\(--half-label-note\);/s);
  assert.match(dashboardCss, /\[data-top-rank="true"\] > small \{[\s\S]*?color: #60edfd;[\s\S]*?text-shadow:/);
  assert.match(dashboardCss, /--half-bar-blue:\s*linear-gradient\(180deg/);
  assert.match(dashboardCss, /--half-bar-mint:\s*linear-gradient\(180deg/);
  assert.match(dashboardCss, /--half-bar-amber:\s*linear-gradient\(180deg/);
  assert.match(dashboardCss, /\.collectionGauge \{[\s\S]*?conic-gradient\(from -90deg/);
  assert.match(dashboardCss, /\.scaleBars \.scaleRow:nth-child\(2\) > i u \{ background: var\(--half-bar-amber\); box-shadow: var\(--half-glow-amber\); \}/);
  assert.match(dashboardCss, /\.progressMetric > i u \{ background: var\(--half-bar-amber\); box-shadow: var\(--half-glow-amber\); \}/);
  assert.match(dashboardCss, /\.inventoryLine \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/s);
  assert.doesNotMatch(dashboardCss, /\.inventoryLine > article:last-child \{ grid-column: 1 \/ -1; \}/);
  assert.match(dashboardCss, /\.mapCoverageLegend \{[\s\S]*?grid-column: 2;[\s\S]*?align-self: end;[\s\S]*?margin: 0 0 14px 18px;[\s\S]*?pointer-events: none;/);
  assert.doesNotMatch(dashboardCss, /\.regionFacts\[data-fact-count="2"\]/);
  assert.match(dashboardCss, /\.annualTimeline \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(dashboardCss, /\.specialtyBusinessGrid/);
  assert.match(dashboardCss, /\.rail:global\(\.is-right\) \{[^}]*grid-template-rows: auto minmax\(0, 1\.4fr\) repeat\(4, minmax\(0, \.76fr\)\)/s);
  assert.match(dashboardCss, /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?\.rail:global\(\.is-right\) \{[^}]*overflow-x: hidden;[^}]*overflow-y: auto;/s);
  assert.match(dashboardCss, /\.greenPlusHighlights \{[^}]*display: grid;[^}]*gap:/s);
  assert.match(dashboardSource, /mark: "★★★"/);
  assert.match(dashboardSource, /mark: "No\.1"/);
  assert.match(dashboardSource, /className=\{styles\.managedHonorBadge\}[\s\S]*?data-honor-mark=\{honor\.mark\}[\s\S]*?aria-hidden="true"/);
  assert.match(dashboardCss, /\.managedHonorBadge \{[^}]*border:[^}]*border-radius: 50%;/s);
  assert.match(dashboardCss, /\.managedHonorBadge::before \{[^}]*border:[^}]*border-radius: 50%;/s);
  assert.match(dashboardCss, /\.greenPlusHighlights li \{[^}]*border: 0;[^}]*background: none;/s);
  assert.match(dashboardCss, /\.developmentDock \{[\s\S]*?grid-column: 1;[\s\S]*?grid-row: auto;[\s\S]*?width: 100%;/);
  assert.match(dashboardCss, /@media \(max-width: 1200px\) \{[\s\S]*?\.developmentDock \{[\s\S]*?height: auto;[\s\S]*?min-height: 116px;/);
  assert.match(dashboardCss, /@media \(max-width: 720px\) \{[\s\S]*?\.developmentDock \{ order: 5;[\s\S]*?\.rail:global\(\.is-left\) \{ order: 3; \}[\s\S]*?\.rail:global\(\.is-right\) \{ order: 4; \}/);
  assert.match(dashboardSource, /type KpiLevel = "primary" \| "secondary" \| "detail"/);
  assert.match(dashboardSource, /data-kpi-level=\{item\.id === totalValue\.id \|\| item\.id === totalArea\.id \? "primary" : "secondary"\}/);
  assert.match(dashboardSource, /<MetricCard item=\{sold\} compact kpiLevel="primary" \/>/);
  assert.match(dashboardCss, /--half-kpi-primary-size:\s*24px;[\s\S]*?--half-kpi-secondary-size:\s*18px;[\s\S]*?--half-kpi-detail-size:\s*15px;/);
  assert.match(dashboardCss, /\[data-kpi-level="primary"\] \.valueLineCompact strong \{[\s\S]*?font-size: var\(--half-kpi-primary-size\)/);
  assert.match(dashboardCss, /\[data-kpi-level="secondary"\] \.valueLineCompact strong \{[\s\S]*?font-size: var\(--half-kpi-secondary-size\)/);
  assert.match(dashboardCss, /\[data-kpi-level="detail"\] \.valueLineCompact strong,[\s\S]*?font-size: var\(--half-kpi-detail-size\)/);
  assert.doesNotMatch(dashboardCss, /\.rail:global\(\.is-right\) \.valueLineCompact strong \{ font-size: 20px; \}/);
  assert.match(dashboardCss, /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?--half-kpi-primary-size: 20px;[\s\S]*?--half-kpi-secondary-size: 16px;[\s\S]*?--half-kpi-detail-size: 13px;/);
  assert.match(dashboardSource, /className=\{styles\.recognitionChart\} aria-label="已售未结预计结转金额对比"/);
  assert.match(dashboardCss, /\.recognitionChart \{[^}]*grid-template-columns: repeat\(3, 1fr\)/s);
  assert.match(dashboardCss, /\.projectDrilldown \{[^}]*z-index: 9;[^}]*grid-column: 2;[^}]*grid-row: 1;/s);
  assert.match(dashboardCss, /@media \(max-width: 1200px\)[\s\S]*?\.dashboard \.workspace\[data-project-list-open="true"\] \.projectDrilldown \{ grid-column: 1; grid-row: 2; align-self: stretch; justify-self: stretch;/);
  assert.match(dashboardCss, /@media \(max-width: 1200px\)[\s\S]*?\.workspace \{[^}]*padding-top: 350px;[^}]*\}[\s\S]*?\.mapField \{ bottom: auto; height: 340px; \}/);
  assert.match(dashboardCss, /@media \(max-width: 1200px\)[\s\S]*?\.regionPanel \{[^}]*position: absolute;[^}]*top: 10px;[^}]*right: 10px;[^}]*left: 10px;[^}]*grid-column: auto;[^}]*grid-row: auto;[^}]*width: auto;[^}]*margin: 0;[^}]*\}/);
  assert.match(dashboardCss, /@media \(max-width: 1200px\)[\s\S]*?\.mapCoverageLegend \{ position: absolute; top: 284px; left: 14px; grid-column: auto; grid-row: auto;[^}]*width: 232px;/);
  assert.match(dashboardCss, /@media \(max-width: 720px\)[\s\S]*?\.regionPanel \{ position: relative; top: auto; right: auto; left: auto; order: 1; width: 100%; margin: 0 0 8px; \}/);
  assert.match(dashboardCss, /@media \(max-width: 720px\)[\s\S]*?\.mapCoverageLegend \{ top: 296px; left: 8px; width: 212px;/);
  assert.match(dashboardCss, /@media \(max-width: 720px\)[\s\S]*?\.workspace \{[^}]*display: flex;[^}]*flex-direction: column;[^}]*min-width: 0;[^}]*\}/);
  assert.match(dashboardCss, /@media \(max-width: 720px\)[\s\S]*?\.rail:global\(\.is-left\),[\s\S]*?\.rail:global\(\.is-right\) \{ display: grid; grid-template-columns: minmax\(0, 1fr\); gap: 8px; \}/);
  assert.match(dashboardCss, /\.dashboard\[data-visual-theme="light"\] \{[\s\S]*?--half-cyan:\s*#007440;/);
  assert.match(dashboardCss, /\.flipStage \{[^}]*transform-style:\s*preserve-3d;[^}]*transition:\s*transform/s);
  assert.match(dashboardCss, /\.flipFace \{[^}]*backface-visibility:\s*hidden;/s);
  assert.match(dashboardCss, /\.flipPanel\[data-flipped="true"\] \.flipStage \{ transform: rotateY\(180deg\); \}/);
  assert.match(dashboardCss, /@media \(max-width: 720px\)[\s\S]*?data-panel-index="05"\]\s*\{ min-height: 410px; \}/);
  assert.match(techMapSource, /export type TechMapVisualTheme = "dark" \| "light"/);
  assert.match(techMapSource, /const LIGHT_MAP_PALETTE: MapPalette = \{[\s\S]*?boundarySelected: new THREE\.Color\(0x007440\)/);
  assert.match(techMapSource, /const isLightTheme = visualTheme === "light";[\s\S]*?const palette = isLightTheme \? LIGHT_MAP_PALETTE : DARK_MAP_PALETTE/);
  assert.match(techMapSource, /data-visual-theme=\{visualTheme\}/);
  assert.match(shellSource, /import HalfYear2026Dashboard from "\.\/half-year-2026-dashboard"/);
  assert.match(shellSource, /<HalfYear2026Dashboard\s*\/>/);
  assert.doesNotMatch(shellSource, /useState|lazy\(|Suspense|DashboardView|grand-page|GrandDashboard|onSelectView/);
  assert.doesNotMatch(dashboardSource, /DashboardViewSwitch|经营驾驶舱1|经营驾驶舱3/);
  assert.match(annualSource, /export const ANNUAL_METRIC_GROUPS/);
  assert.doesNotMatch(annualSource, /2026-H1|1H2026/);
});

test("organization loading keeps investment labels stable and the left rail content-sized", async () => {
  const dashboardSource = await readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8");
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.match(
    dashboardSource,
    /const liveFacts: readonly RegionFact\[\] = usesOperatingOverview[\s\S]*?: facts;/,
    "organization loading must render the source-backed local fallback instead of empty placeholders",
  );
  assert.match(dashboardSource, /function buildOperatingOverviewFallbackFacts\([\s\S]*?organization\.newProjects[\s\S]*?newProjectTotalBuildingAreaWan[\s\S]*?organization\.newValue[\s\S]*?organization\.investment/);
  assert.match(dashboardSource, /facts=\{isAdministrativeMapScope \? regionFacts : operatingOverviewFallbackFacts\}/);
  assert.match(
    dashboardCss,
    /--half-rail-left-template:\s*auto minmax\(0, 1\.9fr\) minmax\(0, 2\.35fr\) minmax\(72px, \.64fr\) minmax\(72px, \.64fr\) minmax\(0, 1fr\) minmax\(0, 1fr\);/,
    "the left rail should use one centralized desktop template instead of competing content-sized rows",
  );
  assert.doesNotMatch(dashboardCss, /minmax\(max-content/);
  assert.match(dashboardCss, /\.rail:global\(\.is-left\) \.resourceDock \{[\s\S]*?align-self: stretch;/);
});

test("desktop resolution scaling is centralized across screen sizes", async () => {
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  for (const token of [
    "--half-screen-density",
    "--half-dashboard-pad-x",
    "--half-dashboard-pad-y",
    "--half-header-height",
    "--half-footer-height",
    "--half-rail-left-width",
    "--half-rail-right-width",
    "--half-rail-left-template",
    "--half-rail-right-template",
  ]) {
    assert.match(dashboardCss, new RegExp(`${token}:`));
  }

  assert.match(
    dashboardCss,
    /\.workspace \{[\s\S]*?grid-template-columns:\s*minmax\(var\(--half-rail-min-width\), var\(--half-rail-left-width\)\) minmax\(0, 1fr\) minmax\(var\(--half-rail-min-width\), var\(--half-rail-right-width\)\);[\s\S]*?gap:\s*var\(--half-rail-gap\);/,
  );
  assert.match(
    dashboardCss,
    /\.dashboard\[data-dashboard-view="half-year-2026"\] \.rail:global\(\.is-left\) \{ grid-template-rows: var\(--half-rail-left-template\); \}/,
  );
  assert.match(
    dashboardCss,
    /\.dashboard\[data-dashboard-view="half-year-2026"\] \.rail:global\(\.is-right\) \{ grid-template-rows: var\(--half-rail-right-template\); \}/,
  );
  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(min-height: 876px\) and \(max-height: 1080px\) \{[\s\S]*?--half-screen-density:\s*presentation;[\s\S]*?--half-rail-left-template:/,
  );
  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?--half-screen-density:\s*dense;[\s\S]*?--half-rail-left-template:/,
  );
});

test("specialty panel titles omit the redundant business suffix", async () => {
  const dashboardSource = await readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8");

  for (const [index, title] of [["04", "代建"], ["06", "商管"], ["07", "小镇"], ["09", "康养"]]) {
    assert.match(dashboardSource, new RegExp(`<Panel\\s+index="${index}"\\s+title="${title}"`));
  }
  assert.doesNotMatch(dashboardSource, /title="(?:代建|商管|小镇|康养)业务"/);
});

test("town module uses the six supplied operating indicators as a compact metric matrix", async () => {
  const dashboardSource = await readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8");
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.match(dashboardSource, /data-green-plus-layout=\{group\.id === "town-operations" \? "metric-matrix" : undefined\}/);
  assert.match(dashboardSource, /group\.id !== "town-operations" \? \([\s\S]*?greenPlusNarrative/);
  assert.match(dashboardCss, /data-green-plus-layout="metric-matrix"[^}]*grid-template-rows: minmax\(0, 1fr\);/s);
  assert.match(dashboardCss, /Town operating metrics override[\s\S]*?data-green-plus-layout="metric-matrix"[^}]*grid-template-rows: minmax\(0, 1fr\);[\s\S]*?data-green-plus-layout="metric-matrix"[^}]*\.greenPlusFacts \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[^}]*grid-template-rows: repeat\(3, minmax\(0, 1fr\)\);/s);
});

test("managed business keeps covered cities in the six-card performance grid", async () => {
  const metricsModule = await importTypeScriptDataModule(
    new URL("../app/half-year-2026-metrics.ts", import.meta.url),
  );
  const actual = metricsModule.HALF_YEAR_2026_MANAGED_PERFORMANCE_METRICS?.map((item) => ({
    label: item.label,
    value: item.value,
    unit: item.unit,
    period: item.displayPeriod,
  })) ?? [];

  assert.deepEqual(actual, [
    { label: "合约总面积", value: "12,000", unit: "万方", period: "2026上半年" },
    { label: "合约在建面积", value: "4,490", unit: "万方", period: "2026上半年" },
    { label: "覆盖城市", value: "132", unit: "座", period: "2026上半年" },
    { label: "新拓合约建面", value: "1,352", unit: "万方", period: "2026上半年" },
    { label: "销售金额", value: "345", unit: "亿元", period: "2026上半年" },
    { label: "交付面积", value: "546", unit: "万方", period: "2026上半年" },
  ]);
  assert.deepEqual(
    {
      label: metricsModule.HALF_YEAR_2026_MANAGED_MARKET_SHARE_METRIC?.label,
      value: metricsModule.HALF_YEAR_2026_MANAGED_MARKET_SHARE_METRIC?.value,
      unit: metricsModule.HALF_YEAR_2026_MANAGED_MARKET_SHARE_METRIC?.unit,
      period: metricsModule.HALF_YEAR_2026_MANAGED_MARKET_SHARE_METRIC?.displayPeriod,
    },
    { label: "市占率", value: "20.7", unit: "%", period: "2025年度" },
  );
});

test("compact command-centre view keeps the inventory performance strip visible", async () => {
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.doesNotMatch(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?\.panel\[data-panel-index="03"\] \.inventoryLine \{ display: none; \}/,
    "the compact desktop breakpoint must not hide the three inventory KPIs and leave the sales panel empty",
  );
  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?\.panel\[data-panel-index="03"\] \.panelBody \{[^}]*grid-template-rows: minmax\(0, 1\.85fr\) minmax\(54px, 1fr\);/,
    "the compact sales panel should reserve two clear rows for dynamic sales and inventory KPIs",
  );
});

test("sales panel balances its two visible content rows", async () => {
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.match(
    dashboardCss,
    /\.dashboard\[data-dashboard-view="half-year-2026"\] \.panel\[data-panel-index="03"\] \.panelBody \{\s*grid-template-rows: minmax\(0, 1\.85fr\) minmax\(72px, 1fr\);\s*\}/,
    "the sales panel should reserve balanced height for dynamic sales and inventory KPIs",
  );
});

test("dense desktop mode removes empty bands before shrinking readable KPIs", async () => {
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?\.dashboard\[data-dashboard-view="half-year-2026"\] \.panel\[data-panel-index="03"\] \.panelBody \{[\s\S]*?grid-template-rows: minmax\(0, 1\.85fr\) minmax\(54px, 1fr\);/,
    "short screens should preserve the sales chart and inventory row without nested delivery modules",
  );
  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?\.dashboard\[data-dashboard-view="half-year-2026"\] \.panel\[data-panel-index="01"\] \.panelBody \{[\s\S]*?grid-template-rows: minmax\(0, 1fr\) minmax\(42px, \.55fr\) minmax\(38px, \.42fr\);/,
    "short screens should reduce the spare bands in investment detail rows while keeping headline KPIs readable",
  );
  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(min-height: 876px\) and \(max-height: 1080px\) \{[\s\S]*?\.dashboard\[data-dashboard-view="half-year-2026"\] \.panel\[data-panel-index="01"\] \.ratioRow article > small \{ display: none; \}/,
    "compact screens should drop secondary investment notes before clipping the KPI row",
  );
});

test("mid-height desktop switches components to a presentation layout without clipped rows", async () => {
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");
  const presentationCss = dashboardCss.slice(dashboardCss.indexOf("/* Mid-height desktop presentation mode:"));

  assert.match(
    presentationCss,
    /@media \(min-width: 1201px\) and \(min-height: 876px\) and \(max-height: 1080px\) \{[\s\S]*?--half-screen-density:\s*presentation;[\s\S]*?--half-rail-left-template:\s*auto minmax\(0, 2fr\) minmax\(0, 2\.06fr\) minmax\(78px, \.68fr\) minmax\(58px, \.64fr\) minmax\(0, \.92fr\) minmax\(0, \.98fr\);/,
    "900–1080 class screens need their own presentation layout instead of inheriting dense-screen compression",
  );
  assert.match(
    presentationCss,
    /@media \(min-width: 1201px\) and \(min-height: 876px\) and \(max-height: 1080px\) \{[\s\S]*?\.salesTrendPlot \{ height: 54px; \}/,
    "the sales chart should use the space reserved for it instead of leaving a large empty card",
  );
  assert.match(
    presentationCss,
    /@media \(min-width: 1201px\) and \(min-height: 876px\) and \(max-height: 1080px\) \{[\s\S]*?\.greenPlusGroup \{[\s\S]*?grid-template-rows:\s*minmax\(42px, \.9fr\) minmax\(48px, 1\.1fr\);/,
    "specialty panels should turn their available height into two intentional visual bands",
  );
  assert.match(
    presentationCss,
    /@media \(min-width: 1201px\) and \(min-height: 876px\) and \(max-height: 1080px\) \{[\s\S]*?\.panel\[data-panel-index="01"\] \.ratioRow article > small \{ display: none; \}/,
    "presentation screens should remove secondary investment notes before the KPI row clips",
  );
  assert.match(
    presentationCss,
    /\.panel\[data-panel-index="01"\] \.ratioRow article \{[^}]*padding-block:\s*1px;/,
    "the compact investment ratio row must not lose its border pixels at 900–960px tall viewports",
  );
  assert.match(presentationCss, /\.deliveryPanel \.salesDeliveryGrid small,[\s\S]*?\.customerEvaluationPanel \.salesCustomerEvaluationGrid article > small \{[\s\S]*?display: none;/);
  assert.match(
    presentationCss,
    /@media \(min-width: 1201px\) and \(min-height: 876px\) and \(max-height: 1080px\) \{[\s\S]*?\.panel\[data-panel-index="01"\] \.panelBody \{[^}]*grid-template-rows:\s*minmax\(72px, 1\.08fr\) minmax\(48px, \.7fr\) minmax\(40px, \.58fr\);/,
    "investment rows must reserve their readable content height instead of collapsing to zero",
  );
});

test("managed sales ranking stays inside the sales metric card", async () => {
  const [dashboardSource, metricsSource] = await Promise.all([
    readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/half-year-2026-metrics.ts", import.meta.url), "utf8"),
  ]);

  assert.match(dashboardSource, /className=\{styles\.managedInsightStrip\}/);
  assert.match(dashboardSource, /市场份额连续十年超过20%/);
  assert.match(metricsSource, /note: "新房销售全行业 Top11"/);
  assert.match(dashboardSource, /item\.note \? <small className=\{styles\.managedMetricNote\}>\{item\.note\}<\/small>/);
  assert.doesNotMatch(dashboardSource, /data-managed-insight="sales-rank"/);
});

test("market share is presented as a full core KPI instead of a footnote", async () => {
  const [dashboardSource, dashboardCss] = await Promise.all([
    readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(dashboardSource, /<b>\{marketShare\.value\}<em>\{marketShare\.unit\}<\/em><\/b>/);
  assert.match(dashboardSource, /<small className=\{styles\.managedInsightNote\}>市场份额连续十年超过20%<\/small>/);
  assert.match(dashboardCss, /--half-managed-share-height: clamp\(40px, 5\.2vh, 52px\);/);
  assert.match(dashboardCss, /\.panel\[data-panel-index="04"\] \.managedInsightStrip strong b \{[^}]*font-size: var\(--half-highlight-kpi-size\) !important;/s);
});

test("investment panel omits redundant subsection captions", async () => {
  const dashboardSource = await readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(dashboardSource, /<span><i \/>动态经营<\/span>/);
  assert.doesNotMatch(dashboardSource, /<span><i \/>项目动态<\/span>/);
  assert.doesNotMatch(dashboardSource, /<span>新增货值结构<\/span>/);
  assert.match(dashboardSource, /data-retry-action="operating-overview"/);
  assert.match(dashboardSource, /aria-label=\{`项目动态，\$\{PROJECT_DYNAMICS_SNAPSHOT\.scopeLabel\}`\}/);
});

test("tall desktop density raises rail labels above presentation-size minimums", async () => {
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.match(dashboardCss, /@media \(min-width: 1500px\) and \(min-height: 900px\) \{/);
  assert.match(dashboardCss, /\.rail \.panelBody span \{ font-size: 11px !important; \}/);
  assert.match(dashboardCss, /\.rail \.panelBody :is\(small, em\) \{ font-size: 9px !important; \}/);
});

test("investment and managed KPI values share one responsive presentation size", async () => {
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.match(dashboardCss, /--half-highlight-kpi-size: clamp\(18px, 1\.2vw, 20px\);/);
  assert.doesNotMatch(dashboardCss, /--half-highlight-kpi-size: (?:26|32)px;/);
  assert.match(
    dashboardCss,
    /@media \(min-width: 2200px\) and \(min-height: 1200px\) \{[\s\S]*?--half-highlight-kpi-size: min\(1\.2vw, 2\.1vh\);[\s\S]*?--half-highlight-label-size: min\(\.65vw, 1\.15vh\);[\s\S]*?--half-highlight-unit-size: min\(\.54vw, \.94vh\);/,
  );
  assert.match(
    dashboardCss,
    /\.panel\[data-panel-index="01"\] \.investmentLiveGrid strong,[\s\S]*?\.panel\[data-panel-index="04"\] \.managedGrid \.valueLineCompact strong \{[\s\S]*?font-size: var\(--half-highlight-kpi-size\) !important;/,
  );
});

test("customer evaluation uses the available desktop height without enlarging its KPI values", async () => {
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(min-height: 900px\) \{[\s\S]*?\.panel\[data-panel-index="03"\] \.salesCustomerEvaluation \{[\s\S]*?min-height: clamp\(68px, 7vh, 150px\);/,
  );
  assert.match(dashboardCss, /\.salesCustomerEvaluationGrid article \{[\s\S]*?align-content: center;/);
});

test("managed market share stays period-labelled while sales rank stays in its metric card", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = (await response.text()).replaceAll("<!-- -->", "");
  const managedStart = html.indexOf('data-panel-index="04"');
  const managedEnd = html.indexOf('data-panel-index="06"', managedStart);
  const managedHtml = html.slice(managedStart, managedEnd);

  assert.match(
    managedHtml,
    /data-managed-insight="market-share"[^>]*data-card-treatment="gold"[^>]*data-source-period="2025-FY"/,
  );
  assert.doesNotMatch(managedHtml, /data-managed-insight="sales-rank"/);
  assert.match(managedHtml, /data-metric-id="managed-sales-amount"[\s\S]*?新房销售全行业 Top11/);
  assert.match(managedHtml, /2025年度/);
  assert.match(managedHtml, /2026上半年/);
});

test("dashboard density adapts for wide and short desktop viewports", async () => {
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.match(
    dashboardCss,
    /\.workspace \{[^}]*grid-template-columns: minmax\(var\(--half-rail-min-width\), var\(--half-rail-left-width\)\) minmax\(0, 1fr\) minmax\(var\(--half-rail-min-width\), var\(--half-rail-right-width\)\);/s,
  );
  assert.match(
    dashboardCss,
    /@media \(min-width: 1500px\) and \(min-height: 900px\) \{[\s\S]*?--half-panel-title-size: 20px;/s,
    "wide screens should raise the shared rail-title variable instead of hard-coding one panel size",
  );
  assert.match(
    dashboardCss,
    /\.managedInsightStrip \{[^}]*container-type: inline-size;/s,
    "the gold cards should scale from their panel width instead of a fixed viewport assumption",
  );
});

test("UI-009 presents every cockpit ranking as Top N without changing business figures", async () => {
  const [metricsModule, projectCasesModule] = await Promise.all([
    importTypeScriptDataModule(new URL("../app/half-year-2026-metrics.ts", import.meta.url)),
    importTypeScriptDataModule(new URL("../app/heavy-asset-project-cases.ts", import.meta.url)),
  ]);
  const metrics = metricsModule.HALF_YEAR_2026_ALL_METRICS;
  const rankingTexts = [
    ...metrics.flatMap((item) => [item.comparison, item.note]),
    ...metricsModule.HALF_YEAR_2026_GREEN_PLUS_GROUPS.flatMap((group) => [
      group.detail,
      ...group.highlights.map((highlight) => highlight.label),
    ]),
    ...projectCasesModule.HEAVY_ASSET_PROJECT_CASES.map((project) => project.highlight),
  ].filter((value) => typeof value === "string" && /Top\s*\d|排名|第一|第\s*\d/.test(value));

  assert.ok(rankingTexts.length > 0, "the source model should still expose genuine ranking statements");
  for (const text of rankingTexts) {
    assert.match(text, /Top \d+/, `ranking should use the spaced Top N form: ${text}`);
    assert.doesNotMatch(text, /Top\d|排名第?\s*\d|第\s*\d|第一/, `legacy ranking wording should be removed: ${text}`);
  }
  const managedMetrics = metricsModule.HALF_YEAR_2026_MANAGED_PERFORMANCE_METRICS;
  assert.equal(managedMetrics.find((item) => item.id === "managed-sales-amount")?.numericValue, 345);
  assert.equal(managedMetrics.find((item) => item.id === "managed-covered-cities")?.numericValue, 132);
  assert.equal(metrics.find((item) => item.id === "h1-customer-satisfaction")?.numericValue, 93.3);
});

test("UI-010 keeps the national map bright and visibly extruded without extra render geometry", async () => {
  const source = await readFile(new URL("../app/tech-map.tsx", import.meta.url), "utf8");
  const depth = Number(source.match(/const MAP_DEPTH = ([\d.]+);/)?.[1]);
  const tilt = Number(source.match(/mapRoot\.rotation\.x = -Math\.PI \/ 2 (- [\d.]+);/)?.[1]?.replace(" ", ""));
  const darkPalette = source.slice(source.indexOf("const DARK_MAP_PALETTE"), source.indexOf("const LIGHT_MAP_PALETTE"));
  const bloomStrength = Number(darkPalette.match(/bloomStrength: ([\d.]+),/)?.[1]);
  const boundaryGlowOpacity = Number(darkPalette.match(/boundaryGlowOpacity: ([\d.]+),/)?.[1]);

  assert.ok(depth >= 1.05 && depth <= 1.25, `map extrusion must be visible but bounded; received ${depth}`);
  assert.ok(tilt <= -0.16 && tilt >= -0.22, `map tilt must reveal the lower edge without disturbing labels; received ${tilt}`);
  assert.ok(bloomStrength >= 0.45 && bloomStrength <= 0.7, `bloom must brighten contours without washing labels out; received ${bloomStrength}`);
  assert.ok(boundaryGlowOpacity >= 0.22, `national and provincial contour glow must remain visible; received ${boundaryGlowOpacity}`);
  assert.match(source, /const sideMaterial = new THREE\.MeshStandardMaterial\(\{[\s\S]*?emissive: palette\.side,[\s\S]*?\}\);/);
  assert.match(source, /const sideEmissiveIntensity = isLightTheme \? 0 : [\d.]+;/);
  assert.equal((source.match(/new THREE\.ExtrudeGeometry/g) ?? []).length, 1, "the depth treatment must reuse the existing map mesh");
});

test("UI-011 gives each Green+ card one featured KPI and one compact narrative profile", async () => {
  const [dashboardSource, dashboardCss] = await Promise.all([
    readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(dashboardSource, /const GREEN_PLUS_FEATURED_FACT_IDS/);
  assert.match(dashboardSource, /data-green-plus-variant=\{group\.id\}/);
  assert.match(dashboardSource, /data-green-plus-featured=\{fact\.id === featuredFactId \? "true" : undefined\}/);
  assert.match(dashboardSource, /className=\{styles\.greenPlusNarrative\} data-green-plus-narrative="profile"[\s\S]*?className=\{styles\.greenPlusDescription\}[\s\S]*?className=\{styles\.greenPlusHighlights\}/);
  assert.match(dashboardCss, /\.greenPlusNarrative \{[^}]*display: grid;[^}]*grid-template-rows: auto auto;/s);
  for (const groupId of ["commercial-operations", "town-operations", "life-technology", "wellness"]) {
    assert.match(dashboardCss, new RegExp(`data-green-plus-variant="${groupId}"`));
  }
});

test("UI-012 fills the left rail with consistent vertical rhythm instead of blank bands", async () => {
  const css = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.match(css, /\.rail:global\(\.is-left\) \{[\s\S]*?row-gap: 6px;[\s\S]*?padding-block: 6px;/);
  assert.match(css, /\.panel\[data-panel-index="01"\] \.panelBody,[\s\S]*?\.panel\[data-panel-index="03"\] \.panelBody \{[^}]*align-content: stretch;[^}]*gap: 6px;/s);
  assert.match(css, /\.panel\[data-panel-index="03"\] \.salesCustomerEvaluation \{[^}]*height: 100%;[^}]*margin-top: 0;/s);
  assert.match(css, /\.panel\[data-panel-index="03"\] \.inventoryLine \{[^}]*height: 100%;[^}]*margin-top: 0;/s);
  assert.match(css, /\.panel\[data-panel-index="03"\] \.inventoryLine > article \{[^}]*align-content: center;/s);
  assert.match(css, /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?\.panel\[data-panel-index="01"\] \.ratioRow article > small \{ display: none; \}/);
  assert.match(css, /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?\.rail:global\(\.is-left\) \.resourceDock \.subsectionTitle \{ display: none; \}/);
  assert.match(css, /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?\.developmentDock \.annualTimeline article > i \{ display: none; \}/);
});

test("UI-013 turns each Green+ narrative ribbon into a two-level business profile", async () => {
  const [dashboardSource, dashboardCss] = await Promise.all([
    readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(dashboardSource, /data-green-plus-narrative="profile"/);
  assert.match(
    dashboardSource,
    /className=\{styles\.greenPlusDescription\}[\s\S]*?<small>业务进展<\/small>[\s\S]*?<p>\{group\.detail\}<\/p>/,
    "the business description should be a labelled information layer",
  );
  assert.match(
    dashboardSource,
    /className=\{styles\.greenPlusHighlights\}[\s\S]*?data-green-plus-highlight=\{highlight\.kind\}/,
    "case and honor content should remain a separate information layer",
  );
  assert.match(
    dashboardCss,
    /\.greenPlusNarrative \{[^}]*grid-template-columns: minmax\(0, 1fr\);[^}]*grid-template-rows: auto auto;/s,
    "the two layers must stack instead of collapsing into a thin side-by-side ribbon",
  );
  assert.match(dashboardCss, /\.greenPlusDescription \{[^}]*border-left: 2px solid var\(--green-plus-accent\);/s);
  assert.match(
    dashboardCss,
    /\.greenPlusHighlights span \{[^}]*white-space: normal;[^}]*-webkit-line-clamp: 2;/s,
    "case and honor copy must wrap to two readable lines instead of hard ellipsis",
  );
  assert.doesNotMatch(
    dashboardCss,
    /\.greenPlusHighlights span \{[^}]*(?:text-overflow: ellipsis|white-space: nowrap);/s,
  );
  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?\.greenPlusGroup \{[^}]*grid-template-rows: 22px 33px;[^}]*gap: 2px;[\s\S]*?\.greenPlusFacts article \{[^}]*display: flex;[^}]*height: 22px;/,
    "the laptop-height layout must reserve real rows for KPIs and both narrative layers",
  );
});

test("UI-014 gives Green+ cards the command-module treatment from the approved concept", async () => {
  const [dashboardSource, dashboardCss] = await Promise.all([
    readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(dashboardSource, /data-green-plus-frame="command-module"/);
  assert.match(dashboardSource, /<small className=\{styles\.greenPlusSubtitle\}>\{GREEN_PLUS_SUBTITLES\[group\.id\]\}<\/small>/);
  assert.match(dashboardSource, /data-green-plus-kpi-card="beacon"/);
  assert.match(
    dashboardSource,
    /<small>\{highlight\.kind === "case" \? "项目" : "荣誉"\}<\/small>/,
    "business strips should use project and honor labels like the approved mock",
  );
  assert.match(
    dashboardCss,
    /\.greenPlusGroup::before \{[^}]*repeating-linear-gradient\(90deg,/s,
    "the module needs a subtle chart and grid backing layer, not a flat card body",
  );
  assert.match(dashboardCss, /\.greenPlusGroup::after \{[^}]*bottom: 38px;[^}]*background:/s);
  assert.match(
    dashboardCss,
    /\.greenPlusFacts article \{[^}]*border: 1px solid rgba\(87, 210, 255, \.34\);[^}]*box-shadow:[^}]*0 0 18px/s,
    "KPI blocks should read as luminous dashboard beacons",
  );
  assert.match(
    dashboardCss,
    /\.greenPlusFacts article\[data-green-plus-featured="true"\] > b \{[^}]*text-shadow:[^}]*rgba\(255, 212, 121/s,
    "the featured KPI should get the warm glowing numeral treatment",
  );
  assert.match(
    dashboardCss,
    /\.greenPlusHighlights small \{[^}]*border-radius: 999px;[^}]*background: linear-gradient\(135deg, rgba\(32, 171, 255/s,
    "project and honor labels should become bright capsule tags",
  );
  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?\.greenPlusGroup \{[^}]*grid-template-rows: 22px 33px;[^}]*gap: 2px;/,
    "the short-screen mode must keep a real title row plus compact KPI and strip rows",
  );
});

test("city project lists sort acquisition dates newest first", async () => {
  const dashboardSource = await readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8");

  assert.match(
    dashboardSource,
    /\.sort\(\(left, right\) => \(\s*\(right\.projectGainTime \?\? ""\)\.localeCompare\(left\.projectGainTime \?\? ""\)\s*\|\| left\.name\.localeCompare\(right\.name, "zh-CN"\)/,
  );
  assert.doesNotMatch(dashboardSource, /left\.saleStatus\.localeCompare\(right\.saleStatus/);
});

test("UI-015 renders delivery and customer evaluation as independent left-rail panels", async () => {
  const [dashboardSource, dashboardCss] = await Promise.all([
    readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(dashboardSource, /const OPERATING_DELIVERY_SNAPSHOT/);
  assert.match(dashboardSource, /data-delivery-snapshot="operating-command"/);
  assert.match(dashboardSource, /<Panel[\s\S]{0,220}?index="10"[\s\S]{0,220}?title="项目交付"/);
  assert.match(dashboardSource, /<Panel[\s\S]{0,220}?index="11"[\s\S]{0,220}?title="集团客户评价"/);
  assert.doesNotMatch(dashboardSource, /<span>经营指挥交付<\/span>/);
  assert.match(
    dashboardSource,
    /<SalesPanel[\s\S]*?<DeliveryPanel \/>[\s\S]*?<CustomerEvaluationPanel \/>[\s\S]*?<ResourcesPanel \/>[\s\S]*?<ConstructionPanel \/>/,
    "the left rail should follow the layout approved in the reference screenshot",
  );

  const deliveryMetricIds = [...dashboardSource.matchAll(/id: "delivery-(households|value|area)"/g)].map((match) => match[1]);
  assert.deepEqual(deliveryMetricIds, ["households", "value", "area"]);
  assert.doesNotMatch(dashboardSource, /id: "delivery-projects"/, "the narrow rail should not add a fourth delivery metric");

  assert.match(dashboardCss, /\.rail \.panelTitle h2 \{ font-size: var\(--half-panel-title-size\); \}/);
  assert.match(dashboardCss, /--half-panel-title-size: clamp\(16px, 1vw, 19px\);/);
  assert.match(
    dashboardCss,
    /\.dashboard\[data-dashboard-view="half-year-2026"\] \.panel \.panelTitle > span \{[^}]*display: none;/,
    "module title sequence numbers should be hidden globally",
  );
  assert.match(
    dashboardCss,
    /--half-rail-left-template:[^;]*auto[^;]*minmax\(0, 1\.9fr\)[^;]*minmax\(0, 2\.35fr\)[^;]*minmax\(72px, \.64fr\)[^;]*minmax\(72px, \.64fr\)/,
    "the desktop left rail should reserve independent rows for delivery and customer evaluation",
  );
  assert.doesNotMatch(
    dashboardCss,
    /\.panel\[data-panel-index="01"\] \.panelTitle h2,[\s\S]*?\.panel\[data-panel-index="04"\] \.panelTitle h2 \{ font-size:/,
    "no individual rail panels should receive title-only font-size overrides",
  );
});

test("development efficiency follows resources in the left rail and releases the map bottom", async () => {
  const dashboardSource = await readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8");
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");
  const leftRailStart = dashboardSource.indexOf("fusion-module-rail is-left");
  const leftRailEnd = dashboardSource.indexOf("fusion-module-rail is-right", leftRailStart);
  const leftRailSource = dashboardSource.slice(leftRailStart, leftRailEnd);

  assert.match(leftRailSource, /<ResourcesPanel \/>[\s\S]*?<ConstructionPanel \/>/);
  assert.doesNotMatch(dashboardSource.slice(0, leftRailStart), /<ConstructionPanel \/>/);
  assert.match(dashboardSource, /viewportOcclusionSelector='\.fusion-module-rail'/);
  assert.match(dashboardSource, /layoutRole="left-rail-development"/);
  assert.doesNotMatch(leftRailSource, /mapOcclusion/);
  assert.match(dashboardCss, /grid-template-rows:\s*auto\s*minmax\(0, 1\.9fr\)\s*minmax\(0, 2\.35fr\)\s*minmax\(72px, \.64fr\)\s*minmax\(72px, \.64fr\)\s*minmax\(0, 1fr\)\s*minmax\(0, 1fr\);/);
  assert.match(dashboardCss, /\.developmentDock \{[\s\S]*?grid-column: 1;[\s\S]*?grid-row: auto;[\s\S]*?width: 100%;[\s\S]*?margin: 0;/);
  assert.match(dashboardCss, /\.mapCoverageLegend \{ margin-bottom: 14px; \}/);
});

test("compact sales trend keeps value labels below its title", async () => {
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.match(dashboardCss, /\.salesTrendBars li > b \{[\s\S]*?top: -10px;/);
  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(max-height: 1079px\) \{[\s\S]*?\.panel\[data-panel-index="03"\] \.salesTrendChart \{ padding-block: 12px 10px; \}[\s\S]*?\.panel\[data-panel-index="03"\] \.salesTrendPlot \{ height: 36px; \}/,
  );
});

test("compact left rail keeps all six panels inside the command-centre viewport", async () => {
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");

  assert.match(dashboardCss, /\.developmentDock \{[\s\S]*?height: auto;/);
  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(max-height: 1079px\) \{[\s\S]*?\.rail:global\(\.is-left\) \.panel \{ padding: 4px; \}[\s\S]*?\.developmentDock \.annualTimeline article \{ min-height: 48px;/,
  );
  assert.match(
    dashboardCss,
    /:is\(\.deliveryPanel, \.customerEvaluationPanel\) \{[\s\S]*?padding: 4px;/,
  );
  assert.match(
    dashboardCss,
    /@media \(min-width: 1201px\) and \(max-height: 875px\) \{[\s\S]*?\.rail:global\(\.is-left\) \{[^}]*grid-template-rows: auto minmax\(0, 1\.7fr\) minmax\(0, 2\.05fr\) minmax\(54px, \.62fr\) minmax\(50px, \.55fr\) minmax\(0, \.85fr\) minmax\(0, \.8fr\);/,
  );
});

test("MacBook and ThinkPad laptop layouts preserve readable aligned dashboard cards", async () => {
  const [dashboardSource, dashboardCss] = await Promise.all([
    readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(
    dashboardCss,
    /@media \(min-width: 1280px\) and \(max-width: 1600px\) and \(max-height: 920px\) \{[\s\S]*?--half-laptop-profile:\s*compact-laptop;/,
    "common 1366/1440-wide laptop screens should use an explicit compact layout profile",
  );
  assert.match(
    dashboardCss,
    /@media \(min-width: 1400px\) and \(max-width: 1728px\) and \(min-height: 921px\) and \(max-aspect-ratio: 11 \/ 6\) \{[\s\S]*?--half-laptop-profile:\s*macbook-tall;/,
    "16:10 MacBook screens should use a dedicated tall laptop profile",
  );
  assert.match(
    dashboardCss,
    /\.investmentLiveGrid article \{[^}]*position:\s*relative;/,
    "investment metric cards should provide a stable positioning context for rank labels",
  );
  assert.match(
    dashboardCss,
    /\.investmentLiveGrid \.rankDetail \{[^}]*position:\s*absolute;[^}]*top:\s*2px;[^}]*right:\s*5px;/,
    "the new-value rank should share the label row without deforming the value row",
  );
  assert.match(
    dashboardCss,
    /\.panel\[data-panel-index="03"\] \.salesTrendCard \{[^}]*display:\s*grid;[^}]*grid-template-rows:\s*minmax\(0, 1fr\);/,
    "the sales trend card should vertically center its chart within the available card height",
  );
  assert.doesNotMatch(
    dashboardSource,
    /<div className=\{styles\.salesTrendHeader\}>/,
    "the compact chart should not spend vertical space on a redundant visible title",
  );
  assert.match(
    dashboardCss,
    /:is\(\.inventoryLine, \.salesDeliveryGrid\) article > span \{[^}]*font-size:\s*8px;[^}]*line-height:\s*1\.2;/,
    "inventory and delivery labels should share one readable laptop baseline",
  );
  assert.match(
    dashboardCss,
    /\.greenPlusGroup\[data-green-plus-layout="metric-matrix"\] \.greenPlusFacts article > span \{[^}]*overflow:\s*visible;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;/,
    "town metric labels must be shown in full instead of ellipsized",
  );
  assert.match(
    dashboardCss,
    /\.greenPlusGroup\[data-green-plus-layout="metric-matrix"\] \.greenPlusFacts article\[data-green-plus-metric-id="green-plus-town-industries"\] > b \{[^}]*overflow:\s*visible;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;/,
    "the five-industry value must remain fully readable",
  );
  assert.match(
    dashboardCss,
    /\.greenPlusGroup:not\(\[data-green-plus-layout="metric-matrix"\]\) \.greenPlusNarrative \{[^}]*row-gap:\s*4px;/,
    "right-rail business narrative rows should retain breathing room on laptop screens",
  );
});

test("sales loading keeps the latest scoped performance snapshot visible", async () => {
  const dashboardSource = await readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8");

  assert.match(dashboardSource, /WENSHU_CITY_SALES_6283/);
  assert.match(dashboardSource, /const liveMonthlySales = state === "ready"[\s\S]*?latestSales\.monthlyContractSalesYi/);
  assert.match(dashboardSource, /buildSalesTrendBars\(liveMonthlySales \?\? fallbackMonthlySales\)/);
  assert.match(dashboardSource, /const canRenderTrend = state !== "unavailable" && trend\.bars\.length > 0/);
  assert.match(dashboardSource, /data-trend-display-mode=\{usesFallbackTrend \? "snapshot" : "live"\}/);
  assert.match(dashboardSource, /const rollingSalesFallback = administrativeRegionMetrics\?\.contractSalesYi[\s\S]*?activeCitySalesFallback\?\.contractSalesYi[\s\S]*?scopedOrganizationSalesFallback\?\.sales/);
  assert.match(dashboardSource, /fallbackMonthlySales=\{rollingMonthlySalesFallback\}/);
});

test("both dashboard views share a motion-safe type hierarchy and bright detail accents", async () => {
  const globalsCss = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const integratedCss = await readFile(new URL("../app/map-integrated-overview.css", import.meta.url), "utf8");
  const cockpitCss = await readFile(new URL("../app/vision-cockpit.css", import.meta.url), "utf8");
  const countUpSource = await readFile(new URL("../app/use-dashboard-count-up.ts", import.meta.url), "utf8");

  assert.match(globalsCss, /--font-geist-sans:\s*"Helvetica Neue"/);
  assert.match(globalsCss, /--font-geist-mono:\s*"SFMono-Regular"/);

  assert.match(integratedCss, /--fusion-accent-cyan:\s*#00d4ff/);
  assert.match(integratedCss, /--fusion-accent-mint:\s*#00ff9d/);
  assert.match(integratedCss, /\.fusion-module-card\s*\{[^}]*animation:\s*fusion-soft-enter \.45s ease-out both;/s);
  assert.match(integratedCss, /@keyframes fusion-soft-enter\s*\{[\s\S]*?translateY\(8px\)[\s\S]*?translateY\(0\)/);
  assert.match(integratedCss, /\.three-city-label\.is-selected::before\s*\{[^}]*animation:\s*fusion-status-pulse 2s ease-in-out infinite;/s);
  assert.match(integratedCss, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?animation-duration:\s*\.01ms !important;[\s\S]*?animation-iteration-count:\s*1 !important;[\s\S]*?transition-duration:\s*\.01ms !important;/);

  assert.match(cockpitCss, /--vision-accent-cyan:\s*#00d4ff/);
  assert.match(cockpitCss, /--vision-accent-mint:\s*#00ff9d/);
  assert.match(cockpitCss, /\.grand-group-heading > div p\s*\{[^}]*font-weight:\s*400;/s);
  assert.match(cockpitCss, /\.grand-group-heading > div h2\s*\{[^}]*font-weight:\s*400;/s);
  assert.match(cockpitCss, /\.grand-composite-label\s*\{[^}]*font-weight:\s*400;/s);
  assert.match(cockpitCss, /\.grand-embedded-fact > span\s*\{[^}]*font-weight:\s*400;/s);
  assert.match(cockpitCss, /\.grand-composite-value strong\s*\{[^}]*font-weight:\s*400;/s);
  assert.match(cockpitCss, /\.grand-sales-kpi strong\s*\{[^}]*font-weight:\s*400;/s);
  assert.match(cockpitCss, /\.grand-sales-kpi > div > em\s*\{\s*font-weight:\s*400;/s);
  assert.match(cockpitCss, /@keyframes vision-soft-enter\s*\{[\s\S]*?translateY\(8px\)[\s\S]*?translateY\(0\)/);
  assert.match(cockpitCss, /\.three-city-label\.is-selected::before\s*\{[^}]*animation:\s*vision-status-pulse 2s ease-in-out infinite;/s);
  assert.match(cockpitCss, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?animation-duration:\s*\.01ms !important;[\s\S]*?transition-duration:\s*\.01ms !important;/);
  assert.match(countUpSource, /requestAnimationFrame\(draw\)/);
  assert.match(countUpSource, /prefers-reduced-motion: reduce/);
  assert.match(countUpSource, /const duration = 760/);
});

test("engineering-site points keep project-specific big-screen destinations", async () => {
  const { ENGINEERING_SITE_PROJECTS } = await importTypeScriptDataModule(
    new URL("../app/heavy-asset-project-cases.ts", import.meta.url),
  );
  const sites = new Map(ENGINEERING_SITE_PROJECTS.map((project) => [project.projectRecordId, project]));

  assert.equal(ENGINEERING_SITE_PROJECTS.length, 2, "the map must expose one selected project per city");
  assert.deepEqual([...sites.keys()].sort(), ["P4097", "P4098"]);
  assert.equal(new Set(ENGINEERING_SITE_PROJECTS.map((project) => project.cityAdcode)).size, ENGINEERING_SITE_PROJECTS.length);

  assert.equal(
    sites.get("P4097")?.url,
    "https://gc.gtcloud.cn/home.html#/project_bigscreen/homeIntelligentMonitorings/homeIntelligentMonitoring_ep?tenantId=5600007&orgId=314275759694016&orgType=PROJECT",
    "义乌海上潮鸣 must open its own project big screen",
  );
  assert.equal(sites.get("P4097")?.projectName, "义乌海上潮鸣");
  assert.equal(
    sites.get("P4098")?.url,
    "https://gc.gtcloud.cn/home.html#/project_bigscreen/homeIntelligentMonitorings/homeIntelligentMonitoring_ep?tenantId=5600007&orgId=327532140060992&orgType=PROJECT",
    "杭州枫丹玫瑰园 must keep its existing destination",
  );
  assert.equal(sites.get("P4098")?.projectName, "杭州枫丹玫瑰园");
  assert.equal(new Set(ENGINEERING_SITE_PROJECTS.map((project) => project.url)).size, 2, "project destinations must not be reused");
});

test("map renders a source-backed city project-count cloud without claiming exact addresses", async () => {
  const mapSource = await readFile(new URL("../app/tech-map.tsx", import.meta.url), "utf8");
  const caseSource = await readFile(new URL("../app/heavy-asset-project-cases.ts", import.meta.url), "utf8");
  assert.match(mapSource, /projectIndex < projectCloudCapacity/);
  assert.match(mapSource, /cloudGeometry\.setDrawRange\(0, city\.count\)/);
  assert.match(mapSource, /role: "city-project-count-cloud"/);
  assert.match(mapSource, /preciseLocations: false/);
  assert.match(mapSource, /data-project-cloud-count/);
  assert.match(mapSource, /data-city-label-mode=\{isOutline \? undefined : "all-with-collision-avoidance"\}/);
  assert.match(mapSource, /presentationMode\?: "business" \| "outline"/);
  assert.match(mapSource, /const visibleCities = isOutline \? \[\] : cities/);
  assert.match(mapSource, /if \(!isOutline\) landParticleTimer/);
  assert.match(mapSource, /if \(isOutline\) composer\.render\(\);\s*mount\.dataset\.renderState = "ready"/);
  assert.match(caseSource, /projectRecordId: "P4098"[\s\S]*?projectName: "杭州枫丹玫瑰园"[\s\S]*?cityAdcode: 330100/);
  assert.match(caseSource, /projectRecordId: "P4097"[\s\S]*?projectName: "义乌海上潮鸣"[\s\S]*?cityAdcode: 330700/);
  assert.match(caseSource, /destination: "engineering-site"/);
  assert.match(mapSource, /金华: \[-72, 62\]/, "the two selected city labels need enough vertical separation to remain visible together");
  assert.match(mapSource, /siteLabel\.textContent = engineeringSite\.projectName;/, "the map chip must show the full project name without a truncating suffix");
  assert.match(mapSource, /window\.open\(engineeringSite\.url, "_blank", "noopener,noreferrer"\)/);
  assert.match(mapSource, /if \(event\.key === "Enter" \|\| event\.key === " "\) activateEngineeringSite\(event\)/);
  assert.match(mapSource, /data-map-presentation=\{presentationMode\}/);
  assert.match(mapSource, /data-project-cloud-count=\{isOutline \? undefined : WENSHU_DOMESTIC_PROJECT_COUNT\}/);
  assert.match(mapSource, /visual\.labelObject\.visible = citySelected \|\| inScope/);
  assert.match(mapSource, /is-national-view/);
  assert.match(mapSource, /labelOcclusionSelector/);
  assert.match(mapSource, /document\.querySelectorAll<HTMLElement>\(labelOcclusionSelector\)/);
  assert.match(mapSource, /data-label-occlusion/);
  assert.match(mapSource, /viewportOcclusionSelector/);
  assert.match(mapSource, /data-viewport-fit/);
  assert.match(mapSource, /const safeArea = resolveMapSafeArea\(mountBounds, viewportOccluders\)/);
  assert.match(mapSource, /const viewportFit = resolveMapViewportFit\(width, height, safeArea\)/);
  assert.match(mapSource, /const occlusionShift = resolveOcclusionShift\(initialRect, occlusionBounds, mapBounds\)/);
  assert.match(mapSource, /style\.pointerEvents = overlaps \? "none" : "auto"/);
  assert.match(mapSource, /const nextViewOffsetX = resolveViewOffset\(width, height\)/);
  assert.match(mapSource, /setAttribute\("aria-pressed", citySelected \? "true" : "false"\)/);
  assert.match(mapSource, /scopedCityAdcodes\?: number\[\]/);
  assert.match(mapSource, /scopedCityProjectCounts\?: Record<number, number>/);
  assert.match(mapSource, /visual\.projectCloud\.geometry\.setDrawRange\(0, Math\.min\(projectCloudCapacity, visual\.displayCount\)\)/);
  assert.match(mapSource, /tooltip\.textContent = city[\s\S]*?city\.displayCount/);
  assert.match(mapSource, /region\.selected = \(cityAdcode !== null \|\| !hasScopedCities\) && selected\.has\(region\.adcode\)/);
  assert.match(mapSource, /classList\.toggle\("is-in-scope", scopeSelected\)/);
  assert.match(mapSource, /pointerdown", stopMapPointer/);
  assert.match(mapSource, /pointerup", stopMapPointer/);
  assert.match(mapSource, /citySelected && selectedCityActionLabel/);
  assert.match(mapSource, /`\$\{visual\.city\.name\}，\$\{visual\.displayCount\}个项目，点击查看城市指标`/);
  assert.match(mapSource, /onProjectCaseSelect\?: \(projectCase: HeavyAssetProjectCase\) => void/);
  assert.match(mapSource, /caseLabel\.dataset\.projectRecordId = projectCase\.projectRecordId/);
  assert.match(mapSource, /caseLabel\.addEventListener\("click", activateProjectCase\)/);
  assert.match(mapSource, /projectCaseCallbackRef\.current\?\.\(projectCase\)/);
  assert.match(mapSource, /matchMedia\("\(pointer: coarse\)"\)\.matches \? "pan-y" : "none"/);
  assert.match(mapSource, /camera\.fov = viewportFit\.fov/);
  assert.match(mapSource, /mount\.dataset\.renderState = "loading"/);
  assert.match(mapSource, /let mapCollectionPromise: Promise<MapCollection> \| null = null/);
  assert.match(mapSource, /performance\.now\(\) - batchStartedAt < 6/);
  assert.match(mapSource, /window\.setTimeout\(scheduleParticleBatch, 1400\)/);
  assert.match(mapSource, /mount\.dataset\.particleState = "ready"/);
  assert.match(mapSource, /const rendererPixelRatio = Math\.min\(window\.devicePixelRatio \|\| 1, 1\)/);
  assert.match(mapSource, /const collisionInterval = !introFinished \|\| focusTransition \? 12 : 60/);
  assert.match(mapSource, /landParticleTimer = window\.setTimeout/);
  assert.match(mapSource, /mount\.dataset\.renderState = "ready"/);
  assert.match(mapSource, /点簇表示城市项目数量，不代表项目精确地址/);
});

test("project cockpit embeds structural facts inside their headline metric groups", async () => {
  const cockpitSource = await readFile(new URL("../app/grand-page.tsx", import.meta.url), "utf8");
  assert.match(cockpitSource, /grand-composite-facts/);
  assert.doesNotMatch(cockpitSource, /grand-primary-facts|grand-supporting-facts|supportingLabel=/);
  assert.match(cockpitSource, /data-composition="embedded-supporting"/);
  assert.equal((cockpitSource.match(/data-primary-count="3"/g) ?? []).length, 2);
  assert.equal((cockpitSource.match(/data-supporting-count="3"/g) ?? []).length, 1);
  assert.equal((cockpitSource.match(/data-supporting-count="2"/g) ?? []).length, 1);
  assert.match(cockpitSource, /id: "total-projects"[\s\S]*?supporting: \{[\s\S]*?id: "total-land-area"/);
  assert.match(cockpitSource, /id: "construction-projects"[\s\S]*?supporting: \{[\s\S]*?id: "construction-area"/);
  assert.match(cockpitSource, /id: "pending-projects"[\s\S]*?supporting: \{[\s\S]*?id: "pending-area"/);
  assert.match(cockpitSource, /id: "new-projects"[\s\S]*?label: "年度新拓项目"/);
  assert.match(cockpitSource, /id: "new-value"[\s\S]*?supporting: \{[\s\S]*?id: "equity-value"/);
  assert.match(cockpitSource, /id: "investment"[\s\S]*?supporting: \{[\s\S]*?id: "equity-investment"/);
  assert.match(cockpitSource, /data-parent-metric-id=\{fact\.id\}/);
  assert.match(cockpitSource, /grand-city-directory/);
  assert.doesNotMatch(cockpitSource, /<input\b/);
  assert.match(cockpitSource, /data-city-adcode=\{city\.cityAdcode\}/);
  assert.match(cockpitSource, /activeOrganizationCities\.map/);
  assert.match(cockpitSource, /data-query-mode="organization"/);
  assert.doesNotMatch(cockpitSource, /PUBLIC_DISPLAY_DATE|WENSHU_SNAPSHOT_DATE/);
  assert.match(cockpitSource, /salesAsOfLabel = latestSales\?\.asOfDate\.replaceAll/);
  assert.match(cockpitSource, /按最新完整日自动更新，不读取固定销售快照/);
  assert.match(cockpitSource, /WENSHU_ORGANIZATION_DEVELOPMENT_3002\[activeOrganization\.code\]/);
  assert.match(cockpitSource, /scopedCityAdcodes=\{scopedCityAdcodes\}/);
  assert.match(cockpitSource, /activeOrganizationCityAdcodeSet\.has\(project\.cityAdcode\)/);
  assert.match(cockpitSource, /经营组织 → 覆盖行政区 → 城市 → 项目清单/);
  assert.match(cockpitSource, /共 \{drilldownProjects\.length\} 个项目/);
  assert.doesNotMatch(cockpitSource, /className="grand-query-mode"|>行政区划</);
  assert.match(cockpitSource, /data-data-status="actual"/);
  assert.match(cockpitSource, /\{WENSHU_DOMESTIC_PROJECT_COUNT\} 个国内有效项目/);
  assert.doesNotMatch(cockpitSource, /项目开发状态|全国台账口径|问数实际签约口径|PROJECT DISTRIBUTION|项目布局|3D 交互地图|vision-map-header/);

  const cockpitCss = await readFile(new URL("../app/vision-cockpit.css", import.meta.url), "utf8");
  assert.match(cockpitCss, /\.grand-project-table-head \{\s*display: none;/);
  assert.match(cockpitCss, /\.grand-project-list > article \{\s*grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(cockpitCss, /max-aspect-ratio: 4\/3/);

  const snapshotSource = await readFile(new URL("../app/wenshu-snapshot.ts", import.meta.url), "utf8");
  assert.match(snapshotSource, /pendingArea: number/);
  assert.match(snapshotSource, /pendingProjects: 20, pendingArea: 606\.5/);

  const projectSource = await readFile(new URL("../app/wenshu-projects-snapshot.ts", import.meta.url), "utf8");
  assert.match(projectSource, /"cityAdcode": 330300,[\s\S]{0,180}"provinceAdcode": 330000,[\s\S]{0,180}"name": "温州",[\s\S]{0,180}"count": 7/);
});

test("organization drilldown keeps cross-province coverage cities and project registers aligned", async () => {
  const [{ WENSHU_ORGANIZATION_DEVELOPMENT_3002 }, projectSnapshot] = await Promise.all([
    importTypeScriptDataModule(new URL("../app/wenshu-organization-development-snapshot.ts", import.meta.url)),
    importTypeScriptDataModule(new URL("../app/wenshu-projects-snapshot.ts", import.meta.url)),
  ]);

  const zhejiang = WENSHU_ORGANIZATION_DEVELOPMENT_3002["50127376"];
  const managedCityNames = new Set(zhejiang.cities.map((city) => city.name));
  const managedCities = projectSnapshot.WENSHU_CITY_SUMMARIES.filter((city) => managedCityNames.has(city.name));
  const managedCityAdcodes = new Set(managedCities.map((city) => city.cityAdcode));
  const mapValidProjects = projectSnapshot.WENSHU_PROJECTS.filter((project) => managedCityAdcodes.has(project.cityAdcode));

  assert.equal(zhejiang.totalProjects, 223);
  assert.equal(managedCities.length, 12);
  assert.equal(mapValidProjects.length, 230);
  assert.ok(managedCities.some((city) => city.name === "福州" && city.provinceName === "福建"));
  assert.ok(managedCities.some((city) => city.name === "合肥" && city.provinceName === "安徽"));
  assert.equal(projectSnapshot.WENSHU_CITY_SUMMARIES.length, 55);
  assert.equal(projectSnapshot.WENSHU_PROJECTS.length, 488);
});

test("city drilldown uses source-backed dataset 6283 contract sales", async () => {
  const salesSource = await readFile(new URL("../app/wenshu-city-sales-snapshot.ts", import.meta.url), "utf8");
  const declarationStart = salesSource.indexOf("export const WENSHU_CITY_SALES_6283");
  const objectStart = salesSource.indexOf("{", declarationStart);
  const objectEnd = salesSource.indexOf("\n};", objectStart) + 2;
  assert.ok(declarationStart >= 0 && objectStart > declarationStart && objectEnd > objectStart);
  const citySales = JSON.parse(salesSource.slice(objectStart, objectEnd));

  assert.equal(Object.keys(citySales).length, 58);
  assert.equal(citySales["杭州"].contractSalesYi, 116.426);
  assert.equal(citySales["温州"].contractSalesYi, 0.9781);
  assert.deepEqual(citySales["温州"].monthlyContractSalesYi, [0, 0, 0, 0.1724, 0, 0.7765, 0, 0.0292]);
  for (const [cityName, row] of Object.entries(citySales)) {
    assert.equal(row.monthlyContractSalesYi.length, 8, `${cityName} must have eight monthly values`);
    const monthlyTotal = row.monthlyContractSalesYi.reduce((total, value) => total + value, 0);
    assert.ok(Math.abs(monthlyTotal - row.contractSalesYi) <= .00021, `${cityName} monthly sales must reconcile`);
  }

  const projectSource = await readFile(new URL("../app/wenshu-projects-snapshot.ts", import.meta.url), "utf8");
  const cityArrayStart = projectSource.indexOf("export const WENSHU_CITY_SUMMARIES");
  const cityArrayEnd = projectSource.indexOf("export const WENSHU_VALUE_BY_ORG", cityArrayStart);
  const mapCityNames = [...projectSource.slice(cityArrayStart, cityArrayEnd).matchAll(/"name": "([^"]+)"/g)]
    .map((match) => match[1]);
  assert.equal(mapCityNames.length, 55);
  for (const cityName of mapCityNames) assert.ok(citySales[cityName], `${cityName} must have dataset 6283 sales`);

  const cockpitSource = await readFile(new URL("../app/grand-page.tsx", import.meta.url), "utf8");
  assert.match(cockpitSource, /fetch\(`\/api\/latest-sales\?\$\{params\.toString\(\)\}`/);
  assert.match(cockpitSource, /sales: latestSales\.cumulativeContractSalesYi/);
  assert.match(cockpitSource, /monthlySales: latestSales\.monthlyContractSalesYi/);
  assert.match(cockpitSource, /const latestSalesRequestKey = `\$\{activeOrganization\.code\}::\$\{activeCity\?\.name \?\? ""\}`/);
  assert.match(cockpitSource, /const \[orgUnitCode, cityName\] = latestSalesRequestKey\.split\("::"\)/);
  assert.match(cockpitSource, /if \(cityName\) params\.set\("cityName", cityName\)/);
  assert.match(cockpitSource, /data-source-dataset="6286"/);
  assert.doesNotMatch(cockpitSource, /WENSHU_CITY_SALES_6283|usesCitySales6283/);
  assert.match(cockpitSource, /barMagnitude === 0\s*\? "0%"/);
  assert.match(cockpitSource, /value === 0 \? "is-zero"/);
  assert.match(cockpitSource, /value < 0 \? "，合同冲减" : ""/);
  const cockpitCss = await readFile(new URL("../app/vision-cockpit.css", import.meta.url), "utf8");
  assert.match(cockpitCss, /\.grand-story-chart > div\.is-negative i::after/);
  assert.match(cockpitCss, /border-top-color: #e87378/);
});

test("small contract amounts switch to a single readable chart unit", async () => {
  const { formatMoneyFromYi } = await importTypeScriptDataModule(
    new URL("../app/money-format.ts", import.meta.url),
  );

  assert.deepEqual(formatMoneyFromYi(0.0137), {
    value: "137",
    unit: "万元",
    scaledValue: 137,
  });
  assert.deepEqual(formatMoneyFromYi(0.0006), {
    value: "6",
    unit: "万元",
    scaledValue: 6,
  });
  assert.deepEqual(formatMoneyFromYi(0.1), {
    value: "0.1",
    unit: "亿元",
    scaledValue: 0.1,
  });
  assert.equal(formatMoneyFromYi(Number.NaN).value, "—");

  const cockpitSource = await readFile(new URL("../app/grand-page.tsx", import.meta.url), "utf8");
  assert.match(cockpitSource, /formatMoneyFromYi\(metrics\.sales/);
  assert.match(cockpitSource, /单位：\{salesDisplay\.unit\}/);
  assert.match(cockpitSource, /viewOffsetX=\{-7\}/);
  assert.match(cockpitSource, /--grand-project-content-height/);

  const integratedSource = await readFile(new URL("../app/map-integrated-overview.tsx", import.meta.url), "utf8");
  assert.match(integratedSource, /formatMoneyFromYi\(activeRegionMetrics\.contractSalesYi/);
  assert.match(integratedSource, /--fusion-project-content-height/);
});

test("map region snapshot keeps administrative metrics source-backed and two-step", async () => {
  const metricSource = await readFile(new URL("../app/map-region-metrics.ts", import.meta.url), "utf8");
  assert.match(metricSource, /WENSHU_PROJECTS/);
  assert.match(metricSource, /WENSHU_CITY_SALES_6283/);
  assert.match(metricSource, /ACTIVE_DEVELOPMENT_STATUSES = new Set\(\["在建", "待开发"\]\)/);
  assert.match(metricSource, /project\.provinceAdcode === provinceAdcode/);
  assert.match(metricSource, /cityAdcode == null \|\| project\.cityAdcode === cityAdcode/);
  assert.doesNotMatch(metricSource, /annual-metrics|ANNUAL_|WENSHU_ORGANIZATIONS|NATIONAL_METRICS/);

  const integratedSource = await readFile(new URL("../app/map-integrated-overview.tsx", import.meta.url), "utf8");
  assert.match(integratedSource, /className="fusion-region-facts"/);
  assert.match(integratedSource, /data-scope-kind=\{activeOrganizationCityDevelopment \? "organization-city" : activeCity \? "city" : "province"\}/);
  assert.match(integratedSource, /data-source-dataset=\{activeOrganizationCityDevelopment \? "3002,6283" : "6,3001,6283"\}/);
  assert.match(integratedSource, /activeOrganizationDevelopment\.cities\.find\(\(city\) => city\.name === activeCity\.name\)/);
  assert.match(integratedSource, /if \(!activeOrganizationCityAdcodes\.includes\(city\.cityAdcode\)\) setActiveOrganizationCode\(null\)/);
  assert.match(integratedSource, /项目总建面/);
  assert.match(integratedSource, /土储总建面/);
  assert.match(integratedSource, /未开发建面/);
  assert.match(integratedSource, /纯待开发/);
  assert.match(integratedSource, /在建＋待开发项目/);
  assert.match(integratedSource, /本年合同销售额/);
  assert.match(integratedSource, /查看可定位项目/);
  assert.match(integratedSource, /className="fusion-organization-city-nav"/);
  assert.match(integratedSource, /cities=\{activeOrganizationCities\}/);
  assert.match(integratedSource, /onViewProjects=\{\(\) => setIsProjectListOpen\(true\)\}/);
  assert.match(integratedSource, /查看覆盖城市项目/);
  assert.match(integratedSource, /共 \{drilldownProjects\.length\} 个项目/);
  assert.doesNotMatch(integratedSource, /组织台账|覆盖城市行政区有效明细|明细按覆盖城市行政区有效项目口径展示/);
  assert.doesNotMatch(integratedSource, /本年度计划交付面积/);
  assert.match(integratedSource, /handleProvinceSelect[\s\S]*?setActiveOrganizationCode\(null\)[\s\S]*?setIsProjectListOpen\(false\)/);
  assert.match(integratedSource, /handleCitySelect[\s\S]*?setIsProjectListOpen\(openProjectList\)/);
  assert.match(integratedSource, /setIsProjectListOpen\(true\)/);
  assert.match(integratedSource, /className="fusion-organization-scroll-next"/);
  assert.match(integratedSource, /grid\.scrollTo\(\{/);
  assert.match(integratedSource, /onPointerDown=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.match(integratedSource, /onClick=\{\(event\) => \{[\s\S]*?scrollOrganizations\(\)/);
  assert.doesNotMatch(integratedSource, /setAutoRotate/);

  const projectUiCss = await readFile(new URL("../app/map-integrated-overview.css", import.meta.url), "utf8");
  assert.match(projectUiCss, /\.fusion-organization-city-nav\s*\{/);
  assert.match(projectUiCss, /\.fusion-organization-scroll-next\s*\{/);
  assert.match(projectUiCss, /\.fusion-organization-grid\s*\{[\s\S]*?margin-right:\s*40px;/);
  assert.doesNotMatch(projectUiCss, /\.fusion-organization-board::after/);
  assert.match(projectUiCss, /data-project-list-open="true"[\s\S]*?\.fusion-project-drilldown\s*\{[\s\S]*?grid-column:\s*2;/);
  assert.doesNotMatch(projectUiCss, /data-project-list-open="true"\][^{]*\.fusion-module-rail\.is-right\s*\{[\s\S]*?visibility:\s*hidden/);

  const mapSource = await readFile(new URL("../app/tech-map.tsx", import.meta.url), "utf8");
  assert.match(mapSource, /visual\.hitTarget\.visible = !hasScopedCities \|\| inScope \|\| citySelected/);

  const organizationModule = await importTypeScriptDataModule(
    new URL("../app/wenshu-organization-development-snapshot.ts", import.meta.url),
  );
  const organizationSnapshots = organizationModule.WENSHU_ORGANIZATION_DEVELOPMENT_3002;
  assert.equal(Object.keys(organizationSnapshots).length, 9);
  const organizationIndexModule = await importTypeScriptDataModule(
    new URL("../app/wenshu-snapshot.ts", import.meta.url),
  );
  assert.deepEqual(
    Object.keys(organizationSnapshots).sort(),
    organizationIndexModule.WENSHU_FIRST_LEVEL_ORGANIZATIONS
      .filter((organization) => organization.dashboardAvailable !== false)
      .map((organization) => organization.code)
      .sort(),
  );
  const zhejiang = organizationSnapshots["50127376"];
  assert.equal(zhejiang.totalProjects, 223);
  assert.equal(zhejiang.soilAreaM2, 6_149_250.84);
  assert.equal(zhejiang.cities.length, 12);
  assert.equal(zhejiang.cities.reduce((total, city) => total + city.totalProjects, 0), 223);
  const zhejiangCityNames = new Set(zhejiang.cities.map((city) => city.name));
  for (const cityName of ["杭州", "宁波", "嘉兴", "福州", "合肥", "温州"]) assert.ok(zhejiangCityNames.has(cityName));
  assert.equal(zhejiangCityNames.has("舟山"), false);
  assert.deepEqual(
    zhejiang.cities.find((city) => city.name === "嘉兴"),
    {
      name: "嘉兴",
      totalProjects: 9,
      soilAreaM2: 415_648.8,
      constructionProjects: 5,
      constructionAreaM2: 415_648.8,
      pendingProjects: 0,
      pendingAreaM2: 0,
    },
  );

  const projectSource = await readFile(new URL("../app/wenshu-projects-snapshot.ts", import.meta.url), "utf8");
  const projectStart = projectSource.indexOf("export const WENSHU_PROJECTS");
  const cityStart = projectSource.indexOf("export const WENSHU_CITY_SUMMARIES", projectStart);
  const cityEnd = projectSource.indexOf("export const WENSHU_VALUE_BY_ORG", cityStart);
  const mapCityNames = new Set(
    [...projectSource.slice(cityStart, cityEnd).matchAll(/"name": "([^"]+)"/g)].map((match) => match[1]),
  );
  const organizationCityNames = [];
  for (const [organizationCode, snapshot] of Object.entries(organizationSnapshots)) {
    organizationCityNames.push(...snapshot.cities.map((city) => city.name));
    for (const [field, cityField] of [
      ["totalProjects", "totalProjects"],
      ["soilAreaM2", "soilAreaM2"],
      ["constructionProjects", "constructionProjects"],
      ["constructionAreaM2", "constructionAreaM2"],
      ["pendingProjects", "pendingProjects"],
      ["pendingAreaM2", "pendingAreaM2"],
    ]) {
      const cityTotal = snapshot.cities.reduce((total, city) => total + city[cityField], 0);
      assert.ok(
        Math.abs(cityTotal - snapshot[field]) <= .02,
        `${organizationCode} ${field} must reconcile to city rows`,
      );
    }
    for (const city of snapshot.cities) assert.ok(mapCityNames.has(city.name), `${city.name} needs a verified map anchor`);
  }
  assert.ok(
    new Set(organizationCityNames).size < organizationCityNames.length,
    "first-level organizations may share covered cities, such as the small-town business",
  );
  const projectArrayStart = projectSource.indexOf("= [", projectStart) + 2;
  const projectArrayEnd = projectSource.lastIndexOf("];", cityStart);
  const projects = JSON.parse(projectSource.slice(projectArrayStart, projectArrayEnd + 1));

  const salesSource = await readFile(new URL("../app/wenshu-city-sales-snapshot.ts", import.meta.url), "utf8");
  const salesDeclarationStart = salesSource.indexOf("export const WENSHU_CITY_SALES_6283");
  const salesObjectStart = salesSource.indexOf("{", salesDeclarationStart);
  const salesObjectEnd = salesSource.indexOf("\n};", salesObjectStart) + 2;
  const citySales = JSON.parse(salesSource.slice(salesObjectStart, salesObjectEnd));

  const summarize = (scopeProjects) => {
    const activeProjects = scopeProjects.filter((project) => ["在建", "待开发"].includes(project.developmentStatus));
    const cityNames = [...new Set(scopeProjects.map((project) => project.cityName))];
    return {
      projects: scopeProjects.length,
      cities: cityNames.length,
      area: Math.round(scopeProjects.reduce((total, project) => total + project.totalBuildingAreaWan, 0) * 100) / 100,
      activeProjects: activeProjects.length,
      activeArea: Math.round(activeProjects.reduce((total, project) => total + project.totalBuildingAreaWan, 0) * 100) / 100,
      sales: Math.round(cityNames.reduce((total, cityName) => total + citySales[cityName].contractSalesYi, 0) * 10000) / 10000,
    };
  };

  assert.deepEqual(summarize(projects.filter((project) => project.provinceAdcode === 330000)), {
    projects: 226,
    cities: 11,
    area: 4088.14,
    activeProjects: 71,
    activeArea: 1234.18,
    sales: 214.6737,
  });
  assert.deepEqual(summarize(projects.filter((project) => project.cityAdcode === 330300)), {
    projects: 7,
    cities: 1,
    area: 150.57,
    activeProjects: 2,
    activeArea: 43.83,
    sales: 0.9781,
  });

  const integratedCss = await readFile(new URL("../app/map-integrated-overview.css", import.meta.url), "utf8");
  assert.match(integratedCss, /\.fusion-region-facts \{/);
  assert.match(integratedCss, /background: linear-gradient\(145deg, rgba\(4, 25, 53, \.96\), rgba\(3, 17, 39, \.92\)\)/);
});

test("city anchors reconcile exactly to the domestic project snapshot", async () => {
  const source = await readFile(new URL("../app/wenshu-projects-snapshot.ts", import.meta.url), "utf8");
  const developmentModule = await importTypeScriptDataModule(new URL("../app/wenshu-organization-development-snapshot.ts", import.meta.url));
  const parseExportedArray = (name, nextName) => {
    const declarationStart = source.indexOf(`export const ${name}`);
    const nextDeclaration = source.indexOf(`export const ${nextName}`, declarationStart + 1);
    assert.notEqual(declarationStart, -1, `${name} declaration must exist`);
    assert.notEqual(nextDeclaration, -1, `${nextName} declaration must exist`);
    const arrayStart = source.indexOf("= [", declarationStart) + 2;
    const arrayEnd = source.lastIndexOf("];", nextDeclaration);
    assert.ok(arrayStart > declarationStart, `${name} array start must exist`);
    assert.ok(arrayEnd > arrayStart, `${name} array end must exist`);
    return JSON.parse(source.slice(arrayStart, arrayEnd + 1));
  };

  const projects = parseExportedArray("WENSHU_PROJECTS", "WENSHU_CITY_SUMMARIES");
  const cities = parseExportedArray("WENSHU_CITY_SUMMARIES", "WENSHU_VALUE_BY_ORG");
  assert.equal(projects.length, 488);
  assert.equal(cities.length, 55);
  assert.equal(new Set(projects.map((project) => project.id)).size, 488);
  assert.equal(new Set(cities.map((city) => city.cityAdcode)).size, 55);
  assert.equal(cities.reduce((total, city) => total + city.count, 0), 488);

  const projectCountByCity = new Map();
  for (const project of projects) {
    projectCountByCity.set(project.cityAdcode, (projectCountByCity.get(project.cityAdcode) ?? 0) + 1);
  }
  assert.equal(projectCountByCity.size, 55);
  for (const city of cities) {
    assert.equal(projectCountByCity.get(city.cityAdcode), city.count, `${city.name} project count must reconcile`);
  }
  const nationalCityCountByName = new Map(cities.map((city) => [city.name, city.count]));
  for (const development of Object.values(developmentModule.WENSHU_ORGANIZATION_DEVELOPMENT_3002)) {
    for (const city of development.cities) {
      const nationalCount = nationalCityCountByName.get(city.name);
      assert.notEqual(nationalCount, undefined, `${city.name} organization snapshot needs a map anchor`);
      assert.ok(city.totalProjects <= nationalCount + 8, `${city.name} organization count must fit reserved point-cloud capacity`);
    }
  }

  const wenzhouProjects = projects.filter((project) => project.cityAdcode === 330300);
  assert.equal(wenzhouProjects.length, 7);
  assert.equal(Math.round(wenzhouProjects.reduce((total, project) => total + project.totalBuildingAreaWan, 0) * 10) / 10, 150.6);
  assert.equal(wenzhouProjects.filter((project) => project.developmentStatus === "在建").length, 1);
  assert.equal(Math.round(wenzhouProjects
    .filter((project) => project.developmentStatus === "在建")
    .reduce((total, project) => total + project.totalBuildingAreaWan, 0) * 10) / 10, 38.6);
  assert.equal(wenzhouProjects.filter((project) => project.developmentStatus === "待开发").length, 1);
  assert.equal(Math.round(wenzhouProjects
    .filter((project) => project.developmentStatus === "待开发")
    .reduce((total, project) => total + project.totalBuildingAreaWan, 0) * 10) / 10, 5.2);
});

test("operating overview API stays source-backed and excludes internal equity fields", async () => {
  const source = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");
  const start = source.indexOf('if (requestUrl.pathname === "/api/operating-overview")');
  const end = source.indexOf('if (requestUrl.pathname !== "/api/latest-sales")');
  assert.ok(start >= 0 && end > start, "local operating overview route must be registered before latest sales");
  const block = source.slice(start, end);

  assert.match(block, /requestUrl\.searchParams\.get\("date"\) \|\| currentShanghaiDate\(\)/);
  assert.match(block, /validateDashboardDate\(asOfDate\)/);
  assert.match(block, /getDatasetDatasource\(service, "10802"\)/);
  assert.match(block, /getDatasetDatasource\(service, "10266"\)/);
  assert.match(block, /getDatasetDatasource\(service, "12051"\)/);
  assert.match(block, /datasetCode: "10802"[\s\S]*?date: asOfDate[\s\S]*?region: orgUnitCode[\s\S]*?startGainDate: `\$\{asOfDate\.slice\(0, 4\)\}-01-01`/);
  assert.match(block, /datasetCode: "10266"[\s\S]*?params: \{ date: asOfDate, region: orgUnitCode \}/);
  assert.match(block, /datasetCode: "12051"[\s\S]*?region: orgUnitCode[\s\S]*?date: asOfDate[\s\S]*?startGainDate: `\$\{asOfDate\.slice\(0, 4\)\}-01-01`/);
  assert.match(block, /singleDatasetRow\(investmentQuery, "10802"\)/);
  assert.match(block, /singleDatasetRow\(salesQuery, "10266"\)/);
  assert.match(block, /ytdCumulativeContractSalesYi: requiredNumericField\(salesRow, "accumCompValue"\)/);
  assert.match(block, /ytdNewProjectCount: requiredNumericField\(investmentRow, "numberOfItems"\)/);
  assert.match(block, /const ytdNewValueYi = nullableNumericField\(investmentRow, "investmentValue"\)/);
  assert.match(block, /\bytdNewValueYi,\s*\n/);
  assert.match(block, /ytdInvestmentYi: nullableNumericField\(investmentRow, "investment"\)/);
  assert.match(block, /nullableNumericField\(investmentRow, "total_construction_area"\)/);
  assert.match(block, /aggregateTier12NewValue\(tier12Query, ytdNewValueYi\)/);
  assert.match(block, /ytdTier12NewValueSharePct: tier12Aggregation\.sharePct/);
  assert.match(block, /ytdTier12NewValueYi: tier12Aggregation\.valueYi/);
  assert.match(block, /catch\(\(\) => null\)/);
  assert.match(block, /error instanceof RequestValidationError \? 400 : 502/);
  assert.match(block, /"Cache-Control", "no-store, max-age=0"/);
  assert.doesNotMatch(block, /equityValue|equityInvestment|shareOfEquity|accumCompTargetValue|cumuCompRate|contractTarget|CompletionRate/);
});

test("single fused cockpit keeps external-scale disclosure metrics and live drilldown", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = (await response.text()).replaceAll("<!-- -->", "");
  const dashboardSource = await readFile(new URL("../app/half-year-2026-dashboard.tsx", import.meta.url), "utf8");
  const dashboardCss = await readFile(new URL("../app/half-year-2026-dashboard.module.css", import.meta.url), "utf8");
  const viteSource = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");

  const panelHtml = (index) => {
    const markerIndex = html.indexOf(`data-panel-index="${index}"`);
    assert.notEqual(markerIndex, -1, `panel ${index} must be server-rendered`);
    const panelStart = html.lastIndexOf("<section", markerIndex);
    const nextMarkerOffset = html.slice(markerIndex + 1).search(/data-panel-index="\d+"/);
    const nextMarkerIndex = nextMarkerOffset < 0 ? -1 : markerIndex + 1 + nextMarkerOffset;
    const panelEnd = nextMarkerIndex < 0 ? html.indexOf("</main>", markerIndex) : html.lastIndexOf("<section", nextMarkerIndex);
    assert.ok(panelStart >= 0 && panelEnd > markerIndex, `panel ${index} needs a reliable sibling boundary`);
    return html.slice(panelStart, panelEnd);
  };

  assert.match(html, /<h1>绿城中国经营驾驶舱<\/h1>/);
  assert.match(html, /<aside[^>]*\bis-left\b[^>]*aria-label="重资产项目"[^>]*>[\s\S]*?>重资产项目<\/span>/);
  assert.match(html, /<aside[^>]*\bis-right\b[^>]*aria-labelledby="specialty-business-heading"[^>]*>[\s\S]*?<span[^>]*id="specialty-business-heading"[^>]*role="heading"[^>]*aria-level="2"[^>]*>特色业务<\/span>/);
  assert.doesNotMatch(html, /经营概况|动态经营 \+ 中期计划|2026 中期业绩|代建 \+ 绿城\+/);
  assert.doesNotMatch(html, /<h2[^>]*>特色业务<\/h2>/);
  assert.doesNotMatch(html, /经营驾驶舱1|经营驾驶舱3|<button[^>]*data-dashboard-view=/);
  assert.doesNotMatch(html, /滚动经营指标/);

  const investmentHtml = panelHtml("01");
  const salesHtml = panelHtml("03");
  const deliveryHtml = panelHtml("10");
  const customerEvaluationHtml = panelHtml("11");
  const constructionHtml = panelHtml("02");
  const managedHtml = panelHtml("04");
  assert.match(investmentHtml, /<h2[^>]*>投资与土储<\/h2>/);
  assert.match(salesHtml, /累计合同销售额/);
  assert.match(salesHtml, /class="[^"]*salesOverviewRow[^"]*"[\s\S]*?最新销售经营数据[\s\S]*?销售业绩趋势/);
  assert.doesNotMatch(salesHtml, /本月实际合同销售额|当月实际合同销售额|本月日均|本月日均环比/);
  assert.match(investmentHtml, /data-project-dynamics="true"/);
  assert.match(investmentHtml, /项目动态/);
  assert.match(investmentHtml, /截至08月28日未注销项目/);
  for (const [label, value] of [
    ["项目个数", "512"],
    ["土储总建面", "2029.61"],
    ["在建总建面", "1440.95"],
  ]) {
    assert.match(investmentHtml, new RegExp(`${label}[\\s\\S]{0,120}?${value.replace(".", "\\.")}`));
  }
  assert.match(constructionHtml, /data-layout-role="left-rail-development"/);
  assert.doesNotMatch(constructionHtml, /data-half-map-occlusion="true"/);
  assert.match(constructionHtml, /<h2[^>]*>开发效率<\/h2>/);
  assert.match(managedHtml, /<h2[^>]*>代建<\/h2>/);
  assert.match(managedHtml, /中国房协 · 截至06\.30/);
  assert.match(managedHtml, /中指院 · 截至06\.30/);
  assert.match(panelHtml("05"), /<h2[^>]*>结转资源<\/h2>/);
  assert.doesNotMatch(panelHtml("05"), /<h2[^>]*>下半年资源与结转<\/h2>/);
  assert.match(panelHtml("06"), /<h2[^>]*>商管<\/h2>/);
  assert.match(panelHtml("07"), /<h2[^>]*>小镇<\/h2>/);
  assert.doesNotMatch(panelHtml("07"), /核心小镇业务/);
  assert.match(panelHtml("08"), /<h2[^>]*>生活科技<\/h2>/);
  assert.match(panelHtml("09"), /<h2[^>]*>康养<\/h2>/);
  assert.doesNotMatch(panelHtml("05"), /下半年自投可售货值|下半年自投可售面积|存量在售货值|计划新推货值|新推计划|其中全新推盘|三季度计划新推|四季度计划新推/);
  assert.doesNotMatch(html, />全国 · 经营指挥同步[^<]*<\/small>|>全国 · 最新完整日[^<]*<\/small>|>全国 · 单位：亿元 · 截至[^<]*<\/small>|>普睿数智 · 截至06\.30<\/small>|>滚动经营快照 · 2026\.08\.24<\/small>|>截至6月30日实际<\/small>/);
  assert.doesNotMatch(html, /<footer class="fusion-footer">/);

  const leftRailStart = html.indexOf('aria-label="重资产项目"');
  const leftRailEnd = html.indexOf("</aside>", leftRailStart);
  assert.ok(leftRailStart >= 0 && leftRailEnd > leftRailStart, "left rail must render as one operating-overview group");
  const leftRailHtml = html.slice(leftRailStart, leftRailEnd);
  const leftRailOrder = ["01", "03", "10", "11", "05", "02"].map((index) => leftRailHtml.indexOf(`data-panel-index="${index}"`));
  assert.ok(leftRailOrder.every((position) => position >= 0), "left rail must contain six independently titled operating modules");
  assert.deepEqual([...leftRailOrder].sort((a, b) => a - b), leftRailOrder, "delivery and customer evaluation must follow sales before resources and development efficiency");

  const rightRailStart = html.indexOf('aria-labelledby="specialty-business-heading"');
  const rightRailEnd = html.indexOf("</aside>", rightRailStart);
  assert.ok(rightRailStart >= 0 && rightRailEnd > rightRailStart, "right rail must render as one specialty-business group");
  const rightRailHtml = html.slice(rightRailStart, rightRailEnd);
  const rightRailOrder = ["04", "06", "07", "08", "09"].map((index) => rightRailHtml.indexOf(`data-panel-index="${index}"`));
  assert.ok(rightRailOrder.every((position) => position >= 0), "right rail must contain five independent business panels");
  assert.deepEqual([...rightRailOrder].sort((a, b) => a - b), rightRailOrder, "all Green+ businesses must remain independent and ordered");
  assert.doesNotMatch(rightRailHtml, /data-panel-index="(?:02|05)"/, "resources and development efficiency must leave the right rail");

  for (const [panelIndex, groupId, title] of [
    ["06", "commercial-operations", "商用运营"],
    ["07", "town-operations", "小镇运营"],
    ["08", "life-technology", "生活科技"],
    ["09", "wellness", "康养"],
  ]) {
    assert.match(panelHtml(panelIndex), new RegExp(`data-green-plus-group="${groupId}"[\\s\\S]{0,500}?${title}`));
  }
  assert.equal((rightRailHtml.match(/data-green-plus-metric-id=/g) ?? []).length, 8);
  assert.equal((rightRailHtml.match(/data-green-plus-highlight=/g) ?? []).length, 4);
  for (const highlight of [
    "杭州晓风朗月｜在浙首个施工大总包项目·品质兑现",
    "上海北中环中心｜长租公寓轻资产运营项目",
    "入选“2026银发消费服务商Top50”",
    "小镇IP运营获“产业综合运营优秀企业”",
  ]) {
    assert.match(rightRailHtml, new RegExp(highlight), `right rail must render the source-backed highlight: ${highlight}`);
  }
  assert.match(rightRailHtml, /data-source-pages="13"/);
  assert.match(rightRailHtml, /data-material-pages="12"/);
  assert.doesNotMatch(rightRailHtml, /2025展示|初步意向/);

  for (const index of ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"]) {
    const header = panelHtml(index).match(/<header[^>]*>[\s\S]*?<\/header>/)?.[0];
    assert.ok(header, `panel ${index} needs a visible header`);
    assert.doesNotMatch(header, /<small\b/, `panel ${index} header must not repeat source cadence or scope`);
  }

  assert.doesNotMatch(investmentHtml, /data-rank-badge="new-value"/, "Top4 must wait for the matching live new-value fact");
  assert.match(dashboardSource, /const showsNewValueRank = showGroupRank && usesOperatingOverview && fact\.label === "新拓货值"/);
  assert.doesNotMatch(dashboardSource, /showGroupRank && index === 2/);
  assert.match(dashboardCss, /\.investmentLiveGrid small:not\(\.rankDetail\) \{ display: none; \}/);
  assert.doesNotMatch(dashboardCss, /\.panel \{ min-height: 330px; \}/);
  assert.match(salesHtml, /data-rank-badge="sales-performance"[^>]*>自投销售 Top6</);
  assert.doesNotMatch(salesHtml, /data-delivery-snapshot|data-sales-customer-evaluation/);
  assert.match(deliveryHtml, /data-delivery-snapshot="operating-command"/);
  assert.match(deliveryHtml, /<h2[^>]*>项目交付<\/h2>/);
  assert.match(customerEvaluationHtml, /data-sales-customer-evaluation="group-disclosure"/);
  assert.match(customerEvaluationHtml, /<h2[^>]*>集团客户评价<\/h2>/);
  assert.match(customerEvaluationHtml, /data-metric-id="h1-customer-satisfaction"[\s\S]{0,500}?<strong>93\.3<\/strong><em>分<\/em>/);
  assert.match(customerEvaluationHtml, /data-metric-id="h1-customer-loyalty"[\s\S]{0,500}?<strong>89\.1<\/strong><em>%<\/em>/);
  assert.doesNotMatch(managedHtml, /data-metric-id="h1-customer-(?:satisfaction|loyalty)"/);
  for (const [honorId, label, value] of [
    ["managed-capability-rating", "代建综合能力评价", "三星级"],
    ["managed-operations-leader", "代建运营引领企业", "Top1"],
  ]) {
    const honorStart = managedHtml.indexOf(`data-managed-honor="${honorId}"`);
    const honorEnd = managedHtml.indexOf("</article>", honorStart);
    assert.ok(honorStart >= 0 && honorEnd > honorStart, `${honorId} must render as one honor item`);
    const honorHtml = managedHtml.slice(honorStart, honorEnd);
    assert.match(honorHtml, new RegExp(label));
    assert.match(honorHtml, new RegExp(value));
  }
  assert.match(managedHtml, /data-managed-honor="managed-capability-rating"[\s\S]{0,500}?data-honor-mark="★★★"/);
  assert.match(managedHtml, /data-managed-honor="managed-operations-leader"[\s\S]{0,500}?data-honor-mark="No\.1"/);

  for (const externalScaleLabel of [
    "一二线新增货值占比",
    "北上杭新增货值",
  ]) {
    assert.match(investmentHtml, new RegExp(externalScaleLabel), `panel 01 must show ${externalScaleLabel}`);
  }
  assert.match(investmentHtml, /data-metric-id="h1-investment-tier12-share"[\s\S]{0,500}?<strong>94<\/strong><em>%<\/em>/);

  assert.match(constructionHtml, /经营指挥关键节点/);
  for (const [metricId, label, value] of [
    ["demo-zone-open", "示范区开放", "5.3"],
    ["project-launch", "项目首开", "5.9"],
    ["delivery", "交付", "26.4"],
  ]) {
    const markerIndex = constructionHtml.indexOf(`data-key-node-id="${metricId}"`);
    assert.notEqual(markerIndex, -1, `${metricId} must render in project construction`);
    const articleStart = constructionHtml.lastIndexOf("<article", markerIndex);
    const articleEnd = constructionHtml.indexOf("</article>", markerIndex);
    const stageHtml = constructionHtml.slice(articleStart, articleEnd);
    assert.match(stageHtml, new RegExp(label));
    assert.match(stageHtml, new RegExp(`${value.replace(".", "\\.")}[\\s\\S]{0,60}?(?:个)?月`));
  }
  assert.match(constructionHtml, /2026年拿地项目/);
  assert.match(constructionHtml, /截至08月31日/);
  assert.doesNotMatch(constructionHtml, /<b>(?:5\.4|6\.1|26\.2)<em>/);
  assert.doesNotMatch(constructionHtml, /2025展示|初步意向/);
  for (const removedSupportingLabel of [
    "装配式建筑应用占比（在建）",
    "新增绿色建筑认证面积",
    "累计绿色建筑项目",
  ]) {
    assert.doesNotMatch(constructionHtml, new RegExp(removedSupportingLabel));
  }

  for (const internalEquityLabel of [
    "权益土地款",
    "新增投资权益比",
    "权益建筑面积",
    "权益可售建筑面积",
    "权益销售",
    "代建归母净利润",
    "已售未结权益金额",
  ]) {
    assert.doesNotMatch(html, new RegExp(`>${internalEquityLabel}</span>`), `${internalEquityLabel} must not render as a metric`);
  }

  const metricTags = [...html.matchAll(/<[^>]+data-metric-id="([a-z0-9-]+)"[^>]*>/g)];
  const renderedMetricIds = new Set(metricTags.map((match) => match[1]));
  assert.equal(metricTags.length, 16);
  assert.equal(renderedMetricIds.size, 16);
  assert.equal(metricTags.filter((match) => /data-status="actual"/.test(match[0])).length, 13);
  assert.equal(metricTags.filter((match) => /data-status="plan"/.test(match[0])).length, 3);
  for (const removedInvestmentMetricId of [
    "h1-investment-projects",
    "h1-investment-saleable-area",
    "h1-investment-new-value",
    "h1-landbank-value",
    "h1-landbank-total-gfa",
    "h1-landbank-saleable-gfa",
  ]) {
    assert.equal(renderedMetricIds.has(removedInvestmentMetricId), false, `${removedInvestmentMetricId} must not render in the fused cockpit`);
  }
  const renderedGreenPlusMetricIds = new Set([...html.matchAll(/data-green-plus-metric-id="([a-z0-9-]+)"/g)].map((match) => match[1]));
  assert.equal(renderedGreenPlusMetricIds.size, 8);
  for (const removedConstructionMetricId of [
    "construction-prefab",
    "construction-green-area",
    "construction-green-projects",
  ]) {
    assert.equal(renderedGreenPlusMetricIds.has(removedConstructionMetricId), false, `${removedConstructionMetricId} must not render in development efficiency`);
  }
  for (const internalMetricId of [
    "h1-sales-equity",
    "h1-investment-equity-land-cost",
    "h1-investment-equity-ratio",
    "h1-landbank-equity-gfa",
    "h1-landbank-equity-saleable-gfa",
    "h1-managed-profit",
    "h2-resource-equity-unrecognized",
  ]) {
    assert.equal(renderedMetricIds.has(internalMetricId), false, `${internalMetricId} is internal-only`);
  }

  assert.match(viteSource, /getDatasetDatasource\(service, "10802"\)/);
  assert.match(viteSource, /getDatasetDatasource\(service, "10266"\)/);
  assert.match(viteSource, /getDatasetDatasource\(service, "12051"\)/);
  assert.match(dashboardSource, /fetch\(`\/api\/operating-overview\?\$\{params\.toString\(\)\}`/);
  assert.match(dashboardSource, /fetch\(`\/api\/latest-sales\?\$\{params\.toString\(\)\}`/);
  assert.match(dashboardSource, /function CityProjectDrilldown/);
  assert.match(dashboardSource, /selectedCityActionLabel="再次点击查看项目清单"/);
  assert.match(dashboardSource, /const \[focusedProjectId, setFocusedProjectId\] = useState<string \| null>\(null\)/);
  assert.match(dashboardSource, /const handleProjectCaseSelect = \(projectCase: HeavyAssetProjectCase\) =>/);
  assert.match(dashboardSource, /setFocusedProjectId\(projectCase\.projectRecordId\)/);
  assert.match(dashboardSource, /onProjectCaseSelect=\{handleProjectCaseSelect\}/);
  assert.match(dashboardSource, /focusedProjectId=\{focusedProjectId\}/);
  assert.match(dashboardSource, /data-source-dataset="6,3001,1016"/);
});

test("ships a project-local social preview asset", async () => {
  await access(new URL("../public/og.png", import.meta.url));
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /https:\/\/verachen1989\.github\.io\/sale_speed\//);
  assert.doesNotMatch(layout, /next\/headers|x-forwarded-host/);
  assert.match(layout, /summary_large_image/);
  assert.match(layout, /og\.png/);
  await access(projectRoot);
});

test("keeps browser-loaded public assets compatible with the GitHub Pages base path", async () => {
  const [publicPath, layoutSource, mapSource, cockpitSource, integratedSource] = await Promise.all([
    readFile(new URL("../app/public-path.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/tech-map.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/grand-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/map-integrated-overview.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(publicPath, /process\.env\.NEXT_PUBLIC_BASE_PATH/);
  assert.match(publicPath, /export function publicAssetPath/);
  assert.match(layoutSource, /publicAssetPath\("\/favicon\.svg"\)/);
  assert.match(mapSource, /fetch\(publicAssetPath\("\/china-geo\.json"\)/);
  assert.match(cockpitSource, /publicAssetPath\("\/greentown-logo-header\.png"\)/);
  assert.match(integratedSource, /publicAssetPath\("\/greentown-logo-header\.png"\)/);
});
