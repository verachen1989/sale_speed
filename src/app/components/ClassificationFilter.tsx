import { useState, useRef, useEffect, useLayoutEffect, forwardRef } from 'react';
import svgPaths from '../../imports/svg-c6a3dnowsi';
import { getFilterCategorySummaries, type Period, type IndicatorType, type PropertyType } from '../mock/dashboardData';

interface ClassificationFilterProps {
  onClose: () => void;
  initialFilterType?: 'status' | 'landYear' | 'city';
  onFilterChange?: (category: string, label: string) => void;
  period: Period;
  indicatorType: IndicatorType;
  propertyType: PropertyType;
  totalUnits: number;
  totalAmount: number;
  selectedFilterLabel?: string;
}

export interface FilterState {
  projectType: string[];
  landYear: string[];
  city: string[];
}

export function ClassificationFilter({ onClose, initialFilterType = 'status', onFilterChange, period, indicatorType, propertyType, totalUnits, totalAmount, selectedFilterLabel }: ClassificationFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<'status' | 'landYear' | 'city'>(initialFilterType);
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [buttonX, setButtonX] = useState(0);
  const [cardCenters, setCardCenters] = useState<number[]>([]);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const cardsViewportRef = useRef<HTMLDivElement | null>(null);

  // Update selectedFilter when selectedFilterLabel changes
  useEffect(() => {
    setSelectedFilter(selectedFilterLabel || '');
  }, [selectedFilterLabel]);

  // Calculate filter categories dynamically based on total
  const getFilterCategories = () => {
    return getFilterCategorySummaries(period, indicatorType, propertyType);
  };

  const filterCategories = getFilterCategories();

  const currentOptions = filterCategories[selectedCategory];
  const optionsKey = currentOptions.map((option) => option.label).join('|');
  
  const categoryLabels = {
    status: '按销售状态',
    landYear: '按拿地年份',
    city: '按重点城市',
  };

  const handleCategoryClick = (type: 'status' | 'landYear' | 'city') => {
    setSelectedCategory(type);
    // Clear selection when switching category
    setSelectedFilter('');
    if (onFilterChange) {
      onFilterChange(type, '');
    }
  };

  const handleFilterSelect = (label: string) => {
    setSelectedFilter((prev) => {
      if (prev === label) {
        return prev;
      }
      onFilterChange?.(selectedCategory, label);
      return label;
    });
  };

  const updateSelectedFilterByScroll = () => {
    const viewport = cardsViewportRef.current;
    if (!viewport || currentOptions.length === 0) {
      return;
    }

    const firstLabel = currentOptions[0]?.label ?? '';
    const lastLabel = currentOptions[currentOptions.length - 1]?.label ?? '';
    if (!firstLabel) {
      return;
    }

    // 左滑回到起点时，优先回到第一张卡
    if (viewport.scrollLeft <= 8) {
      setSelectedFilter((prev) => {
        if (prev === firstLabel) {
          return prev;
        }
        onFilterChange?.(selectedCategory, firstLabel);
        return firstLabel;
      });
      return;
    }

    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    // 右滑到终点时，优先选中最后一张卡（例如 2026年拿地）
    if (lastLabel && viewport.scrollLeft >= maxScrollLeft - 8) {
      setSelectedFilter((prev) => {
        if (prev === lastLabel) {
          return prev;
        }
        onFilterChange?.(selectedCategory, lastLabel);
        return lastLabel;
      });
      return;
    }

    const centerX = viewport.scrollLeft + viewport.clientWidth / 2;
    let closestLabel = firstLabel;
    let minDistance = Number.POSITIVE_INFINITY;

    currentOptions.forEach((option) => {
      const card = cardRefs.current[option.label];
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

    setSelectedFilter((prev) => {
      if (prev === closestLabel) {
        return prev;
      }
      onFilterChange?.(selectedCategory, closestLabel);
      return closestLabel;
    });
  };

  useLayoutEffect(() => {
    const measureConnections = () => {
      const viewport = cardsViewportRef.current;
      const button = buttonRefs.current[selectedCategory];
      if (!viewport || !button) return;

      const viewportRect = viewport.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const nextButtonX = buttonRect.left + buttonRect.width / 2 - viewportRect.left;
      const nextCardCenters = currentOptions.map((option) => {
        const card = cardRefs.current[option.label];
        if (!card) return 0;
        const cardRect = card.getBoundingClientRect();
        return cardRect.left + cardRect.width / 2 - viewportRect.left;
      });

      setButtonX((prev) => (Math.abs(prev - nextButtonX) < 0.5 ? prev : nextButtonX));
      setCardCenters((prev) => {
        if (
          prev.length === nextCardCenters.length &&
          prev.every((value, index) => Math.abs(value - nextCardCenters[index]) < 0.5)
        ) {
          return prev;
        }
        return nextCardCenters;
      });
    };

    measureConnections();

    const viewport = cardsViewportRef.current;
    if (!viewport) return;

    viewport.addEventListener('scroll', measureConnections, { passive: true });
    window.addEventListener('resize', measureConnections);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measureConnections);
      resizeObserver.observe(viewport);
      currentOptions.forEach((option) => {
        const card = cardRefs.current[option.label];
        if (card) {
          resizeObserver?.observe(card);
        }
      });
    }

    return () => {
      viewport.removeEventListener('scroll', measureConnections);
      window.removeEventListener('resize', measureConnections);
      resizeObserver?.disconnect();
    };
  }, [selectedCategory, optionsKey, selectedFilter, selectedFilterLabel, period, indicatorType, totalUnits, totalAmount]);

  const getCardConnectionLine = (index: number) => {
    const cardX = cardCenters[index] ?? 0;
    const distance = cardX - buttonX;
    return { cardX, distance, visible: cardX > 0 };
  };

  return (
    <div className="relative mt-6">
      {/* Category Buttons */}
      <div className="flex gap-[10px]">
        <CategoryButton
          label={categoryLabels.status}
          active={selectedCategory === 'status'}
          onClick={() => handleCategoryClick('status')}
          ref={(ref) => buttonRefs.current['status'] = ref}
        />
        <CategoryButton
          label={categoryLabels.landYear}
          active={selectedCategory === 'landYear'}
          onClick={() => handleCategoryClick('landYear')}
          ref={(ref) => buttonRefs.current['landYear'] = ref}
        />
        <CategoryButton
          label={categoryLabels.city}
          active={selectedCategory === 'city'}
          onClick={() => handleCategoryClick('city')}
          ref={(ref) => buttonRefs.current['city'] = ref}
        />
      </div>

      {/* Filter Cards Container with Connection Lines */}
      <div className="relative overflow-x-hidden pt-[40px]">
        {/* Connection Lines - One for each card */}
        {currentOptions.map((option, index) => {
          const line = getCardConnectionLine(index);
          if (!line.visible) {
            return null;
          }
          return (
            <div 
              key={`line-${option.label}`}
              className="absolute pointer-events-none z-0" 
              style={{ left: `${buttonX}px`, top: '0' }}
            >
              {/* Vertical line down from button */}
              <svg className="block" fill="none" preserveAspectRatio="none" viewBox="0 0 1 24" style={{ width: '1px', height: '24px' }}>
                <path d="M0.5 0V24" stroke="#616366" strokeOpacity="0.21" />
              </svg>
              
              {/* Curved horizontal line to card */}
              <svg 
                className="block" 
                fill="none" 
                preserveAspectRatio="none" 
                viewBox={`0 0 ${Math.abs(line.distance)} 16.5`}
                style={{ 
                  width: `${Math.abs(line.distance)}px`, 
                  height: '16.5px',
                  position: 'absolute',
                  left: line.distance >= 0 ? '0' : `${line.distance}px`,
                  top: '23px'
                }}
              >
                <path 
                  d={line.distance >= 0 
                    ? `M${Math.abs(line.distance)} 16.5C${Math.abs(line.distance)} 0.5 0 0.5 0 0.5`
                    : `M0 16.5C0 0.5 ${Math.abs(line.distance)} 0.5 ${Math.abs(line.distance)} 0.5`
                  }
                  stroke="#616366" 
                  strokeOpacity="0.21" 
                />
              </svg>
            </div>
          );
        })}

        <div
          ref={cardsViewportRef}
          onScroll={updateSelectedFilterByScroll}
          className="flex gap-[7px] overflow-x-auto pb-2 relative z-10 scrollbar-hide"
        >
          {currentOptions.map((option, index) => (
            <FilterCard
              key={option.label}
              label={option.label}
              count={option.count}
              amount={option.amount}
              isSelected={selectedFilter === option.label}
              onClick={() => handleFilterSelect(option.label)}
              ref={(ref) => cardRefs.current[option.label] = ref}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CategoryButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const CategoryButton = forwardRef<HTMLButtonElement, CategoryButtonProps>(
  ({ label, active, onClick }, ref) => {
    return (
      <button
        onClick={onClick}
        className={`bg-white h-[30px] px-[14px] rounded-[10px] flex items-center justify-center transition-all ${
          active ? 'border border-[#007440]' : 'border-0'
        }`}
        ref={ref}
      >
        <p className={`font-medium text-[12px] leading-[16px] whitespace-nowrap ${
          active ? 'text-[#007440]' : 'text-[#4a5565]'
        }`}>
          {label}
        </p>
      </button>
    );
  }
);

CategoryButton.displayName = 'CategoryButton';

interface FilterCardProps {
  label: string;
  count: number;
  amount: number;
  isSelected: boolean;
  onClick: () => void;
}

const FilterCard = forwardRef<HTMLDivElement, FilterCardProps>(
  ({ label, count, amount, isSelected, onClick }, ref) => {
    return (
      <div
        onClick={onClick}
        className={`bg-white h-[80px] w-[102px] rounded-[10px] cursor-pointer transition-all shrink-0 relative ${
          isSelected ? 'border border-[#007440]' : 'border-2 border-transparent'
        }`}
        ref={ref}
      >
        {/* Label Tag */}
        <div className="absolute left-0 top-0 bg-[rgba(0,201,80,0.1)] h-[22px] rounded-tl-[10px] rounded-br-[10px] px-[5px] flex items-center max-w-[90%]">
          <p className="text-[#4a5565] text-[12px] font-medium leading-[16px] truncate">{label}</p>
        </div>

        {/* Value */}
        <div className="absolute left-[8px] right-[8px] bottom-[10px]">
          <p className="text-[#0a0a0a] text-[0px] leading-[0] font-semibold tracking-[0.0703px]">
            <span className="text-[16px] leading-[32px]">{count}</span>
            <span className="text-[12px] leading-[32px] font-normal">套</span>
          </p>
          <p className="text-[#6a7282] text-[10px] leading-[14px] mt-[-2px]">
            ({amount}亿)
          </p>
        </div>
      </div>
    );
  }
);

FilterCard.displayName = 'FilterCard';
