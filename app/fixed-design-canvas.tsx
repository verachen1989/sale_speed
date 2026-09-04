"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styles from "./fixed-design-canvas.module.css";

type FixedDesignCanvasProps = {
  children: ReactNode;
  designWidth: number;
  designHeight: number;
  title: string;
};

type CanvasViewport = {
  scale: number;
  height: number;
};

export function resolveCanvasViewport(
  viewportWidth: number,
  viewportHeight: number,
  designWidth: number,
  designHeight: number,
): CanvasViewport {
  if (
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    designWidth <= 0 ||
    designHeight <= 0
  ) {
    return { scale: 1, height: designHeight };
  }

  // 只按宽度等比缩放，画布高度则跟随当前视口补足。
  // 这样始终保留大屏的固定横向布局，同时不会因屏幕比例不同而上下留白。
  const scale = viewportWidth / designWidth;

  return {
    scale,
    height: viewportHeight / scale,
  };
}

function copyDocumentStyles(targetDocument: Document) {
  const sourceNodes = document.head.querySelectorAll(
    'style, link[rel="stylesheet"], link[rel="preload"][as="style"]',
  );

  for (const sourceNode of sourceNodes) {
    targetDocument.head.append(sourceNode.cloneNode(true));
  }

  const base = targetDocument.createElement("base");
  base.href = document.baseURI;
  targetDocument.head.prepend(base);

  const isolationStyle = targetDocument.createElement("style");
  isolationStyle.textContent = `
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
    }

    [data-dashboard-view="half-year-2026"] {
      width: 100% !important;
      height: 100% !important;
      min-height: 100% !important;
    }
  `;
  targetDocument.head.append(isolationStyle);
}

export default function FixedDesignCanvas({
  children,
  designWidth,
  designHeight,
  title,
}: FixedDesignCanvasProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewport>({
    scale: 1,
    height: designHeight,
  });

  const updateCanvasViewport = useCallback(() => {
    setCanvasViewport(
      resolveCanvasViewport(
        window.innerWidth,
        window.innerHeight,
        designWidth,
        designHeight,
      ),
    );
  }, [designHeight, designWidth]);

  useEffect(() => {
    const initialFrame = window.requestAnimationFrame(updateCanvasViewport);
    window.addEventListener("resize", updateCanvasViewport);
    window.visualViewport?.addEventListener("resize", updateCanvasViewport);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("resize", updateCanvasViewport);
      window.visualViewport?.removeEventListener("resize", updateCanvasViewport);
    };
  }, [updateCanvasViewport]);

  const prepareFrame = useCallback(() => {
    const frame = frameRef.current;
    const frameDocument = frame?.contentDocument;
    if (!frame || !frameDocument) return;

    frameDocument.documentElement.lang = document.documentElement.lang || "zh-CN";
    frameDocument.body.className = document.body.className;
    copyDocumentStyles(frameDocument);
    setPortalTarget(frameDocument.body);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (frame?.contentDocument?.readyState === "complete") prepareFrame();
  }, [prepareFrame]);

  const canvasStyle = {
    "--design-width": `${designWidth}px`,
    "--design-height": `${canvasViewport.height}px`,
    "--canvas-scale": canvasViewport.scale,
  } as CSSProperties;

  return (
    <div className={styles.viewport}>
      <div className={styles.canvas} style={canvasStyle}>
        {!portalTarget ? <div className={styles.fallback}>{children}</div> : null}
        <iframe
          ref={frameRef}
          className={styles.frame}
          title={title}
          srcDoc="<!doctype html><html><head></head><body></body></html>"
          onLoad={prepareFrame}
        />
        {portalTarget ? createPortal(children, portalTarget) : null}
      </div>
    </div>
  );
}
