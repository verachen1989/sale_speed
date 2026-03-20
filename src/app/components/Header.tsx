import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  period: '当日' | '当月' | '当年';
  onPeriodChange: (period: '当日' | '当月' | '当年') => void;
  propertyType: string;
  onPropertyTypeChange: (type: string) => void;
  indicatorType: string;
  onIndicatorTypeChange: (type: string) => void;
}

export function Header({
  period,
  onPeriodChange,
  propertyType,
  onPropertyTypeChange,
  indicatorType,
  onIndicatorTypeChange,
}: HeaderProps) {
  const periods: Array<'当日' | '当月' | '当年'> = ['当日', '当月', '当年'];

  return (
    <div className="flex items-center justify-between">
      {/* Period Tabs */}
      <div className="flex overflow-clip rounded-[4px] border border-[#c0d9d1]">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-[13px] py-[8px] text-[14px] font-normal transition-colors ${
              period === p
                ? 'bg-[#007440] text-white'
                : 'bg-white text-[#007440] hover:bg-[#f0f7f4]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex gap-4">
        <DropdownFilter
          value={propertyType}
          onChange={onPropertyTypeChange}
          options={['住宅', '商办', '车储']}
        />
        <DropdownFilter
          value={indicatorType}
          onChange={onIndicatorTypeChange}
          options={['协议', '合同']}
        />
      </div>
    </div>
  );
}

interface DropdownFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

function DropdownFilter({ value, onChange, options }: DropdownFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[#007440] text-[16px] font-normal hover:opacity-80"
      >
        {value}
        <ChevronDown className="size-[14px]" />
      </button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 min-w-[120px] rounded-md bg-white shadow-lg border border-gray-200">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-[14px] hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                  value === option ? 'bg-[#edf7f4] text-[#007440]' : 'text-[#606266]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}