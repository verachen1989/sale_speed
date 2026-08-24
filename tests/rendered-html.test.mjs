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
  assert.match(visibleHtml, /问数中国境内有效项目快照 2026\.08\.24/);
  assert.match(visibleHtml, /点击城市定位/);
  assert.match(visibleHtml, /年度经营指标/);
  assert.match(html, /https:\/\/dashboard\.example\/og\.png/);
  assert.doesNotMatch(visibleHtml, /补充指标|次级展示|原稿灰底/);
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
  await access(new URL("../app/map-integrated-overview.tsx", import.meta.url));
  await access(new URL("../app/map-integrated-overview.css", import.meta.url));
});

test("ships a project-local social preview asset", async () => {
  await access(new URL("../public/og.png", import.meta.url));
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /x-forwarded-host/);
  assert.match(layout, /summary_large_image/);
  assert.match(layout, /\/og\.png/);
  await access(projectRoot);
});
