import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  getTrendData,
  type IndicatorType,
  type MetricType,
  type Period,
  type PropertyType,
  type VersionType,
} from '../mock/dashboardData';

interface TrendChartProps {
  period: Period;
  indicatorType: IndicatorType;
  propertyType: PropertyType;
  filterLabel?: string;
}

function getDisplayScale(metricType: MetricType, values: number[]) {
  const maxValue = Math.max(...values, 0);

  if (metricType === '金额') {
    if (maxValue >= 10000) {
      return { divisor: 10000, unit: '亿', digits: 1 };
    }
    return { divisor: 1, unit: '万', digits: 0 };
  }

  if (maxValue >= 10000) {
    return { divisor: 10000, unit: '万套', digits: 1 };
  }

  return { divisor: 1, unit: '套', digits: 0 };
}

function formatScaledValue(value: number, divisor: number, digits: number) {
  const scaled = value / divisor;
  const fixed = digits > 0 ? scaled.toFixed(digits) : Math.round(scaled).toString();
  return digits > 0 ? fixed.replace(/\.0$/, '') : fixed;
}

function getLabelDigits(value: number, divisor: number) {
  const scaled = value / divisor;
  if (scaled >= 100) return 0;
  if (scaled >= 10) return 1;
  return 2;
}

function getNiceStep(roughStep: number) {
  if (roughStep <= 0) return 1;
  const exponent = Math.floor(Math.log10(roughStep));
  const fraction = roughStep / 10 ** exponent;

  if (fraction <= 1) return 1 * 10 ** exponent;
  if (fraction <= 2) return 2 * 10 ** exponent;
  if (fraction <= 5) return 5 * 10 ** exponent;
  return 10 * 10 ** exponent;
}

function buildYAxisTicks(values: number[]) {
  const maxValue = Math.max(...values, 0);
  const roughStep = maxValue / 4;
  const step = getNiceStep(roughStep);
  const topValue = Math.max(step * 4, step);

  return Array.from({ length: 5 }, (_, index) => index * step).filter((tick) => tick <= topValue);
}

