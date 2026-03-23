import {
  importedAnnualResidentialProjects,
  importedMonthlyResidentialProjects,
  importedDailyResidentialProjects,
} from './importedProjectData';

export type Period = '当日' | '当月' | '当年';
export type IndicatorType = '协议' | '合同';
export type MetricType = '套数' | '金额';
export type VersionType = '年度经营计划版' | '首开定价会版' | '全景会版' | '经营策划会版' | '交底会版';
export type FilterCategory = 'status' | 'landYear' | 'city';
export type FilterLabel = string;
export type PropertyType = '住宅' | '商办' | '车储';

export interface ProjectRecord {
  id: string;
  name: string;
  landDate: string;
  agreementUnits: number;
  agreementAmount: number;
  contractUnits: number;
  contractAmount: number;
  cashPayment: number;
  loanPayment: number;
  totalPayment: number;
  city: string;
  status: string;
  landYear: string;
  monthlyDetails?: MonthlyDetail[];
}

export interface MonthlyDetail {
  month: string;
  agreementUnits: number;
  contractUnits: number;
  avgPrice: number;
  totalPayment: number;
  cashPayment: number;
  loanPayment: number;
}

type TrendPoint = {
  date: string;
  actual: number;
  target: number;
};

type FilterSummary = {
  label: string;
  count: number;
  amount: number;
};

