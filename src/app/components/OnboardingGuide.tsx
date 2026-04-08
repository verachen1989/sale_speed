import { useEffect, useLayoutEffect, useState } from 'react';
import { X } from 'lucide-react';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  target: HTMLElement | null;
}

interface OnboardingGuideProps {
  open: boolean;
  steps: GuideStep[];
  onClose: () => void;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_WIDTH = 320;
const COMPACT_CARD_WIDTH = 288;
const VIEWPORT_GAP = 16;
const HIGHLIGHT_PADDING = 10;

export function OnboardingGuide({ open, steps, onClose }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  const activeStep = steps[currentStep];

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !activeStep?.target) return;

    activeStep.target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [activeStep, open]);

  useLayoutEffect(() => {
    if (!open || !activeStep?.target) {
      setHighlightRect(null);
      return;
    }

    const updateRect = () => {
      const rect = activeStep.target?.getBoundingClientRect();
      if (!rect) {
        setHighlightRect(null);
        return;
      }

      setHighlightRect({
        top: Math.max(VIEWPORT_GAP, rect.top - HIGHLIGHT_PADDING),
        left: Math.max(VIEWPORT_GAP, rect.left - HIGHLIGHT_PADDING),
        width: Math.min(window.innerWidth - VIEWPORT_GAP * 2, rect.width + HIGHLIGHT_PADDING * 2),
        height: rect.height + HIGHLIGHT_PADDING * 2,
      });
    };

    updateRect();

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [activeStep, open]);

  if (!open || !activeStep || !highlightRect) {
    return null;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isCompact = viewportWidth <= 390;
  const isLastStep = currentStep === steps.length - 1;
  const cardWidth = Math.min(
    isCompact ? COMPACT_CARD_WIDTH : CARD_WIDTH,
    viewportWidth - VIEWPORT_GAP * 2
  );
  const cardMaxHeight = Math.min(320, viewportHeight - VIEWPORT_GAP * 2);
  const spaceBelow = viewportHeight - (highlightRect.top + highlightRect.height);
  const shouldPlaceAbove = spaceBelow < 260 && highlightRect.top > viewportHeight * 0.44;
  const cardTop = shouldPlaceAbove
    ? Math.max(VIEWPORT_GAP, highlightRect.top - cardMaxHeight - 18)
    : Math.min(viewportHeight - cardMaxHeight - VIEWPORT_GAP, highlightRect.top + highlightRect.height + 18);
  const preferredLeft = highlightRect.left;
  const cardLeft = Math.min(
    viewportWidth - cardWidth - VIEWPORT_GAP,
    Math.max(VIEWPORT_GAP, preferredLeft)
  );

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute rounded-[24px] border-2 border-[#7ef0b0] bg-transparent transition-all duration-300"
        style={{
          top: highlightRect.top,
          left: highlightRect.left,
          width: highlightRect.width,
          height: highlightRect.height,
          boxShadow: '0 0 0 9999px rgba(4, 12, 10, 0.72)',
        }}
      />

      <div
        className="absolute rounded-[24px] bg-[#0f2c25] p-4 text-white shadow-[0_18px_48px_rgba(0,0,0,0.28)] sm:p-5"
        style={{
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
          maxHeight: cardMaxHeight,
        }}
      >
        <div className="flex max-h-full flex-col">
        <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4 sm:gap-4">
          <div className="min-w-0">
            <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.18em] text-[#8fe0b6]">
              Step {currentStep + 1}/{steps.length}
            </div>
            <h3 className="text-[17px] font-semibold leading-6 sm:text-[18px]">{activeStep.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)] text-white transition hover:bg-[rgba(255,255,255,0.2)]"
            aria-label="关闭引导"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="overflow-y-auto pr-1 text-[13px] leading-6 text-[rgba(255,255,255,0.8)] sm:text-[14px]">{activeStep.description}</p>

        <div className="mt-4 flex flex-col gap-3 sm:mt-5">
          <div className="flex gap-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === currentStep ? 'w-7 bg-[#7ef0b0]' : 'w-2.5 bg-[rgba(255,255,255,0.3)]'
                }`}
                aria-label={`跳转到第 ${index + 1} 步`}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[rgba(255,255,255,0.15)] px-3 py-1.5 text-[12px] text-[rgba(255,255,255,0.75)] transition hover:bg-[rgba(255,255,255,0.1)]"
            >
              跳过
            </button>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((step) => step - 1)}
                className="rounded-full border border-[rgba(255,255,255,0.15)] px-3 py-1.5 text-[12px] text-white transition hover:bg-[rgba(255,255,255,0.1)]"
              >
                上一步
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  onClose();
                  return;
                }
                setCurrentStep((step) => step + 1);
              }}
              className="rounded-full bg-[#7ef0b0] px-3 py-1.5 text-[12px] font-semibold text-[#0b221c] transition hover:bg-[#98f3c0]"
            >
              {isLastStep ? '完成' : '下一步'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
