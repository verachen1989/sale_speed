import { sites } from "@openai/sites-vite-plugin";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { fetchWithTimeout } from "./scripts/dashboard-request.mjs";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

type McpToolResult = {
  isError?: boolean;
  content?: Array<{ type?: string; text?: string }>;
  structuredContent?: Record<string, unknown>;
};

class RequestValidationError extends Error {}

const datasetDatasourceCache = new Map<string, Promise<string>>();

function datasetServiceUrl() {
  const config = readFileSync(join(homedir(), ".codex", "config.toml"), "utf8");
  const block = config.match(/\[mcp_servers\.dataset-service\]([\s\S]*?)(?=\n\[|$)/)?.[1];
  const rawUrl = block?.match(/url\s*=\s*"([^"]+)"/)?.[1];
  if (!rawUrl) throw new Error("未找到本机 dataset-service 配置");

  const url = new URL(rawUrl);
  const userId = process.env.MATRIX_USER_ID || url.searchParams.get("userId") || "15015794";
  url.searchParams.set("userId", userId);
  return { url: url.toString(), userId };
}

async function callDatasetTool(
  service: ReturnType<typeof datasetServiceUrl>,
  name: string,
  args: Record<string, unknown>,
) {
  const response = await fetchWithTimeout(service.url, {
    timeoutMs: 15_000,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      userId: service.userId,
      "X-User-Id": service.userId,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  if (!response.ok) throw new Error(`数据服务返回 ${response.status}`);

  const raw = await response.text();
  const envelopes = raw
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data: "))
    .map((line) => JSON.parse(line.slice(6)) as { error?: unknown; result?: McpToolResult });
  const envelope = envelopes.at(-1);
  if (!envelope || envelope.error || envelope.result?.isError) {
    throw new Error("数据服务未返回有效结果");
  }
  return envelope.result ?? {};
}

function latestCompletedDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const todayUtc = Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day));
  return new Date(todayUtc - 86_400_000).toISOString().slice(0, 10);
}

function currentShanghaiDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function datasetRows(result: McpToolResult) {
  const rows = result.structuredContent?.data;
  if (!Array.isArray(rows)) throw new Error("数据集未返回明细行");
  return rows as Array<Record<string, unknown>>;
}

function singleDatasetRow(result: McpToolResult, datasetCode: string) {
  const rows = datasetRows(result);
  if (rows.length !== 1) throw new Error(`数据集 ${datasetCode} 返回 ${rows.length} 行，聚合粒度异常`);
  return rows[0];
}

function requiredNumericField(row: Record<string, unknown>, field: string) {
  const rawValue = row[field];
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    throw new Error(`数据集字段 ${field} 缺失`);
  }
  const value = Number(rawValue);
  if (!Number.isFinite(value)) throw new Error(`数据集字段 ${field} 不是有效数值`);
  return value;
}

function nullableNumericField(row: Record<string, unknown>, field: string) {
  const rawValue = row[field];
  if (rawValue === null || rawValue === undefined || rawValue === "") return null;
  const value = Number(rawValue);
  if (!Number.isFinite(value)) throw new Error(`数据集字段 ${field} 不是有效数值`);
  return value;
}

type InvestmentCityLevel = "FirstTierCity" | "NewFirstTierCity" | "SecondTierCity" | "OtherCity";

const ALLOWED_INVESTMENT_CITY_LEVELS = new Set<InvestmentCityLevel>([
  "FirstTierCity",
  "NewFirstTierCity",
  "SecondTierCity",
  "OtherCity",
]);
const TIER12_INVESTMENT_CITY_LEVELS = new Set<InvestmentCityLevel>([
  "FirstTierCity",
  "NewFirstTierCity",
  "SecondTierCity",
]);