const projectsByPeriodAndType: Record<PropertyType, Record<Period, ProjectRecord[]>> = {
  住宅: {
    当日: [
      { id: '1', name: '南京风起潮鸣', landDate: '2025-01-01', agreementUnits: 36, agreementAmount: 7020, contractUnits: 38, contractAmount: 7410, cashPayment: 3910, loanPayment: 2730, totalPayment: 6640, city: '南京', status: '当年首开', landYear: '2025年' },
      { id: '2', name: '深圳颐和花园', landDate: '2024-06-15', agreementUnits: 34, agreementAmount: 6800, contractUnits: 35, contractAmount: 7000, cashPayment: 3820, loanPayment: 2660, totalPayment: 6480, city: '深圳', status: '续销', landYear: '2024年' },
      { id: '3', name: '义乌芝麻开门', landDate: '2023-08-20', agreementUnits: 32, agreementAmount: 5920, contractUnits: 34, contractAmount: 6290, cashPayment: 3310, loanPayment: 2310, totalPayment: 5620, city: '杭州', status: '尾盘', landYear: '2023年' },
      { id: '4', name: '苏州格致国际', landDate: '2025-02-10', agreementUnits: 34, agreementAmount: 7140, contractUnits: 36, contractAmount: 7560, cashPayment: 4010, loanPayment: 2810, totalPayment: 6820, city: '苏州', status: '当年首开', landYear: '2025年' },
      { id: '5', name: '长沙悦誉家', landDate: '2024-09-05', agreementUnits: 32, agreementAmount: 6080, contractUnits: 33, contractAmount: 6270, cashPayment: 3420, loanPayment: 2390, totalPayment: 5810, city: '长沙', status: '续销', landYear: '2024年' },
      { id: '6', name: '杭州西溪蝶园', landDate: '2024-03-12', agreementUnits: 28, agreementAmount: 5880, contractUnits: 30, contractAmount: 6300, cashPayment: 3465, loanPayment: 2415, totalPayment: 5880, city: '杭州', status: '续销', landYear: '2024年' },
      { id: '7', name: '上海青浦雅苑', landDate: '2023-11-08', agreementUnits: 25, agreementAmount: 5250, contractUnits: 27, contractAmount: 5670, cashPayment: 3119, loanPayment: 2173, totalPayment: 5292, city: '上海', status: '尾盘', landYear: '2023年' },
      { id: '8', name: '北京朝阳府邸', landDate: '2025-01-20', agreementUnits: 38, agreementAmount: 7980, contractUnits: 40, contractAmount: 8400, cashPayment: 4620, loanPayment: 3220, totalPayment: 7840, city: '北京', status: '当年首开', landYear: '2025年' },
      { id: '9', name: '成都天府新居', landDate: '2024-07-18', agreementUnits: 30, agreementAmount: 5700, contractUnits: 32, contractAmount: 6080, cashPayment: 3344, loanPayment: 2330, totalPayment: 5674, city: '成都', status: '续销', landYear: '2024年' },
      { id: '10', name: '重庆江景台', landDate: '2023-05-22', agreementUnits: 26, agreementAmount: 4680, contractUnits: 28, contractAmount: 5040, cashPayment: 2772, loanPayment: 1930, totalPayment: 4702, city: '重庆', status: '尾盘', landYear: '2023年' },
      { id: '11', name: '广州珠江湾', landDate: '2024-10-15', agreementUnits: 35, agreementAmount: 7350, contractUnits: 37, contractAmount: 7770, cashPayment: 4274, loanPayment: 2978, totalPayment: 7252, city: '广州', status: '续销', landYear: '2024年' },
      { id: '12', name: '武汉东湖雅居', landDate: '2024-04-08', agreementUnits: 29, agreementAmount: 5510, contractUnits: 31, contractAmount: 5890, cashPayment: 3240, loanPayment: 2257, totalPayment: 5497, city: '武汉', status: '续销', landYear: '2024年' },
      { id: '13', name: '西安曲江春晓', landDate: '2023-12-01', agreementUnits: 27, agreementAmount: 4860, contractUnits: 29, contractAmount: 5220, cashPayment: 2871, loanPayment: 2000, totalPayment: 4871, city: '西安', status: '尾盘', landYear: '2023年' },
      { id: '14', name: '天津海河明珠', landDate: '2024-08-25', agreementUnits: 31, agreementAmount: 6200, contractUnits: 33, contractAmount: 6600, cashPayment: 3630, loanPayment: 2530, totalPayment: 6160, city: '天津', status: '续销', landYear: '2024年' },
      { id: '15', name: '青岛海景花园', landDate: '2025-03-05', agreementUnits: 33, agreementAmount: 6930, contractUnits: 35, contractAmount: 7350, cashPayment: 4043, loanPayment: 2818, totalPayment: 6861, city: '青岛', status: '当年首开', landYear: '2025年' },
    ],
    当月: [
      { id: '1', name: '南京风起潮鸣', landDate: '2025-01-01', agreementUnits: 980, agreementAmount: 196000, contractUnits: 1030, contractAmount: 206000, cashPayment: 110000, loanPayment: 76000, totalPayment: 186000, city: '南京', status: '当年首开', landYear: '2025年' },
      { id: '2', name: '深圳颐和花园', landDate: '2024-06-15', agreementUnits: 920, agreementAmount: 184000, contractUnits: 950, contractAmount: 190000, cashPayment: 104000, loanPayment: 72000, totalPayment: 176000, city: '深圳', status: '续销', landYear: '2024年' },
      { id: '3', name: '义乌芝麻开门', landDate: '2023-08-20', agreementUnits: 860, agreementAmount: 163400, contractUnits: 910, contractAmount: 172900, cashPayment: 92000, loanPayment: 64000, totalPayment: 156000, city: '杭州', status: '尾盘', landYear: '2023年' },
      { id: '4', name: '苏州格致国际', landDate: '2025-02-10', agreementUnits: 1100, agreementAmount: 231000, contractUnits: 1160, contractAmount: 243600, cashPayment: 131000, loanPayment: 91000, totalPayment: 222000, city: '苏州', status: '当年首开', landYear: '2025年', monthlyDetails: [
          { month: '1月', agreementUnits: 72, contractUnits: 76, avgPrice: 21.0, totalPayment: 15960, cashPayment: 7600, loanPayment: 100 },
          { month: '2月', agreementUnits: 30, contractUnits: 32, avgPrice: 21.0, totalPayment: 6720, cashPayment: 3200, loanPayment: 100 },
          { month: '3月', agreementUnits: 30, contractUnits: 32, avgPrice: 21.0, totalPayment: 6720, cashPayment: 3200, loanPayment: 100 },
          { month: '4月', agreementUnits: 30, contractUnits: 32, avgPrice: 21.0, totalPayment: 6720, cashPayment: 3200, loanPayment: 100 },
          { month: '5月', agreementUnits: 30, contractUnits: 32, avgPrice: 21.0, totalPayment: 6720, cashPayment: 3200, loanPayment: 100 },
        ]
      },
      { id: '5', name: '长沙悦誉家', landDate: '2024-09-05', agreementUnits: 1000, agreementAmount: 220000, contractUnits: 1050, contractAmount: 231000, cashPayment: 121000, loanPayment: 84000, totalPayment: 205000, city: '长沙', status: '续销', landYear: '2024年' },
      { id: '6', name: '杭州西溪蝶园', landDate: '2024-03-12', agreementUnits: 850, agreementAmount: 178500, contractUnits: 900, contractAmount: 189000, cashPayment: 104000, loanPayment: 72000, totalPayment: 176000, city: '杭州', status: '续销', landYear: '2024年' },
      { id: '7', name: '上海青浦雅苑', landDate: '2023-11-08', agreementUnits: 780, agreementAmount: 163800, contractUnits: 820, contractAmount: 172200, cashPayment: 94700, loanPayment: 66000, totalPayment: 160700, city: '上海', status: '尾盘', landYear: '2023年' },
      { id: '8', name: '北京朝阳府邸', landDate: '2025-01-20', agreementUnits: 1050, agreementAmount: 220500, contractUnits: 1100, contractAmount: 231000, cashPayment: 127000, loanPayment: 88500, totalPayment: 215500, city: '北京', status: '当年首开', landYear: '2025年' },
      { id: '9', name: '成都天府新居', landDate: '2024-07-18', agreementUnits: 890, agreementAmount: 169100, contractUnits: 940, contractAmount: 178600, cashPayment: 98200, loanPayment: 68400, totalPayment: 166600, city: '成都', status: '续销', landYear: '2024年' },
      { id: '10', name: '重庆江景台', landDate: '2023-05-22', agreementUnits: 750, agreementAmount: 135000, contractUnits: 800, contractAmount: 144000, cashPayment: 79200, loanPayment: 55200, totalPayment: 134400, city: '重庆', status: '尾盘', landYear: '2023年' },
      { id: '11', name: '广州珠江湾', landDate: '2024-10-15', agreementUnits: 970, agreementAmount: 203700, contractUnits: 1020, contractAmount: 214200, cashPayment: 117800, loanPayment: 82100, totalPayment: 199900, city: '广州', status: '续销', landYear: '2024年' },
      { id: '12', name: '武汉东湖雅居', landDate: '2024-04-08', agreementUnits: 830, agreementAmount: 157700, contractUnits: 880, contractAmount: 167200, cashPayment: 91960, loanPayment: 64040, totalPayment: 156000, city: '武汉', status: '续销', landYear: '2024年' },
      { id: '13', name: '西安曲江春晓', landDate: '2023-12-01', agreementUnits: 770, agreementAmount: 138600, contractUnits: 820, contractAmount: 147600, cashPayment: 81180, loanPayment: 56580, totalPayment: 137760, city: '西安', status: '尾盘', landYear: '2023年' },
      { id: '14', name: '天津海河明珠', landDate: '2024-08-25', agreementUnits: 910, agreementAmount: 182000, contractUnits: 960, contractAmount: 192000, cashPayment: 105600, loanPayment: 73600, totalPayment: 179200, city: '天津', status: '续销', landYear: '2024年' },
      { id: '15', name: '青岛海景花园', landDate: '2025-03-05', agreementUnits: 950, agreementAmount: 199500, contractUnits: 1000, contractAmount: 210000, cashPayment: 115500, loanPayment: 80500, totalPayment: 196000, city: '青岛', status: '当年首开', landYear: '2025年' },
    ],
    当年: [
      { id: '1', name: '南京风起潮鸣', landDate: '2025-01-01', agreementUnits: 5600, agreementAmount: 1120000, contractUnits: 5880, contractAmount: 1176000, cashPayment: 630000, loanPayment: 438000, totalPayment: 1068000, city: '南京', status: '当年首开', landYear: '2025年' },
      { id: '2', name: '深圳颐和花园', landDate: '2024-06-15', agreementUnits: 5100, agreementAmount: 1020000, 
        contractUnits: 5360, 
        contractAmount: 1072000, 
        cashPayment: 574000, 
        loanPayment: 399000, 
        totalPayment: 973000,
        city: '深圳',
        status: '续销',
        landYear: '2024年'
      },
      { id: '3', name: '义乌芝麻开门', landDate: '2023-08-20', agreementUnits: 4900, agreementAmount: 931000, contractUnits: 5140, contractAmount: 976600, cashPayment: 523000, loanPayment: 364000, totalPayment: 887000, city: '杭州', status: '尾盘', landYear: '2023年' },
      { id: '4', name: '苏州格致国际', landDate: '2025-02-10', agreementUnits: 6600, agreementAmount: 1386000, contractUnits: 6930, contractAmount: 1455300, cashPayment: 782000, loanPayment: 544000, totalPayment: 1326000, city: '苏州', status: '当年首开', landYear: '2025年', monthlyDetails: [
          { month: '1月', agreementUnits: 1320, contractUnits: 1386, avgPrice: 21.0, totalPayment: 291060, cashPayment: 156400, loanPayment: 1800 },
          { month: '2月', agreementUnits: 550, contractUnits: 578, avgPrice: 21.0, totalPayment: 121380, cashPayment: 65200, loanPayment: 800 },
          { month: '3月', agreementUnits: 550, contractUnits: 578, avgPrice: 21.0, totalPayment: 121380, cashPayment: 65200, loanPayment: 800 },
          { month: '4月', agreementUnits: 550, contractUnits: 578, avgPrice: 21.0, totalPayment: 121380, cashPayment: 65200, loanPayment: 800 },
          { month: '5月', agreementUnits: 550, contractUnits: 578, avgPrice: 21.0, totalPayment: 121380, cashPayment: 65200, loanPayment: 800 },
        ]
      },
      { id: '5', name: '长沙悦誉家', landDate: '2024-09-05', agreementUnits: 6400, agreementAmount: 1344000, contractUnits: 6720, contractAmount: 1411200, cashPayment: 758000, loanPayment: 527000, totalPayment: 1285000, city: '长沙', status: '续销', landYear: '2024年' },
      { id: '6', name: '杭州西溪蝶园', landDate: '2024-03-12', agreementUnits: 5200, agreementAmount: 1092000, contractUnits: 5460, contractAmount: 1146600, cashPayment: 630800, loanPayment: 439200, totalPayment: 1070000, city: '杭州', status: '续销', landYear: '2024年' },
      { id: '7', name: '上海青浦雅苑', landDate: '2023-11-08', agreementUnits: 4700, agreementAmount: 987000, contractUnits: 4940, contractAmount: 1037400, cashPayment: 570700, loanPayment: 397400, totalPayment: 968100, city: '上海', status: '尾盘', landYear: '2023年' },
      { id: '8', name: '北京朝阳府邸', landDate: '2025-01-20', agreementUnits: 6300, agreementAmount: 1323000, contractUnits: 6600, contractAmount: 1386000, cashPayment: 762300, loanPayment: 531000, totalPayment: 1293300, city: '北京', status: '当年首开', landYear: '2025年' },
      { id: '9', name: '成都天府新居', landDate: '2024-07-18', agreementUnits: 5400, agreementAmount: 1026000, contractUnits: 5700, contractAmount: 1083000, cashPayment: 595600, loanPayment: 414800, totalPayment: 1010400, city: '成都', status: '续销', landYear: '2024年' },
      { id: '10', name: '重庆江景台', landDate: '2023-05-22', agreementUnits: 4500, agreementAmount: 810000, contractUnits: 4800, contractAmount: 864000, cashPayment: 475200, loanPayment: 331200, totalPayment: 806400, city: '重庆', status: '尾盘', landYear: '2023年' },
      { id: '11', name: '广州珠江湾', landDate: '2024-10-15', agreementUnits: 5800, agreementAmount: 1218000, contractUnits: 6100, contractAmount: 1281000, cashPayment: 704500, loanPayment: 490500, totalPayment: 1195000, city: '广州', status: '续销', landYear: '2024年' },
      { id: '12', name: '武汉东湖雅居', landDate: '2024-04-08', agreementUnits: 5000, agreementAmount: 950000, contractUnits: 5280, contractAmount: 1003200, cashPayment: 551800, loanPayment: 384500, totalPayment: 936300, city: '武汉', status: '续销', landYear: '2024年' },
      { id: '13', name: '西安曲江春晓', landDate: '2023-12-01', agreementUnits: 4600, agreementAmount: 828000, contractUnits: 4900, contractAmount: 882000, cashPayment: 485100, loanPayment: 338400, totalPayment: 823500, city: '西安', status: '尾盘', landYear: '2023年' },
      { id: '14', name: '天津海河明珠', landDate: '2024-08-25', agreementUnits: 5500, agreementAmount: 1100000, contractUnits: 5800, contractAmount: 1160000, cashPayment: 638000, loanPayment: 444800, totalPayment: 1082800, city: '天津', status: '续销', landYear: '2024年' },
      { id: '15', name: '青岛海景花园', landDate: '2025-03-05', agreementUnits: 5700, agreementAmount: 1197000, contractUnits: 6000, contractAmount: 1260000, cashPayment: 693000, loanPayment: 483000, totalPayment: 1176000, city: '青岛', status: '当年首开', landYear: '2025年' },
    ],
  },
  商办: {
    当日: [
      { id: '11', name: '北京CBD商务中心', landDate: '2024-06-01', agreementUnits: 15, agreementAmount: 4500, contractUnits: 16, contractAmount: 4800, cashPayment: 2400, loanPayment: 1600, totalPayment: 4000, city: '北京', status: '当年首开', landYear: '2024年' },
      { id: '12', name: '上海陆家嘴金融大厦', landDate: '2023-08-01', agreementUnits: 12, agreementAmount: 3600, contractUnits: 13, contractAmount: 3900, cashPayment: 2100, loanPayment: 1400, totalPayment: 3500, city: '上海', status: '续销', landYear: '2023年' },
      { id: '13', name: '深圳前海商业综合体', landDate: '2024-09-15', agreementUnits: 18, agreementAmount: 5400, contractUnits: 19, contractAmount: 5700, cashPayment: 3135, loanPayment: 2185, totalPayment: 5320, city: '深圳', status: '续销', landYear: '2024年' },
      { id: '14', name: '广州天河写字楼', landDate: '2025-02-01', agreementUnits: 14, agreementAmount: 4200, contractUnits: 15, contractAmount: 4500, cashPayment: 2475, loanPayment: 1725, totalPayment: 4200, city: '广州', status: '当年首开', landYear: '2025年' },
      { id: '15', name: '杭州钱江新城商务楼', landDate: '2024-05-20', agreementUnits: 13, agreementAmount: 3900, contractUnits: 14, contractAmount: 4200, cashPayment: 2310, loanPayment: 1610, totalPayment: 3920, city: '杭州', status: '续销', landYear: '2024年' },
    ],
    当月: [
      { id: '11', name: '北京CBD商务中心', landDate: '2024-06-01', agreementUnits: 420, agreementAmount: 126000, contractUnits: 450, contractAmount: 135000, cashPayment: 72000, loanPayment: 48000, totalPayment: 120000, city: '北京', status: '当年首开', landYear: '2024年' },
      { id: '12', name: '上海陆家嘴金融大厦', landDate: '2023-08-01', agreementUnits: 350, agreementAmount: 105000, contractUnits: 380, contractAmount: 114000, cashPayment: 63000, loanPayment: 42000, totalPayment: 105000, city: '上海', status: '续销', landYear: '2023年' },
      { id: '13', name: '深圳前海商业综合体', landDate: '2024-09-15', agreementUnits: 480, agreementAmount: 144000, contractUnits: 510, contractAmount: 153000, cashPayment: 84150, loanPayment: 58650, totalPayment: 142800, city: '深圳', status: '续销', landYear: '2024年' },
      { id: '14', name: '广州天河写字楼', landDate: '2025-02-01', agreementUnits: 390, agreementAmount: 117000, contractUnits: 420, contractAmount: 126000, cashPayment: 69300, loanPayment: 48300, totalPayment: 117600, city: '广州', status: '当年首开', landYear: '2025年' },
      { id: '15', name: '杭州钱江新城商务楼', landDate: '2024-05-20', agreementUnits: 360, agreementAmount: 108000, contractUnits: 390, contractAmount: 117000, cashPayment: 64350, loanPayment: 44850, totalPayment: 109200, city: '杭州', status: '续销', landYear: '2024年' },
    ],
    当年: [
      { id: '11', name: '北京CBD商务中心', landDate: '2024-06-01', agreementUnits: 2400, agreementAmount: 720000, contractUnits: 2520, contractAmount: 756000, cashPayment: 403200, loanPayment: 268800, totalPayment: 672000, city: '北京', status: '当年首开', landYear: '2024年' },
      { id: '12', name: '上海陆家嘴金融大厦', landDate: '2023-08-01', agreementUnits: 2100, agreementAmount: 630000, contractUnits: 2280, contractAmount: 684000, cashPayment: 378000, loanPayment: 252000, totalPayment: 630000, city: '上海', status: '续销', landYear: '2023年' },
      { id: '13', name: '深圳前海商业综合体', landDate: '2024-09-15', agreementUnits: 2700, agreementAmount: 810000, contractUnits: 2850, contractAmount: 855000, cashPayment: 470250, loanPayment: 327750, totalPayment: 798000, city: '深圳', status: '续销', landYear: '2024年' },
      { id: '14', name: '广州天河写字楼', landDate: '2025-02-01', agreementUnits: 2200, agreementAmount: 660000, contractUnits: 2340, contractAmount: 702000, cashPayment: 386100, loanPayment: 269100, totalPayment: 655200, city: '广州', status: '当年首开', landYear: '2025年' },
      { id: '15', name: '杭州钱江新城商务楼', landDate: '2024-05-20', agreementUnits: 2000, agreementAmount: 600000, contractUnits: 2160, contractAmount: 648000, cashPayment: 356400, loanPayment: 248400, totalPayment: 604800, city: '杭州', status: '续销', landYear: '2024年' },
    ],
  },
  车储: {
    当日: [
      { id: '21', name: '杭州西湖车位', landDate: '2024-03-01', agreementUnits: 25, agreementAmount: 1250, contractUnits: 28, contractAmount: 1400, cashPayment: 980, loanPayment: 280, totalPayment: 1260, city: '杭州', status: '当年首开', landYear: '2024年' },
      { id: '22', name: '成都天府车库', landDate: '2023-11-01', agreementUnits: 20, agreementAmount: 1000, contractUnits: 22, contractAmount: 1100, cashPayment: 770, loanPayment: 220, totalPayment: 990, city: '成都', status: '续销', landYear: '2023年' },
      { id: '23', name: '南京江宁车位', landDate: '2024-07-10', agreementUnits: 22, agreementAmount: 1100, contractUnits: 24, contractAmount: 1200, cashPayment: 840, loanPayment: 240, totalPayment: 1080, city: '南京', status: '续销', landYear: '2024年' },
      { id: '24', name: '苏州工业园车库', landDate: '2025-01-15', agreementUnits: 28, agreementAmount: 1400, contractUnits: 30, contractAmount: 1500, cashPayment: 1050, loanPayment: 300, totalPayment: 1350, city: '苏州', status: '当年首开', landYear: '2025年' },
      { id: '25', name: '深圳南山车位', landDate: '2024-04-20', agreementUnits: 24, agreementAmount: 1200, contractUnits: 26, contractAmount: 1300, cashPayment: 910, loanPayment: 260, totalPayment: 1170, city: '深圳', status: '续销', landYear: '2024年' },
    ],
    当月: [
      { id: '21', name: '杭州西湖车位', landDate: '2024-03-01', agreementUnits: 680, agreementAmount: 34000, contractUnits: 720, contractAmount: 36000, cashPayment: 25200, loanPayment: 7200, totalPayment: 32400, city: '杭州', status: '当年首开', landYear: '2024年' },
      { id: '22', name: '成都天府车库', landDate: '2023-11-01', agreementUnits: 580, agreementAmount: 29000, contractUnits: 620, contractAmount: 31000, cashPayment: 21700, loanPayment: 6200, totalPayment: 27900, city: '成都', status: '续销', landYear: '2023年' },
      { id: '23', name: '南京江宁车位', landDate: '2024-07-10', agreementUnits: 620, agreementAmount: 31000, contractUnits: 660, contractAmount: 33000, cashPayment: 23100, loanPayment: 6600, totalPayment: 29700, city: '南京', status: '续销', landYear: '2024年' },
      { id: '24', name: '苏州工业园车库', landDate: '2025-01-15', agreementUnits: 750, agreementAmount: 37500, contractUnits: 800, contractAmount: 40000, cashPayment: 28000, loanPayment: 8000, totalPayment: 36000, city: '苏州', status: '当年首开', landYear: '2025年' },
      { id: '25', name: '深圳南山车位', landDate: '2024-04-20', agreementUnits: 650, agreementAmount: 32500, contractUnits: 690, contractAmount: 34500, cashPayment: 24150, loanPayment: 6900, totalPayment: 31050, city: '深圳', status: '续销', landYear: '2024年' },
    ],
    当年: [
      { id: '21', name: '杭州西湖车位', landDate: '2024-03-01', agreementUnits: 3900, agreementAmount: 195000, contractUnits: 4140, contractAmount: 207000, cashPayment: 144900, loanPayment: 41400, totalPayment: 186300, city: '杭州', status: '当年首开', landYear: '2024年' },
      { id: '22', name: '成都天府车库', landDate: '2023-11-01', agreementUnits: 3400, agreementAmount: 170000, contractUnits: 3620, contractAmount: 181000, cashPayment: 126700, loanPayment: 36200, totalPayment: 162900, city: '成都', status: '续销', landYear: '2023年' },
      { id: '23', name: '南京江宁车位', landDate: '2024-07-10', agreementUnits: 3600, agreementAmount: 180000, contractUnits: 3840, contractAmount: 192000, cashPayment: 134400, loanPayment: 38400, totalPayment: 172800, city: '南京', status: '续销', landYear: '2024年' },
      { id: '24', name: '苏州工业园车库', landDate: '2025-01-15', agreementUnits: 4200, agreementAmount: 210000, contractUnits: 4480, contractAmount: 224000, cashPayment: 156800, loanPayment: 44800, totalPayment: 201600, city: '苏州', status: '当年首开', landYear: '2025年' },
      { id: '25', name: '深圳南山车位', landDate: '2024-04-20', agreementUnits: 3800, agreementAmount: 190000, contractUnits: 4040, contractAmount: 202000, cashPayment: 141400, loanPayment: 40400, totalPayment: 181800, city: '深圳', status: '续销', landYear: '2024年' },
    ],
  },
};

