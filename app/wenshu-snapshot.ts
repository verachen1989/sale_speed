export type WenshuOrganizationSnapshot = {
  code: string;
  name: string;
  adcodes: number[];
  sales: number;
  salesMomentum: number;
  monthlySales: number[];
  newValue: number;
  newValueGrowth: number;
  equityValue: number | null;
  investment: number;
  equityInvestment: number | null;
  newProjects: number;
  cashFlow: number;
  totalProjects: number;
  pendingProjects: number;
  constructionProjects: number;
  soilArea: number;
  constructionArea: number;
  sellingProjects: number;
};

export const WENSHU_SNAPSHOT_DATE = "2026.08.24";

// Local-only snapshot retrieved from Wenshu MCP. Runtime publishing is intentionally disabled.
// Sources: 10266 (actual cumulative contract sales), 6286 (monthly actual contract sales),
// 11110 (monthly daily-average momentum), 12022 (investment scale and YoY),
// 12115 (operating cash flow), and 3002 (project development status).
// Dataset 3002 area fields are returned in square metres and converted to 10k m² here.
export const WENSHU_ORGANIZATIONS: WenshuOrganizationSnapshot[] = [
  {
    code: "00000001", name: "绿城中国", adcodes: [],
    sales: 642.09, salesMomentum: -60,
    monthlySales: [57.78, 45.38, 119.19, 110.44, 112.42, 113.22, 38.54, 46.07],
    newValue: 637.44, newValueGrowth: -44.22, equityValue: 515.88,
    investment: 315.39, equityInvestment: 248.31, newProjects: 32,
    cashFlow: 102.06, totalProjects: 510, constructionProjects: 155,
    pendingProjects: 20,
    soilArea: 2055.4, constructionArea: 1448.8, sellingProjects: 184,
  },
  {
    code: "50127376", name: "浙江区域", adcodes: [330000],
    sales: 242.13, salesMomentum: -66.01,
    monthlySales: [24.83, 18.8, 51.67, 51.12, 36.31, 36.4, 10.98, 12.01],
    newValue: 320.55, newValueGrowth: -43.93, equityValue: 213.39,
    investment: 158.05, equityInvestment: 98.99, newProjects: 17,
    cashFlow: 32.6, totalProjects: 223, constructionProjects: 54,
    pendingProjects: 6,
    soilArea: 613.4, constructionArea: 566.9, sellingProjects: 50,
  },
  {
    code: "10002002", name: "华东区域", adcodes: [310000, 320000, 340000],
    sales: 188.34, salesMomentum: -41.46,
    monthlySales: [11.1, 8.58, 30.59, 27.39, 37.6, 39.94, 10.95, 22.19],
    newValue: 151.34, newValueGrowth: -56.82, equityValue: 136.94,
    investment: 75.98, equityInvestment: 67.96, newProjects: 6,
    cashFlow: 46.16, totalProjects: 66, constructionProjects: 23,
    pendingProjects: 3,
    soilArea: 475, constructionArea: 246, sellingProjects: 26,
  },
  {
    code: "10002006", name: "华北区域", adcodes: [110000, 120000, 130000],
    sales: 28.78, salesMomentum: -68.42,
    monthlySales: [3.76, 3.59, 3.87, 4.29, 5.72, 4.11, 1.93, 1.51],
    newValue: 46.84, newValueGrowth: 0, equityValue: 46.84,
    investment: 23.58, equityInvestment: 23.58, newProjects: 2,
    cashFlow: -0.73, totalProjects: 32, constructionProjects: 5,
    pendingProjects: 1,
    soilArea: 53, constructionArea: 24.1, sellingProjects: 10,
  },
  {
    code: "10002216", name: "华南区域", adcodes: [350000, 440000, 460000],
    sales: 44.96, salesMomentum: -70.27,
    monthlySales: [4.13, 2.47, 8.5, 7.84, 8.08, 8.72, 2.63, 3.53],
    newValue: 29.24, newValueGrowth: -32.34, equityValue: 29.24,
    investment: 16.86, equityInvestment: 16.86, newProjects: 1,
    cashFlow: 17.13, totalProjects: 17, constructionProjects: 9,
    pendingProjects: 1,
    soilArea: 107.2, constructionArea: 63.5, sellingProjects: 10,
  },
  {
    code: "50121142", name: "西北区域", adcodes: [610000, 620000, 630000, 640000, 650000],
    sales: 45.05, salesMomentum: -70.59,
    monthlySales: [4.52, 3.77, 7.94, 7.56, 8.58, 7.68, 2.8, 2.2],
    newValue: 10.91, newValueGrowth: -88.93, equityValue: 10.91,
    investment: 4.95, equityInvestment: 4.95, newProjects: 1,
    cashFlow: 12.63, totalProjects: 33, constructionProjects: 14,
    pendingProjects: 1,
    soilArea: 197.5, constructionArea: 154.4, sellingProjects: 18,
  },
  {
    code: "50052675", name: "华中公司", adcodes: [360000, 420000, 430000],
    sales: 33.18, salesMomentum: -78.57,
    monthlySales: [1.51, 1.3, 3.67, 3.59, 8.2, 8.82, 4.13, 1.96],
    newValue: 0, newValueGrowth: 0, equityValue: null,
    investment: 0, equityInvestment: null, newProjects: 0,
    cashFlow: 9.33, totalProjects: 18, constructionProjects: 10,
    pendingProjects: 0,
    soilArea: 99.2, constructionArea: 88.3, sellingProjects: 14,
  },
  {
    code: "10002007", name: "中原公司", adcodes: [370000, 410000],
    sales: 14.51, salesMomentum: -62.5,
    monthlySales: [1.85, 1.27, 3.47, 2.27, 2.29, 1.86, .71, .79],
    newValue: 29.9, newValueGrowth: 341.54, equityValue: 29.9,
    investment: 14.73, equityInvestment: 14.73, newProjects: 2,
    cashFlow: -6.65, totalProjects: 30, constructionProjects: 5,
    pendingProjects: 2,
    soilArea: 97.5, constructionArea: 75.8, sellingProjects: 10,
  },
  {
    code: "50203640", name: "成都公司", adcodes: [500000, 510000],
    sales: 3.84, salesMomentum: -100,
    monthlySales: [.23, .3, 1.47, .68, .58, .39, .15, .04],
    newValue: 13.81, newValueGrowth: 7.72, equityValue: 13.81,
    investment: 7.37, equityInvestment: 7.37, newProjects: 1,
    cashFlow: -2.57, totalProjects: 14, constructionProjects: 3,
    pendingProjects: 0,
    soilArea: 16, constructionArea: 16, sellingProjects: 5,
  },
  {
    code: "50121143", name: "东北公司", adcodes: [210000, 220000, 230000],
    sales: 10.4, salesMomentum: -75,
    monthlySales: [.63, .8, 1.71, 1.24, 1.57, 1.87, 1.94, .63],
    newValue: 34.85, newValueGrowth: 210.69, equityValue: 34.85,
    investment: 13.87, equityInvestment: 13.87, newProjects: 2,
    cashFlow: -.78, totalProjects: 20, constructionProjects: 9,
    pendingProjects: 2,
    soilArea: 131.4, constructionArea: 64.3, sellingProjects: 14,
  },
];
