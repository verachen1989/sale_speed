import { X, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FieldFilterProps {
  onClose: () => void;
  onFieldsChange?: (fields: string[]) => void;
  selectedFields?: string[];
}

export function FieldFilter({ onClose, onFieldsChange, selectedFields: initialSelectedFields = [] }: FieldFilterProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(initialSelectedFields);

  useEffect(() => {
    setSelectedFields(initialSelectedFields);
  }, [initialSelectedFields]);

  const allFields = [
    '套数',
    '金额',
    '回款现金',
    '回款贷款',
    '回款合计',
  ];

  const toggleField = (field: string) => {
    const newFields = selectedFields.includes(field)
      ? selectedFields.filter((f) => f !== field)
      : [...selectedFields, field];
    
    setSelectedFields(newFields);
    if (onFieldsChange) {
      onFieldsChange(newFields);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[16px] shadow-lg max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="relative px-4 pt-4 pb-3 border-b border-gray-100">
          <h3 className="text-[#0a0a0a] text-[20px] font-semibold tracking-[-0.45px]">
            字段筛选
          </h3>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-[#0a0a0a] opacity-70 hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Field List */}
        <div className="px-4 pt-4 pb-6 flex flex-col gap-3">
          {allFields.map((field) => {
            const isSelected = selectedFields.includes(field);
            return (
              <button
                key={field}
                onClick={() => toggleField(field)}
                className="bg-[#f9fafb] rounded-[10px] px-3 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <span className="text-[#0a0a0a] text-[14px] font-medium tracking-[-0.15px]">
                  {field}
                </span>
                
                {/* Checkbox */}
                <div
                  className={`size-4 rounded-[4px] flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[#030213] border border-[#030213]'
                      : 'bg-[#f3f3f5] border border-[rgba(0,0,0,0.1)]'
                  }`}
                >
                  {isSelected && <Check className="size-3 text-white" strokeWidth={2} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