function aggregateTier12NewValue(result: McpToolResult, headlineNewValueYi: number) {
  const rows = datasetRows(result);
  const totalRows = rows.filter((row) => String(row.projectCode ?? "") === "-");
  const detailRows = rows.filter((row) => String(row.projectCode ?? "") !== "-");
  if (totalRows.length !== 1) throw new Error("数据集 12051 合计行异常");

  const projectCodes = new Set<string>();
  let detailTotalYi = 0;
  let tier12ValueYi = 0;
  for (const row of detailRows) {
    const projectCode = String(row.projectCode ?? "");
    const cityLevel = String(row.city_level ?? "") as InvestmentCityLevel;
    const newValueYi = requiredNumericField(row, "addValueAmount");
    if (!projectCode || projectCodes.has(projectCode)) throw new Error("数据集 12051 项目编码缺失或重复");
    if (!ALLOWED_INVESTMENT_CITY_LEVELS.has(cityLevel)) throw new Error("数据集 12051 城市能级缺失或出现新枚举");
    if (newValueYi < 0) throw new Error("数据集 12051 新增货值不能为负数");
    projectCodes.add(projectCode);
    detailTotalYi += newValueYi;
    if (TIER12_INVESTMENT_CITY_LEVELS.has(cityLevel)) tier12ValueYi += newValueYi;
  }

  const datasetTotalYi = requiredNumericField(totalRows[0], "addValueAmount");
  const toleranceYi = 0.05;
  if (
    Math.abs(detailTotalYi - datasetTotalYi) > toleranceYi
    || Math.abs(datasetTotalYi - headlineNewValueYi) > toleranceYi
  ) {
    throw new Error("数据集 12051 与 10802 新增货值不一致");
  }

  return {
    valueYi: tier12ValueYi,
    sharePct: datasetTotalYi === 0 ? null : (tier12ValueYi / datasetTotalYi) * 100,
  };
}

function validateDashboardDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RequestValidationError("数据日期格式不正确");
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new RequestValidationError("数据日期不是有效日历日期");
  }
  if (value > currentShanghaiDate()) throw new RequestValidationError("数据日期不能晚于今天");
}

async function getDatasetDatasource(
  service: ReturnType<typeof datasetServiceUrl>,
  datasetCode: string,
) {
  const cacheKey = `${service.url}::${datasetCode}`;
  const cached = datasetDatasourceCache.get(cacheKey);
  if (cached) return cached;

  const pending = callDatasetTool(service, "get_dataset_by_code", {
    datasetCode,
    needSql: false,
  }).then((definition) => {
    const datasourceCode = (definition.structuredContent?.dataset as { datasourceCode?: string } | undefined)?.datasourceCode;
    if (!datasourceCode) throw new Error(`${datasetCode} 数据集定义缺少数据源`);
    return datasourceCode;
  }).catch((error) => {
    datasetDatasourceCache.delete(cacheKey);
    throw error;
  });
  datasetDatasourceCache.set(cacheKey, pending);
  return pending;
}

