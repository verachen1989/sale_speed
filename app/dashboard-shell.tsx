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
        <MapIntegratedOverview
          onSwitchToProjects={() => setView("projects")}
        />
      ) : (
        <GrandDashboard onSwitchToShowcase={() => setView("showcase")} />
      )}
    </div>
  );
}
