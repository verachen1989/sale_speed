import assert from "node:assert/strict";

const requestedUrl = process.argv[2];
if (!requestedUrl) {
  throw new Error("Usage: npm run verify:pages -- <http-or-https-url>");
}

const pageUrl = new URL(requestedUrl);
if (!pageUrl.pathname.endsWith("/")) pageUrl.pathname += "/";
const basePath = pageUrl.pathname.replace(/\/$/, "");
const failures = [];
const checked = new Map();

async function fetchChecked(url, label) {
  const key = url.href;
  if (checked.has(key)) return checked.get(key);
  const response = await fetch(url, {
    headers: {
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
    redirect: "follow",
  });
  const result = {
    label,
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    body: response,
  };
  checked.set(key, result);
  if (!response.ok) failures.push(`${label}: ${url.href} returned ${response.status}`);
  return result;
}

function extractHtmlAssetUrls(html) {
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
}

function extractCssAssetUrls(css) {
  return [...css.matchAll(/url\((?:"|')?([^"')]+)(?:"|')?\)/g)].map((match) => match[1]);
}

function sameSiteAsset(value, parentUrl) {
  if (!value || value.startsWith("data:") || value.startsWith("blob:")) return null;
  const url = new URL(value, parentUrl);
  if (url.origin !== pageUrl.origin) return null;
  if (!url.pathname.startsWith(`${basePath}/`)) {
    failures.push(`Out-of-base-path asset: ${url.href}`);
    return null;
  }
  return url;
}

const pageResult = await fetchChecked(pageUrl, "homepage");
const html = await pageResult.body.text();
assert.match(pageResult.contentType, /^text\/html\b/i);
assert.match(html, /<title>绿城中国经营工作台<\/title>/);
assert.match(html, /MAP INTEGRATED VIEW/);
assert.doesNotMatch(html.replaceAll("<!-- -->", ""), /密集地图/);
assert.match(html, /https:\/\/verachen1989\.github\.io\/sale_speed\/og\.png/);

const htmlAssets = [...new Set(extractHtmlAssetUrls(html))]
  .map((value) => sameSiteAsset(value, pageUrl))
  .filter(Boolean);
const htmlAssetResults = await Promise.all(
  htmlAssets.map((url) => fetchChecked(url, `HTML asset ${url.pathname}`)),
);

const cssResults = htmlAssetResults.filter((result) => /^text\/css\b/i.test(result.contentType));
for (const cssResult of cssResults) {
  const css = await cssResult.body.text();
  const cssAssets = [...new Set(extractCssAssetUrls(css))]
    .map((value) => sameSiteAsset(value, pageUrl))
    .filter(Boolean);
  await Promise.all(cssAssets.map((url) => fetchChecked(url, `CSS asset ${url.pathname}`)));
}

const criticalPaths = [
  "favicon.svg",
  "greentown-logo-header.png",
  "china-geo.json",
  "og.png",
  "dashboard-bg.png",
  "dashboard-bg-cityscape.png",
  "dashboard-bg-future.png",
];
await Promise.all(
  criticalPaths.map((pathname) => fetchChecked(new URL(pathname, pageUrl), `critical ${pathname}`)),
);

const geoResult = checked.get(new URL("china-geo.json", pageUrl).href);
const geo = await geoResult.body.json();
assert.ok(Array.isArray(geo.features) && geo.features.length > 0, "china-geo.json must contain map features");

if (failures.length > 0) throw new Error(`Resource verification failed:\n${failures.join("\n")}`);

console.log(JSON.stringify({
  pageUrl: pageUrl.href,
  homepageStatus: pageResult.status,
  checkedResources: checked.size,
  cssFiles: cssResults.length,
  mapFeatures: geo.features.length,
  failures: failures.length,
}, null, 2));
