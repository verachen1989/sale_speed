import {
  WENSHU_PROJECTS,
  WENSHU_PROJECT_SNAPSHOT_DATE,
} from "./wenshu-projects-snapshot";
import {
  WENSHU_CITY_SALES_6283,
  WENSHU_CITY_SALES_6283_SNAPSHOT_DATE,
} from "./wenshu-city-sales-snapshot";

export type MapRegionScope = {
  provinceAdcode: number;
  cityAdcode?: number | null;
};

export type MapRegionMetrics = {
  projectCount: number;
  cityCount: number;
  projectBuildingAreaWan: number;
  activeDevelopmentProjectCount: number;
  activeDevelopmentBuildingAreaWan: number;
  contractSalesYi: number;
  projectSnapshotDate: string;
  salesSnapshotDate: string;
};

const ACTIVE_DEVELOPMENT_STATUSES = new Set(["在建", "待开发"]);

export function getMapRegionMetrics({
  provinceAdcode,
  cityAdcode,
}: MapRegionScope): MapRegionMetrics {
  const projects = WENSHU_PROJECTS.filter((project) => (
    project.provinceAdcode === provinceAdcode
    && (cityAdcode == null || project.cityAdcode === cityAdcode)
  ));
  const activeDevelopmentProjects = projects.filter((project) => (
    ACTIVE_DEVELOPMENT_STATUSES.has(project.developmentStatus)
  ));
  const cityNames = new Set(projects.map((project) => project.cityName));
  const contractSalesYi = [...cityNames].reduce((total, cityName) => (
    total + (WENSHU_CITY_SALES_6283[cityName]?.contractSalesYi ?? 0)
  ), 0);

  return {
    projectCount: projects.length,
    cityCount: cityNames.size,
    projectBuildingAreaWan: projects.reduce((total, project) => total + project.totalBuildingAreaWan, 0),
    activeDevelopmentProjectCount: activeDevelopmentProjects.length,
    activeDevelopmentBuildingAreaWan: activeDevelopmentProjects.reduce(
      (total, project) => total + project.totalBuildingAreaWan,
      0,
    ),
    contractSalesYi,
    projectSnapshotDate: WENSHU_PROJECT_SNAPSHOT_DATE,
    salesSnapshotDate: WENSHU_CITY_SALES_6283_SNAPSHOT_DATE,
  };
}
