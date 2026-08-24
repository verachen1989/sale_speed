"use client";

import { useState } from "react";
import DenseMapOverview from "./dense-map-overview";
import GrandDashboard from "./grand-page";
import MapIntegratedOverview from "./map-integrated-overview";

type DashboardView = "dense" | "showcase" | "projects";

export default function DashboardShell() {
  const [view, setView] = useState<DashboardView>("dense");

  return (
    <div className="dashboard-shell">
      {view === "dense" ? (
        <DenseMapOverview
          onSwitchToIntegrated={() => setView("showcase")}
          onSwitchToProjects={() => setView("projects")}
        />
      ) : view === "showcase" ? (
        <MapIntegratedOverview
          onSwitchToDense={() => setView("dense")}
          onSwitchToProjects={() => setView("projects")}
        />
      ) : (
        <>
          <GrandDashboard />
          <div className="dashboard-view-switch" role="group" aria-label="大屏视图切换">
            <button type="button" aria-pressed="false" onClick={() => setView("dense")}>密集地图</button>
            <button type="button" aria-pressed="false" onClick={() => setView("showcase")}>融合地图</button>
            <button type="button" className="is-active" aria-pressed="true">项目驾驶舱</button>
          </div>
        </>
      )}
    </div>
  );
}
