import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Calendar, MoreHorizontal, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from 'recharts';
import { getProjectDetail, type Period, type IndicatorType, type MetricType, type PropertyType } from '../mock/dashboardData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

type BusinessCategory = '协议' | '合同' | '来访';

interface RealLayoutRow {
  secondbusinesstypecode?: string;
  secondbusinesstypename?: string;
  housetype?: string;
  staticsDate?: string;
  zset?: number;
  pushRoomQty?: number;
  saleOrderQty?: number;
  saleContractQty?: number;
  wssetOrder?: number;
  wssetContract?: number;
}

interface RealLayoutSummary {
  label: string;
  secondaryType: string;
  count: number;
  amount: number;
  inventory: number;
}

interface RealVersionTrendRow {
  labelName?: number;
  contractAmtTargetMonth?: number;
  contractAmtMonth?: number;
  contractQtyTargetMonth?: number;
  contractQtyMonth?: number;
}

interface RealSalesTrendRow {
  labelName?: string;
  kcQty?: number;
  monthAvgQty?: number;
}

interface RealVisitOrderRow {
  date?: string;
  type?: string;
  value?: number;
}

interface RealPhaseRow {
  phaseCode?: string;
  phaseName?: string;
}

const FALLBACK_LAYOUT_DEFINITIONS = [
  { label: '中高层128A-3', secondaryType: '中高层', ratio: 0.052 },
  { label: '中高层106b-4', secondaryType: '中高层', ratio: 0.049 },
  { label: '中高层109B-5', secondaryType: '中高层', ratio: 0.061 },
  { label: '中高层139A-10', secondaryType: '中高层', ratio: 0.073 },
  { label: '中高层139a-11', secondaryType: '中高层', ratio: 0.067 },
  { label: '中高层164A-6', secondaryType: '中高层', ratio: 0.081 },
  { label: '中高层162A-7', secondaryType: '中高层', ratio: 0.075 },
  { label: '中高层139B-12', secondaryType: '中高层', ratio: 0.069 },
  { label: '中高层106a-2', secondaryType: '中高层', ratio: 0.047 },
  { label: '中高层109A-1', secondaryType: '中高层', ratio: 0.057 },
  { label: '中高层165A-9', secondaryType: '中高层', ratio: 0.084 },
  { label: '地库标准车位', secondaryType: '地下车位', ratio: 0.138 },
  { label: '地库子母车位', secondaryType: '地下车位', ratio: 0.112 },
] as const;

const normalizeSecondaryType = (value?: string) => {
  if (!value) {
    return '中高层';
  }

  if (value.includes('车位')) {
    return '地下车位';
  }

  return '中高层';
};

const toNumber = (value: number | string | undefined) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const VERSION_CODE_MAP = {
  '年度经营计划版': 4,
  '首开定价会版': 5,
  '全景会版': 2,
  '经营策划会版': 1,
  '交底会版': 0,
} as const;

const today = new Date();

interface ProjectDetailProps {
  projectId: string;
  projectName?: string;
  period?: Period;
  propertyType?: PropertyType;
  onBack: () => void;
}

