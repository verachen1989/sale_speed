import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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

test("server-renders the integrated map as the default exhibition view", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const visibleHtml = html.replaceAll("<!-- -->", "");
  assert.match(html, /<title>绿城中国经营工作台<\/title>/);
  assert.match(html, /MAP INTEGRATED VIEW/);
  assert.match(html, /绿城中国经营驾驶舱/);
  assert.match(html, /融合地图/);
  assert.match(html, /项目驾驶舱/);
  assert.match(html, /总合同销售金额/);
  assert.match(html, /2,519/);
  assert.match(html, /新拓项目转化率/);
  assert.match(html, /data-layout="all-modules"/);
  assert.match(html, /data-module-count="7"/);
  assert.match(html, /data-metric-count="56"/);
  assert.equal((html.match(/class="fusion-module-card is-/g) ?? []).length, 7);
  assert.match(html, /data-organization-count="11"/);
  assert.match(html, /data-active-organization-code="national"/);
  assert.match(html, /data-source-dataset="10300"/);
  assert.match(html, /data-source-snapshot="2026\.08\.23"/);
  assert.equal((html.match(/data-organization-code="[0-9]+"/g) ?? []).length, 11);
  assert.match(visibleHtml, /经营组织总览/);
  assert.match(html, /aria-label="查看更多经营组织"/);
  assert.match(visibleHtml, /浙江区域/);
  assert.match(visibleHtml, /620\.53/);
  assert.match(visibleHtml, /未售货值 · 2026\.08\.23/);
  assert.match(html, /data-region-metrics-active="false"/);
  assert.match(html, /data-feature-metric-count="3"/);
  assert.match(html, /data-card-metric-count="5"/);
  for (const metricId of [
    "investment-projects",
    "investment-saleable-area",
    "investment-new-value",
    "investment-equity",
    "investment-conversion",
    "investment-tier12",
    "investment-yangtze",
    "investment-lower-tier",
  ]) {
    assert.equal((html.match(new RegExp(`data-metric-id="${metricId}"`, "g")) ?? []).length, 1, `${metricId} should render exactly once`);
  }
  assert.match(html, /data-priority="supporting"/);
  assert.match(html, /data-project-cloud-count="488"/);
  assert.match(html, /data-city-anchor-count="55"/);
  assert.match(html, /fusion-stage-signal is-highlight/);
  assert.match(html, /is-progress/);
  const renderedMetricIds = [...html.matchAll(/data-metric-id="([a-z0-9-]+)"/g)].map((match) => match[1]);
  assert.equal(renderedMetricIds.length, 56);
  assert.equal(new Set(renderedMetricIds).size, 56);
  assert.match(visibleHtml, /2025 年度经营概览/);
  assert.match(visibleHtml, /7 大经营板块 · 56 项年度经营指标/);
  assert.match(html, /https:\/\/verachen1989\.github\.io\/sale_speed\/og\.png/);
  assert.match(html, /href="\/favicon\.svg"/);
  assert.doesNotMatch(visibleHtml, /密集地图|DENSE MAP WORKBENCH|BUSINESS STRUCTURE|结构与效率|补充指标|次级展示|原稿灰底|本章|07 CHAPTERS|人民币|自动轮播|继续轮播/);
  assert.doesNotMatch(html, /fusion-hero-strip|fusion-stage-controls|fusion-map-caption/);
  assert.doesNotMatch(html, /fusion-region-facts/);
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
  assert.match(shellSource, /useState<DashboardView>\("showcase"\)/);
  assert.doesNotMatch(shellSource, /DenseMapOverview|dense-map-overview|密集地图|"dense"/);
  const layoutSource = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(layoutSource, /dense-map-overview|高密度地图/);
  await assert.rejects(access(new URL("../app/dense-map-overview.tsx", import.meta.url)), { code: "ENOENT" });
  await assert.rejects(access(new URL("../app/dense-map-overview.css", import.meta.url)), { code: "ENOENT" });
  await access(new URL("../app/map-integrated-overview.css", import.meta.url));
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

test("map renders a source-backed city project-count cloud without claiming exact addresses", async () => {
  const mapSource = await readFile(new URL("../app/tech-map.tsx", import.meta.url), "utf8");
  assert.match(mapSource, /projectIndex < city\.count/);
  assert.match(mapSource, /role: "city-project-count-cloud"/);
  assert.match(mapSource, /preciseLocations: false/);
  assert.match(mapSource, /data-project-cloud-count/);
  assert.match(mapSource, /data-city-label-mode="all-with-collision-avoidance"/);
  assert.match(mapSource, /visual\.labelObject\.visible = citySelected \|\| inScope/);
  assert.match(mapSource, /is-national-view/);
  assert.match(mapSource, /labelOcclusionSelector/);
  assert.match(mapSource, /document\.querySelectorAll<HTMLElement>\(labelOcclusionSelector\)/);
  assert.match(mapSource, /data-label-occlusion/);
  assert.match(mapSource, /viewportOcclusionSelector/);
  assert.match(mapSource, /data-viewport-fit/);
  assert.match(mapSource, /const fittedWidth = viewportOcclusionSelector/);
  assert.match(mapSource, /style\.pointerEvents = overlaps \? "none" : "auto"/);
  assert.match(mapSource, /const nextViewOffsetX = resolveViewOffset\(width, height\)/);
  assert.match(mapSource, /setAttribute\("aria-pressed", citySelected \? "true" : "false"\)/);
  assert.match(mapSource, /scopedCityAdcodes\?: number\[\]/);
  assert.match(mapSource, /region\.selected = \(cityAdcode !== null \|\| !hasScopedCities\) && selected\.has\(region\.adcode\)/);
  assert.match(mapSource, /classList\.toggle\("is-in-scope", scopeSelected\)/);
  assert.match(mapSource, /pointerdown", stopMapPointer/);
  assert.match(mapSource, /pointerup", stopMapPointer/);
  assert.match(mapSource, /\? `\$\{city\.name\}，点击查看城市指标`/);
  assert.match(mapSource, /camera\.fov = THREE\.MathUtils\.clamp\(adaptiveFov, 30, 52\)/);
  assert.match(mapSource, /mount\.dataset\.renderState = "loading"/);
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
  assert.match(cockpitSource, /const PUBLIC_DISPLAY_DATE = "2025\.8\.6"/);
  assert.match(cockpitSource, /className="grand-header-actions"[\s\S]*?className="fusion-view-switch"/);
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
  assert.match(cockpitSource, /const activeCitySales = activeCity \? WENSHU_CITY_SALES_6283\[activeCity\.name\] : undefined/);
  assert.match(cockpitSource, /sales: activeCitySales\.contractSalesYi/);
  assert.match(cockpitSource, /monthlySales: activeCitySales\.monthlyContractSalesYi/);
  assert.match(cockpitSource, /const usesCitySales6283 = Boolean\(activeCity && activeCitySales\)/);
  assert.match(cockpitSource, /data-source-dataset=\{usesCitySales6283 \? "6283" : undefined\}/);
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