const overviewChangeRate: Record<Period, Record<IndicatorType, string>> = {
  当日: { 协议: '12%', 合同: '14%' },
  当月: { 协议: '18%', 合同: '20%' },
  当年: { 协议: '26%', 合同: '28%' },
};

const unitTrendByIndicator: Record<IndicatorType, Record<Period, TrendPoint[]>> = {
  协议: {
    当日: [
      { date: '3/10', actual: 142, target: 158 },
      { date: '3/11', actual: 128, target: 146 },
      { date: '3/12', actual: 155, target: 162 },
      { date: '3/13', actual: 171, target: 168 },
      { date: '3/14', actual: 163, target: 170 },
      { date: '3/15', actual: 194, target: 182 },
      { date: '3/16', actual: 168, target: 176 },
    ],
    当月: [
      { date: '2/09', actual: 700, target: 820 },
      { date: '2/16', actual: 820, target: 900 },
      { date: '2/23', actual: 930, target: 980 },
      { date: '3/02', actual: 1060, target: 1120 },
      { date: '3/09', actual: 970, target: 1040 },
      { date: '3/16', actual: 1080, target: 1150 },
    ],
    当年: [
      { date: '5月', actual: 3800, target: 4100 },
      { date: '6月', actual: 7900, target: 8500 },
      { date: '7月', actual: 12450, target: 13300 },
      { date: '8月', actual: 17300, target: 18400 },
      { date: '9月', actual: 22920, target: 24100 },
      { date: '10月', actual: 28600, target: 29800 },
    ],
  },
  合同: {
    当日: [
      { date: '3/10', actual: 148, target: 164 },
      { date: '3/11', actual: 132, target: 150 },
      { date: '3/12', actual: 162, target: 170 },
      { date: '3/13', actual: 176, target: 174 },
      { date: '3/14', actual: 169, target: 178 },
      { date: '3/15', actual: 201, target: 188 },
      { date: '3/16', actual: 176, target: 182 },
    ],
    当月: [
      { date: '2/09', actual: 730, target: 850 },
      { date: '2/16', actual: 860, target: 940 },
      { date: '2/23', actual: 980, target: 1030 },
      { date: '3/02', actual: 1110, target: 1180 },
      { date: '3/09', actual: 1020, target: 1080 },
      { date: '3/16', actual: 1140, target: 1210 },
    ],
    当年: [
      { date: '5月', actual: 4010, target: 4320 },
      { date: '6月', actual: 8290, target: 8920 },
      { date: '7月', actual: 12980, target: 13880 },
      { date: '8月', actual: 18020, target: 19120 },
      { date: '9月', actual: 24060, target: 25280 },
      { date: '10月', actual: 30030, target: 31350 },
    ],
  },
};