export default function ProjectDetail({
  projectId,
  projectName,
  period: initialPeriod = '当年',
  propertyType: initialPropertyType = '住宅',
  onBack,
}: ProjectDetailProps) {
  const allPhaseOption = '全盘';
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [phase, setPhase] = useState(allPhaseOption);
  const [propertyType, setPropertyType] = useState<PropertyType>(initialPropertyType);
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>('合同');
  const [metricType, setMetricType] = useState<MetricType>('套数');
  const [selectedSecondaryType, setSelectedSecondaryType] = useState('全部');
  const [selectedVersion, setSelectedVersion] = useState<'年度经营计划版' | '首开定价会版' | '全景会版' | '经营策划会版' | '交底会版'>('年度经营计划版');
  const [selectedLayout, setSelectedLayout] = useState('全部已售');
  const [realLayoutRows, setRealLayoutRows] = useState<RealLayoutRow[] | null>(null);
  const [realVersionTrendRows, setRealVersionTrendRows] = useState<RealVersionTrendRow[] | null>(null);
  const [realSalesTrendRows, setRealSalesTrendRows] = useState<RealSalesTrendRow[] | null>(null);
  const [realVisitOrderRows, setRealVisitOrderRows] = useState<RealVisitOrderRow[] | null>(null);
  const [realPhaseRows, setRealPhaseRows] = useState<RealPhaseRow[] | null>(null);
  const layoutScrollRef = useRef<HTMLDivElement | null>(null);
  const layoutCardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const secondaryTypeOptionsByPropertyType: Record<PropertyType, string[]> = {
    住宅: ['全部', '中高层'],
    商办: ['全部', '中高层'],
    车储: ['全部', '地下车位'],
  };
  
  // Generate unique ID for gradient
  const uniqueId = useMemo(() => Math.random().toString(36).substring(2, 9), []);

  useEffect(() => {
    setPropertyType(initialPropertyType);
  }, [initialPropertyType]);

  const isFullScopeOnlyCategory = businessCategory === '来访';
  const indicatorType: IndicatorType = businessCategory === '协议' ? '协议' : '合同';

  useEffect(() => {
    if (!isFullScopeOnlyCategory) {
      return;
    }

    setPhase(allPhaseOption);
    setSelectedSecondaryType('全部');
    setSelectedLayout('全部已售');
    if (metricType === '金额' && businessCategory === '来访') {
      setMetricType('套数');
    }
  }, [businessCategory, isFullScopeOnlyCategory, metricType]);

  const selectedPhaseCode = phase === allPhaseOption
    ? ''
    : realPhaseRows?.find((item) => item.phaseName === phase)?.phaseCode ?? '';

  const layoutStaticsType = period === '当月' ? 2 : 1;

  useEffect(() => {
    let cancelled = false;

    const fetchRealPhases = async () => {
      try {
        const response = await fetch(`/api/project-phases?projectCode=${encodeURIComponent(projectId)}`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const rows = Array.isArray(payload?.responseData) ? payload.responseData : [];

        if (!cancelled) {
          setRealPhaseRows(rows);
        }
      } catch {
        if (!cancelled) {
          setRealPhaseRows(null);
        }
      }
    };

    fetchRealPhases();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    const fetchRealLayoutRows = async () => {
      try {
        const response = await fetch(
          `/api/project-layout-analysis?projectCode=${encodeURIComponent(projectId)}&stageCode=${encodeURIComponent(selectedPhaseCode)}&staticsType=${layoutStaticsType}`
        );
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const rows = Array.isArray(payload?.responseData) ? payload.responseData : [];

        if (!cancelled) {
          setRealLayoutRows(rows);
        }
      } catch {
        if (!cancelled) {
          setRealLayoutRows(null);
        }
      }
    };

    fetchRealLayoutRows();

    return () => {
      cancelled = true;
    };
  }, [projectId, selectedPhaseCode, layoutStaticsType]);

  useEffect(() => {
    let cancelled = false;

    const fetchRealVisitOrderRows = async () => {
      try {
        const response = await fetch(`/api/project-visit-order-trend?projectCodes=${encodeURIComponent(projectId)}`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const rows = Array.isArray(payload?.responseData) ? payload.responseData : [];

        if (!cancelled) {
          setRealVisitOrderRows(rows);
        }
      } catch {
        if (!cancelled) {
          setRealVisitOrderRows(null);
        }
      }
    };

    fetchRealVisitOrderRows();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    const fetchRealVersionTrendRows = async () => {
      try {
        const staticsVersion = VERSION_CODE_MAP[selectedVersion];
        const response = await fetch(
          `/api/project-version-trend?projectCode=${encodeURIComponent(projectId)}&staticsVersion=${staticsVersion}`
        );
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const rows = Array.isArray(payload?.responseData) ? payload.responseData : [];

        if (!cancelled) {
          setRealVersionTrendRows(rows);
        }
      } catch {
        if (!cancelled) {
          setRealVersionTrendRows(null);
        }
      }
    };

    fetchRealVersionTrendRows();

    return () => {
      cancelled = true;
    };
  }, [projectId, selectedVersion]);

  useEffect(() => {
    let cancelled = false;

    const fetchRealSalesTrendRows = async () => {
      try {
        const response = await fetch(
          `/api/project-sales-trend?projectCode=${encodeURIComponent(projectId)}&dateType=1&stageCode=${encodeURIComponent(selectedPhaseCode)}`
        );
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const rows = Array.isArray(payload?.responseData) ? payload.responseData : [];

        if (!cancelled) {
          setRealSalesTrendRows(rows);
        }
      } catch {
        if (!cancelled) {
          setRealSalesTrendRows(null);
        }
      }
    };

    fetchRealSalesTrendRows();

    return () => {
      cancelled = true;
    };
  }, [projectId, selectedPhaseCode]);

  // Get project data from dashboardData
  const project = getProjectDetail(projectId, period, propertyType) ?? getProjectDetail(projectId, period, '住宅');
  
  if (!project) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <p className="text-[#8c8c8c]">项目数据未找到</p>
      </div>
    );
  }

  const projectTitle = projectName || project.name;
  const projectUnits = indicatorType === '协议' ? project.agreementUnits : project.contractUnits;
  const projectAmount = indicatorType === '协议' ? project.agreementAmount : project.contractAmount;
  const latestRealLayoutRows = !realLayoutRows || realLayoutRows.length === 0
    ? []
    : (() => {
        const latestDate = realLayoutRows
          .map((item) => item.staticsDate ?? '')
          .filter(Boolean)
          .sort()
          .at(-1);

        return latestDate ? realLayoutRows.filter((item) => item.staticsDate === latestDate) : [];
      })();
  const hasMeaningfulRealLayoutData = latestRealLayoutRows.some((item) => {
    const soldCount = indicatorType === '协议' ? toNumber(item.saleOrderQty) : toNumber(item.saleContractQty);
    const inventoryCount = indicatorType === '协议' ? toNumber(item.wssetOrder) : toNumber(item.wssetContract);
    return soldCount > 0 || inventoryCount > 0;
  });

  const realSecondaryTypeSummaries = !hasMeaningfulRealLayoutData
    ? []
    : (() => {

        const totals = new Map<string, { count: number; inventory: number }>();

        latestRealLayoutRows.forEach((item) => {
          const label = normalizeSecondaryType(item.secondbusinesstypename);
          const isAggregateRow = item.housetype === '-' || item.housetype === '合计';
          if (!isAggregateRow) {
            return;
          }

          totals.set(label, {
            count: indicatorType === '协议' ? toNumber(item.saleOrderQty) : toNumber(item.saleContractQty),
            inventory: indicatorType === '协议' ? toNumber(item.wssetOrder) : toNumber(item.wssetContract),
          });
        });

        const structured = [
          { label: '中高层', count: totals.get('中高层')?.count ?? 0, inventory: totals.get('中高层')?.inventory ?? 0 },
          { label: '地下车位', count: totals.get('地下车位')?.count ?? 0, inventory: totals.get('地下车位')?.inventory ?? 0 },
        ];
        const totalCount = structured.reduce((sum, item) => sum + item.count, 0);
        const totalInventory = structured.reduce((sum, item) => sum + item.inventory, 0);

        return [
          { label: '全部', count: totalCount, amount: projectAmount, inventory: totalInventory },
          ...structured.map((item) => ({
            label: item.label,
            count: item.count,
            amount: totalCount > 0 ? Math.round(projectAmount * (item.count / totalCount)) : 0,
            inventory: item.inventory,
          })),
        ];
      })();

  const secondaryTypeSummaries = realSecondaryTypeSummaries.length > 0
    ? realSecondaryTypeSummaries
    : [
        { label: '全部', count: projectUnits, amount: projectAmount, inventory: Math.round(projectUnits * 0.23) },
        { label: '中高层', count: Math.round(projectUnits * 0.84), amount: Math.round(projectAmount * 0.82), inventory: Math.round(projectUnits * 0.19) },
        { label: '地下车位', count: Math.round(projectUnits * 0.16), amount: Math.round(projectAmount * 0.18), inventory: Math.round(projectUnits * 0.44) },
      ];
  const secondaryTypeOptions = secondaryTypeOptionsByPropertyType[propertyType];
  const propertySecondaryValue = `${propertyType}|${selectedSecondaryType}`;

  const realLayoutSummaries: RealLayoutSummary[] = !hasMeaningfulRealLayoutData
    ? []
    : (() => {

        const layoutRows = latestRealLayoutRows
          .filter((item) => item.housetype && item.housetype !== '-' && item.housetype !== '合计')
          .map((item) => ({
            label: item.housetype as string,
            secondaryType: normalizeSecondaryType(item.secondbusinesstypename),
            count: indicatorType === '协议' ? toNumber(item.saleOrderQty) : toNumber(item.saleContractQty),
            amount: 0,
            inventory: indicatorType === '协议' ? toNumber(item.wssetOrder) : toNumber(item.wssetContract),
          }))
          .filter((item) => item.count > 0 || item.inventory > 0);

        const selectedSummary = secondaryTypeSummaries.find((item) => item.label === selectedSecondaryType);
        const allSummaryCount = selectedSummary?.count ?? projectUnits;
        const allSummaryAmount = selectedSummary?.amount ?? projectAmount;

        return [
          {
            label: '全部已售',
            secondaryType: selectedSecondaryType,
            count: allSummaryCount,
            amount: allSummaryAmount,
            inventory: selectedSummary?.inventory ?? Math.round(allSummaryCount * 0.23),
          },
          ...layoutRows.map((item) => ({
            ...item,
            amount: allSummaryCount > 0 ? Math.round(allSummaryAmount * (item.count / allSummaryCount)) : 0,
          })),
        ];
      })();

  const layoutSummaries = realLayoutSummaries.length > 0
    ? realLayoutSummaries
    : [
        {
          label: '全部已售',
          secondaryType: selectedSecondaryType,
          count: selectedSecondaryType === '全部' ? projectUnits : secondaryTypeSummaries.find((item) => item.label === selectedSecondaryType)?.count ?? projectUnits,
          amount: selectedSecondaryType === '全部' ? projectAmount : secondaryTypeSummaries.find((item) => item.label === selectedSecondaryType)?.amount ?? projectAmount,
          inventory: selectedSecondaryType === '全部'
            ? Math.round(projectUnits * 0.23)
            : secondaryTypeSummaries.find((item) => item.label === selectedSecondaryType)?.inventory ?? Math.round(projectUnits * 0.23),
        },
        ...FALLBACK_LAYOUT_DEFINITIONS.map((item) => ({
          label: item.label,
          secondaryType: item.secondaryType,
          count: Math.max(1, Math.round(projectUnits * item.ratio)),
          amount: Math.max(1, Math.round(projectAmount * (item.ratio + 0.004))),
          inventory: Math.max(0, Math.round(projectUnits * item.ratio * 0.23)),
        })),
      ];
  const filteredLayoutSummaries = layoutSummaries.filter(
    (item) => item.label === '全部已售' || selectedSecondaryType === '全部' || item.secondaryType === selectedSecondaryType
  );
  const selectedSecondarySummary = secondaryTypeSummaries.find((item) => item.label === selectedSecondaryType);
  const selectedSecondaryInventory = selectedSecondarySummary?.inventory
    ?? secondaryTypeSummaries.find((item) => item.label === '全部')?.inventory
    ?? Math.round(projectUnits * 0.23);
  const phaseOptions = realPhaseRows && realPhaseRows.length > 0
    ? [allPhaseOption, ...realPhaseRows.map((item) => item.phaseName).filter((item): item is string => Boolean(item))]
    : [allPhaseOption, '一期', '二期', '三期'];
  const latestRealSalesTrend = !realSalesTrendRows || realSalesTrendRows.length === 0
    ? null
    : [...realSalesTrendRows]
        .sort((a, b) => String(a.labelName ?? '').localeCompare(String(b.labelName ?? '')))
        .at(-1) ?? null;

  // Generate title based on period
  const periodTitle = {
    当日: '近7日流速趋势',
    当月: '近6周流速趋势',
    当年: '近6个月流速趋势',
  };

  const rollingMonthLabels = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    return `${date.getMonth() + 1}月`;
  });

  const mockAnnualTrendData = [
    { month: rollingMonthLabels[0], target: 60, actual: 62, visits: 280 },
    { month: rollingMonthLabels[1], target: 68, actual: 65, visits: 310 },
    { month: rollingMonthLabels[2], target: 72, actual: 78, visits: 350 },
    { month: rollingMonthLabels[3], target: 75, actual: 82, visits: 380 },
    { month: rollingMonthLabels[4], target: 78, actual: 72, visits: 340 },
    { month: rollingMonthLabels[5], target: 80, actual: 75, visits: 360 },
  ];
  const baseTrendData = period === '当年' ? mockAnnualTrendData : period === '当月' ? [
    { month: '2/03-2/09', target: 140, actual: 135, visits: 45 },
    { month: '2/10-2/16', target: 150, actual: 155, visits: 52 },
    { month: '2/17-2/23', target: 160, actual: 165, visits: 55 },
    { month: '2/24-3/02', target: 170, actual: 175, visits: 58 },
    { month: '3/03-3/09', target: 165, actual: 160, visits: 53 },
    { month: '3/10-3/16', target: 175, actual: 180, visits: 60 },
  ] : [
    { month: '3/10', target: 25, actual: 27, visits: 12 },
    { month: '3/11', target: 23, actual: 24, visits: 10 },
    { month: '3/12', target: 28, actual: 30, visits: 13 },
    { month: '3/13', target: 30, actual: 32, visits: 14 },
    { month: '3/14', target: 29, actual: 28, visits: 12 },
    { month: '3/15', target: 32, actual: 35, visits: 15 },
    { month: '3/16', target: 31, actual: 30, visits: 13 },
  ];
  const realDailyVisitsByDate = !realVisitOrderRows || realVisitOrderRows.length === 0
    ? new Map<string, number>()
    : (() => {
        const visitMap = new Map<string, number>();

        realVisitOrderRows.forEach((item) => {
          const date = item.date ?? '';
          if (!date) {
            return;
          }

          if (item.type === '来访') {
            visitMap.set(date, toNumber(item.value));
          }
        });

        return visitMap;
      })();

  const realAnnualTrendData = !realVersionTrendRows || realVersionTrendRows.length === 0
    ? []
    : realVersionTrendRows
        .filter((item) => {
          const label = toNumber(item.labelName);
          if (!label) {
            return false;
          }

          const year = Math.floor(label / 100);
          const month = label % 100;
          const itemDate = new Date(year, month - 1, 1);
          const startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
          const endDate = new Date(today.getFullYear(), today.getMonth(), 1);
          return itemDate >= startDate && itemDate <= endDate;
        })
        .sort((a, b) => toNumber(a.labelName) - toNumber(b.labelName))
        .map((item, index) => {
          const label = String(item.labelName);
          const month = Number.parseInt(label.slice(4, 6), 10);
          return {
            month: `${month}月`,
            target: toNumber(item.contractQtyTargetMonth),
            actual: toNumber(item.contractQtyMonth),
            actualAmount: toNumber(item.contractAmtMonth),
            targetAmount: toNumber(item.contractAmtTargetMonth),
            visits: mockAnnualTrendData[index]?.visits ?? 0,
          };
        });

  const versionAdjustedData = period === '当年' && indicatorType === '合同' && realAnnualTrendData.length > 0
    ? realAnnualTrendData.map((item) => ({
        month: item.month,
        target: item.target,
        actual: item.actual,
        visits: item.visits,
      }))
    : baseTrendData;
  const totalVisits = versionAdjustedData.reduce((sum, item) => sum + item.visits, 0);
  const fullScopeLayoutSummary = {
    label: '全盘',
    count: businessCategory === '来访'
      ? totalVisits
      : businessCategory === '认购'
        ? project.agreementUnits
        : projectUnits,
    amount: businessCategory === '来访' ? 0 : projectAmount,
    inventory: businessCategory === '来访' ? 0 : Math.round(project.agreementUnits * 0.23),
  };
  const displayedLayoutSummaries = isFullScopeOnlyCategory ? [fullScopeLayoutSummary] : filteredLayoutSummaries;

  const isAllLayoutSelected = isFullScopeOnlyCategory || selectedLayout === '全部已售';
  const activeTrendRatio =
    !isAllLayoutSelected
      ? (filteredLayoutSummaries.find((item) => item.label === selectedLayout)?.count ?? projectUnits) / Math.max(projectUnits, 1)
      : (secondaryTypeSummaries.find((item) => item.label === selectedSecondaryType)?.count ?? projectUnits) / Math.max(projectUnits, 1);
  
  const layoutMultiplier = isAllLayoutSelected && selectedSecondaryType === '全部' ? 1 : activeTrendRatio;
  
  const trendData = versionAdjustedData.map((item, index) => {
    if (isAllLayoutSelected && selectedSecondaryType === '全部') {
      return {
        ...item,
        visits: period === '当日' && realDailyVisitsByDate.has(item.month) ? realDailyVisitsByDate.get(item.month) ?? item.visits : item.visits,
      };
    }

    const factor = layoutMultiplier + ((index % 3) - 1) * 0.03;
    return {
      ...item,
      target: Math.round(item.target * (period === '当年' ? factor : Math.max(0.78, factor))),
      actual: Math.round(item.actual * factor),
      // 来访组数优先使用 6249 的真实值，户型筛选时保持项目级口径不缩放
      visits: period === '当日' && realDailyVisitsByDate.has(item.month) ? realDailyVisitsByDate.get(item.month) ?? item.visits : item.visits,
    };
  });

  const estimatedPrices = trendData.map((_, index) => 315 + (index % 4) * 6);
  const realAmountTrendData = period === '当年' && indicatorType === '合同' && realAnnualTrendData.length > 0
    ? trendData.map((item, index) => ({
        ...item,
        target: Math.round((realAnnualTrendData[index]?.targetAmount ?? 0) * (item.target / Math.max(realAnnualTrendData[index]?.target ?? 1, 1))),
        actual: Math.round((realAnnualTrendData[index]?.actualAmount ?? 0) * (item.actual / Math.max(realAnnualTrendData[index]?.actual ?? 1, 1))),
      }))
    : null;
  const amountTrendData = realAmountTrendData ?? trendData.map((item, index) => ({
    ...item,
    target: Math.round(item.target * estimatedPrices[index]),
    actual: Math.round(item.actual * estimatedPrices[index]),
  }));
  const visitTrendData = trendData.map((item) => ({
    ...item,
    target: 0,
    actual: item.visits,
  }));
  const purchaseUnitTrendData = trendData.map((item) => ({
    ...item,
    target: item.target,
    actual: item.actual,
  }));
  const purchaseAmountTrendData = amountTrendData.map((item) => ({
    ...item,
    target: item.target,
    actual: item.actual,
  }));
  const chartData = businessCategory === '来访'
    ? visitTrendData
    : metricType === '金额'
        ? amountTrendData
        : trendData;
  const derivedAmounts = trendData.map((item, index) => Math.round(item.actual * estimatedPrices[index]));
  const contractAmountSeries = amountTrendData.map((item) => item.actual);
  const totalPaymentSeries = contractAmountSeries.map((value) => Math.round(value * 0.92));
  const cashPaymentSeries = contractAmountSeries.map((value) => Math.round(value * 0.46));
  const mortgagePaymentSeries = totalPaymentSeries.map((value, index) => Math.max(value - cashPaymentSeries[index], 0));
  const averagePriceSeries = trendData.map((item, index) => {
    const units = Math.max(item.actual, 1);
    return Math.round((contractAmountSeries[index] / units) * 10) / 10;
  });
  const detailData: Array<{ indicator: string; values: Array<number | string> }> = businessCategory === '来访'
    ? [
        {
          indicator: '来访组数',
          values: visitTrendData.map((item) => item.actual.toLocaleString()),
        },
      ]
    : [
          {
            indicator: `${indicatorType}套数`,
            values: trendData.map((item) => item.actual.toLocaleString()),
          },
          {
            indicator: `${indicatorType}金额`,
            values: contractAmountSeries.map((value) => value.toLocaleString()),
          },
          {
            indicator: '成交均价',
            values: averagePriceSeries.map((value) => value.toLocaleString()),
          },
          {
            indicator: '回款合计',
            values: totalPaymentSeries.map((value) => value.toLocaleString()),
          },
          {
            indicator: '回款现金',
            values: cashPaymentSeries.map((value) => value.toLocaleString()),
          },
          {
            indicator: '回款按揭',
            values: mortgagePaymentSeries.map((value) => value.toLocaleString()),
          },
        ];

  const parsePeriodLabel = (label: string, period: Period) => {
    if (period === '当年' && label.includes('月')) {
      const month = Number.parseInt(label.replace('月', ''), 10);
      const currentMonth = today.getMonth() + 1;
      const year = month <= currentMonth ? today.getFullYear() : today.getFullYear() - 1;
      return year * 100 + month;
    }

    const [startLabel] = label.split('-');
    if (startLabel.includes('/')) {
      const [month, day] = startLabel.split('/').map(Number);
      const currentMonth = today.getMonth() + 1;
      const year = month <= currentMonth ? today.getFullYear() : today.getFullYear() - 1;
      return year * 10000 + month * 100 + day;
    }
    
    return Number.NEGATIVE_INFINITY;
  };

  const detailColumns = chartData
    .map((item, index) => ({
      month: item.month,
      sortKey: parsePeriodLabel(item.month, period),
      values: detailData.map((row) => row.values[index]),
    }))
    .sort((a, b) => b.sortKey - a.sortKey);

  const sortedMonths = detailColumns.map((column) => column.month);
  const sortedDetailData = detailData.map((row, rowIndex) => ({
    ...row,
    values: detailColumns.map((column) => column.values[rowIndex]),
  }));

  const averageTarget = Math.round(chartData.reduce((sum, d) => sum + d.target, 0) / chartData.length);
  const averageActual = Math.round(chartData.reduce((sum, d) => sum + d.actual, 0) / chartData.length);
  const realMonthAvgQty = toNumber(latestRealSalesTrend?.monthAvgQty);
  const scaledMonthAvgQty = realMonthAvgQty > 0
    ? Math.round(realMonthAvgQty * layoutMultiplier * 10) / 10
    : averageActual;
  const averageActualDisplay = metricType === '套数' ? scaledMonthAvgQty : averageActual;
  const inventory = isAllLayoutSelected && selectedSecondaryType === '全部' && toNumber(latestRealSalesTrend?.kcQty) > 0
    ? toNumber(latestRealSalesTrend?.kcQty)
    : selectedSecondaryInventory;
  const trendScopeLabel = isFullScopeOnlyCategory ? `全盘${businessCategory}` : !isAllLayoutSelected ? selectedLayout : '';
  const trendTitle = businessCategory === '来访'
    ? `${periodTitle[period].replace('流速趋势', '来访组数')}`
    : `${periodTitle[period]}${trendScopeLabel ? `-${trendScopeLabel}` : ''}`;
  const detailTitle = `${trendScopeLabel || '全盘'}明细`;
  const fullScopeNotice = businessCategory === '来访'
    ? '当前项目来访数据仅提供全盘口径，已自动禁用分期、业态/户型筛选。'
    : '';
  const updateSelectedLayoutByScroll = () => {
    if (isFullScopeOnlyCategory) {
      return;
    }

    const container = layoutScrollRef.current;
    if (!container || filteredLayoutSummaries.length === 0) {
      return;
    }

    const firstLabel = filteredLayoutSummaries[0]?.label ?? '全部已售';
    // 左滑回到起点时，优先选中第一张卡（全部已售）
    if (container.scrollLeft <= 8) {
      setSelectedLayout((prev) => (prev === firstLabel ? prev : firstLabel));
      return;
    }

    const centerX = container.scrollLeft + container.clientWidth / 2;
    let closestLabel = firstLabel;
    let minDistance = Number.POSITIVE_INFINITY;

    filteredLayoutSummaries.forEach((option) => {
      const card = layoutCardRefs.current[option.label];
      if (!card) {
        return;
      }

      const cardCenterX = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenterX - centerX);
      if (distance < minDistance) {
        minDistance = distance;
        closestLabel = option.label;
      }
    });

    setSelectedLayout((prev) => (prev === closestLabel ? prev : closestLabel));
  };

  const scrollLayoutCardIntoView = (label: string, behavior: ScrollBehavior = 'smooth') => {
    const container = layoutScrollRef.current;
    const card = layoutCardRefs.current[label];
    if (!container || !card) {
      return;
    }

    const targetLeft = card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;
    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior,
    });
  };

  useEffect(() => {
    if (!isAllLayoutSelected) {
      return;
    }

    const container = layoutScrollRef.current;
    if (!container) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      container.scrollTo({ left: 0, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [filteredLayoutSummaries, selectedLayout]);

  const handleLayoutFilterClick = (label: string) => {
    if (isFullScopeOnlyCategory) {
      return;
    }

    setSelectedLayout(label);
    scrollLayoutCardIntoView(label);
  };

  const handleResetFilters = () => {
    setPeriod(initialPeriod);
    setPhase(allPhaseOption);
    setPropertyType(initialPropertyType);
    setBusinessCategory('合同');
    setMetricType('套数');
    setSelectedSecondaryType('全部');
    setSelectedVersion('年度经营计划版');
    setSelectedLayout('全部已售');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Top Navigation Bar */}
      <div className="bg-[#47957f] px-4 py-2.5 relative">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-[14px] font-semibold">9:41</span>
          <div className="flex items-center gap-1.5">
            <svg className="size-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 17h20v2H2zm3.15-12.95L7 6.95l9-9 9 9 1.85-1.9L17 2.05z"/>
            </svg>
            <svg className="size-3 text-white" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 12h2v4H0v-4zm3-3h2v7H3V9zm3-3h2v10H6V6zm3-3h2v13H9V3zm3-3h2v16h-2V0z"/>
            </svg>
            <svg className="size-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="6" width="18" height="12" rx="2" ry="2"/>
              <path d="M23 10v4a1 1 0 0 1-1 1h-1V9h1a1 1 0 0 1 1 1z"/>
            </svg>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-8 text-white hover:opacity-80"
          >
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="text-white text-[18px] font-semibold">{projectTitle}</h1>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center size-8 text-white hover:opacity-80">
              <Calendar className="size-[18px]" />
            </button>
            <button className="flex items-center justify-center size-8 text-white hover:opacity-80">
              <MoreHorizontal className="size-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-0 pb-20">
        <div className="sticky top-0 z-30 -mx-4 mb-2 bg-[#f5f5f5] px-4 pt-0 pb-1">
          {/* Filter Row */}
          <div className="flex items-center justify-between gap-2 px-1 py-2">
            <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto scrollbar-hide">
              <div className="flex-shrink-0 relative">
                <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
                  <SelectTrigger className="h-8 px-2 bg-transparent border-0 text-[14px] text-[#1a1a1a] font-medium hover:bg-gray-50 transition-all w-auto gap-0.5 focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="当日">当日</SelectItem>
                    <SelectItem value="当月">当月</SelectItem>
                    <SelectItem value="当年">当年</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-shrink-0 relative">
                <Select value={phase} onValueChange={setPhase} disabled={isFullScopeOnlyCategory}>
                  <SelectTrigger className="h-8 px-2 bg-transparent border-0 text-[14px] text-[#1a1a1a] font-medium hover:bg-gray-50 transition-all w-auto gap-0.5 focus:ring-0 focus:ring-offset-0 disabled:opacity-45 disabled:cursor-not-allowed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {phaseOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-shrink-0 relative">
                <Select
                  value={propertySecondaryValue}
                  onValueChange={(value) => {
                    const [nextPropertyType, nextSecondaryType] = value.split('|') as [PropertyType, string];
                    setPropertyType(nextPropertyType);
                    setSelectedSecondaryType(nextSecondaryType);
                    setSelectedLayout('全部已售');
                  }}
                  disabled={isFullScopeOnlyCategory}
                >
                  <SelectTrigger className="h-8 px-2 bg-transparent border-0 text-[14px] text-[#1a1a1a] font-medium hover:bg-gray-50 transition-all w-auto gap-0.5 focus:ring-0 focus:ring-offset-0 disabled:opacity-45 disabled:cursor-not-allowed">
                    <span>{propertyType}-{selectedSecondaryType}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {(['住宅', '商办', '车储'] as PropertyType[]).map((type) => (
                      <div key={type}>
                        <div className="px-2 py-1.5 text-[11px] font-semibold text-[#99a1af]">{type}</div>
                        {secondaryTypeOptionsByPropertyType[type].map((option) => (
                          <SelectItem key={`${type}|${option}`} value={`${type}|${option}`}>
                            <span className="pl-2">{option}</span>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-shrink-0 relative">
                <Select value={businessCategory} onValueChange={(value) => setBusinessCategory(value as BusinessCategory)}>
                  <SelectTrigger className="h-8 px-2 bg-transparent border-0 text-[14px] text-[#1a1a1a] font-medium hover:bg-gray-50 transition-all w-auto gap-0.5 focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="协议">协议</SelectItem>
                    <SelectItem value="合同">合同</SelectItem>
                    <SelectItem value="来访">来访</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="shrink-0 rounded-full border border-[#d7e6df] bg-white px-3 py-1 text-[12px] font-medium text-[#007440] transition-colors hover:bg-[#f3fbf7]"
            >
              重置
            </button>
          </div>

          <div className="rounded-tl-[10px] rounded-tr-[20px] bg-[#e8f5f0] px-4 py-2.5">
            {fullScopeNotice ? (
              <div className="mb-2 rounded-[10px] bg-white/70 px-3 py-2 text-[11px] leading-[16px] text-[#4a5565]">
                {fullScopeNotice}
              </div>
            ) : null}
            <div
              ref={layoutScrollRef}
              onScroll={updateSelectedLayoutByScroll}
              className="flex gap-[7px] overflow-x-auto pb-2"
            >
              {displayedLayoutSummaries.map((option) => {
                const isSelected = isFullScopeOnlyCategory ? true : selectedLayout === option.label;
                const countUnit = businessCategory === '来访' ? '组' : '套';
                const suffixText = businessCategory === '来访'
                  ? '当前仅支持全盘'
                  : `（剩${option.inventory.toLocaleString()}套）`;

                return (
                  <button
                    key={option.label}
                    ref={(node) => {
                      layoutCardRefs.current[option.label] = node;
                    }}
                    type="button"
                    onClick={() => handleLayoutFilterClick(option.label)}
                    className={`bg-white min-h-[76px] w-[112px] rounded-[10px] cursor-pointer transition-all shrink-0 relative text-left px-2 py-2 flex flex-col justify-end ${
                      isSelected ? 'border border-[#007440]' : 'border-2 border-transparent'
                    } ${isFullScopeOnlyCategory ? 'cursor-default' : ''}`}
                  >
                    <div className="absolute left-0 top-0 bg-[rgba(0,201,80,0.1)] h-[22px] rounded-tl-[10px] rounded-br-[10px] px-[5px] flex items-center max-w-[94%]">
                      <p className="text-[#4a5565] text-[12px] font-medium leading-[16px] truncate">{option.label}</p>
                    </div>
                    <div className="mt-[24px]">
                      <div className="flex items-baseline gap-1 whitespace-nowrap overflow-hidden text-[#0a0a0a]">
                        <span className="text-[15px] leading-[18px] font-semibold">{option.count.toLocaleString()}</span>
                        <span className="text-[11px] leading-[16px] font-normal">{countUnit}</span>
                        <span className="text-[10px] leading-[14px] text-[#6a7282] truncate">{suffixText}</span>
                      </div>
                      {businessCategory !== '来访' ? (
                        <p className="mt-0.5 text-[#6a7282] text-[10px] leading-[12px] whitespace-nowrap truncate">
                          {option.amount.toLocaleString()}万
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Trend Chart Card */}
        <div className="bg-white rounded-[12px] p-3 mb-3">
          <div className="mb-2">
            <h3 className="text-[#1a1a1a] text-[15px] font-semibold">{trendTitle}</h3>
          </div>

          <div className="mb-3 flex items-center justify-between gap-3">
            {businessCategory !== '来访' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMetricType('套数')}
                  className={`px-3 py-1 text-[12px] rounded transition-colors ${
                    metricType === '套数'
                      ? 'bg-[#007440] text-white'
                      : 'bg-gray-100 text-[#8c8c8c] hover:bg-gray-200'
                  }`}
                >
                  套数
                </button>
                <button
                  onClick={() => setMetricType('金额')}
                  className={`px-3 py-1 text-[12px] rounded transition-colors ${
                    metricType === '金额'
                      ? 'bg-[#007440] text-white'
                      : 'bg-gray-100 text-[#8c8c8c] hover:bg-gray-200'
                  }`}
                >
                  金额
                </button>
              </div>
            ) : (
              <div />
            )}

            {period === '当年' && businessCategory !== '来访' ? (
              <div className="flex items-center gap-2 text-[12px] shrink-0">
                <span className="text-[#8c8c8c]">对比</span>
                <Select value={selectedVersion} onValueChange={(value) => setSelectedVersion(value as any)}>
                  <SelectTrigger className="h-auto w-auto border-0 bg-transparent text-[12px] text-[#007440] p-0 gap-1 hover:opacity-80 focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="年度经营计划版">年度经营计划版</SelectItem>
                    <SelectItem value="首开定价会版">首开定价会版</SelectItem>
                    <SelectItem value="全景会版">全景会版</SelectItem>
                    <SelectItem value="经营策划会版">经营策划会版</SelectItem>
                    <SelectItem value="交底会版">交底会版</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 mb-3">
            {period === '当年' && businessCategory !== '来访' ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-[#f59e0b]" />
                  <span className="text-[#8c8c8c] text-[12px]">目标</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-[#007440]" />
                  <span className="text-[#8c8c8c] text-[12px]">实际</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-[#007440]" />
                  <span className="text-[#8c8c8c] text-[12px]">{businessCategory === '来访' ? '来访组数' : '实际'}</span>
                </div>
              </div>
            )}
            <span className="text-[#8c8c8c] text-[11px]">
              单位：
              {businessCategory === '来访'
                ? '组'
                : metricType === '套数'
                  ? '套'
                  : '万'}
            </span>
          </div>

          {/* Chart */}
          <div className="h-[180px] mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }} barGap={0} barCategoryGap="20%">
                <defs>
                  <linearGradient id={`targetBarGradient-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF9500" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#FF9500" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id={`actualBarGradient-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#007440" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#007440" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id={`visitsBarGradient-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F0F0F0"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8c8c8c', fontSize: 11 }}
                  height={20}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8c8c8c', fontSize: 11 }}
                  width={45}
                  tickCount={5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ color: '#1a1a1a', fontWeight: 600, marginBottom: '4px' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length > 0) {
                      const targetData = payload.find((p: any) => p.dataKey === 'target');
                      const actualData = payload.find((p: any) => p.dataKey === 'actual');
                      const visitsData = payload.find((p: any) => p.dataKey === 'visits');
                      const rawUnit = businessCategory === '来访' ? '组' : metricType === '套数' ? '套' : '万';
                      const showDifference = Boolean(targetData && actualData && period === '当年');
                      const difference = showDifference ? Number(actualData?.value ?? 0) - Number(targetData?.value ?? 0) : 0;
                      const diffColor = difference >= 0 ? '#00c950' : '#ff3b30';

                      return (
                        <div style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}>
                          <div style={{ color: '#1a1a1a', fontWeight: 600, marginBottom: '4px' }}>{label}</div>
                          {targetData && (
                            <div style={{ color: '#666', fontSize: '12px', marginBottom: '2px' }}>
                              目标：{Number(targetData.value).toLocaleString()}{rawUnit}
                            </div>
                          )}
                          {actualData && (
                            <div style={{ color: '#666', fontSize: '12px', marginBottom: showDifference ? '4px' : '0' }}>
                              {businessCategory === '来访' ? '来访组数' : '实际'}：{Number(actualData.value).toLocaleString()}{rawUnit}
                            </div>
                          )}
                          {showDifference && (
                            <div style={{
                              color: diffColor,
                              fontSize: '12px',
                              fontWeight: 600,
                              borderTop: '1px solid #f0f0f0',
                              paddingTop: '4px',
                              marginTop: '4px'
                            }}>
                              差值：{difference >= 0 ? '+' : ''}{difference.toLocaleString()}{rawUnit}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return null;
                  }}
                />
                {period === '当年' && businessCategory !== '来访' && (
                  <Bar
                    dataKey="target"
                    fill={`url(#targetBarGradient-${uniqueId})`}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={20}
                  >
                    <LabelList
                      dataKey="target"
                      position="top"
                      style={{ fill: '#8c8c8c', fontSize: '10px', fontWeight: 500 }}
                      formatter={(value: number) => {
                        if (metricType === '金额' && value >= 10000) {
                          return (value / 10000).toFixed(1) + '亿';
                        }
                        return value.toLocaleString();
                      }}
                    />
                  </Bar>
                )}
                {/* 来访组数柱子 - 只在套数且全部已售时显示 */}
                <Bar
                  dataKey="actual"
                  fill={`url(#actualBarGradient-${uniqueId})`}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                >
                  <LabelList
                    dataKey="actual"
                    position="top"
                    style={{ fill: '#8c8c8c', fontSize: '10px', fontWeight: 500 }}
                    formatter={(value: number) => {
                      if (metricType === '金额' && value >= 10000) {
                        return (value / 10000).toFixed(1) + '亿';
                      }
                      return value.toLocaleString();
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics */}
          <div className="border-t border-[#e5e7eb] pt-3 grid grid-cols-3 divide-x divide-[#e5e7eb]">
            {period === '当年' && businessCategory !== '来访' && (
              <>
                <div className="flex flex-col items-center px-3 text-center">
                  <span className="text-[#8c8c8c] text-[12px] mb-1.5">目标月均</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#1a1a1a] text-[18px] font-semibold leading-none">
                      {averageTarget.toLocaleString()}
                    </span>
                    <span className="text-[#8c8c8c] text-[12px]">{metricType === '套数' ? '套' : '万'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center px-3 text-center">
                  <span className="text-[#8c8c8c] text-[12px] mb-1.5">{metricType === '套数' ? '月平均流速' : '实际月均'}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#1a1a1a] text-[18px] font-semibold leading-none">
                      {metricType === '套数' ? averageActualDisplay.toLocaleString() : averageActualDisplay.toLocaleString()}
                    </span>
                    <span className="text-[#8c8c8c] text-[12px]">{metricType === '套数' ? '套' : '万'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center px-3 text-center">
                  <span className="text-[#8c8c8c] text-[12px] mb-1.5">库存套数</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#1a1a1a] text-[18px] font-semibold leading-none">{inventory.toLocaleString()}</span>
                    <span className="text-[#8c8c8c] text-[12px]">套</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detail Table Card */}
        <div className="bg-white rounded-[12px] p-4">
          <div className="mb-4">
            <h3 className="text-[#1a1a1a] text-[15px] font-semibold">{detailTitle}</h3>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#e5e7eb]">
                  <th className="sticky left-0 z-10 bg-white text-left py-3 px-2 min-w-[112px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#007440] text-[13px] font-semibold">指标</span>
                      <span className="text-[#8c8c8c] text-[10px] font-normal leading-[14px]">
                        {businessCategory === '来访' ? '单位：组' : '单位：套/万'}
                      </span>
                    </div>
                  </th>
                  {sortedMonths.map((month) => {
                    const [start, end] = month.split('-');

                    return (
                    <th key={month} className="text-right py-3 px-2 text-[#8c8c8c] text-[13px] font-normal min-w-[60px] whitespace-pre-line leading-tight">
                      <span className="inline-flex flex-col items-end">
                        <span>{start}</span>
                        {end ? <span>{`-${end}`}</span> : null}
                      </span>
                    </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedDetailData.map((row) => (
                  <tr key={row.indicator} className="border-b border-[#e5e7eb] last:border-0">
                    <td className="sticky left-0 z-10 bg-white py-3 px-2 text-[#007440] text-[13px] font-medium">{row.indicator}</td>
                    {row.values.map((value, index) => (
                      <td key={index} className="py-3 px-2 text-[#1a1a1a] text-[13px] font-medium text-right">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Indicator - Home Bar */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-[#1a1a1a] rounded-full opacity-30" />
      </div>
    </div>
  );
}
