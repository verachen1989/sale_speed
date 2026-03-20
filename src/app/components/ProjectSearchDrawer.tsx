import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { getVisibleProjects, getTotals, type Period, type IndicatorType, type PropertyType } from '../mock/dashboardData';

interface ProjectSearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  period: Period;
  indicatorType: IndicatorType;
  propertyType: PropertyType;
  onNavigateToProject: (projectId: string, projectName: string) => void;
}

export function ProjectSearchDrawer({
  isOpen,
  onClose,
  period,
  indicatorType,
  propertyType,
  onNavigateToProject,
}: ProjectSearchDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<ReturnType<typeof getVisibleProjects>>([]);

  const allProjects = getVisibleProjects(period, indicatorType, undefined, propertyType);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(allProjects);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProjects(
        allProjects.filter((project) =>
          project.name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, allProjects]);

  const totals = getTotals(filteredProjects);

  const handleProjectClick = (projectId: string, projectName: string) => {
    onNavigateToProject(projectId, projectName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up pt-[max(env(safe-area-inset-top),0px)] pb-[max(env(safe-area-inset-bottom),12px)]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-4 border-b border-[#f0f0f0]">
          <h2 className="text-[#1a1a1a] text-[18px] font-semibold">项目搜索</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-8 text-[#8c8c8c] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="shrink-0 px-4 py-3 border-b border-[#f0f0f0] bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8c8c8c]" />
            <input
              type="text"
              placeholder="搜索项目"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputMode="search"
              enterKeyHint="search"
              autoCapitalize="off"
              autoCorrect="off"
              className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f5] rounded-lg text-base text-[#1a1a1a] placeholder:text-[#8c8c8c] focus:outline-none focus:ring-2 focus:ring-[#007440]/20"
            />
          </div>
        </div>

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Table */}
          <table className="w-full">
            <thead className="sticky top-0 bg-[#fafafa] z-10">
              <tr>
                <th className="px-4 py-3 text-left text-[#007440] text-[13px] font-semibold min-w-[140px] whitespace-nowrap">
                  项目名称
                </th>
                <th className="px-4 py-3 text-center text-[#8c8c8c] text-[13px] font-normal min-w-[72px] whitespace-nowrap">
                  套数
                </th>
                <th className="px-4 py-3 text-center text-[#8c8c8c] text-[13px] font-normal min-w-[110px] whitespace-nowrap">
                  金额（万元）
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Totals Row */}
              <tr className="bg-[#e8f5f0] border-b border-[#f0f0f0]">
                <td className="px-4 py-3 text-[#1a1a1a] text-[14px] font-semibold">
                  合计
                </td>
                <td className="px-4 py-3 text-center text-[#1a1a1a] text-[14px] font-semibold">
                  {indicatorType === '协议' ? totals.agreementUnits : totals.contractUnits}
                </td>
                <td className="px-4 py-3 text-center text-[#1a1a1a] text-[14px] font-semibold">
                  {(indicatorType === '协议' ? totals.agreementAmount : totals.contractAmount).toLocaleString()}
                </td>
              </tr>

              {/* Project Rows */}
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => handleProjectClick(project.id, project.name)}
                    className="border-b border-[#f0f0f0] hover:bg-[#fafafa] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#007440] text-[14px] font-medium">
                          {project.name}
                        </span>
                        <span className="text-[#99a1af] text-[11px] leading-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                          拿地：{project.landDate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-[#1a1a1a] text-[14px] font-medium">
                      {indicatorType === '协议' ? project.agreementUnits : project.contractUnits}
                    </td>
                    <td className="px-4 py-3 text-center text-[#1a1a1a] text-[14px] font-medium">
                      {(indicatorType === '协议' ? project.agreementAmount : project.contractAmount).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[#8c8c8c] text-[14px]">
                    未找到匹配的项目
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
