import { TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ClassificationFilter } from './ClassificationFilter';
import svgPaths from '../../imports/svg-ql9agtg48v';
import { getOverviewMetrics, type IndicatorType, type Period, type PropertyType } from '../mock/dashboardData';

interface OverviewCardsProps {
  period: Period;
  indicatorType: IndicatorType;
  propertyType: PropertyType;
  onFilterChange?: (filterLabel: string) => void;
}

export function OverviewCards({ period, indicatorType, propertyType, onFilterChange }: OverviewCardsProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState<'status' | 'landYear' | 'city'>('status');
  const [selectedFilterLabel, setSelectedFilterLabel] = useState<string>('');

  // Clear filter when period, indicatorType, or propertyType changes
  useEffect(() => {
    setSelectedFilterLabel('');
    setShowFilter(false);
    if (onFilterChange) {
      onFilterChange('');
    }
  }, [period, indicatorType, propertyType]);

  // Always use full data for top metrics, don't filter
  const currentData = getOverviewMetrics(period, indicatorType, propertyType);

  const handleFilterClick = (type: 'status' | 'landYear' | 'city') => {
    if (!showFilter) {
      setFilterType(type);
      setShowFilter(true);
    } else if (filterType === type) {
      setShowFilter(false);
      // Clear filter when closing
      setSelectedFilterLabel('');
      if (onFilterChange) {
        onFilterChange('');
      }
    } else {
      setFilterType(type);
    }
  };

  const handleFilterChange = (category: string, label: string) => {
    setSelectedFilterLabel(label);
    if (onFilterChange) {
      onFilterChange(label);
    }
  };

  const handleCloseFilter = () => {
    setShowFilter(false);
    // Clear filter when closing
    setSelectedFilterLabel('');
    if (onFilterChange) {
      onFilterChange('');
    }
  };

  const handleClearFilter = () => {
    // Clear filter and close panel
    setSelectedFilterLabel('');
    setShowFilter(false);
    if (onFilterChange) {
      onFilterChange('');
    }
  };

  return (
    <div>
      {showFilter ? (
        <div className="relative overflow-hidden rounded-tl-[10px] rounded-tr-[20px] bg-[#e8f5f0] px-4 py-4 sm:px-6">
          <div className="absolute left-0 top-0 bg-[rgba(0,201,80,0.1)] h-[24px] rounded-tl-[10px] rounded-br-[10px] px-2 flex items-center">
            <span className="text-[#4a5565] text-[12px] font-medium leading-[16px]">已售</span>
          </div>
          {/* Top Row: Metrics and Control Buttons */}
          <div className="grid grid-cols-[auto_auto] items-start justify-between gap-2.5 pt-3">
            {/* Metrics */}
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <MetricCard
                value={currentData.value1.toLocaleString()}
                unit="套"
                percentage={currentData.percentage}
              />
              <MetricCard
                value={currentData.value2.toLocaleString()}
                unit="万"
                percentage={currentData.percentage}
              />
            </div>

            {/* Clear Filter Button */}
            <button
              onClick={handleClearFilter}
              className="shrink-0 self-start bg-white text-[#007440] text-[11px] font-medium hover:opacity-80 whitespace-nowrap px-2.5 py-1.5 rounded-lg border border-[#007440] transition-all"
            >
              清空筛选
            </button>
          </div>

          {/* Expanded Filter Panel */}
          <ClassificationFilter
            onClose={handleCloseFilter}
            initialFilterType={filterType}
            onFilterChange={handleFilterChange}
            period={period}
            indicatorType={indicatorType}
            propertyType={propertyType}
            totalUnits={currentData.value1}
            totalAmount={currentData.value2}
            selectedFilterLabel={selectedFilterLabel}
          />
        </div>
      ) : (
        <div className="relative overflow-hidden bg-[#e8f5f0] rounded-tl-[10px] rounded-tr-[20px] px-4 py-4 sm:px-6">
          <div className="absolute left-0 top-0 bg-[rgba(0,201,80,0.1)] h-[24px] rounded-tl-[10px] rounded-br-[10px] px-2 flex items-center">
            <span className="text-[#4a5565] text-[12px] font-medium leading-[16px]">已售</span>
          </div>
          <div className="grid grid-cols-[auto_auto] items-start justify-between gap-2.5 pt-3">
            {/* Metrics */}
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <CollapsedMetric value={currentData.value1.toLocaleString()} unit="套" percentage={currentData.percentage} />
              <CollapsedMetric value={currentData.value2.toLocaleString()} unit="万" percentage={currentData.percentage} />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilter(true)}
              className="shrink-0 self-start bg-white text-[#007440] text-[11px] font-medium hover:opacity-80 whitespace-nowrap px-2.5 py-1.5 rounded-lg border border-[#007440] transition-all"
            >
              项目类型筛选
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CollapsedMetricProps {
  value: string;
  unit: string;
  percentage: string;
}

function CollapsedMetric({ value, unit, percentage }: CollapsedMetricProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-baseline gap-[2px] mb-1 whitespace-nowrap">
        <span className="min-w-0 truncate text-[#1a1a1a] text-[17px] font-semibold leading-[24px] tracking-[-0.45px]">
          {value}
        </span>
        <span className="text-[#1a1a1a] text-[12px] font-medium leading-[16px]">{unit}</span>
      </div>
      <div className="flex items-center gap-[4px] whitespace-nowrap">
        <TrendingUp className="size-3 text-[#00c950]" strokeWidth={1} />
        <span className="text-[#99a1af] text-[11px] leading-[14px]">环比 {percentage}</span>
      </div>
    </div>
  );
}

interface MetricCardProps {
  value: string;
  unit: string;
  percentage: string;
}

function MetricCard({ value, unit, percentage }: MetricCardProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
        <span className="min-w-0 truncate text-[#1a1a1a] text-[17px] font-semibold leading-[24px] tracking-[-0.45px]">
          {value}
        </span>
        <span className="text-[#1a1a1a] text-[12px] font-medium">{unit}</span>
      </div>
      <div className="flex items-center gap-1 whitespace-nowrap">
        <TrendingUp className="size-3 text-[#00c950]" strokeWidth={1} />
        <span className="text-[#99a1af] text-[11px] leading-[14px]">环比 {percentage}</span>
      </div>
    </div>
  );
}
