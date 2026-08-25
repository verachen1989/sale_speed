export type WenshuOrganizationCityDevelopmentSnapshot = {
  name: string;
  totalProjects: number;
  soilAreaM2: number;
  constructionProjects: number;
  constructionAreaM2: number;
  pendingProjects: number;
  pendingAreaM2: number;
};

export type WenshuOrganizationDevelopmentSnapshot = {
  totalProjects: number;
  soilAreaM2: number;
  constructionProjects: number;
  constructionAreaM2: number;
  pendingProjects: number;
  pendingAreaM2: number;
  cities: readonly WenshuOrganizationCityDevelopmentSnapshot[];
};

export const WENSHU_ORGANIZATION_DEVELOPMENT_SNAPSHOT_DATE = "2026.08.25";

// Local-only snapshot from Dataset 3002.
// statisType=0/queryType=0 provides organization totals; statisType=1/queryType=1
// provides the exact cities managed by each operating organization.
export const WENSHU_ORGANIZATION_DEVELOPMENT_3002: Record<string, WenshuOrganizationDevelopmentSnapshot> = {
  "00000005": {
    totalProjects: 43, soilAreaM2: 2385046.39,
    constructionProjects: 20, constructionAreaM2: 1450457.83,
    pendingProjects: 0, pendingAreaM2: 934588.56,
    cities: [
      { name: "杭州", totalProjects: 11, soilAreaM2: 110169.14, constructionProjects: 2, constructionAreaM2: 110169.14, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "嘉兴", totalProjects: 2, soilAreaM2: 204300.76, constructionProjects: 1, constructionAreaM2: 204300.76, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "湖州", totalProjects: 6, soilAreaM2: 175722.43, constructionProjects: 3, constructionAreaM2: 144989.43, pendingProjects: 0, pendingAreaM2: 30733 },
      { name: "绍兴", totalProjects: 2, soilAreaM2: 137619.61, constructionProjects: 2, constructionAreaM2: 105636.32, pendingProjects: 0, pendingAreaM2: 31983.29 },
      { name: "舟山", totalProjects: 11, soilAreaM2: 642371.36, constructionProjects: 5, constructionAreaM2: 300535.56, pendingProjects: 0, pendingAreaM2: 341835.8 },
      { name: "合肥", totalProjects: 1, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "衢州", totalProjects: 1, soilAreaM2: 141076.43, constructionProjects: 1, constructionAreaM2: 141076.43, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "南昌", totalProjects: 1, soilAreaM2: 471489.69, constructionProjects: 1, constructionAreaM2: 337413.74, pendingProjects: 0, pendingAreaM2: 134075.95 },
      { name: "苏州", totalProjects: 1, soilAreaM2: 89914.28, constructionProjects: 1, constructionAreaM2: 89914.28, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "海南省直辖", totalProjects: 2, soilAreaM2: 157034.6, constructionProjects: 2, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 157034.6 },
      { name: "开封", totalProjects: 1, soilAreaM2: 94466.26, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 94466.26 },
      { name: "鹰潭", totalProjects: 1, soilAreaM2: 54386.27, constructionProjects: 1, constructionAreaM2: 3070.17, pendingProjects: 0, pendingAreaM2: 51316.1 },
      { name: "马鞍山", totalProjects: 1, soilAreaM2: 106495.56, constructionProjects: 1, constructionAreaM2: 13352, pendingProjects: 0, pendingAreaM2: 93143.56 },
      { name: "台州", totalProjects: 1, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "陵水黎族自治县", totalProjects: 1, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
    ],
  },
  "50127376": {
    totalProjects: 223, soilAreaM2: 6149250.84,
    constructionProjects: 55, constructionAreaM2: 5684080.85,
    pendingProjects: 5, pendingAreaM2: 465169.99,
    cities: [
      { name: "绍兴", totalProjects: 4, soilAreaM2: 23322.99, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 1, pendingAreaM2: 23322.99 },
      { name: "金华", totalProjects: 14, soilAreaM2: 331759.17, constructionProjects: 5, constructionAreaM2: 331759.17, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "杭州", totalProjects: 107, soilAreaM2: 3335496.19, constructionProjects: 29, constructionAreaM2: 3137015.52, pendingProjects: 2, pendingAreaM2: 198480.67 },
      { name: "宁波", totalProjects: 50, soilAreaM2: 1052040.19, constructionProjects: 9, constructionAreaM2: 992396.19, pendingProjects: 0, pendingAreaM2: 59644 },
      { name: "嘉兴", totalProjects: 9, soilAreaM2: 415648.8, constructionProjects: 5, constructionAreaM2: 415648.8, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "台州", totalProjects: 10, soilAreaM2: 290841.56, constructionProjects: 4, constructionAreaM2: 239474.87, pendingProjects: 0, pendingAreaM2: 51366.69 },
      { name: "温州", totalProjects: 8, soilAreaM2: 438361.17, constructionProjects: 1, constructionAreaM2: 386038.17, pendingProjects: 1, pendingAreaM2: 52323 },
      { name: "衢州", totalProjects: 4, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "福州", totalProjects: 7, soilAreaM2: 80032.64, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 1, pendingAreaM2: 80032.64 },
      { name: "合肥", totalProjects: 7, soilAreaM2: 181748.13, constructionProjects: 2, constructionAreaM2: 181748.13, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "湖州", totalProjects: 2, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "丽水", totalProjects: 1, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
    ],
  },
  "10002002": {
    totalProjects: 66, soilAreaM2: 4749688.71,
    constructionProjects: 23, constructionAreaM2: 2460488.81,
    pendingProjects: 3, pendingAreaM2: 2289199.9,
    cities: [
      { name: "徐州", totalProjects: 6, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "上海", totalProjects: 16, soilAreaM2: 762290.88, constructionProjects: 8, constructionAreaM2: 502332.95, pendingProjects: 2, pendingAreaM2: 259957.93 },
      { name: "苏州", totalProjects: 14, soilAreaM2: 470412.18, constructionProjects: 3, constructionAreaM2: 441424.58, pendingProjects: 1, pendingAreaM2: 28987.6 },
      { name: "南通", totalProjects: 10, soilAreaM2: 1770403.61, constructionProjects: 3, constructionAreaM2: 454901.26, pendingProjects: 0, pendingAreaM2: 1315502.35 },
      { name: "南京", totalProjects: 6, soilAreaM2: 357074.57, constructionProjects: 5, constructionAreaM2: 357074.57, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "泰州", totalProjects: 2, soilAreaM2: 314041.6, constructionProjects: 2, constructionAreaM2: 166710.29, pendingProjects: 0, pendingAreaM2: 147331.31 },
      { name: "宿迁", totalProjects: 1, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "盐城", totalProjects: 2, soilAreaM2: 981635.49, constructionProjects: 1, constructionAreaM2: 444214.78, pendingProjects: 0, pendingAreaM2: 537420.71 },
      { name: "扬州", totalProjects: 4, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "无锡", totalProjects: 4, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "常州", totalProjects: 1, soilAreaM2: 93830.38, constructionProjects: 1, constructionAreaM2: 93830.38, pendingProjects: 0, pendingAreaM2: 0 },
    ],
  },
  "10002006": {
    totalProjects: 32, soilAreaM2: 530022.93,
    constructionProjects: 5, constructionAreaM2: 241006.37,
    pendingProjects: 1, pendingAreaM2: 289016.56,
    cities: [
      { name: "天津", totalProjects: 13, soilAreaM2: 257894.5, constructionProjects: 3, constructionAreaM2: 65109.94, pendingProjects: 0, pendingAreaM2: 192784.56 },
      { name: "北京", totalProjects: 18, soilAreaM2: 272128.43, constructionProjects: 2, constructionAreaM2: 175896.43, pendingProjects: 1, pendingAreaM2: 96232 },
      { name: "石家庄", totalProjects: 1, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
    ],
  },
  "10002216": {
    totalProjects: 17, soilAreaM2: 1072100.01,
    constructionProjects: 9, constructionAreaM2: 635110.26,
    pendingProjects: 1, pendingAreaM2: 436989.75,
    cities: [
      { name: "广州", totalProjects: 10, soilAreaM2: 552668.79, constructionProjects: 5, constructionAreaM2: 290089.68, pendingProjects: 1, pendingAreaM2: 262579.11 },
      { name: "佛山", totalProjects: 5, soilAreaM2: 433169.82, constructionProjects: 3, constructionAreaM2: 258759.18, pendingProjects: 0, pendingAreaM2: 174410.64 },
      { name: "深圳", totalProjects: 2, soilAreaM2: 86261.4, constructionProjects: 1, constructionAreaM2: 86261.4, pendingProjects: 0, pendingAreaM2: 0 },
    ],
  },
  "50121142": {
    totalProjects: 33, soilAreaM2: 1975363.37,
    constructionProjects: 14, constructionAreaM2: 1543622.54,
    pendingProjects: 1, pendingAreaM2: 431740.83,
    cities: [
      { name: "西安", totalProjects: 29, soilAreaM2: 1553571.24, constructionProjects: 13, constructionAreaM2: 1237872.38, pendingProjects: 1, pendingAreaM2: 315698.86 },
      { name: "乌鲁木齐", totalProjects: 4, soilAreaM2: 421792.13, constructionProjects: 1, constructionAreaM2: 305750.16, pendingProjects: 0, pendingAreaM2: 116041.97 },
    ],
  },
  "50052675": {
    totalProjects: 18, soilAreaM2: 991513.88,
    constructionProjects: 10, constructionAreaM2: 882736.68,
    pendingProjects: 0, pendingAreaM2: 108777.2,
    cities: [
      { name: "长沙", totalProjects: 7, soilAreaM2: 529988.07, constructionProjects: 5, constructionAreaM2: 463388.07, pendingProjects: 0, pendingAreaM2: 66600 },
      { name: "武汉", totalProjects: 10, soilAreaM2: 461525.81, constructionProjects: 5, constructionAreaM2: 419348.61, pendingProjects: 0, pendingAreaM2: 42177.2 },
      { name: "黄石", totalProjects: 1, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
    ],
  },
  "10002007": {
    totalProjects: 30, soilAreaM2: 974654.73,
    constructionProjects: 5, constructionAreaM2: 757564.6,
    pendingProjects: 2, pendingAreaM2: 217090.13,
    cities: [
      { name: "济南", totalProjects: 12, soilAreaM2: 482208.92, constructionProjects: 2, constructionAreaM2: 438092.2, pendingProjects: 1, pendingAreaM2: 44116.72 },
      { name: "青岛", totalProjects: 8, soilAreaM2: 271516.18, constructionProjects: 1, constructionAreaM2: 183040.71, pendingProjects: 1, pendingAreaM2: 88475.47 },
      { name: "信阳", totalProjects: 1, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "郑州", totalProjects: 4, soilAreaM2: 215379.63, constructionProjects: 1, constructionAreaM2: 130881.69, pendingProjects: 0, pendingAreaM2: 84497.94 },
      { name: "烟台", totalProjects: 2, soilAreaM2: 5550, constructionProjects: 1, constructionAreaM2: 5550, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "济宁", totalProjects: 1, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "淄博", totalProjects: 1, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
      { name: "泰安", totalProjects: 1, soilAreaM2: 0, constructionProjects: 0, constructionAreaM2: 0, pendingProjects: 0, pendingAreaM2: 0 },
    ],
  },
  "50121143": {
    totalProjects: 20, soilAreaM2: 1313850.51,
    constructionProjects: 9, constructionAreaM2: 642744.53,
    pendingProjects: 2, pendingAreaM2: 671105.98,
    cities: [
      { name: "大连", totalProjects: 13, soilAreaM2: 406031.37, constructionProjects: 5, constructionAreaM2: 357402.37, pendingProjects: 1, pendingAreaM2: 48629 },
      { name: "沈阳", totalProjects: 5, soilAreaM2: 579170.78, constructionProjects: 3, constructionAreaM2: 174274.1, pendingProjects: 1, pendingAreaM2: 404896.68 },
      { name: "哈尔滨", totalProjects: 2, soilAreaM2: 328648.36, constructionProjects: 1, constructionAreaM2: 111068.06, pendingProjects: 0, pendingAreaM2: 217580.3 },
    ],
  },
};
