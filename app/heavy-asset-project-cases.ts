export type HeavyAssetProjectCase = {
  id: string;
  projectRecordId: string;
  projectName: string;
  cityName: string;
  cityAdcode: number;
  highlight: string;
  locationPrecision: "city";
  sourcePdfPhysicalPages: readonly number[];
};

export type EngineeringSiteProject = {
  id: string;
  projectRecordId: string;
  projectName: string;
  cityName: string;
  cityAdcode: number;
  label: "工程现场";
  destination: "engineering-site";
  url: string;
  locationPrecision: "city";
};

const ENGINEERING_SITE_URL = "https://gc.gtcloud.cn/home.html#/project_bigscreen/homeIntelligentMonitorings/homeIntelligentMonitoring_ep?tenantId=5600007&orgId=327532140060992&orgType=PROJECT";
const YIWU_CHAOMING_HAISHANG_URL = "https://gc.gtcloud.cn/home.html#/project_bigscreen/homeIntelligentMonitorings/homeIntelligentMonitoring_ep?tenantId=5600007&orgId=314275759694016&orgType=PROJECT";

export const ENGINEERING_SITE_PROJECTS = [
  {
    id: "hangzhou-fengdan-rose-garden",
    projectRecordId: "P4098",
    projectName: "杭州枫丹玫瑰园",
    cityName: "杭州",
    cityAdcode: 330100,
    label: "工程现场",
    destination: "engineering-site",
    url: ENGINEERING_SITE_URL,
    locationPrecision: "city",
  },
  {
    id: "yiwu-chaoming-haishang",
    projectRecordId: "P4097",
    projectName: "义乌海上潮鸣",
    cityName: "金华",
    cityAdcode: 330700,
    label: "工程现场",
    destination: "engineering-site",
    url: YIWU_CHAOMING_HAISHANG_URL,
    locationPrecision: "city",
  },
] as const satisfies readonly EngineeringSiteProject[];

// These cases are attached to the existing city anchors. The source material
// does not provide coordinates suitable for project-level map positioning.
export const HEAVY_ASSET_PROJECT_CASES = [
  {
    id: "shanghai-chaoming-bund",
    projectRecordId: "P4082",
    projectName: "上海潮鸣外滩",
    cityName: "上海",
    cityAdcode: 310100,
    highlight: "销售45.4亿·均价17.0万/㎡",
    locationPrecision: "city",
    sourcePdfPhysicalPages: [10, 29],
  },
  {
    id: "suzhou-rose-garden-phase-2",
    projectRecordId: "P4080",
    projectName: "苏州玫瑰园二期",
    cityName: "苏州",
    cityAdcode: 320500,
    highlight: "网签28.4亿·江苏 Top 1",
    locationPrecision: "city",
    sourcePdfPhysicalPages: [6, 29],
  },
  {
    id: "beijing-langyue-hefeng",
    projectRecordId: "P4115",
    projectName: "北京朗月和风",
    cityName: "北京",
    cityAdcode: 110100,
    highlight: "拿地当天方案公示",
    locationPrecision: "city",
    sourcePdfPhysicalPages: [11, 17, 31],
  },
] as const satisfies readonly HeavyAssetProjectCase[];
