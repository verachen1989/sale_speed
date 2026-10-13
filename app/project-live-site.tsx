import { ENGINEERING_SITE_PROJECTS } from "./heavy-asset-project-cases";

const PANORAMA_PROJECTS = [
  { projectRecordId: "P4098", projectName: "杭州枫丹玫瑰园", orgId: "327532140060992" },
  { projectRecordId: "P3895", projectName: "广州馥香园", orgId: "100056397316320" },
  { projectRecordId: "P3978", projectName: "杭州湖映金沙", orgId: "111507435806944" },
] as const;

function hasProjectMedia(projectId: string) {
  return Boolean(getProjectLiveSite(projectId) || PANORAMA_PROJECTS.some((site) => site.projectRecordId === projectId));
}

export function getProjectLiveSite(projectId: string) {
  return ENGINEERING_SITE_PROJECTS.find((site) => site.projectRecordId === projectId);
}

export function prioritizeLiveProjects<T extends { id: string }>(projects: readonly T[]): T[] {
  return [...projects.filter((project) => hasProjectMedia(project.id)),
    ...projects.filter((project) => !hasProjectMedia(project.id))];
}

export function ProjectLiveSiteLink({ projectId }: { projectId: string }) {
  const site = getProjectLiveSite(projectId);
  const panorama = PANORAMA_PROJECTS.find((item) => item.projectRecordId === projectId);
  return <>{site ? <a className="project-live-site-link" href={site.url} target="_blank" rel="noopener noreferrer"
    aria-label={`${site.projectName} · 查看现场视频`} title="查看现场视频">
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>
    现场
  </a> : null}
  {panorama ? <a className="project-live-site-link" target="_blank" rel="noopener noreferrer"
    href={`https://gc.gtcloud.cn/home.html#/project_bigscreen/quanjingzhanshi?tenantId=5600007&orgId=${panorama.orgId}&orgType=PROJECT`}
    aria-label={`${panorama.projectName} · 查看全景展示`} title="查看全景展示">
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <ellipse cx="8" cy="8" rx="2.8" ry="6" fill="none" stroke="currentColor" />
      <path d="M2 8h12" stroke="currentColor" />
    </svg>全景
  </a> : null}</>;

}