const amountTrendByIndicator: Record<IndicatorType, Record<Period, TrendPoint[]>> = {
  协议: {
    当日: [
      { date: '3/10', actual: 27100, target: 30000 },
      { date: '3/11', actual: 24500, target: 27900 },
      { date: '3/12', actual: 29600, target: 30900 },
      { date: '3/13', actual: 32300, target: 31900 },
      { date: '3/14', actual: 31200, target: 32600 },
      { date: '3/15', actual: 35600, target: 34800 },
      { date: '3/16', actual: 31960, target: 33400 },
    ],
    当月: [
      { date: '2/09', actual: 142000, target: 164000 },
      { date: '2/16', actual: 167000, target: 182000 },
      { date: '2/23', actual: 189000, target: 198000 },
      { date: '3/02', actual: 216000, target: 226000 },
      { date: '3/09', actual: 199000, target: 209000 },
      { date: '3/16', actual: 220000, target: 232000 },
    ],
    当年: [
      { date: '5月', actual: 760000, target: 810000 },
      { date: '6月', actual: 1605000, target: 1690000 },
      { date: '7月', actual: 2530000, target: 2640000 },
      { date: '8月', actual: 3534000, target: 3670000 },
      { date: '9月', actual: 4668000, target: 4810000 },
      { date: '10月', actual: 5801000, target: 5940000 },
    ],
  },
  合同: {
    当日: [
      { date: '3/10', actual: 28800, target: 31500 },
      { date: '3/11', actual: 25700, target: 28600 },
      { date: '3/12', actual: 30800, target: 32200 },
      { date: '3/13', actual: 33600, target: 33100 },
      { date: '3/14', actual: 32500, target: 33800 },
      { date: '3/15', actual: 36800, target: 36000 },
      { date: '3/16', actual: 34530, target: 35000 },
    ],
    当月: [
      { date: '2/09', actual: 148000, target: 171000 },
      { date: '2/16', actual: 175000, target: 190000 },
      { date: '2/23', actual: 198000, target: 207000 },
      { date: '3/02', actual: 227000, target: 236000 },
      { date: '3/09', actual: 209000, target: 218000 },
      { date: '3/16', actual: 231000, target: 243000 },
    ],
    当年: [
      { date: '5月', actual: 798000, target: 848000 },
      { date: '6月', actual: 1688000, target: 1772000 },
      { date: '7月', actual: 2656000, target: 2765000 },
      { date: '8月', actual: 3708000, target: 3848000 },
      { date: '9月', actual: 4899000, target: 5046000 },
      { date: '10月', actual: 6091100, target: 6245000 },
    ],
  },
};

