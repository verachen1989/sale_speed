import { useEffect, useRef, useState } from 'react';
import { Header, OverviewCards, TrendChart, ProjectTable } from '../components';
import { ProjectSearchDrawer } from '../components/ProjectSearchDrawer';
import { ChevronLeft, Calendar, MoreHorizontal, Sparkles, X } from 'lucide-react';
import type { IndicatorType, Period, PropertyType } from '../mock/dashboardData';
import { OnboardingGuide } from '../components/OnboardingGuide';

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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isPosterOpen, setIsPosterOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const overviewRef = useRef<HTMLDivElement | null>(null);
  const trendRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSeenGuide = window.localStorage.getItem('dashboard-onboarding-seen');
    if (!hasSeenGuide) {
      setIsPosterOpen(true);
    }
  }, []);

  const closeGuide = () => {
    setIsGuideOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dashboard-onboarding-seen', 'true');
    }
  };

  const closePoster = () => {
    setIsPosterOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dashboard-onboarding-seen', 'true');
    }
  };

  const handleStartGuide = () => {
    setIsPosterOpen(false);
    setIsGuideOpen(true);
  };

  const guideSteps = [
    {
      id: 'filters',
      title: '先看顶部筛选',
      description: '这里控制周期、业态和业务口径。切换任一项，概览卡、趋势图和项目明细会一起联动刷新。',
      target: headerRef.current,
    },
    {
      id: 'overview',
      title: '用概览卡快速收口',
      description: '先看核心销售指标，再点“项目类型筛选”做状态、拿地年份或重点城市的快速聚焦。',
      target: overviewRef.current,
    },
    {
      id: 'trend',
      title: '趋势图看节奏变化',
      description: '这里支持套数/金额切换；当年模式下还能切版本，对比目标和实际差值。',
      target: trendRef.current,
    },
    {
      id: 'table',
      title: '明细表负责下钻',
      description: '项目明细支持字段切换和搜索。点击任意项目，可以直接进入项目详情页继续分析。',
      target: tableRef.current,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-[#47957f] px-3 py-3 sm:px-4">
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
        <div className="grid grid-cols-[32px_1fr_auto] items-center gap-2">
          <button className="flex items-center justify-center size-8 text-white hover:opacity-80">
            <ChevronLeft className="size-5 sm:size-6" />
          </button>
          <h1 className="truncate text-center text-[18px] font-semibold text-white sm:text-[20px]">绿城中国</h1>
          <div className="flex items-center justify-end gap-1.5 sm:gap-3">
            <button
              className="flex items-center gap-1 rounded-full bg-[rgba(255,255,255,0.12)] px-2 py-1 text-white transition hover:bg-[rgba(255,255,255,0.2)]"
              onClick={() => setIsGuideOpen(true)}
            >
              <Sparkles className="size-4" />
              <span className="hidden text-[12px] font-medium sm:inline">新手指引</span>
            </button>
            <button className="flex items-center justify-center size-8 text-white hover:opacity-80">
              <Calendar className="size-5" />
            </button>
            <button className="flex items-center justify-center size-8 text-white hover:opacity-80">
              <MoreHorizontal className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[430px] px-3 pb-4 sm:max-w-none sm:px-4">
        <div ref={headerRef} className="sticky top-[84px] z-40 -mx-3 mb-2 bg-[#f5f5f5] px-3 pb-2 sm:-mx-4 sm:top-[88px] sm:px-4">
          <Header
            period={period}
            onPeriodChange={setPeriod}
            propertyType={propertyType}
            onPropertyTypeChange={setPropertyType}
            indicatorType={indicatorType}
            onIndicatorTypeChange={setIndicatorType}
          />
        </div>

        <div ref={overviewRef} className="mt-2">
          <OverviewCards period={period} indicatorType={indicatorType} propertyType={propertyType} onFilterChange={setFilterLabel} />
        </div>
        
        <div ref={trendRef} className="mt-2.5">
          <TrendChart period={period} indicatorType={indicatorType} propertyType={propertyType} filterLabel={filterLabel} />
        </div>
        
        <div ref={tableRef} className="mt-2.5">
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

      {isPosterOpen && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-[rgba(7,16,13,0.62)] p-4 pt-8 sm:items-center sm:p-5">
          <div className="relative my-auto w-full max-w-[360px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.22)] sm:rounded-[28px]">
            <button
              type="button"
              onClick={closePoster}
              className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-[rgba(0,0,0,0.08)] text-[#1f2937] transition hover:bg-[rgba(0,0,0,0.12)]"
              aria-label="关闭海报"
            >
              <X className="size-4" />
            </button>

            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0d7a54_0%,#38a169_58%,#b9f5cf_100%)] px-5 pb-6 pt-7 text-white sm:px-6 sm:pb-7 sm:pt-8">
              <div className="absolute -right-10 -top-8 h-32 w-32 rounded-full bg-[rgba(255,255,255,0.14)] blur-2xl" />
              <div className="absolute -left-8 bottom-6 h-24 w-24 rounded-full bg-[#d6ffe3]/20 blur-xl" />

              <div className="relative">
                <div className="mb-3 inline-flex items-center rounded-full bg-[rgba(255,255,255,0.16)] px-3 py-1 text-[11px] font-medium tracking-[0.16em]">
                  NEW FEATURE
                </div>
                <h2 className="max-w-[250px] text-[24px] font-semibold leading-[1.2] tracking-[-0.03em] sm:max-w-none sm:text-[28px]">
                  区域流速分析上线啦
                </h2>
                <p className="mt-3 max-w-[260px] text-[13px] leading-6 text-[rgba(255,255,255,0.82)] sm:text-[14px]">
                  新版看板支持一屏看概览、趋势和项目明细。先看 1 分钟教程，再开始上手。
                </p>
              </div>

              <div className="relative mt-5 rounded-[20px] border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.12)] p-3.5 backdrop-blur-sm sm:mt-6 sm:rounded-[22px] sm:p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] bg-[rgba(255,255,255,0.12)] p-3">
                    <div className="text-[11px] text-[rgba(255,255,255,0.7)]">上手路径</div>
                    <div className="mt-1 text-[14px] font-medium sm:text-[15px]">筛选 &gt; 趋势 &gt; 下钻</div>
                  </div>
                  <div className="rounded-[18px] bg-[rgba(255,255,255,0.12)] p-3">
                    <div className="text-[11px] text-[rgba(255,255,255,0.7)]">覆盖内容</div>
                    <div className="mt-1 text-[14px] font-medium sm:text-[15px]">区域总览与项目分析</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
              <button
                type="button"
                onClick={handleStartGuide}
                className="w-full rounded-full bg-[#0f7a4f] px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0c6b45]"
              >
                查看教程
              </button>
              <button
                type="button"
                onClick={closePoster}
                className="mt-3 w-full rounded-full border border-[#d7e7dd] px-4 py-3 text-[14px] font-medium text-[#476255] transition hover:bg-[#f5faf7]"
              >
                稍后再看
              </button>
            </div>
          </div>
        </div>
      )}

      <OnboardingGuide open={isGuideOpen} steps={guideSteps} onClose={closeGuide} />
    </div>
  );
}