function localLatestSalesPlugin() {
  return {
    name: "local-latest-sales",
    configureServer(server: { middlewares: { use: (handler: (req: { method?: string; url?: string }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void }, next: () => void) => void) => void } }) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
        if (requestUrl.pathname === "/api/operating-overview") {
          if (req.method && req.method !== "GET") {
            res.statusCode = 405;
            res.end("Method Not Allowed");
            return;
          }

          try {
            const orgUnitCode = requestUrl.searchParams.get("orgUnitCode") || "00000001";
            const asOfDate = requestUrl.searchParams.get("date") || currentShanghaiDate();
            if (!/^\d{8}$/.test(orgUnitCode)) throw new RequestValidationError("组织编码格式不正确");
            validateDashboardDate(asOfDate);

            const service = datasetServiceUrl();
            const [investmentDatasource, salesDatasource, tier12Datasource] = await Promise.all([
              getDatasetDatasource(service, "10802"),
              getDatasetDatasource(service, "10266"),
              getDatasetDatasource(service, "12051").catch(() => null),
            ]);

            const [investmentQuery, salesQuery, tier12Query] = await Promise.all([
              callDatasetTool(service, "query_dataset_data", {
                datasetCode: "10802",
                datasourceCode: investmentDatasource,
                params: {
                  date: asOfDate,
                  region: orgUnitCode,
                  startGainDate: `${asOfDate.slice(0, 4)}-01-01`,
                },
              }),
              callDatasetTool(service, "query_dataset_data", {
                datasetCode: "10266",
                datasourceCode: salesDatasource,
                params: { date: asOfDate, region: orgUnitCode },
              }),
              tier12Datasource
                ? callDatasetTool(service, "query_dataset_data", {
                    datasetCode: "12051",
                    datasourceCode: tier12Datasource,
                    params: {
                      region: orgUnitCode,
                      date: asOfDate,
                      startGainDate: `${asOfDate.slice(0, 4)}-01-01`,
                    },
                  }).catch(() => null)
                : Promise.resolve(null),
            ]);
            const investmentRow = singleDatasetRow(investmentQuery, "10802");
            const salesRow = singleDatasetRow(salesQuery, "10266");
            const ytdNewValueYi = nullableNumericField(investmentRow, "investmentValue");
            const tier12Aggregation = tier12Query && ytdNewValueYi !== null
              ? (() => {
                  try {
                    return aggregateTier12NewValue(tier12Query, ytdNewValueYi);
                  } catch {
                    return { valueYi: null, sharePct: null };
                  }
                })()
              : { valueYi: null, sharePct: null };

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Cache-Control", "no-store, max-age=0");
            res.end(JSON.stringify({
              orgUnitCode,
              asOfDate,
              periodStartDate: `${asOfDate.slice(0, 4)}-01-01`,
              datasetCodes: ["10802", "10266", "12051"],
              scope: "经营组织年初至今实际",
              ytdCumulativeContractSalesYi: requiredNumericField(salesRow, "accumCompValue"),
              ytdNewProjectCount: requiredNumericField(investmentRow, "numberOfItems"),
              ytdNewValueYi,
              ytdInvestmentYi: nullableNumericField(investmentRow, "investment"),
              ytdNewProjectTotalBuildingAreaWan: (() => {
                const value = nullableNumericField(investmentRow, "total_construction_area");
                return value === null ? null : value / 10_000;
              })(),
              ytdTier12NewValueSharePct: tier12Aggregation.sharePct,
              ytdTier12NewValueYi: tier12Aggregation.valueYi,
            }));
          } catch (error) {
            res.statusCode = error instanceof RequestValidationError ? 400 : 502;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Cache-Control", "no-store, max-age=0");
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : "经营指挥概览数据查询失败" }));
          }
          return;
        }

        if (requestUrl.pathname !== "/api/latest-sales") return next();
        if (req.method && req.method !== "GET") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }

        try {
          const orgUnitCode = requestUrl.searchParams.get("orgUnitCode") || "00000001";
          const cityName = requestUrl.searchParams.get("cityName") || "";
          if (!/^\d{8}$/.test(orgUnitCode)) throw new Error("组织编码格式不正确");

          const asOfDate = latestCompletedDate();
          const statYear = asOfDate.slice(0, 4);
          const currentMonth = Number(asOfDate.slice(5, 7));
          const currentDayCount = Number(asOfDate.slice(8, 10));
          const service = datasetServiceUrl();
          const datasourceCode = await getDatasetDatasource(service, "6286");

          const query = await callDatasetTool(service, "query_dataset_data", {
            datasetCode: "6286",
            datasourceCode,
            params: {
              orgUnitCode,
              gainYear: "",
              cityName,
              salestatusname: "",
              bizType1Code: "",
              startDate: `${statYear}-01-01`,
              endDate: asOfDate,
            },
          });
          const rows = (query.structuredContent?.data ?? []) as Array<{
            labelMonth?: string;
            contractTotalPrice?: number | string | null;
          }>;
          const monthlyContractSalesYi = Array.from({ length: currentMonth }, () => 0);
          for (const row of rows) {
            const month = Number(row.labelMonth?.slice(5, 7));
            if (month >= 1 && month <= currentMonth) {
              monthlyContractSalesYi[month - 1] = Number(row.contractTotalPrice ?? 0) / 100_000_000;
            }
          }

          const cumulativeContractSalesYi = monthlyContractSalesYi.reduce((sum, value) => sum + value, 0);
          const currentMonthSalesYi = monthlyContractSalesYi[currentMonth - 1] ?? 0;
          const previousMonthSalesYi = monthlyContractSalesYi[currentMonth - 2] ?? 0;
          const previousMonthDayCount = new Date(Date.UTC(Number(statYear), currentMonth - 1, 0)).getUTCDate();
          const currentMonthDailyAverageYi = currentDayCount > 0 ? currentMonthSalesYi / currentDayCount : 0;
          const previousMonthDailyAverageYi = previousMonthDayCount > 0
            ? previousMonthSalesYi / previousMonthDayCount
            : 0;
          const dailyAverageGrowthPct = previousMonthDailyAverageYi === 0
            ? null
            : (currentMonthDailyAverageYi / previousMonthDailyAverageYi - 1) * 100;

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store, max-age=0");
          res.end(JSON.stringify({
            orgUnitCode,
            cityName,
            asOfDate,
            statYear,
            datasetCode: "6286",
            scope: "全业态实际合同",
            cumulativeContractSalesYi,
            monthlyContractSalesYi,
            currentMonthDailyAverageYi,
            previousMonthDailyAverageYi,
            dailyAverageGrowthPct,
          }));
        } catch (error) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store, max-age=0");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "最新销售数据查询失败" }));
        }
      });
    },
  };
}

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      localLatestSalesPlugin(),
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