const cityKeywords = [
  '杭州', '上海', '苏州', '南京', '宁波', '温州', '嘉兴', '湖州', '舟山', '绍兴', '台州', '金华',
  '北京', '深圳', '广州', '武汉', '成都', '重庆', '天津', '青岛', '西安', '徐州', '长沙', '海南',
  '象山', '慈溪', '义乌', '信阳',
] as const;

function inferCity(name: string) {
  const city = cityKeywords.find((keyword) => name.includes(keyword));
  if (city) return city;
  return name.slice(0, 2) || '杭州';
}

function getLandYearLabel(landDate: string) {
  const year = Number.parseInt(landDate.slice(0, 4), 10);
  if (!year || year <= 2021) return '2021年及以前';
  return `${year}年`;
}

function getSalesStatus(rawStatus: string, landDate: string) {
  const year = Number.parseInt(landDate.slice(0, 4), 10);
  if (year >= 2025) return '当年首开';
  if (rawStatus === '售罄') return '尾盘';
  return '续销';
}

function matchesFilter(project: ProjectRecord, filterLabel?: string) {
  if (!filterLabel) return true;

  if (filterLabel === '当年首开' || filterLabel === '续销' || filterLabel === '尾盘') {
    return project.status === filterLabel;
  }

  const normalizedLandYear = filterLabel.replace('拿地', '');
  if (normalizedLandYear.includes('年')) {
    return project.landYear === normalizedLandYear;
  }

  return project.city === filterLabel;
}

