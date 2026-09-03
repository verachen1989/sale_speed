export type PixelRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type MapSafeArea = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(maximum, Math.max(minimum, value))
);

const intersects = (left: PixelRect, right: PixelRect, gap = 0) => (
  left.left < right.right + gap
  && left.right > right.left - gap
  && left.top < right.bottom + gap
  && left.bottom > right.top - gap
);

export function resolveMapSafeArea(mountBounds: PixelRect, occluderBounds: readonly PixelRect[]): MapSafeArea {
  const width = Math.max(1, mountBounds.right - mountBounds.left);
  const height = Math.max(1, mountBounds.bottom - mountBounds.top);
  const centreX = width / 2;
  const centreY = height / 2;
  const safeArea: MapSafeArea = { left: 0, top: 0, right: width, bottom: height };

  occluderBounds.forEach((bounds) => {
    const local = {
      left: clamp(bounds.left - mountBounds.left, 0, width),
      top: clamp(bounds.top - mountBounds.top, 0, height),
      right: clamp(bounds.right - mountBounds.left, 0, width),
      bottom: clamp(bounds.bottom - mountBounds.top, 0, height),
    };
    if (local.right <= local.left || local.bottom <= local.top) return;

    if (local.right <= centreX) {
      safeArea.left = Math.max(safeArea.left, local.right);
      return;
    }
    if (local.left >= centreX) {
      safeArea.right = Math.min(safeArea.right, local.left);
      return;
    }
    if (local.bottom <= centreY) {
      safeArea.top = Math.max(safeArea.top, local.bottom);
      return;
    }
    if (local.top >= centreY) {
      safeArea.bottom = Math.min(safeArea.bottom, local.top);
      return;
    }

    // A blocker crossing both axes is assigned to its nearest viewport edge.
    // This keeps a centred bottom dock from being silently ignored.
    const nearestEdge = [
      { edge: "left", distance: local.left },
      { edge: "right", distance: width - local.right },
      { edge: "top", distance: local.top },
      { edge: "bottom", distance: height - local.bottom },
    ].sort((left, right) => left.distance - right.distance)[0]?.edge;
    if (nearestEdge === "left") safeArea.left = Math.max(safeArea.left, local.right);
    if (nearestEdge === "right") safeArea.right = Math.min(safeArea.right, local.left);
    if (nearestEdge === "top") safeArea.top = Math.max(safeArea.top, local.bottom);
    if (nearestEdge === "bottom") safeArea.bottom = Math.min(safeArea.bottom, local.top);
  });

  safeArea.left = clamp(safeArea.left, 0, width - 1);
  safeArea.right = clamp(safeArea.right, safeArea.left + 1, width);
  safeArea.top = clamp(safeArea.top, 0, height - 1);
  safeArea.bottom = clamp(safeArea.bottom, safeArea.top + 1, height);
  return safeArea;
}

export function resolveMapViewportFit(
  width: number,
  height: number,
  safeArea: MapSafeArea,
  minimumVisibleFraction = .64,
) {
  const safeWidth = Math.max(1, safeArea.right - safeArea.left);
  const safeHeight = Math.max(1, safeArea.bottom - safeArea.top);
  const fittedWidth = Math.max(safeWidth, width * minimumVisibleFraction);
  const fittedHeight = Math.max(safeHeight, height * minimumVisibleFraction);
  const baselineAspect = 16 / 9;
  const baselineHalfFov = Math.PI / 12;
  const widthFitAspect = fittedWidth / Math.max(1, height);
  const heightFitRatio = fittedHeight / Math.max(1, height);
  const widthFov = 2 * Math.atan(Math.tan(baselineHalfFov) * baselineAspect / widthFitAspect) * 180 / Math.PI;
  const heightFov = 2 * Math.atan(Math.tan(baselineHalfFov) / heightFitRatio) * 180 / Math.PI;

  return {
    fittedWidth,
    fittedHeight,
    widthFitAspect,
    heightFitRatio,
    fov: clamp(Math.max(30, widthFov, heightFov), 30, 52),
    centerOffsetXPx: (safeArea.left + safeArea.right) / 2 - width / 2,
    centerOffsetYPx: (safeArea.top + safeArea.bottom) / 2 - height / 2,
  };
}

export function resolveOcclusionShift(
  rect: PixelRect,
  occluders: readonly PixelRect[],
  container: PixelRect,
  gap = 12,
): { x: number; y: number } | null {
  let x = 0;
  let y = 0;

  for (const blocker of occluders) {
    const current = {
      left: rect.left + x,
      top: rect.top + y,
      right: rect.right + x,
      bottom: rect.bottom + y,
    };
    if (!intersects(current, blocker, gap)) continue;

    const candidates = [
      { x: blocker.left - gap - current.right, y: 0 },
      { x: blocker.right + gap - current.left, y: 0 },
      { x: 0, y: blocker.top - gap - current.bottom },
      { x: 0, y: blocker.bottom + gap - current.top },
    ].filter((candidate) => (
      current.left + candidate.x >= container.left
      && current.right + candidate.x <= container.right
      && current.top + candidate.y >= container.top
      && current.bottom + candidate.y <= container.bottom
    )).sort((left, right) => (
      Math.abs(left.x) + Math.abs(left.y) - Math.abs(right.x) - Math.abs(right.y)
    ));

    const shift = candidates[0];
    if (!shift) return null;
    x += shift.x;
    y += shift.y;
  }

  return { x, y };
}
