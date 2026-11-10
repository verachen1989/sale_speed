"use client";

import { useState } from "react";
import { ENGINEERING_SITE_PROJECTS } from "./heavy-asset-project-cases";
import { WENSHU_PROJECTS } from "./wenshu-projects-snapshot";
import mediaRows from "./project-media-snapshot.json";

const PANORAMA_PROJECTS = [
  { projectRecordId: "P4098", projectName: "杭州枫丹玫瑰园", orgId: "327532140060992" },
  { projectRecordId: "P3895", projectName: "广州馥香园", orgId: "100056397316320" },
  { projectRecordId: "P3978", projectName: "杭州湖映金沙", orgId: "111507435806944" },
] as const;

function projectMedia(projectId: string) {
  const project = WENSHU_PROJECTS.find((item) => item.id === projectId);
  if (!project) return [];
  const name = project.name.split("（")[0];
  return mediaRows.filter((row) => row["所属城市（台账参考）"] === project.cityName &&
    row["项目名称"].replace(/[一二三四五六七八九十]+期$/, "") === name);
}
export function unmatchedCityMedia(cityName: string, siteOnly = false) {
  const matched = new Set(WENSHU_PROJECTS.filter((p) => p.cityName === cityName).flatMap((p) => projectMedia(p.id).map((row) => row["项目名称"])));
  return [...new Set(mediaRows.filter((row) => row["所属城市（台账参考）"] === cityName && !matched.has(row["项目名称"]) && (unwrapLink(row["现场链接"]) || (!siteOnly && unwrapLink(row["全景链接"]))))
    .map((row) => row["项目名称"].replace(/[一二三四五六七八九十]+期$/, "")))];
}
export function hasProjectLiveSite(projectId: string) {
  const rows = projectMedia(projectId);
  if (rows.length) return rows.some((row) => Boolean(unwrapLink(row["现场链接"])));
  return Boolean(getProjectLiveSite(projectId)?.url);
}
export function hasProjectMedia(projectId: string) {
  const rows = projectMedia(projectId);
  if (rows.length) return rows.some((row) => Boolean(unwrapLink(row["现场链接"]) || (!siteOnly && unwrapLink(row["全景链接"]))));
  return Boolean(getProjectLiveSite(projectId)?.url || PANORAMA_PROJECTS.some((site) => site.projectRecordId === projectId));
}
export function getProjectLiveSite(projectId: string) {
  return ENGINEERING_SITE_PROJECTS.find((site) => site.projectRecordId === projectId);
}
export function prioritizeLiveProjects<T extends { id: string }>(projects: readonly T[]): T[] {
  return [...projects.filter((project) => hasProjectMedia(project.id)), ...projects.filter((project) => !hasProjectMedia(project.id))];
}
function unwrapLink(value: string | null) {
  if (!value) return "";
  return value.match(/\]\((.*)\)$/)?.[1] ?? value;
}
export function ProjectLiveSiteLink({ projectId = "", mediaName }: { projectId?: string; mediaName?: string }) {
  const [selectedPhase, setSelectedPhase] = useState(0);
  const rows = mediaName ? mediaRows.filter((row) => row["项目名称"].replace(/[一二三四五六七八九十]+期$/, "") === mediaName) : projectMedia(projectId);
  const row = rows[selectedPhase] ?? rows[0];
  const site = getProjectLiveSite(projectId);
  const panorama = PANORAMA_PROJECTS.find((item) => item.projectRecordId === projectId);
  const siteUrl = row ? unwrapLink(row["现场链接"]) : site?.url;
  const panoramaUrl = row ? unwrapLink(row["全景链接"]) : panorama ? `https://gc.gtcloud.cn/home.html#/project_bigscreen/quanjingzhanshi?tenantId=5600007&orgId=${panorama.orgId}&orgType=PROJECT` : null;
  const name = row?.["项目名称"] ?? site?.projectName ?? panorama?.projectName;
  const note = row ? [row["现场监控情况"], row["现场情况"]].filter(Boolean).join("；") : "";
  if (!siteUrl && !panoramaUrl) return null;
  return <span className="project-media-controls">
    {rows.length > 1 ? <select className="project-media-phase" aria-label={`${name}分期`} value={selectedPhase} onChange={(event) => setSelectedPhase(Number(event.target.value))}>
      {rows.map((item, index) => <option key={item["项目名称"]} value={index}>{item["项目名称"].match(/[一二三四五六七八九十]+期$/)?.[0] ?? item["项目名称"]}</option>)}
    </select> : null}
    {siteUrl ? <a className="project-live-site-link" href={siteUrl} target="_blank" rel="noopener noreferrer" aria-label={`${name} · 查看现场视频`} title={note || "查看现场视频"}>▶ 现场</a> : null}
    {panoramaUrl ? <a className="project-live-site-link" href={panoramaUrl} target="_blank" rel="noopener noreferrer" aria-label={`${name} · 查看全景展示`} title={note || "查看全景展示"}>◎ 全景</a> : null}
  </span>;
}