function getRollingMonthLabels(count = 6) {
  const currentMonth = new Date().getMonth() + 1;
  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;
    const month = ((currentMonth - offset - 1 + 12) % 12) + 1;
    return `${month}月`;
  });
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekRangeLabel(endLabel: string) {
  const [monthText, dayText] = endLabel.split('/');
  const month = Number(monthText);
  const day = Number(dayText);
  const currentYear = new Date().getFullYear();
  const endDate = new Date(currentYear, month - 1, day);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 6);
  return `${formatMonthDay(startDate)}-${formatMonthDay(endDate)}`;
}

function hasIndicatorData(project: ProjectRecord, indicatorType: IndicatorType) {
  if (indicatorType === '协议') {
    return project.agreementUnits > 0 || project.agreementAmount > 0;
  }

  return project.contractUnits > 0 || project.contractAmount > 0;
}

export function getVisibleProjects(
  period: Period,
  indicatorType: IndicatorType,
  filterLabel?: string,
  propertyType: PropertyType = '住宅'
) {
  return getProjects(period, filterLabel, propertyType).filter((project) => hasIndicatorData(project, indicatorType));
}

function buildProjectDetails(project: ProjectRecord, period: Period): MonthlyDetail[] {
  const yearLabels = getRollingMonthLabels(6);
  const yearRatios = yearLabels.map((_, index) => index + 1);
  const yearRatioSum = yearRatios.reduce((sum, value) => sum + value, 0);
  const weekEndLabels = ['2/09', '2/16', '2/23', '3/02', '3/09', '3/16'];

  const templates: Record<Period, { labels: string[]; ratios: number[] }> = {
    当年: {
      labels: yearLabels,
      ratios: yearRatios.map((value) => value / yearRatioSum),
    },
    当月: {
      labels: weekEndLabels.map(getWeekRangeLabel),
      ratios: [0.14, 0.17, 0.18, 0.18, 0.15, 0.18],
    },
    当日: {
      labels: ['3/13', '3/14', '3/15', '3/16', '3/17', '3/18', '3/19'],
      ratios: [0.11, 0.13, 0.15, 0.16, 0.14, 0.15, 0.16],
    },
  };

  const template = templates[period];
  const avgPrice = project.contractUnits > 0 ? Number((project.contractAmount / project.contractUnits).toFixed(1)) : 0;

  return template.labels.map((label, index) => {
    const ratio = template.ratios[index] ?? 0;
    return {
      month: label,
      agreementUnits: Math.round(project.agreementUnits * ratio),
      contractUnits: Math.round(project.contractUnits * ratio),
      avgPrice,
      totalPayment: Math.round(project.totalPayment * ratio),
      cashPayment: Math.round(project.cashPayment * ratio),
      loanPayment: Math.round(project.loanPayment * ratio),
    };
  });
}

