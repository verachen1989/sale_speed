import assert from "node:assert/strict";
import { access, copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const clientDir = path.join(projectRoot, "dist", "client");
const serverEntry = path.join(projectRoot, "dist", "server", "index.js");
const publicDir = path.join(projectRoot, "public");
const basePath = "/sale_speed";
const siteUrl = "https://verachen1989.github.io/sale_speed/";
const artifactDir = path.join(clientDir, "sale_speed");
const publicCssAssets = [
  "dashboard-bg.png",
  "dashboard-bg-cityscape.png",
  "dashboard-bg-future.png",
];

await Promise.all([access(serverEntry), access(artifactDir), access(publicDir)]);

const workerUrl = pathToFileURL(serverEntry);
workerUrl.searchParams.set("pages-build", `${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const executionContext = {
  waitUntil() {},
  passThroughOnException() {},
};
const env = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};
const requestHeaders = {
  accept: "text/html",
  host: "verachen1989.github.io",
  "x-forwarded-host": "verachen1989.github.io",
  "x-forwarded-proto": "https",
};

const response = await worker.fetch(
  new Request(siteUrl, { headers: requestHeaders }),
  env,
  executionContext,
);
assert.equal(response.status, 200, `Expected rendered homepage status 200, got ${response.status}`);
assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

const html = await response.text();
assert.match(html, /<title>绿城中国经营工作台<\/title>/);
assert.match(html, /MAP INTEGRATED VIEW/);
assert.match(html, /https:\/\/verachen1989\.github\.io\/sale_speed\/og\.png/);
assert.match(html, /(?:src|href)="\/sale_speed\/_next\//);
assert.match(html, /src="\/sale_speed\/greentown-logo-header\.png"/);
assert.doesNotMatch(html, /(?:src|href)="\/(?!sale_speed\/)/);

await cp(publicDir, artifactDir, { recursive: true, force: true });
await writeFile(path.join(artifactDir, "index.html"), html, "utf8");
await writeFile(path.join(artifactDir, ".nojekyll"), "", "utf8");

const source404 = path.join(clientDir, "404.html");
try {
  await copyFile(source404, path.join(artifactDir, "404.html"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const cssDir = path.join(artifactDir, "_next", "static", "css");
const cssEntries = await import("node:fs/promises").then(({ readdir }) => readdir(cssDir));
for (const cssEntry of cssEntries.filter((entry) => entry.endsWith(".css"))) {
  const cssPath = path.join(cssDir, cssEntry);
  let css = await readFile(cssPath, "utf8");
  for (const asset of publicCssAssets) {
    css = css.replaceAll(`${basePath}/_next/static/${asset}`, `${basePath}/${asset}`);
  }
  await writeFile(cssPath, css, "utf8");
}

const staticDir = path.join(artifactDir, "_next", "static");
await mkdir(staticDir, { recursive: true });
for (const asset of publicCssAssets) {
  const cssFiles = await Promise.all(
    cssEntries
      .filter((entry) => entry.endsWith(".css"))
      .map((entry) => readFile(path.join(cssDir, entry), "utf8")),
  );
  assert.ok(cssFiles.some((css) => css.includes(`${basePath}/${asset}`)), `${asset} must be referenced from built CSS`);
  assert.ok(cssFiles.every((css) => !css.includes(`${basePath}/_next/static/${asset}`)), `${asset} must not keep the broken vinext public path`);
  await access(path.join(artifactDir, asset));
}

const chunkDir = path.join(artifactDir, "_next", "static", "chunks");
const chunkEntries = await import("node:fs/promises").then(({ readdir }) => readdir(chunkDir));
const chunkSources = await Promise.all(
  chunkEntries
    .filter((entry) => entry.endsWith(".js"))
    .map((entry) => readFile(path.join(chunkDir, entry), "utf8")),
);
const mapChunk = chunkSources.find((source) => source.includes("china-geo.json"));
assert.ok(mapChunk, "A client chunk must load china-geo.json");
assert.ok(
  chunkSources.some((source) => source.includes(basePath)),
  "A client chunk must provide the GitHub Pages base path used by publicAssetPath",
);
assert.match(
  mapChunk,
  /fetch\([A-Za-z_$][\w$]*\(["'`]\/china-geo\.json["'`]\)\)/,
  "The map client chunk must resolve china-geo.json through publicAssetPath",
);
assert.doesNotMatch(mapChunk, /fetch\(["'`]\/china-geo\.json/);
assert.ok(chunkSources.some((source) => source.includes("2025.8.6")), "Project cockpit display date must remain in the client bundle");

await Promise.all([
  access(path.join(artifactDir, "index.html")),
  access(path.join(artifactDir, "china-geo.json")),
  access(path.join(artifactDir, "greentown-logo-header.png")),
  access(path.join(artifactDir, "og.png")),
  access(path.join(artifactDir, "_next", "static", "css")),
  access(path.join(artifactDir, "_next", "static", "chunks")),
]);

console.log(JSON.stringify({
  artifactDir,
  basePath,
  siteUrl,
  htmlBytes: Buffer.byteLength(html),
  cssFiles: cssEntries.filter((entry) => entry.endsWith(".css")).length,
  chunkFiles: chunkEntries.filter((entry) => entry.endsWith(".js")).length,
}, null, 2));
