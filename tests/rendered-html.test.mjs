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

test("server-renders the dense map workbench without exposing priority labels", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const visibleHtml = html.replaceAll("<!-- -->", "");
  assert.match(html, /<title>绿城中国经营工作台<\/title>/);
  assert.match(html, /DENSE MAP WORKBENCH/);
  assert.match(html, /绿城中国经营工作台/);
  assert.match(html, /密集地图/);
  assert.match(html, /融合地图/);
  assert.match(html, /项目驾驶舱/);
  assert.match(html, /三维经营地图/);
  assert.match(html, /总合同销售金额/);
  assert.match(html, /2,519/);
  assert.match(html, /新拓项目转化率/);
  assert.match(html, /新增规模/);
  assert.match(html, /投资质量/);
  assert.match(html, /城市结构/);
  assert.match(html, /data-group-id="investment"/);
  assert.match(html, /data-metric-count="8"/);
  assert.match(html, /data-metric-id="investment-equity"/);
  assert.match(html, /data-priority="supporting"/);
  assert.match(html, /data-project-cloud-count="488"/);
  assert.match(html, /data-city-anchor-count="55"/);
  assert.match(html, /PROJECT SCALE CLOUD/);
  assert.match(html, /488 个境内有效项目/);
  assert.match(html, /is-feature/);
  assert.match(html, /is-progress/);
  assert.match(html, /is-ledger/);
  assert.match(visibleHtml, /2026\.08\.24 · 项目规模点簇/);
  assert.match(visibleHtml, /点击城市定位/);
  assert.match(html, /投资拿地年度指标/);
  assert.match(html, /https:\/\/dashboard\.example\/og\.png/);
  assert.doesNotMatch(visibleHtml, /补充指标|次级展示|原稿灰底|本章|07 CHAPTERS|人民币/);
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

test("dense workbench sections cover every metric exactly once and preserve concept A", async () => {
  const annualSource = await readFile(new URL("../app/annual-metrics.ts", import.meta.url), "utf8");
  const denseSource = await readFile(new URL("../app/dense-map-overview.tsx", import.meta.url), "utf8");
  const annualGroupSource = annualSource.slice(
    annualSource.indexOf("export const ANNUAL_METRIC_GROUPS"),
    annualSource.indexOf("export const ANNUAL_METRIC_TOTALS"),
  );
  const annualMetricIds = [...annualGroupSource.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)]
    .map((match) => match[1])
    .filter((id) => id.includes("-"))
    .sort();
  const sectionSource = denseSource.slice(
    denseSource.indexOf("const DENSE_METRIC_SECTIONS"),
    denseSource.indexOf("function DenseMetric"),
  );
  const denseMetricIds = [...sectionSource.matchAll(/"((?:investment|construction|delivery|sales|holding|special|reserve)-[a-z0-9-]+)"/g)]
    .map((match) => match[1])
    .sort();

  assert.equal(denseMetricIds.length, 56);
  assert.equal(new Set(denseMetricIds).size, 56);
  assert.deepEqual(denseMetricIds, annualMetricIds);
  assert.doesNotMatch(denseSource, /补充指标|次级展示|原稿灰底/);
  const integratedSource = await readFile(new URL("../app/map-integrated-overview.tsx", import.meta.url), "utf8");
  assert.match(integratedSource, /fusion-combined-panel/);
  assert.doesNotMatch(integratedSource, /className="fusion-stage-panel"|className="fusion-metric-panel"|本章指标/);
  await access(new URL("../app/map-integrated-overview.css", import.meta.url));
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
  assert.match(mapSource, /document\.querySelector<HTMLElement>\(labelOcclusionSelector\)/);
  assert.match(mapSource, /data-label-occlusion/);
  assert.match(mapSource, /style\.pointerEvents = overlaps \? "none" : "auto"/);
  assert.match(mapSource, /const nextViewOffsetX = resolveViewOffset\(width, height\)/);
  assert.match(mapSource, /setAttribute\("aria-pressed", citySelected \? "true" : "false"\)/);
  assert.match(mapSource, /camera\.fov = THREE\.MathUtils\.clamp\(adaptiveFov, 30, 52\)/);
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
  assert.match(cockpitSource, /grand-city-index-trigger/);
  assert.match(cockpitSource, /grand-city-index-panel/);
  assert.match(cockpitSource, /nationwideCityOptions\.map/);
  assert.match(cockpitSource, /城市导航/);
  assert.doesNotMatch(cockpitSource, /<input\b/);
  assert.match(cockpitSource, /data-city-adcode=\{city\.cityAdcode\}/);
  assert.match(cockpitSource, /activeProvinceCities\.map/);
  assert.match(cockpitSource, /const usesActualInvestment = queryMode === "organization"/);
  assert.match(cockpitSource, /data-data-status=\{usesActualInvestment \? "actual" : "unavailable"\}/);
  assert.match(cockpitSource, /境内有效 \$\{scopedProjectRows\.length\} 个参与定位/);
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
  assert.match(layout, /x-forwarded-host/);
  assert.match(layout, /summary_large_image/);
  assert.match(layout, /\/og\.png/);
  await access(projectRoot);
});