function buildImportedResidentialProjects(period: Period): ProjectRecord[] {
  const sourceByPeriod = {
    当年: importedAnnualResidentialProjects,
    当月: importedMonthlyResidentialProjects,
    当日: importedDailyResidentialProjects,
  } satisfies Record<Period, typeof importedAnnualResidentialProjects>;

  return sourceByPeriod[period].map(([
    id,
    name,
    landDate,
    rawStatus,
    agreementUnits,
    agreementAmount,
    contractUnits,
    contractAmount,
    totalPayment,
    loanPayment,
    cashPayment,
  ]) => {
    const project: ProjectRecord = {
      id,
      name,
      landDate: landDate || '2024-01-01',
      agreementUnits,
      agreementAmount,
      contractUnits,
      contractAmount,
      cashPayment,
      loanPayment,
      totalPayment,
      city: inferCity(name),
      status: getSalesStatus(rawStatus, landDate || ''),
      landYear: getLandYearLabel(landDate || ''),
    };

    project.monthlyDetails = buildProjectDetails(project, period);
    return project;
  });
}

projectsByPeriodAndType.住宅 = {
  当年: buildImportedResidentialProjects('当年'),
  当月: buildImportedResidentialProjects('当月'),
  当日: buildImportedResidentialProjects('当日'),
};

export function getProjects(period: Period, filterLabel?: string, propertyType: PropertyType = '住宅') {
  const allProjects = projectsByPeriodAndType[propertyType][period];

  return allProjects.filter((project) => matchesFilter(project, filterLabel));
}

export function getTotals(projects: ProjectRecord[]) {
  return {
    agreementUnits: projects.reduce((sum, project) => sum + project.agreementUnits, 0),
    agreementAmount: projects.reduce((sum, project) => sum + project.agreementAmount, 0),
    contractUnits: projects.reduce((sum, project) => sum + project.contractUnits, 0),
    contractAmount: projects.reduce((sum, project) => sum + project.contractAmount, 0),
    cashPayment: projects.reduce((sum, project) => sum + project.cashPayment, 0),
    loanPayment: projects.reduce((sum, project) => sum + project.loanPayment, 0),
    totalPayment: projects.reduce((sum, project) => sum + project.totalPayment, 0),
  };
}

/**
 * Get overview metrics for selected property type and indicator
 * Filters by property type first, then returns metrics
 */