export function TrendChart({ period, indicatorType, propertyType, filterLabel }: TrendChartProps) {
  const [selectedVersion, setSelectedVersion] = useState<VersionType>('年度经营计划版');
  const [metricType, setMetricType] = useState<MetricType>('套数');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  
  // Generate unique ID for this component instance
  const uniqueId = useMemo(() => Math.random().toString(36).substring(2, 9), []);

  // Different target values based on version
  const versionTargets: Record<VersionType, { multiplier: number }> = {
    '年度经营计划版': { multiplier: 1.1 },
    '首开定价会版': { multiplier: 1.05 },
    '全景会版': { multiplier: 1.0 },
    '经营策划会版': { multiplier: 0.95 },
    '交底会版': { multiplier: 0.9 },
  };

  // Adjust target values based on selected version
  const data = getTrendData(period, indicatorType, metricType, filterLabel, propertyType).map(item => ({
    ...item,
    target: Math.round(item.target * versionTargets[selectedVersion].multiplier),
  }));

  const actualAverage = Math.round(data.reduce((sum, d) => sum + d.actual, 0) / data.length);
  const targetAverage = Math.round(data.reduce((sum, d) => sum + d.target, 0) / data.length);

  const rawUnit = metricType === '套数' ? '套' : '万';
  const displayScale = useMemo(
    () => getDisplayScale(metricType, data.flatMap((item) => [item.target, item.actual])),
    [data, metricType]
  );
  const yAxisTicks = useMemo(
    () => buildYAxisTicks(data.flatMap((item) => [item.target, item.actual])),
    [data]
  );

  const title = {
    当日: '近7日流速趋势',
    当月: '近6周流速趋势',
    当年: '近6个月流速趋势',
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (period === '当年') {
      container.scrollLeft = container.scrollWidth - container.clientWidth;
      return;
    }

    container.scrollLeft = 0;
  }, [period, metricType, indicatorType, propertyType, filterLabel, selectedVersion]);

  const isYearlyScrollable = period === '当年';
  const chartCanvasWidth = isYearlyScrollable ? Math.max(560, data.length * 104) : undefined;

  return (
    <div className="bg-white rounded-bl-[10px] rounded-br-[10px] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#1a1a1a] text-[14px] font-medium text-left">
          {title[period]}{filterLabel ? `-${filterLabel}` : ''}
        </h3>
        {period === '当年' && (
          <div className="flex items-center gap-2">
            <span className="text-[#8c8c8c] text-[12px]">对比</span>
            <Select value={selectedVersion} onValueChange={(value) => setSelectedVersion(value as VersionType)}>
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
        )}
      </div>

      {/* Metric Type Toggle and Legend */}
      <div className="mb-3 flex items-center justify-between gap-3">
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
        
        {period === '当年' ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#ff9500]" />
              <span className="text-[#8c8c8c] text-[12px]">目标</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#007440]" />
              <span className="text-[#8c8c8c] text-[12px]">实际</span>
            </div>
            <span className="text-[#8c8c8c] text-[11px]">单位：{displayScale.unit}</span>
          </div>
        ) : (
          <span className="text-[#8c8c8c] text-[11px]">单位：{displayScale.unit}</span>
        )}
      </div>

      {/* Chart */}
      <div className="mb-4 flex min-h-[190px]">
        <div className="w-[44px] shrink-0 pr-2 pt-5 pb-5 flex flex-col justify-between items-end">
          {[...yAxisTicks].reverse().map((tick) => (
            <span key={tick} className="text-[#8c8c8c] text-[11px] leading-none">
              {formatScaledValue(tick, displayScale.divisor, displayScale.digits)}
            </span>
          ))}
        </div>
        <div
          ref={scrollRef}
          className={`flex-1 ${isYearlyScrollable ? 'overflow-x-auto overflow-y-hidden scrollbar-hide' : ''}`}
          style={{ minHeight: '190px' }}
        >
          <div className="h-[190px]" style={{ width: chartCanvasWidth ? `${chartCanvasWidth}px` : '100%', minWidth: '100%' }}>
            <ResponsiveContainer width="100%" height={190} minHeight={190}>
              <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }} barGap={0} barCategoryGap="20%">
            <defs>
              <linearGradient id={`targetBarGradient-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF9500" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#FF9500" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id={`actualBarGradient-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#007440" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#007440" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F0F0F0"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8c8c8c', fontSize: 11 }}
              height={20}
            />
            <YAxis hide ticks={yAxisTicks} domain={[0, yAxisTicks[yAxisTicks.length - 1] ?? 'auto']} />
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
                  
                  // Only show difference when both target and actual exist (当年 period)
                  const showDifference = targetData && actualData && period === '当年';
                  const difference = showDifference ? actualData.value - targetData.value : 0;
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
                          目标：{targetData.value.toLocaleString()}{rawUnit}
                        </div>
                      )}
                      {actualData && (
                        <div style={{ color: '#666', fontSize: '12px', marginBottom: showDifference ? '4px' : '0' }}>
                          实际：{actualData.value.toLocaleString()}{rawUnit}
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
            {/* Target bars - only show for 当年 */}
            {period === '当年' && (
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
                    const digits = getLabelDigits(value, displayScale.divisor);
                    return formatScaledValue(value, displayScale.divisor, digits);
                  }}
                />
              </Bar>
            )}
            {/* Actual bars */}
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
                  const digits = getLabelDigits(value, displayScale.divisor);
                  return formatScaledValue(value, displayScale.divisor, digits);
                }}
              />
            </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Statistics - Only show for 当年 */}
      {period === '当年' && (
        <div className="border-t border-[#f1f5f9] pt-4 flex items-center justify-around">
          <div className="flex flex-col gap-1">
            <span className="text-[#62748e] text-[12px]">目标月平均</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[#0f172b] text-[18px] font-semibold">
                {formatScaledValue(targetAverage, displayScale.divisor, displayScale.digits)}
              </span>
              <span className="text-[#62748e] text-[12px]">{displayScale.unit}</span>
            </div>
          </div>
          
          <div className="w-px h-12 bg-[#e2e8f0]" />
          
          <div className="flex flex-col gap-1">
            <span className="text-[#62748e] text-[12px]">实际月平均</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[#096] text-[18px] font-semibold">
                {formatScaledValue(actualAverage, displayScale.divisor, displayScale.digits)}
              </span>
              <span className="text-[#62748e] text-[12px]">{displayScale.unit}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
