"use client";

import { useState } from "react";
import GrandDashboard from "./grand-page";
import MapIntegratedOverview from "./map-integrated-overview";

type DashboardView = "showcase" | "projects";

export default function DashboardShell() {
  const [view, setView] = useState<DashboardView>("showcase");

  return (
    <div className="dashboard-shell">
      {view === "showcase" ? (
        <MapIntegratedOverview onSwitchToProjects={() => setView("projects")} />
      ) : (
        <>
          <GrandDashboard />
          <div className="dashboard-view-switch" role="group" aria-label="大屏视图切换">
            <button type="button" aria-pressed="false" onClick={() => setView("showcase")}>经营全景</button>
            <button type="button" className="is-active" aria-pressed="true">项目驾驶舱</button>
          </div>
        </>
      )}
    </div>
  );
}
