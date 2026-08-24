"use client";

import { useState } from "react";
import AnnualOverview from "./annual-overview";
import GrandDashboard from "./grand-page";

type DashboardView = "annual" | "live";

export default function DashboardShell() {
  const [view, setView] = useState<DashboardView>("annual");

  return (
    <div className="dashboard-shell">
      {view === "annual" ? (
        <AnnualOverview onSwitchToLive={() => setView("live")} />
      ) : (
        <>
          <GrandDashboard />
          <div className="dashboard-view-switch" role="group" aria-label="大屏视图切换">
            <button type="button" aria-pressed="false" onClick={() => setView("annual")}>年度全景</button>
            <button type="button" className="is-active" aria-pressed="true">实时地图</button>
          </div>
        </>
      )}
    </div>
  );
}
