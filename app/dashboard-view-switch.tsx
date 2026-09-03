"use client";

export type DashboardView = "projects" | "showcase" | "half-year-2026";

const DASHBOARD_VIEWS: readonly { id: DashboardView; label: string }[] = [
  { id: "projects", label: "经营驾驶舱1" },
  { id: "half-year-2026", label: "经营驾驶舱3" },
];

export default function DashboardViewSwitch({
  activeView,
  onSelectView,
  className = "fusion-view-switch",
}: {
  activeView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  className?: string;
}) {
  return (
    <div className={className} role="group" aria-label="大屏视图切换">
      {DASHBOARD_VIEWS.map((view) => {
        const isActive = view.id === activeView;
        return (
          <button
            key={view.id}
            type="button"
            className={isActive ? "is-active" : undefined}
            aria-pressed={isActive}
            data-dashboard-view={view.id}
            onClick={() => {
              if (!isActive) onSelectView(view.id);
            }}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
