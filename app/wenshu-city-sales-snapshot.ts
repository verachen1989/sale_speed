export type WenshuCitySales6283Snapshot = {
  contractSalesYi: number;
  contractAreaWan: number;
  contractQty: number;
  orderSalesYi: number;
  collectionYi: number;
  monthlyContractSalesYi: number[];
};

export const WENSHU_CITY_SALES_6283_SNAPSHOT_DATE = "2026.08.24";

// Snapshot retrieved from ChatBI dataset 6283 on 2026-08-25.
// Business date: 2026-01-01 through 2026-08-24.
// All required bizType1Code values 001-007 were reconciled. Only 001 (住宅),
// 002 (商办), and 004 (车位储藏室) returned non-zero values for this period.
// Amounts are converted from yuan to 亿元; contract area is converted from m²
// to 万㎡. Dataset 6283 covers active-sale projects.
export const WENSHU_CITY_SALES_6283: Partial<Record<string, WenshuCitySales6283Snapshot>> = {
  "北京": {
    "contractSalesYi": 9.932,
    "contractAreaWan": 2.8368,
    "contractQty": 427,
    "orderSalesYi": 16.1967,
    "collectionYi": 16.5191,
    "monthlyContractSalesYi": [
      0.6696,
      1.9898,
      1.3823,
      1.6306,
      1.5686,
      1.5668,
      0.3082,
      0.816
    ]
  },
  "常州": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "成都": {
    "contractSalesYi": 3.8893,
    "contractAreaWan": 1.7315,
    "contractQty": 207,
    "orderSalesYi": 4.9687,
    "collectionYi": 4.0232,
    "monthlyContractSalesYi": [
      0.2335,
      0.2977,
      1.4737,
      0.6782,
      0.5758,
      0.3899,
      0.1511,
      0.0894
    ]
  },
  "重庆": {
    "contractSalesYi": 1.7845,
    "contractAreaWan": 2.0265,
    "contractQty": 411,
    "orderSalesYi": 2.2046,
    "collectionYi": 1.763,
    "monthlyContractSalesYi": [
      -0.0116,
      0.0058,
      0.0062,
      0.0247,
      0.7568,
      0.6636,
      0.1285,
      0.2104
    ]
  },
  "大连": {
    "contractSalesYi": 6.1803,
    "contractAreaWan": 4.7375,
    "contractQty": 1254,
    "orderSalesYi": 6.9548,
    "collectionYi": 6.3193,
    "monthlyContractSalesYi": [
      0.2658,
      0.4657,
      0.8857,
      0.5491,
      0.9467,
      1.278,
      1.4162,
      0.373
    ]
  },
  "大庆": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "佛山": {
    "contractSalesYi": 6.3628,
    "contractAreaWan": 3.194,
    "contractQty": 510,
    "orderSalesYi": 6.9995,
    "collectionYi": 6.5604,
    "monthlyContractSalesYi": [
      1.1104,
      0.6102,
      0.8002,
      1.1672,
      0.9542,
      1.0015,
      0.3786,
      0.3405
    ]
  },
  "福州": {
    "contractSalesYi": 4.3581,
    "contractAreaWan": 2.0256,
    "contractQty": 238,
    "orderSalesYi": 5.7249,
    "collectionYi": 5.6936,
    "monthlyContractSalesYi": [
      0.5325,
      0.639,
      0.4043,
      0.663,
      0.7577,
      1.229,
      0.1055,
      0.0271
    ]
  },
  "广州": {
    "contractSalesYi": 13.1311,
    "contractAreaWan": 2.5448,
    "contractQty": 475,
    "orderSalesYi": 15.6746,
    "collectionYi": 14.4215,
    "monthlyContractSalesYi": [
      1.2494,
      0.6697,
      2.3179,
      2.8028,
      3.1882,
      2.4992,
      0.4384,
      -0.0344
    ]
  },
  "哈尔滨": {
    "contractSalesYi": 2.3857,
    "contractAreaWan": 2.975,
    "contractQty": 411,
    "orderSalesYi": 2.7322,
    "collectionYi": 2.4398,
    "monthlyContractSalesYi": [
      0.1764,
      0.226,
      0.5224,
      0.3504,
      0.3073,
      0.2918,
      0.2913,
      0.2201
    ]
  },
  "海南省直辖": {
    "contractSalesYi": 7.4749,
    "contractAreaWan": 1.7242,
    "contractQty": 73,
    "orderSalesYi": 6.8986,
    "collectionYi": 9.2599,
    "monthlyContractSalesYi": [
      2.1693,
      1.9683,
      1.6189,
      0.8502,
      0.423,
      0.17,
      0.1321,
      0.143
    ]
  },
  "海外": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "杭州": {
    "contractSalesYi": 116.426,
    "contractAreaWan": 32.6348,
    "contractQty": 4551,
    "orderSalesYi": 121.9724,
    "collectionYi": 159.9473,
    "monthlyContractSalesYi": [
      14.4084,
      7.0645,
      25.8192,
      29.8848,
      16.4642,
      14.574,
      5.0358,
      3.1753
    ]
  },
  "合肥": {
    "contractSalesYi": 7.4676,
    "contractAreaWan": 5.8385,
    "contractQty": 1032,
    "orderSalesYi": 9.5083,
    "collectionYi": 8.1617,
    "monthlyContractSalesYi": [
      1.0213,
      0.5922,
      1.5112,
      1.379,
      0.811,
      1.5599,
      0.3678,
      0.2252
    ]
  },
  "湖州": {
    "contractSalesYi": 1.166,
    "contractAreaWan": 1.5061,
    "contractQty": 314,
    "orderSalesYi": 2.4532,
    "collectionYi": 1.3902,
    "monthlyContractSalesYi": [
      0.0422,
      0.0569,
      0.1778,
      0.3367,
      0.1793,
      0.2188,
      0.0846,
      0.0699
    ]
  },
  "黄石": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "济南": {
    "contractSalesYi": 10.8288,
    "contractAreaWan": 7.1874,
    "contractQty": 964,
    "orderSalesYi": 12.6185,
    "collectionYi": 13.1408,
    "monthlyContractSalesYi": [
      1.628,
      1.0518,
      2.7192,
      1.8076,
      1.7424,
      1.0628,
      0.3855,
      0.4315
    ]
  },
  "济宁": {
    "contractSalesYi": 0.0143,
    "contractAreaWan": 0.3173,
    "contractQty": 222,
    "orderSalesYi": 0.0259,
    "collectionYi": 0.0453,
    "monthlyContractSalesYi": [
      -0.005,
      0.0005,
      0.0001,
      0.0002,
      0.0001,
      0.004,
      0.0144,
      0
    ]
  },
  "嘉兴": {
    "contractSalesYi": 17.794,
    "contractAreaWan": 7.993,
    "contractQty": 835,
    "orderSalesYi": 18.7286,
    "collectionYi": 19.1918,
    "monthlyContractSalesYi": [
      2.0215,
      1.4376,
      3.0139,
      3.4328,
      2.6007,
      3.1955,
      1.6978,
      0.3942
    ]
  },
  "金华": {
    "contractSalesYi": 17.0153,
    "contractAreaWan": 5.0235,
    "contractQty": 509,
    "orderSalesYi": 22.0905,
    "collectionYi": 22.3547,
    "monthlyContractSalesYi": [
      2.8148,
      0.6002,
      2.7972,
      2.0097,
      1.2947,
      2.1236,
      0.3843,
      4.9908
    ]
  },
  "开封": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "昆明": {
    "contractSalesYi": 3.6256,
    "contractAreaWan": 2.8463,
    "contractQty": 299,
    "orderSalesYi": 4.9213,
    "collectionYi": 3.8895,
    "monthlyContractSalesYi": [
      0.2362,
      0.2281,
      0.685,
      0.92,
      0.5388,
      0.5619,
      0.308,
      0.1476
    ]
  },
  "丽水": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0.1793,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "陵水黎族自治县": {
    "contractSalesYi": 3.946,
    "contractAreaWan": 1.4123,
    "contractQty": 113,
    "orderSalesYi": 4.0824,
    "collectionYi": 4.3095,
    "monthlyContractSalesYi": [
      1.2202,
      1.05,
      1.2311,
      0.2352,
      0.0678,
      0,
      0.044,
      0.0978
    ]
  },
  "马鞍山": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "南昌": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0.111,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "南京": {
    "contractSalesYi": 29.7868,
    "contractAreaWan": 6.2111,
    "contractQty": 737,
    "orderSalesYi": 34.7114,
    "collectionYi": 31.2598,
    "monthlyContractSalesYi": [
      1.8796,
      0.888,
      3.689,
      7.7735,
      5.8774,
      6.7848,
      2.126,
      0.7685
    ]
  },
  "南通": {
    "contractSalesYi": 2.5378,
    "contractAreaWan": 1.8657,
    "contractQty": -51,
    "orderSalesYi": 4.008,
    "collectionYi": 2.9411,
    "monthlyContractSalesYi": [
      0.334,
      0.1234,
      0.4257,
      0.3269,
      0.3792,
      0.8983,
      0.1579,
      -0.1076
    ]
  },
  "宁波": {
    "contractSalesYi": 35.4905,
    "contractAreaWan": 15.0844,
    "contractQty": 2077,
    "orderSalesYi": 41.2791,
    "collectionYi": 42.555,
    "monthlyContractSalesYi": [
      1.8178,
      4.9102,
      7.3591,
      5.3063,
      8.0247,
      5.1941,
      1.721,
      1.1573
    ]
  },
  "青岛": {
    "contractSalesYi": 0.002,
    "contractAreaWan": 0.0115,
    "contractQty": 9,
    "orderSalesYi": 0.0132,
    "collectionYi": 0.2044,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0.002,
      0,
      0
    ]
  },
  "衢州": {
    "contractSalesYi": 1.3899,
    "contractAreaWan": 1.1259,
    "contractQty": 292,
    "orderSalesYi": 2.0185,
    "collectionYi": 2.1612,
    "monthlyContractSalesYi": [
      0.0562,
      0.078,
      0.1401,
      0.223,
      0.1146,
      0.488,
      0.1866,
      0.1033
    ]
  },
  "上海": {
    "contractSalesYi": 79.45,
    "contractAreaWan": 8.3875,
    "contractQty": 838,
    "orderSalesYi": 78.4041,
    "collectionYi": 63.519,
    "monthlyContractSalesYi": [
      1.9041,
      1.5876,
      14.8275,
      7.2621,
      17.2841,
      16.328,
      1.9892,
      18.2673
    ]
  },
  "绍兴": {
    "contractSalesYi": 0.004,
    "contractAreaWan": 0.0055,
    "contractQty": 4,
    "orderSalesYi": 0.006,
    "collectionYi": 0.215,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0.004,
      0,
      0,
      0
    ]
  },
  "深圳": {
    "contractSalesYi": 13.705,
    "contractAreaWan": 3.1659,
    "contractQty": 304,
    "orderSalesYi": 15.7558,
    "collectionYi": 13.7144,
    "monthlyContractSalesYi": [
      1.4866,
      0.9537,
      2.3681,
      1.6259,
      2.4743,
      2.6802,
      1.0289,
      1.0873
    ]
  },
  "沈阳": {
    "contractSalesYi": 0.035,
    "contractAreaWan": 0.0333,
    "contractQty": 1,
    "orderSalesYi": 0,
    "collectionYi": 0.0027,
    "monthlyContractSalesYi": [
      0.035,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "石家庄": {
    "contractSalesYi": 0.0137,
    "contractAreaWan": 0.0512,
    "contractQty": 20,
    "orderSalesYi": 0.022,
    "collectionYi": 0.0158,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0.0034,
      0.0065,
      0.0006,
      0.0008,
      0.0024
    ]
  },
  "苏州": {
    "contractSalesYi": 53.3429,
    "contractAreaWan": 9.7225,
    "contractQty": 1371,
    "orderSalesYi": 59.0757,
    "collectionYi": 54.8161,
    "monthlyContractSalesYi": [
      5.2236,
      3.811,
      7.7506,
      9.1244,
      10.0046,
      10.2097,
      3.911,
      3.3079
    ]
  },
  "宿迁": {
    "contractSalesYi": 0.4893,
    "contractAreaWan": 1.548,
    "contractQty": 173,
    "orderSalesYi": 1.3991,
    "collectionYi": 0.4917,
    "monthlyContractSalesYi": [
      0.0099,
      0.1018,
      0.0643,
      0.0333,
      0.1137,
      0.0672,
      0.0713,
      0.0278
    ]
  },
  "台州": {
    "contractSalesYi": 13.6062,
    "contractAreaWan": 4.7273,
    "contractQty": 500,
    "orderSalesYi": 15.6561,
    "collectionYi": 15.8824,
    "monthlyContractSalesYi": [
      0.573,
      2.5079,
      3.8542,
      1.5478,
      2.2331,
      2.1661,
      0.5297,
      0.1945
    ]
  },
  "泰安": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "泰州": {
    "contractSalesYi": 2.8375,
    "contractAreaWan": 2.9651,
    "contractQty": 340,
    "orderSalesYi": 4.0015,
    "collectionYi": 3.2092,
    "monthlyContractSalesYi": [
      0.0814,
      0.0443,
      0.288,
      1.1026,
      0.6413,
      0.3073,
      0.2893,
      0.0832
    ]
  },
  "唐山": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "天津": {
    "contractSalesYi": 19.1598,
    "contractAreaWan": 8.6317,
    "contractQty": 1356,
    "orderSalesYi": 29.923,
    "collectionYi": 19.8387,
    "monthlyContractSalesYi": [
      3.0952,
      1.5955,
      2.4904,
      2.6573,
      4.1458,
      2.5395,
      1.6176,
      1.0186
    ]
  },
  "温州": {
    "contractSalesYi": 0.9781,
    "contractAreaWan": 0.2705,
    "contractQty": 8,
    "orderSalesYi": 1.6842,
    "collectionYi": 0.5537,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0.1724,
      0,
      0.7765,
      0,
      0.0292
    ]
  },
  "乌鲁木齐": {
    "contractSalesYi": 0.8161,
    "contractAreaWan": 1.9063,
    "contractQty": 297,
    "orderSalesYi": 1.1408,
    "collectionYi": 0.8389,
    "monthlyContractSalesYi": [
      0.0759,
      0.0537,
      0.1246,
      0.1047,
      0.1058,
      0.1257,
      0.1344,
      0.0913
    ]
  },
  "无锡": {
    "contractSalesYi": 0.7635,
    "contractAreaWan": 0.351,
    "contractQty": 31,
    "orderSalesYi": 1.2738,
    "collectionYi": 1.4759,
    "monthlyContractSalesYi": [
      -0.0088,
      0.1208,
      0.2597,
      0.1129,
      0,
      -0.0058,
      0.2847,
      0
    ]
  },
  "武汉": {
    "contractSalesYi": 16.5094,
    "contractAreaWan": 6.6987,
    "contractQty": 563,
    "orderSalesYi": 18.7163,
    "collectionYi": 15.4565,
    "monthlyContractSalesYi": [
      0.2701,
      0.4505,
      0.3616,
      0.7543,
      5.04,
      5.8983,
      2.8918,
      0.8429
    ]
  },
  "西安": {
    "contractSalesYi": 43.8824,
    "contractAreaWan": 24.9678,
    "contractQty": 3307,
    "orderSalesYi": 49.8423,
    "collectionYi": 46.2542,
    "monthlyContractSalesYi": [
      4.1717,
      3.6579,
      7.8072,
      7.3984,
      8.4179,
      7.5222,
      2.5811,
      2.3259
    ]
  },
  "信阳": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "徐州": {
    "contractSalesYi": 0.0632,
    "contractAreaWan": 0.4429,
    "contractQty": 344,
    "orderSalesYi": 0.5143,
    "collectionYi": 0.1447,
    "monthlyContractSalesYi": [
      0,
      0.0012,
      -0.0239,
      0.017,
      0,
      0.0682,
      0.0007,
      0
    ]
  },
  "烟台": {
    "contractSalesYi": 1.8552,
    "contractAreaWan": 1.9441,
    "contractQty": 173,
    "orderSalesYi": 2.0457,
    "collectionYi": 1.8672,
    "monthlyContractSalesYi": [
      0.0906,
      0.0378,
      0.5106,
      0.1872,
      0.2829,
      0.519,
      0.1062,
      0.121
    ]
  },
  "盐城": {
    "contractSalesYi": 1.5123,
    "contractAreaWan": 1.7541,
    "contractQty": 247,
    "orderSalesYi": 3.8373,
    "collectionYi": 1.7894,
    "monthlyContractSalesYi": [
      0,
      0.1847,
      0.4664,
      0.2704,
      0.1809,
      0.1724,
      0.1024,
      0.1351
    ]
  },
  "扬州": {
    "contractSalesYi": -0.0014,
    "contractAreaWan": -0.0035,
    "contractQty": -1,
    "orderSalesYi": -0.0017,
    "collectionYi": 0.1099,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      -0.0014,
      0,
      0,
      0,
      0
    ]
  },
  "鹰潭": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  "长沙": {
    "contractSalesYi": 16.4097,
    "contractAreaWan": 11.2384,
    "contractQty": 1073,
    "orderSalesYi": 19.748,
    "collectionYi": 17.3674,
    "monthlyContractSalesYi": [
      1.1758,
      0.838,
      3.1696,
      2.7852,
      3.081,
      2.8837,
      1.2263,
      1.25
    ]
  },
  "郑州": {
    "contractSalesYi": 1.5724,
    "contractAreaWan": 1.0286,
    "contractQty": 84,
    "orderSalesYi": 1.766,
    "collectionYi": 1.5722,
    "monthlyContractSalesYi": [
      0.1041,
      0.1462,
      0.2024,
      0.2938,
      0.1465,
      0.1865,
      0.1709,
      0.3221
    ]
  },
  "舟山": {
    "contractSalesYi": 10.8037,
    "contractAreaWan": 6.2337,
    "contractQty": 905,
    "orderSalesYi": 12.1728,
    "collectionYi": 12.5094,
    "monthlyContractSalesYi": [
      1.3598,
      0.951,
      2.169,
      1.6533,
      1.3675,
      1.2508,
      1.4739,
      0.5782
    ]
  },
  "淄博": {
    "contractSalesYi": 0,
    "contractAreaWan": 0,
    "contractQty": 0,
    "orderSalesYi": 0,
    "collectionYi": 0,
    "monthlyContractSalesYi": [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]
  }
};
