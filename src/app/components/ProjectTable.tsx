import { useEffect, useState } from 'react';
import { Filter, Search, ChevronRight } from 'lucide-react';
import { FieldFilter } from './FieldFilter';
import {
  getDefaultVisibleFields,
  getVisibleProjects,
  getTotals,
  type IndicatorType,
  type Period,
} from '../mock/dashboardData';

interface ProjectTableProps {
  filterLabel?: string;
  indicatorType?: IndicatorType;
  period?: Period;
  propertyType?: string;
  onNavigateToProject?: (projectId: string, projectName: string) => void;
  onSearchClick?: () => void;
  stickyHeader?: boolean;
}

export function ProjectTable({ filterLabel, indicatorType = '合同', period = '当月', propertyType = '住宅', onNavigateToProject, onSearchClick, stickyHeader = false }: ProjectTableProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showFieldFilter, setShowFieldFilter] = useState(false);
  const [visibleFields, setVisibleFields] = useState<string[]>(getDefaultVisibleFields(indicatorType));

  const projects = getVisibleProjects(period, indicatorType, filterLabel, propertyType as any);
  
  // Sort projects by contract units (descending) based on indicator type
  const sortedProjects = [...projects].sort((a, b) => {
    const aValue = indicatorType === '协议' ? a.agreementUnits : a.contractUnits;
    const bValue = indicatorType === '协议' ? b.agreementUnits : b.contractUnits;
    return bValue - aValue;
  });
  
  const totals = getTotals(projects);

  useEffect(() => {
    setVisibleFields(getDefaultVisibleFields(indicatorType));
  }, [indicatorType]);

  const handleProjectClick = (projectId: string, projectName: string) => {
    setSelectedProject(projectId);
    if (onNavigateToProject) {
      onNavigateToProject(projectId, projectName);
    }
  };

  const tableToolbarClass = stickyHeader
    ? 'sticky top-[138px] z-30 bg-white'
    : '';
  const visibleTableFields = visibleFields.filter((field) => field === '套数' || field === '金额' || field === '回款现金' || field === '回款贷款' || field === '回款合计');
  const stickyGridTemplateColumns = [
    'minmax(128px,1.5fr)',
    ...visibleTableFields.map((field) => {
      if (field === '金额') return '110px';
      if (field === '回款现金' || field === '回款贷款' || field === '回款合计') return '96px';
      return '80px';
    }),
    '40px',
  ].join(' ');

  return (
    <div className="bg-white rounded-lg">
      {/* Table Header */}
      <div className={`flex items-center justify-between px-4 py-4 border-b border-[#f0f0f0] ${tableToolbarClass}`}>
        <h3 className="text-[#0a0a0a] text-[14px] font-medium text-left">
          项目明细{filterLabel ? `-${filterLabel}` : ''}
        </h3>
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-1 text-[#007440] text-[12px] font-medium hover:opacity-80"
            onClick={() => setShowFieldFilter(!showFieldFilter)}
          >
            <Filter className="size-[13px]" />
            字段
          </button>
          <button 
            className="flex items-center gap-1 text-[#007440] text-[12px] font-medium hover:opacity-80"
            onClick={onSearchClick}
          >
            <Search className="size-4" />
            搜索
          </button>
        </div>
      </div>

      {/* Field Filter */}
      {showFieldFilter && (
        <FieldFilter
          onClose={() => setShowFieldFilter(false)}
          onFieldsChange={setVisibleFields}
          selectedFields={visibleFields}
        />
      )}

      {stickyHeader && (
        <div
          className="sticky top-[195px] z-40 border-b border-[#f0f0f0] bg-[#fafafa]"
          style={{ display: 'grid', gridTemplateColumns: stickyGridTemplateColumns }}
        >
          <div className="px-4 py-3 text-left text-[#6a7282] text-[12px] font-medium">项目名称</div>
          {visibleFields.includes('套数') && (
            <div className="px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium whitespace-nowrap">套数</div>
          )}
          {visibleFields.includes('金额') && (
            <div className="px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium whitespace-nowrap">金额（万元）</div>
          )}
          {visibleFields.includes('回款现金') && (
            <div className="px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium whitespace-nowrap">回款现金</div>
          )}
          {visibleFields.includes('回款贷款') && (
            <div className="px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium whitespace-nowrap">回款贷款</div>
          )}
          {visibleFields.includes('回款合计') && (
            <div className="px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium whitespace-nowrap">回款合计</div>
          )}
          <div className="px-4 py-3" />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={stickyHeader ? 'sr-only' : ''}>
            <tr className="bg-[#fafafa]">
              <th className="bg-[#fafafa] px-4 py-3 text-left text-[#6a7282] text-[12px] font-medium min-w-[128px]">
                项目名称
              </th>
              {visibleFields.includes('套数') && (
                <th className="bg-[#fafafa] px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium min-w-[80px] whitespace-nowrap">
                  套数
                </th>
              )}
              {visibleFields.includes('金额') && (
                <th className="bg-[#fafafa] px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium min-w-[110px] whitespace-nowrap">
                  金额（万元）
                </th>
              )}
              {visibleFields.includes('回款现金') && (
                <th className="bg-[#fafafa] px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium min-w-[96px] whitespace-nowrap">
                  回款现金
                </th>
              )}
              {visibleFields.includes('回款贷款') && (
                <th className="bg-[#fafafa] px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium min-w-[96px] whitespace-nowrap">
                  回款贷款
                </th>
              )}
              {visibleFields.includes('回款合计') && (
                <th className="bg-[#fafafa] px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium min-w-[96px] whitespace-nowrap">
                  回款合计
                </th>
              )}
              <th className="bg-[#fafafa] px-4 py-3 min-w-[40px]"></th>
            </tr>
          </thead>
          <tbody>
            {/* Totals Row */}
            <tr className="bg-[#e8f5f0] border-b border-[#f0f0f0]">
              <td className="sticky left-0 z-10 bg-[#e8f5f0] px-4 py-3 text-[#0a0a0a] text-[14px] font-medium">
                合计
              </td>
              {visibleFields.includes('套数') && (
                <td className="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">
                  {indicatorType === '协议' ? totals.agreementUnits : totals.contractUnits}
                </td>
              )}
              {visibleFields.includes('金额') && (
                <td className="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">
                  {(indicatorType === '协议' ? totals.agreementAmount : totals.contractAmount).toLocaleString()}
                </td>
              )}
              {visibleFields.includes('回款现金') && (
                <td className="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">
                  {totals.cashPayment.toLocaleString()}
                </td>
              )}
              {visibleFields.includes('回款贷款') && (
                <td className="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">
                  {totals.loanPayment.toLocaleString()}
                </td>
              )}
              {visibleFields.includes('回款合计') && (
                <td className="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-bold">
                  {totals.totalPayment.toLocaleString()}
                </td>
              )}
              <td className="px-4 py-3"></td>
            </tr>

            {/* Project Rows */}
            {sortedProjects.map((project) => (
              <tr
                key={project.id}
                onClick={() => handleProjectClick(project.id, project.name)}
                className={`border-b border-[#f0f0f0] hover:bg-[#fafafa] cursor-pointer transition-colors ${
                  selectedProject === project.id ? 'bg-[#f0f7f4]' : ''
                }`}
              >
                <td className={`sticky left-0 z-10 px-4 py-3 ${selectedProject === project.id ? 'bg-[#f0f7f4]' : 'bg-white'}`}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#007440] text-[14px] font-medium">
                      {project.name}
                    </span>
                    <span className="text-[#99a1af] text-[11px] leading-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                      拿地：{project.landDate}
                    </span>
                  </div>
                </td>
                {visibleFields.includes('套数') && (
                  <td className="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">
                    {indicatorType === '协议' ? project.agreementUnits : project.contractUnits}
                  </td>
                )}
                {visibleFields.includes('金额') && (
                  <td className="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">
                    {(indicatorType === '协议' ? project.agreementAmount : project.contractAmount).toLocaleString()}
                  </td>
                )}
                {visibleFields.includes('回款现金') && (
                  <td className="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">
                    {project.cashPayment.toLocaleString()}
                  </td>
                )}
                {visibleFields.includes('回款贷款') && (
                  <td className="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">
                    {project.loanPayment.toLocaleString()}
                  </td>
                )}
                {visibleFields.includes('回款合计') && (
                  <td className="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-bold">
                    {project.totalPayment.toLocaleString()}
                  </td>
                )}
                <td className="px-4 py-3 text-center">
                  <ChevronRight className="size-4 text-[#99a1af] mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
