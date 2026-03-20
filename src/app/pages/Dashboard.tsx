import { useState } from 'react';
import { Header, OverviewCards, TrendChart, ProjectTable } from '../components';
import { ProjectSearchDrawer } from '../components/ProjectSearchDrawer';
import { ChevronLeft, Calendar, MoreHorizontal } from 'lucide-react';
import type { IndicatorType, Period, PropertyType } from '../mock/dashboardData';

interface DashboardProps {
  onNavigateToProject: (
    projectId: string,
    projectName: string,
    period: Period,
    propertyType: PropertyType
  ) => void;
}

export default function Dashboard({ onNavigateToProject }: DashboardProps) {
  const [period, setPeriod] = useState<Period>('当月');
  const [propertyType, setPropertyType] = useState<PropertyType>('住宅');
  const [indicatorType, setIndicatorType] = useState<IndicatorType>('合同');
  const [filterLabel, setFilterLabel] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Top Navigation Bar */}
      <div className="bg-[#47957f] px-4 py-3 sticky top-0 z-50">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-[14px] font-semibold">9:41</span>
          <div className="flex items-center gap-1">
            <div className="text-white text-[12px]">📶</div>
            <div className="text-white text-[12px]">📡</div>
            <div className="text-white text-[12px]">🔋</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button className="flex items-center justify-center size-7 text-white hover:opacity-80">
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="text-white text-[20px] font-semibold">绿城中国</h1>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center size-7 text-white hover:opacity-80">
              <Calendar className="size-5" />
            </button>
            <button className="flex items-center justify-center size-7 text-white hover:opacity-80">
              <MoreHorizontal className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="sticky top-[88px] z-40 -mx-4 mb-2 bg-[#f5f5f5] px-4 pb-2">
          <Header
            period={period}
            onPeriodChange={setPeriod}
            propertyType={propertyType}
            onPropertyTypeChange={setPropertyType}
            indicatorType={indicatorType}
            onIndicatorTypeChange={setIndicatorType}
          />
        </div>

        <div className="mt-2">
          <OverviewCards period={period} indicatorType={indicatorType} propertyType={propertyType} onFilterChange={setFilterLabel} />
        </div>
        
        <div className="mt-2.5">
          <TrendChart period={period} indicatorType={indicatorType} propertyType={propertyType} filterLabel={filterLabel} />
        </div>
        
        <div className="mt-2.5">
          <ProjectTable filterLabel={filterLabel} indicatorType={indicatorType} period={period} propertyType={propertyType} stickyHeader onNavigateToProject={(projectId, projectName) => onNavigateToProject(projectId, projectName, period, propertyType)} onSearchClick={() => setIsSearchOpen(true)} />
        </div>
      </div>

      {/* Project Search Drawer */}
      <ProjectSearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        period={period}
        indicatorType={indicatorType}
        propertyType={propertyType}
        onNavigateToProject={(projectId, projectName) => onNavigateToProject(projectId, projectName, period, propertyType)}
      />
    </div>
  );
}
