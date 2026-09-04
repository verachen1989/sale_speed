"use client";

import HalfYear2026Dashboard from "./half-year-2026-dashboard";
import FixedDesignCanvas from "./fixed-design-canvas";

const DASHBOARD_DESIGN_WIDTH = 1920;
const DASHBOARD_DESIGN_HEIGHT = 960;

export default function DashboardShell() {
  return (
    <FixedDesignCanvas
      designWidth={DASHBOARD_DESIGN_WIDTH}
      designHeight={DASHBOARD_DESIGN_HEIGHT}
      title="绿城中国经营驾驶舱"
    >
      <HalfYear2026Dashboard />
    </FixedDesignCanvas>
  );
}
