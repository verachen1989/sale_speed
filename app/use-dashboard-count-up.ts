"use client";

import { useEffect, type RefObject } from "react";

const NUMERIC_TEXT = /^(-?)([\d,]+)(\.\d+)?(\+)?$/;

export function useDashboardCountUp(
  rootRef: RefObject<HTMLElement | null>,
  triggerKey: string,
  selector: string,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const frames = new Set<number>();
    const elements = Array.from(root.querySelectorAll<HTMLElement>(selector));

    elements.forEach((element, index) => {
      const finalText = element.textContent?.trim() ?? "";
      const match = finalText.match(NUMERIC_TEXT);
      if (!match) return;

      const finalValue = Number(finalText.replaceAll(",", "").replace("+", ""));
      if (!Number.isFinite(finalValue) || finalValue === 0) return;

      const decimals = match[3]?.length ? match[3].length - 1 : 0;
      const hasPlus = Boolean(match[4]);
      const formatter = new Intl.NumberFormat("zh-CN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      const delay = Math.min(index * 22, 220);
      const duration = 760;
      let start = 0;
      element.dataset.counting = "true";
      element.setAttribute("aria-label", finalText);

      const draw = (now: number) => {
        if (!start) start = now + delay;
        const progress = Math.max(0, Math.min(1, (now - start) / duration));
        const eased = 1 - Math.pow(1 - progress, 3);
        const nextValue = finalValue * eased;
        element.textContent = `${formatter.format(nextValue)}${hasPlus ? "+" : ""}`;
        if (progress < 1) {
          const frame = requestAnimationFrame(draw);
          frames.add(frame);
        } else {
          element.textContent = finalText;
          delete element.dataset.counting;
        }
      };

      const frame = requestAnimationFrame(draw);
      frames.add(frame);
    });

    return () => {
      frames.forEach(cancelAnimationFrame);
      elements.forEach((element) => {
        const finalText = element.getAttribute("aria-label");
        if (element.dataset.counting === "true" && finalText) element.textContent = finalText;
        delete element.dataset.counting;
      });
    };
  }, [rootRef, selector, triggerKey]);
}