export function getOverviewMetrics(period: Period, indicatorType: IndicatorType, propertyType: PropertyType = '住宅') {
  const totals = getTotals(getVisibleProjects(period, indicatorType, undefined, propertyType));

  return indicatorType === '协议'
    ? { value1: totals.agreementUnits, value2: totals.agreementAmount, percentage: overviewChangeRate[period].协议 }
    : { value1: totals.contractUnits, value2: totals.contractAmount, percentage: overviewChangeRate[period].合同 };
}

/**
 * Get trend data for selected property type
 * Filters cascade: propertyType → indicatorType → metricType → filterLabel
 */
export function getTrendData(period: Period, indicatorType: IndicatorType, metricType: MetricType, filterLabel?: string, propertyType: PropertyType = '住宅') {
  const totals = getTotals(getVisibleProjects(period, indicatorType, filterLabel, propertyType));
  const selectedValue = metricType === '套数'
    ? (indicatorType === '协议' ? totals.agreementUnits : totals.contractUnits)
    : (indicatorType === '协议' ? totals.agreementAmount : totals.contractAmount);

  const trendTemplates: Record<Period, { labels: string[]; actualRatios: number[]; targetRatios: number[] }> = {
    当年: {
      labels: getRollingMonthLabels(6),
      actualRatios: [],
      targetRatios: [],
    },
    当月: {
      labels: ['2/09', '2/16', '2/23', '3/02', '3/09', '3/16'].map(getWeekRangeLabel),
      actualRatios: [0.14, 0.31, 0.48, 0.66, 0.82, 1],
      targetRatios: [0.15, 0.33, 0.52, 0.7, 0.86, 1.04],
    },
    当日: {
      labels: ['3/13', '3/14', '3/15', '3/16', '3/17', '3/18', '3/19'],
      actualRatios: [0.1, 0.24, 0.39, 0.55, 0.7, 0.86, 1],
      targetRatios: [0.12, 0.27, 0.43, 0.6, 0.76, 0.92, 1.05],
    },
  };

  const template = trendTemplates[period];
  if (period === '当年') {
    const weights = template.labels.map((_, index) => index + 1);
    const totalWeight = weights.reduce((sum, value) => sum + value, 0);
    template.actualRatios = weights.map((_, index) =>
      weights.slice(0, index + 1).reduce((sum, value) => sum + value, 0) / totalWeight
    );
    template.targetRatios = template.actualRatios.map((ratio, index) => {
      const nextRatio = Math.min(1, ratio + 0.04 - index * 0.003);
      return nextRatio;
    });
  }

  return template.labels.map((date, index) => ({
    date,
    actual: Math.round(selectedValue * (template.actualRatios[index] ?? 0)),
    target: Math.round(selectedValue * (template.targetRatios[index] ?? 0)),
  }));
}

export function getFilterCategorySummaries(period: Period, indicatorType: IndicatorType, propertyType: PropertyType = '住宅') {
  const projects = getVisibleProjects(period, indicatorType, undefined, propertyType);
  const amountKey = indicatorType === '协议' ? 'agreementAmount' : 'contractAmount';
  const countKey = indicatorType === '协议' ? 'agreementUnits' : 'contractUnits';

  const summarize = (label: string, items: ProjectRecord[]): FilterSummary => ({
    label,
    count: items.reduce((sum, project) => sum + project[countKey], 0),
    amount: Math.round(items.reduce((sum, project) => sum + project[amountKey], 0) / 1000) / 10,
  });

  return {
    status: [
      summarize('当年首开', projects.filter((project) => project.status === '当年首开')),
      summarize('续销', projects.filter((project) => project.status === '续销')),
      summarize('尾盘', projects.filter((project) => project.status === '尾盘')),
    ],
    landYear: ['2021年及以前', '2022年', '2023年', '2024年', '2025年', '2026年'].map((label) =>
      summarize(`${label}拿地`, projects.filter((project) => project.landYear === label))
    ),
    city: ['北京', '上海', '深圳', '南京', '苏州', '杭州', '成都', '重庆']
      .map((label) => summarize(label, projects.filter((project) => project.city === label)))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * Get group-level aggregated totals across all property types (集团汇总)
 * Combines residential (住宅), commercial (商办), and parking (车储) data
 */
export function getGroupTotals(period: Period) {
  const residentialTotals = getTotals(getProjects(period, undefined, '住宅'));
  const commercialTotals = getTotals(getProjects(period, undefined, '商办'));
  const parkingTotals = getTotals(getProjects(period, undefined, '车储'));
  
  return {
    agreementUnits: residentialTotals.agreementUnits + commercialTotals.agreementUnits + parkingTotals.agreementUnits,
    agreementAmount: residentialTotals.agreementAmount + commercialTotals.agreementAmount + parkingTotals.agreementAmount,
    contractUnits: residentialTotals.contractUnits + commercialTotals.contractUnits + parkingTotals.contractUnits,
    contractAmount: residentialTotals.contractAmount + commercialTotals.contractAmount + parkingTotals.contractAmount,
    cashPayment: residentialTotals.cashPayment + commercialTotals.cashPayment + parkingTotals.cashPayment,
    loanPayment: residentialTotals.loanPayment + commercialTotals.loanPayment + parkingTotals.loanPayment,
    totalPayment: residentialTotals.totalPayment + commercialTotals.totalPayment + parkingTotals.totalPayment,
  };
}

export function getDefaultVisibleFields(indicatorType: IndicatorType) {
  return ['套数', '金额'];
}

export function getProjectDetail(projectId: string, period: Period, propertyType: PropertyType = '住宅') {
  const projects = getProjects(period, undefined, propertyType);
  return projects.find(p => p.id === projectId);
}
