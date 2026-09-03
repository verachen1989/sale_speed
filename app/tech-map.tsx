"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {
  WENSHU_CITY_SUMMARIES,
  WENSHU_COVERED_CITY_COUNT,
  WENSHU_DOMESTIC_PROJECT_COUNT,
} from "./wenshu-projects-snapshot";
import {
  ENGINEERING_SITE_PROJECTS,
  HEAVY_ASSET_PROJECT_CASES,
  type EngineeringSiteProject,
  type HeavyAssetProjectCase,
} from "./heavy-asset-project-cases";
import { resolveMapSafeArea, resolveMapViewportFit, resolveOcclusionShift } from "./map-occlusion";
import { publicAssetPath } from "./public-path";

type Position = [number, number];
type Polygon = Position[][];

type MapGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: Position[][] | Position[][][];
};

type MapFeature = {
  properties: {
    adcode: number;
    name: string;
  };
  geometry: MapGeometry | null;
};

type MapCollection = {
  features: MapFeature[];
};

export type ProvinceSelection = {
  adcode: number;
  name: string;
};

export type CitySelection = {
  cityAdcode: number;
  provinceAdcode: number;
  provinceName: string;
  name: string;
  count: number;
};

export type TechMapVisualTheme = "dark" | "light";

export type TechMapProps = {
  presentationMode?: "business" | "outline";
  visualTheme?: TechMapVisualTheme;
  activeAdcodes: number[];
  activeCityAdcode: number | null;
  scopedCityAdcodes?: number[];
  scopedCityProjectCounts?: Record<number, number>;
  scopeName: string;
  viewOffsetX?: number;
  labelOcclusionSelector?: string;
  viewportOcclusionSelector?: string;
  interactionMode?: "drilldown" | "locate" | "metrics";
  selectedCityActionLabel?: string;
  projectCases?: readonly HeavyAssetProjectCase[];
  engineeringSites?: readonly EngineeringSiteProject[];
  onProvinceSelect: (province: ProvinceSelection) => void;
  onCitySelect: (city: CitySelection) => void;
  onProjectCaseSelect?: (projectCase: HeavyAssetProjectCase) => void;
};

let mapCollectionPromise: Promise<MapCollection> | null = null;

function loadMapCollection() {
  if (!mapCollectionPromise) {
    mapCollectionPromise = fetch(publicAssetPath("/china-geo.json"))
      .then((response) => {
        if (!response.ok) throw new Error(`地图数据加载失败：${response.status}`);
        return response.json() as Promise<MapCollection>;
      })
      .catch((error: unknown) => {
        mapCollectionPromise = null;
        throw error;
      });
  }
  return mapCollectionPromise;
}

type RegionVisual = {
  adcode: number;
  name: string;
  group: THREE.Group;
  mesh: THREE.Mesh<THREE.ExtrudeGeometry, THREE.Material[]>;
  topMaterial: THREE.MeshPhysicalMaterial;
  sideMaterial: THREE.MeshStandardMaterial;
  boundaryMaterial: THREE.LineBasicMaterial;
  boundaryGlowMaterial: THREE.LineBasicMaterial;
  selected: boolean;
};

type CityVisual = {
  city: CitySelection;
  displayCount: number;
  projectCases: readonly HeavyAssetProjectCase[];
  engineeringSites: readonly EngineeringSiteProject[];
  hitTarget: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  projectCloud: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  objects: THREE.Object3D[];
  labelObject: CSS2DObject;
  coreMaterial: THREE.MeshBasicMaterial;
  beamMaterial: THREE.MeshBasicMaterial;
  glowMaterial: THREE.SpriteMaterial;
  ringMaterial: THREE.MeshBasicMaterial;
  cloudMaterial: THREE.PointsMaterial;
  labelElement: HTMLDivElement;
};

type NetworkVisual = {
  provinceAdcode: number;
  cityAdcode: number;
  arc: THREE.Mesh;
  halo: THREE.Mesh;
  light: THREE.Sprite;
};

const EMPTY_CITY_PROJECT_COUNTS: Record<number, number> = {};

const ACCESSIBLE_ONLY_STYLE: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const CENTER_LON = 104;
const CENTER_LAT = 35.5;
const LONGITUDE_SCALE = Math.cos((35 * Math.PI) / 180);
const MAP_SCALE = 1.03;
const MAP_DEPTH = 1.18;

type MapPalette = {
  gradientIndigo: THREE.Color;
  gradientViolet: THREE.Color;
  gradientCyan: THREE.Color;
  gradientMint: THREE.Color;
  gradientBand: THREE.Color;
  particleLight: THREE.Color;
  boundaryGlow: THREE.Color;
  boundarySelected: THREE.Color;
  cityPrimary: THREE.Color;
  citySecondary: THREE.Color;
  citySelected: THREE.Color;
  cityHub: THREE.Color;
  arcPrimary: THREE.Color;
  arcWarm: THREE.Color;
  fogColor: number;
  fogDensity: number;
  exposure: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  hemisphereSky: number;
  hemisphereGround: number;
  hemisphereIntensity: number;
  keyLight: number;
  keyLightIntensity: number;
  accentLight: number;
  accentLightIntensity: number;
  fillLight: number;
  fillLightIntensity: number;
  platform: number;
  platformOpacity: number;
  gridMajor: number;
  gridMinor: number;
  gridOpacity: number;
  space: number;
  spaceOpacity: number;
  land: number;
  landEmissive: number;
  landEmissiveIntensity: number;
  landOpacity: number;
  side: number;
  sideOpacity: number;
  boundary: number;
  boundaryOpacity: number;
  boundaryGlowOpacity: number;
  selectedLand: number;
  selectedEmissive: number;
  selectedBoundary: number;
  particleOpacity: number;
  blending: THREE.Blending;
};

const DARK_MAP_PALETTE: MapPalette = {
  gradientIndigo: new THREE.Color(0x086fd4),
  gradientViolet: new THREE.Color(0x078ad6),
  gradientCyan: new THREE.Color(0x08bcd7),
  gradientMint: new THREE.Color(0x16d0c7),
  gradientBand: new THREE.Color(0x7de7f1),
  particleLight: new THREE.Color(0xa8fbff),
  boundaryGlow: new THREE.Color().setRGB(.12, .95, 1.2),
  boundarySelected: new THREE.Color().setRGB(.42, 1.65, 1.12),
  cityPrimary: new THREE.Color().setRGB(.08, 1.6, .72),
  citySecondary: new THREE.Color().setRGB(.1, 1.2, 1.55),
  citySelected: new THREE.Color().setRGB(.64, 1.72, .38),
  cityHub: new THREE.Color().setRGB(1.42, .88, .22),
  arcPrimary: new THREE.Color().setRGB(.1, 1.05, 1.5),
  arcWarm: new THREE.Color().setRGB(1.28, .7, .12),
  fogColor: 0x021126,
  fogDensity: .0055,
  exposure: 1,
  bloomStrength: .46,
  bloomRadius: .24,
  bloomThreshold: .74,
  hemisphereSky: 0x75cfe2,
  hemisphereGround: 0x030713,
  hemisphereIntensity: .9,
  keyLight: 0xc9eff4,
  keyLightIntensity: 1.1,
  accentLight: 0x087cff,
  accentLightIntensity: 3.2,
  fillLight: 0x3ff7ff,
  fillLightIntensity: 2.5,
  platform: 0x276dff,
  platformOpacity: .007,
  gridMajor: 0x31b6ff,
  gridMinor: 0x173e8f,
  gridOpacity: .012,
  space: 0x72ddff,
  spaceOpacity: .018,
  land: 0xc4e5f2,
  landEmissive: 0x0b4f86,
  landEmissiveIntensity: .46,
  landOpacity: .95,
  side: 0x075ec8,
  sideOpacity: .92,
  boundary: 0x9deeff,
  boundaryOpacity: .88,
  boundaryGlowOpacity: .22,
  selectedLand: 0x8fd8cc,
  selectedEmissive: 0x07524f,
  selectedBoundary: 0x9af1d8,
  particleOpacity: .36,
  blending: THREE.AdditiveBlending,
};

const LIGHT_MAP_PALETTE: MapPalette = {
  gradientIndigo: new THREE.Color(0xe7f1eb),
  gradientViolet: new THREE.Color(0xd4e9dd),
  gradientCyan: new THREE.Color(0xb8ddc9),
  gradientMint: new THREE.Color(0x8bc9a7),
  gradientBand: new THREE.Color(0xf8fbf9),
  particleLight: new THREE.Color(0x0a8c50),
  boundaryGlow: new THREE.Color(0x6bc79a),
  boundarySelected: new THREE.Color(0x007440),
  cityPrimary: new THREE.Color(0x007440),
  citySecondary: new THREE.Color(0x3478b9),
  citySelected: new THREE.Color(0x005b33),
  cityHub: new THREE.Color(0xd8941f),
  arcPrimary: new THREE.Color(0x2da36a),
  arcWarm: new THREE.Color(0xd8941f),
  fogColor: 0xf4f7f5,
  fogDensity: .0024,
  exposure: 1.04,
  bloomStrength: .08,
  bloomRadius: .14,
  bloomThreshold: .9,
  hemisphereSky: 0xffffff,
  hemisphereGround: 0xe5eee9,
  hemisphereIntensity: 1.25,
  keyLight: 0xffffff,
  keyLightIntensity: 1.45,
  accentLight: 0x6bc79a,
  accentLightIntensity: 1.1,
  fillLight: 0xa8dcc0,
  fillLightIntensity: .9,
  platform: 0x007440,
  platformOpacity: .018,
  gridMajor: 0x79b695,
  gridMinor: 0xd7e4de,
  gridOpacity: .13,
  space: 0x2da36a,
  spaceOpacity: .012,
  land: 0xffffff,
  landEmissive: 0xdff2e8,
  landEmissiveIntensity: .12,
  landOpacity: .98,
  side: 0xb8d2c4,
  sideOpacity: .18,
  boundary: 0x719f87,
  boundaryOpacity: .78,
  boundaryGlowOpacity: .08,
  selectedLand: 0xd9f0e3,
  selectedEmissive: 0xb5dfc8,
  selectedBoundary: 0x007440,
  particleOpacity: .14,
  blending: THREE.NormalBlending,
};

const CITY_LABEL_OFFSETS: Record<string, [number, number]> = {
  北京: [-48, -22],
  大连: [52, -8],
  上海: [92, -34],
  苏州: [-190, -26],
  杭州: [-6, 18],
  宁波: [92, 48],
  金华: [-72, 62],
};

function getMapGradientColor(x: number, y: number, palette: MapPalette, target = new THREE.Color()) {
  const eastward = THREE.MathUtils.clamp((x + 28) / 56, 0, 1);
  const northward = THREE.MathUtils.clamp((y + 19) / 38, 0, 1);
  const progress = THREE.MathUtils.clamp(eastward * .82 + (1 - northward) * .18, 0, 1);

  if (progress < .42) {
    target.lerpColors(palette.gradientIndigo, palette.gradientViolet, progress / .42);
  } else if (progress < .78) {
    target.lerpColors(palette.gradientViolet, palette.gradientCyan, (progress - .42) / .36);
  } else {
    target.lerpColors(palette.gradientCyan, palette.gradientMint, (progress - .78) / .22);
  }

  const bandDistance = (y + x * .3 - 1) / 7.5;
  const directionalBand = Math.exp(-(bandDistance * bandDistance));
  const isLightPalette = palette === LIGHT_MAP_PALETTE;
  target.lerp(palette.gradientBand, directionalBand * (isLightPalette ? .11 : .16));
  return target.multiplyScalar(
    (isLightPalette ? .97 : .98)
    + eastward * (isLightPalette ? .025 : .05)
    + directionalBand * (isLightPalette ? .07 : .17),
  );
}

const cities = WENSHU_CITY_SUMMARIES;

function cleanRegionName(name: string) {
  return name
    .replace("壮族自治区", "")
    .replace("回族自治区", "")
    .replace("维吾尔自治区", "")
    .replace("特别行政区", "")
    .replace("自治区", "")
    .replace("省", "")
    .replace("市", "");
}

function projectPosition(position: Position) {
  return new THREE.Vector2(
    (position[0] - CENTER_LON) * LONGITUDE_SCALE * MAP_SCALE,
    (position[1] - CENTER_LAT) * MAP_SCALE,
  );
}

function polygonsFromGeometry(geometry: MapGeometry): Polygon[] {
  if (geometry.type === "Polygon") return [geometry.coordinates as Polygon];
  return geometry.coordinates as Polygon[];
}

function createShape(polygon: Polygon) {
  if (!polygon[0] || polygon[0].length < 3) return null;
  const outer = polygon[0].map(projectPosition);
  if (!THREE.ShapeUtils.isClockWise(outer)) outer.reverse();
  const shape = new THREE.Shape(outer);

  polygon.slice(1).forEach((ring) => {
    if (ring.length < 3) return;
    const holePoints = ring.map(projectPosition);
    if (THREE.ShapeUtils.isClockWise(holePoints)) holePoints.reverse();
    shape.holes.push(new THREE.Path(holePoints));
  });
  return shape;
}

function isInsideRing(point: Position, ring: Position[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > point[1] !== yj > point[1]
      && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi || 1e-9) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function isInsidePolygon(point: Position, polygon: Polygon) {
  if (!polygon[0] || !isInsideRing(point, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => isInsideRing(point, hole));
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Texture();
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 62);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(.12, "rgba(128,246,255,.95)");
  gradient.addColorStop(.38, "rgba(62,169,255,.4)");
  gradient.addColorStop(1, "rgba(36,87,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function TechMap({
  presentationMode = "business",
  visualTheme = "dark",
  activeAdcodes,
  activeCityAdcode,
  scopedCityAdcodes = [],
  scopedCityProjectCounts = EMPTY_CITY_PROJECT_COUNTS,
  scopeName,
  viewOffsetX = 0,
  labelOcclusionSelector,
  viewportOcclusionSelector,
  interactionMode = "drilldown",
  selectedCityActionLabel,
  projectCases = HEAVY_ASSET_PROJECT_CASES,
  engineeringSites = ENGINEERING_SITE_PROJECTS,
  onProvinceSelect,
  onCitySelect,
  onProjectCaseSelect,
}: TechMapProps) {
  const isOutline = presentationMode === "outline";
  const isLightTheme = visualTheme === "light";
  const palette = isLightTheme ? LIGHT_MAP_PALETTE : DARK_MAP_PALETTE;
  const sideEmissiveIntensity = isLightTheme ? 0 : .18;
  const mountRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const activeAdcodesRef = useRef<number[]>(activeAdcodes);
  const activeCityAdcodeRef = useRef<number | null>(activeCityAdcode);
  const scopedCityAdcodesRef = useRef<number[]>(scopedCityAdcodes);
  const scopedCityProjectCountsRef = useRef<Record<number, number>>(scopedCityProjectCounts);
  const provinceCallbackRef = useRef(onProvinceSelect);
  const cityCallbackRef = useRef(onCitySelect);
  const projectCaseCallbackRef = useRef(onProjectCaseSelect);
  const updateSelectionRef = useRef<((
    adcodes: number[],
    cityAdcode: number | null,
    cityAdcodes: number[],
    cityProjectCounts: Record<number, number>,
  ) => void) | null>(null);

  useEffect(() => {
    provinceCallbackRef.current = onProvinceSelect;
    cityCallbackRef.current = onCitySelect;
    projectCaseCallbackRef.current = onProjectCaseSelect;
  }, [onCitySelect, onProjectCaseSelect, onProvinceSelect]);

  useEffect(() => {
    activeAdcodesRef.current = activeAdcodes;
    activeCityAdcodeRef.current = activeCityAdcode;
    scopedCityAdcodesRef.current = scopedCityAdcodes;
    scopedCityProjectCountsRef.current = scopedCityProjectCounts;
    updateSelectionRef.current?.(activeAdcodes, activeCityAdcode, scopedCityAdcodes, scopedCityProjectCounts);
  }, [activeAdcodes, activeCityAdcode, scopedCityAdcodes, scopedCityProjectCounts]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let animationFrame = 0;
    let landParticleTimer: number | null = null;
    mount.dataset.renderState = "loading";
    mount.dataset.particleState = isOutline ? "disabled" : "pending";
    let collisionFrame = 0;
    let sceneVisible = !document.hidden;
    const regions: RegionVisual[] = [];
    const cityVisuals: CityVisual[] = [];
    const networkVisuals: NetworkVisual[] = [];
    let introFinished = reducedMotion;
    let pointerDown: { x: number; y: number } | null = null;
    let pendingFocusAdcodes: number[] | null = null;
    let focusTransition: {
      start: number;
      fromCamera: THREE.Vector3;
      toCamera: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toTarget: THREE.Vector3;
    } | null = null;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(palette.fogColor, palette.fogDensity);

    const camera = new THREE.PerspectiveCamera(30, 1, .1, 320);
    camera.up.set(0, 0, -1);
    const resolveViewOffset = (width: number, height: number) => (
      width < 900 || width / Math.max(1, height) < 1 ? 0 : viewOffsetX
    );
    let currentViewOffsetX = resolveViewOffset(mount.clientWidth, mount.clientHeight);
    const cameraStart = new THREE.Vector3(currentViewOffsetX, 98, 0);
    const cameraEnd = new THREE.Vector3(currentViewOffsetX, 76, 0);
    let currentFitAspect = 16 / 9;
    let currentFitHeightRatio = 1;
    let currentViewOffsetZ = 0;
    camera.position.copy(reducedMotion ? cameraEnd : cameraStart);
    camera.lookAt(currentViewOffsetX, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      mount.classList.add("is-fallback");
      mount.dataset.renderState = "error";
      mount.textContent = "当前环境无法启用 WebGL 三维地图";
      return;
    }

    const rendererPixelRatio = Math.min(window.devicePixelRatio || 1, 1);
    renderer.setPixelRatio(rendererPixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = palette.exposure;
    renderer.setClearColor(0x000000, 0);
    if (isOutline) {
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.pointerEvents = "none";
    } else {
      renderer.domElement.setAttribute("aria-label", "可交互的三维中国经营版图");
      renderer.domElement.style.touchAction = window.matchMedia("(pointer: coarse)").matches ? "pan-y" : "none";
    }
    mount.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = "tech-map-label-layer";
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.inset = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    mount.appendChild(labelRenderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(rendererPixelRatio);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      palette.bloomStrength,
      palette.bloomRadius,
      palette.bloomThreshold,
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = !isOutline && reducedMotion;
    controls.enableDamping = true;
    controls.dampingFactor = .065;
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.minDistance = 20;
    controls.maxDistance = 110;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minAzimuthAngle = 0;
    controls.maxAzimuthAngle = 0;
    controls.target.set(currentViewOffsetX, 0, 0);
    controls.update();

    scene.add(new THREE.HemisphereLight(
      palette.hemisphereSky,
      palette.hemisphereGround,
      palette.hemisphereIntensity,
    ));
    const keyLight = new THREE.DirectionalLight(palette.keyLight, palette.keyLightIntensity);
    keyLight.position.set(-18, 42, 24);
    scene.add(keyLight);
    const blueLight = new THREE.PointLight(palette.accentLight, palette.accentLightIntensity, 130, 2);
    blueLight.position.set(20, 28, 20);
    scene.add(blueLight);
    const cyanLight = new THREE.PointLight(palette.fillLight, palette.fillLightIntensity, 105, 2);
    cyanLight.position.set(-25, 18, -14);
    scene.add(cyanLight);

    const platformMaterial = new THREE.MeshBasicMaterial({
      color: palette.platform,
      transparent: true,
      opacity: palette.platformOpacity,
      side: THREE.DoubleSide,
      blending: palette.blending,
      depthWrite: false,
    });
    const platform = new THREE.Mesh(new THREE.CircleGeometry(47, 96), platformMaterial);
    platform.rotation.x = -Math.PI / 2;
    platform.position.y = -.66;
    scene.add(platform);

    const grid = new THREE.GridHelper(105, 32, palette.gridMajor, palette.gridMinor);
    grid.position.y = -.74;
    const gridMaterial = grid.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = palette.gridOpacity;
    scene.add(grid);

    const mapRoot = new THREE.Group();
    mapRoot.rotation.x = -Math.PI / 2 - .19;
    mapRoot.scale.setScalar(reducedMotion ? 1.03 : .92);
    scene.add(mapRoot);

    const glowTexture = createGlowTexture();
    const pulseRings: Array<{ mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; phase: number }> = [];
    const travellingLights: Array<{ sprite: THREE.Sprite; curve: THREE.QuadraticBezierCurve3; phase: number; speed: number }> = [];
    let mapParticles: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> | null = null;

    const random = seededRandom(20260824);
    const spacePositions: number[] = [];
    for (let i = 0; i < 180; i += 1) {
      spacePositions.push((random() - .5) * 116, random() * 34 + 1, (random() - .5) * 102);
    }
    const spaceGeometry = new THREE.BufferGeometry();
    spaceGeometry.setAttribute("position", new THREE.Float32BufferAttribute(spacePositions, 3));
    const spaceMaterial = new THREE.PointsMaterial({
      color: palette.space,
      size: .06,
      map: glowTexture,
      transparent: true,
      opacity: palette.spaceOpacity,
      blending: palette.blending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(spaceGeometry, spaceMaterial));

    const focusSelection = (adcodes: number[]) => {
      if (!regions.length) return;
      if (!introFinished) {
        pendingFocusAdcodes = adcodes.length ? [...adcodes] : null;
        return;
      }
      const selected = new Set(adcodes);
      const selectedRegions = regions.filter((region) => selected.has(region.adcode));
      const toTarget = new THREE.Vector3(currentViewOffsetX, 0, currentViewOffsetZ);
      const toCamera = cameraEnd.clone();

      if (selectedRegions.length) {
        mapRoot.updateMatrixWorld(true);
        const bounds = new THREE.Box3();
        selectedRegions.forEach((region) => bounds.expandByObject(region.group));
        bounds.getCenter(toTarget);
        const size = bounds.getSize(new THREE.Vector3());
        const halfFovTangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const widthDistance = size.x / Math.max(.01, 2 * halfFovTangent * currentFitAspect);
        const heightDistance = size.z / Math.max(.01, 2 * halfFovTangent * currentFitHeightRatio);
        const distance = THREE.MathUtils.clamp(Math.max(widthDistance, heightDistance) * 1.35, 23, 64);
        const nationalDistance = cameraEnd.y;
        toTarget.x += currentViewOffsetX * distance / nationalDistance;
        toTarget.z += currentViewOffsetZ * distance / nationalDistance;
        const direction = new THREE.Vector3(0, 1, 0);
        toCamera.copy(toTarget).add(direction.multiplyScalar(distance));
        controls.minDistance = 18;
      } else {
        controls.minDistance = 36;
      }

      focusTransition = {
        start: performance.now(),
        fromCamera: camera.position.clone(),
        toCamera,
        fromTarget: controls.target.clone(),
        toTarget,
      };
    };

    const applySelection = (
      adcodes: number[],
      cityAdcode: number | null,
      scopedCityAdcodes: number[],
      scopedCityProjectCounts: Record<number, number>,
    ) => {
      const selected = new Set(adcodes);
      const scopedCities = new Set(scopedCityAdcodes);
      const hasScopedCities = scopedCities.size > 0;
      const isNational = selected.size === 0;
      regions.forEach((region) => {
        // Organization scopes can span selected cities across several provinces.
        // At that level, keep province polygons neutral so the exact city points
        // carry the emphasis; restore the province highlight after city drilldown.
        region.selected = (cityAdcode !== null || !hasScopedCities) && selected.has(region.adcode);
      });
      cityVisuals.forEach((visual) => {
        const inScope = isNational || (hasScopedCities
          ? scopedCities.has(visual.city.cityAdcode)
          : selected.has(visual.city.provinceAdcode));
        const citySelected = visual.city.cityAdcode === cityAdcode;
        const scopeSelected = !isNational && cityAdcode === null && inScope;
        const isHub = visual.city.name === "杭州";
        const isMinor = visual.labelElement.classList.contains("is-minor");
        const scopedProjectCount = scopedCityProjectCounts[visual.city.cityAdcode];
        visual.displayCount = hasScopedCities && Number.isFinite(scopedProjectCount)
          ? Math.max(0, scopedProjectCount)
          : visual.city.count;
        const projectCloudCapacity = visual.projectCloud.geometry.getAttribute("position").count;
        visual.projectCloud.geometry.setDrawRange(0, Math.min(projectCloudCapacity, visual.displayCount));
        visual.projectCloud.userData.projectCount = visual.displayCount;
        const labelCount = visual.labelElement.querySelector("span strong");
        if (labelCount) labelCount.textContent = String(visual.displayCount);
        const projectCaseSummary = visual.projectCases.length
          ? `；重资产项目案例：${visual.projectCases.map((projectCase) => `${projectCase.projectName}，${projectCase.highlight}`).join("；")}（城市级定位）`
          : "";
        const engineeringSiteSummary = visual.engineeringSites.length
          ? `；工程现场：${visual.engineeringSites.map((engineeringSite) => engineeringSite.projectName).join("；")}（城市级定位，点击直达现场）`
          : "";
        const mapHighlightSummary = `${projectCaseSummary}${engineeringSiteSummary}`;
        visual.labelElement.setAttribute(
          "aria-label",
          interactionMode === "locate"
            ? `${visual.city.name}，${visual.displayCount}个项目，点击定位城市${mapHighlightSummary}`
            : interactionMode === "metrics"
              ? citySelected && selectedCityActionLabel
                ? `${visual.city.name}，${visual.displayCount}个项目，${selectedCityActionLabel}${mapHighlightSummary}`
                : `${visual.city.name}，${visual.displayCount}个项目，点击查看城市指标` + mapHighlightSummary
              : `${visual.city.name}，${visual.displayCount}个项目，点击查看项目列表${mapHighlightSummary}`,
        );
        const baseNeon = isMinor ? palette.citySecondary : palette.cityPrimary;
        const activeNeon = citySelected || scopeSelected
          ? palette.citySelected
          : isHub
            ? palette.cityHub
            : baseNeon;
        const scopeWeight = citySelected
          ? 1
          : cityAdcode !== null
            ? (inScope ? .2 : .08)
            : (inScope ? 1 : .08);
        visual.objects.forEach((object) => { object.visible = true; });
        visual.hitTarget.visible = !hasScopedCities || inScope || citySelected;
        visual.labelObject.visible = citySelected || inScope;
        visual.coreMaterial.color.copy(activeNeon);
        visual.coreMaterial.opacity = (citySelected ? .98 : scopeSelected ? .94 : isHub ? .88 : isMinor ? .78 : .84) * scopeWeight;
        visual.beamMaterial.color.copy(activeNeon);
        visual.beamMaterial.opacity = (citySelected ? .84 : scopeSelected ? .78 : isHub ? .68 : visual.displayCount > 10 ? .62 : .48) * scopeWeight;
        visual.glowMaterial.color.copy(activeNeon);
        visual.glowMaterial.opacity = (citySelected ? .76 : scopeSelected ? .66 : isHub ? .58 : .38) * scopeWeight;
        visual.ringMaterial.color.copy(activeNeon);
        visual.ringMaterial.userData.scopeWeight = scopeWeight;
        visual.cloudMaterial.color.copy(activeNeon);
        visual.cloudMaterial.opacity = (citySelected ? .96 : scopeSelected ? .9 : isHub ? .82 : isMinor ? .64 : .72) * scopeWeight;
        visual.cloudMaterial.size = citySelected ? .18 : scopeSelected ? .16 : isHub ? .15 : isMinor ? .12 : .13;
        visual.labelElement.classList.toggle("is-selected", citySelected);
        visual.labelElement.classList.toggle("is-in-scope", scopeSelected);
        visual.labelElement.setAttribute("aria-pressed", citySelected ? "true" : "false");
        visual.labelElement.classList.toggle("is-national-view", isNational && !citySelected);
      });
      networkVisuals.forEach((visual) => {
        const visible = isNational || (hasScopedCities
          ? scopedCities.has(visual.cityAdcode)
          : selected.has(visual.provinceAdcode));
        visual.arc.visible = visible;
        visual.halo.visible = visible;
        visual.light.visible = visible;
      });
      focusSelection(adcodes);
      // Reflow labels on the next frame after a selection without polling the
      // DOM at full animation speed while the map is otherwise idle.
      collisionFrame = 60;
    };
    updateSelectionRef.current = isOutline ? null : applySelection;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const setPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
    };

    const pickCity = (event: PointerEvent) => {
      setPointer(event);
      const visibleTargets = cityVisuals.filter((visual) => visual.hitTarget.visible);
      const hit = raycaster.intersectObjects(visibleTargets.map((visual) => visual.hitTarget), false)[0];
      if (!hit) return null;
      return visibleTargets.find((visual) => visual.hitTarget === hit.object) ?? null;
    };

    const pickRegion = (event: PointerEvent) => {
      setPointer(event);
      const hit = raycaster.intersectObjects(regions.map((region) => region.mesh), false)[0];
      if (!hit) return null;
      const region = regions.find((item) => item.mesh === hit.object);
      return region ?? null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const city = pickCity(event);
      const region = pickRegion(event);
      renderer.domElement.style.cursor = city || region ? "pointer" : "grab";
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      if (!city && !region) {
        tooltip.style.opacity = "0";
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      const selectedCityAction = city && interactionMode === "metrics"
        && city.city.cityAdcode === activeCityAdcodeRef.current
        && selectedCityActionLabel;
      tooltip.textContent = city
        ? `${city.city.name} · ${city.displayCount}个项目 · ${selectedCityAction || `点击${interactionMode === "locate" ? "定位" : interactionMode === "metrics" ? "查看城市指标" : "穿透"}`}`
        : `${cleanRegionName(region!.name)} · 点击${interactionMode === "locate" ? "定位行政区" : interactionMode === "metrics" ? "查看行政区指标" : "联动行政区数据"}`;
      tooltip.style.left = event.clientX - rect.left + 14 + "px";
      tooltip.style.top = event.clientY - rect.top - 8 + "px";
      tooltip.style.opacity = "1";
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDown = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!pointerDown) return;
      const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
      pointerDown = null;
      if (moved > 5) return;
      const city = pickCity(event);
      if (city) {
        cityCallbackRef.current({ ...city.city, count: city.displayCount });
        return;
      }
      const region = pickRegion(event);
      if (!region) return;
      provinceCallbackRef.current({
        adcode: region.adcode,
        name: cleanRegionName(region.name),
      });
    };

    const handlePointerLeave = () => {
      pointerDown = null;
      renderer.domElement.style.cursor = "grab";
      if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
    };

    if (!isOutline) {
      renderer.domElement.addEventListener("pointermove", handlePointerMove);
      renderer.domElement.addEventListener("pointerdown", handlePointerDown);
      renderer.domElement.addEventListener("pointerup", handlePointerUp);
      renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    }

    loadMapCollection()
      .then((collection) => {
        if (disposed) return;
        const allPolygons: Polygon[] = [];

        collection.features.forEach((feature) => {
          if (!feature.geometry || !feature.properties?.name) return;
          const polygons = polygonsFromGeometry(feature.geometry);
          allPolygons.push(...polygons);
          const shapes = polygons.map(createShape).filter((shape): shape is THREE.Shape => Boolean(shape));
          if (!shapes.length) return;

          const topMaterial = new THREE.MeshPhysicalMaterial({
            color: palette.land,
            emissive: palette.landEmissive,
            emissiveIntensity: palette.landEmissiveIntensity,
            vertexColors: true,
            metalness: .02,
            roughness: .7,
            clearcoat: .16,
            clearcoatRoughness: .68,
            transparent: true,
            opacity: palette.landOpacity,
          });
          const sideMaterial = new THREE.MeshStandardMaterial({
            color: palette.side,
            emissive: palette.side,
            emissiveIntensity: sideEmissiveIntensity,
            metalness: 0,
            roughness: .88,
            flatShading: true,
            transparent: true,
            opacity: palette.sideOpacity,
            depthWrite: false,
          });
          const geometry = new THREE.ExtrudeGeometry(shapes, {
            depth: MAP_DEPTH,
            steps: 1,
            bevelEnabled: false,
            curveSegments: 1,
          });
          const positionAttribute = geometry.getAttribute("position");
          const vertexColors = new Float32Array(positionAttribute.count * 3);
          const vertexColor = new THREE.Color();
          for (let index = 0; index < positionAttribute.count; index += 1) {
            getMapGradientColor(positionAttribute.getX(index), positionAttribute.getY(index), palette, vertexColor);
            vertexColors[index * 3] = vertexColor.r;
            vertexColors[index * 3 + 1] = vertexColor.g;
            vertexColors[index * 3 + 2] = vertexColor.b;
          }
          geometry.setAttribute("color", new THREE.BufferAttribute(vertexColors, 3));
          geometry.computeVertexNormals();

          const mesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial]);
          mesh.userData = {
            adcode: feature.properties.adcode,
            name: feature.properties.name,
          };

          const boundaryPositions: number[] = [];
          polygons.forEach((polygon) => {
            const ring = polygon[0];
            for (let index = 0; index < ring.length - 1; index += 1) {
              const current = projectPosition(ring[index]);
              const next = projectPosition(ring[index + 1]);
              boundaryPositions.push(current.x, current.y, MAP_DEPTH + .014, next.x, next.y, MAP_DEPTH + .014);
            }
          });
          const boundaryGeometry = new THREE.BufferGeometry();
          boundaryGeometry.setAttribute("position", new THREE.Float32BufferAttribute(boundaryPositions, 3));
          const boundaryMaterial = new THREE.LineBasicMaterial({
            color: palette.boundary,
            transparent: true,
            opacity: palette.boundaryOpacity,
            blending: THREE.NormalBlending,
            depthWrite: false,
          });
          const boundary = new THREE.LineSegments(boundaryGeometry, boundaryMaterial);
          const boundaryGlowMaterial = new THREE.LineBasicMaterial({
            color: palette.boundaryGlow,
            transparent: true,
            opacity: palette.boundaryGlowOpacity,
            blending: palette.blending,
            depthWrite: false,
          });
          const boundaryGlow = new THREE.LineSegments(boundaryGeometry, boundaryGlowMaterial);
          boundaryGlow.position.z = .004;

          const regionGroup = new THREE.Group();
          regionGroup.add(mesh, boundaryGlow, boundary);
          mapRoot.add(regionGroup);
          regions.push({
            adcode: feature.properties.adcode,
            name: feature.properties.name,
            group: regionGroup,
            mesh,
            topMaterial,
            sideMaterial,
            boundaryMaterial,
            boundaryGlowMaterial,
            selected: false,
          });
        });

        // Interior sparkle points are decorative and expensive to sample against
        // every polygon. Build them after the map and city anchors have already
        // reached the screen, so they never block the first useful frame.
        const particlePositions: number[] = [];
        const particleColors: number[] = [];
        const particleColor = new THREE.Color();
        let particleAttempts = 0;

        const scheduleParticleBatch = () => {
          if (disposed) return;
          landParticleTimer = window.setTimeout(() => buildParticleBatch(), 24);
        };

        const buildParticleBatch = () => {
          if (disposed) return;
          const batchStartedAt = performance.now();
          while (
            particlePositions.length < 4800
            && particleAttempts < 24000
            && performance.now() - batchStartedAt < 6
          ) {
            particleAttempts += 1;
            const point: Position = [73 + random() * 62, 18 + random() * 36];
            if (!allPolygons.some((polygon) => isInsidePolygon(point, polygon))) continue;
            const projected = projectPosition(point);
            particlePositions.push(projected.x, projected.y, MAP_DEPTH + .014 + random() * .024);
            getMapGradientColor(projected.x, projected.y, palette, particleColor);
            particleColor.lerp(palette.particleLight, isLightTheme ? .34 : .22).multiplyScalar(isLightTheme ? .96 : 1.12);
            particleColors.push(particleColor.r, particleColor.g, particleColor.b);
          }

          if (particlePositions.length < 4800 && particleAttempts < 24000) {
            scheduleParticleBatch();
            return;
          }

          const particleGeometry = new THREE.BufferGeometry();
          particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlePositions, 3));
          particleGeometry.setAttribute("color", new THREE.Float32BufferAttribute(particleColors, 3));
          const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: .055,
            map: glowTexture,
            transparent: true,
            opacity: palette.particleOpacity,
            vertexColors: true,
            blending: palette.blending,
            depthWrite: false,
            alphaTest: .07,
          });
          mapParticles = new THREE.Points(particleGeometry, particleMaterial);
          mapRoot.add(mapParticles);
          mount.dataset.particleState = "ready";
        };

        // Decorative land sparkle generation used to monopolize the main thread
        // for hundreds of milliseconds. Let the map become interactive first,
        // then build the same particles in small scheduled slices.
        if (!isOutline) landParticleTimer = window.setTimeout(scheduleParticleBatch, 1400);

        const visibleCities = isOutline ? [] : cities;
        visibleCities.forEach((city, index) => {
          const cityProjectCases = projectCases.filter((projectCase) => projectCase.cityAdcode === city.cityAdcode);
          const cityEngineeringSites = engineeringSites.filter((engineeringSite) => engineeringSite.cityAdcode === city.cityAdcode);
          const projected = projectPosition([city.lon, city.lat]);
          const radius = .06 + Math.sqrt(city.count) * .01;
          const height = .2 + Math.sqrt(city.count) * .065;
          const cityNeon = city.major ? palette.cityPrimary : palette.citySecondary;
          const cloudRandom = seededRandom(20250000 + city.cityAdcode);
          const projectCloudRadius = .24 + Math.sqrt(city.count) * .065;
          const projectCloudPositions: number[] = [];
          const goldenAngle = Math.PI * (3 - Math.sqrt(5));
          // Keep a small hidden capacity reserve so an organization snapshot
          // can show a few more projects than the stricter national effective-
          // project list without rebuilding the WebGL geometry on every click.
          const projectCloudCapacity = Math.max(city.count + 8, Math.ceil(city.count * 1.2));
          for (let projectIndex = 0; projectIndex < projectCloudCapacity; projectIndex += 1) {
            const progress = Math.sqrt((projectIndex + .5) / projectCloudCapacity);
            const angle = projectIndex * goldenAngle + cloudRandom() * .26;
            const distance = projectCloudRadius * progress * (.88 + cloudRandom() * .22);
            projectCloudPositions.push(
              projected.x + Math.cos(angle) * distance,
              projected.y + Math.sin(angle) * distance,
              MAP_DEPTH + .02 + cloudRandom() * .045,
            );
          }
          const cloudGeometry = new THREE.BufferGeometry();
          cloudGeometry.setAttribute("position", new THREE.Float32BufferAttribute(projectCloudPositions, 3));
          cloudGeometry.setDrawRange(0, city.count);
          const cloudMaterial = new THREE.PointsMaterial({
            color: city.hub ? palette.cityHub : cityNeon,
            size: city.hub ? .15 : city.major ? .13 : .12,
            map: glowTexture,
            transparent: true,
            opacity: city.hub ? .82 : city.major ? .72 : .64,
            blending: palette.blending,
            depthWrite: false,
            alphaTest: .035,
          });
          const projectCloud = new THREE.Points(cloudGeometry, cloudMaterial);
          projectCloud.userData = {
            role: "city-project-count-cloud",
            cityAdcode: city.cityAdcode,
            projectCount: city.count,
            preciseLocations: false,
          };
          mapRoot.add(projectCloud);

          const coreMaterial = new THREE.MeshBasicMaterial({
            color: city.hub ? palette.cityHub : cityNeon,
            transparent: true,
            opacity: city.hub ? .88 : city.major ? .84 : .78,
            blending: palette.blending,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const core = new THREE.Mesh(
            new THREE.CircleGeometry(radius * (city.major ? 1.05 : .92), 28),
            coreMaterial,
          );
          core.position.set(projected.x, projected.y, MAP_DEPTH + .034);
          mapRoot.add(core);

          const beamGeometry = new THREE.CylinderGeometry(radius * .48, radius, height, 12, 1, true);
          beamGeometry.rotateX(Math.PI / 2);
          const beamMaterial = new THREE.MeshBasicMaterial({
            color: city.hub ? palette.cityHub : cityNeon,
            transparent: true,
            opacity: city.hub ? .72 : city.count > 10 ? .68 : .56,
            blending: palette.blending,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const beam = new THREE.Mesh(beamGeometry, beamMaterial);
          beam.position.set(projected.x, projected.y, MAP_DEPTH + height / 2);
          mapRoot.add(beam);

          const glowMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            color: city.hub ? palette.cityHub : cityNeon,
            transparent: true,
            opacity: city.hub ? .62 : .46,
            blending: palette.blending,
            depthWrite: false,
          });
          const glow = new THREE.Sprite(glowMaterial);
          glow.scale.set(city.hub ? .9 : .62, city.hub ? .9 : .62, 1);
          glow.position.set(projected.x, projected.y, MAP_DEPTH + height);
          mapRoot.add(glow);

          const ringMaterial = new THREE.MeshBasicMaterial({
            color: city.hub ? palette.cityHub : cityNeon,
            transparent: true,
            opacity: city.hub ? .46 : .32,
            blending: palette.blending,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 1.6, radius * 2.15, 40), ringMaterial);
          ring.position.set(projected.x, projected.y, MAP_DEPTH + .018);
          mapRoot.add(ring);
          pulseRings.push({ mesh: ring, phase: index * .42 });

          const label = document.createElement("div");
          label.className = [
            "three-city-label",
            city.hub ? "is-hub" : "",
            city.major ? "" : "is-minor",
            cityProjectCases.length || cityEngineeringSites.length ? "has-project-case" : "",
          ].filter(Boolean).join(" ");
          label.innerHTML = "<b>" + city.name + "</b><span><strong>" + city.count + "</strong> 个项目</span>";
          const projectCaseSummary = cityProjectCases.length
            ? `；重资产项目案例：${cityProjectCases.map((projectCase) => `${projectCase.projectName}，${projectCase.highlight}`).join("；")}（城市级定位）`
            : "";
          const engineeringSiteSummary = cityEngineeringSites.length
            ? `；工程现场：${cityEngineeringSites.map((engineeringSite) => engineeringSite.projectName).join("；")}（城市级定位，点击直达现场）`
            : "";
          const mapHighlightSummary = `${projectCaseSummary}${engineeringSiteSummary}`;
          cityProjectCases.forEach((projectCase) => {
            const caseLabel = document.createElement("small");
            const caseAccessibleLabel = `${projectCase.projectName}，${projectCase.highlight}，城市级定位，点击直达项目`;
            caseLabel.className = "three-city-case";
            caseLabel.textContent = `${projectCase.projectName} · ${projectCase.highlight}`;
            caseLabel.dataset.projectRecordId = projectCase.projectRecordId;
            caseLabel.setAttribute("role", "button");
            caseLabel.setAttribute("tabindex", "0");
            caseLabel.setAttribute("aria-label", caseAccessibleLabel);
            caseLabel.title = caseAccessibleLabel;
            caseLabel.style.pointerEvents = "auto";
            const stopCasePointer = (event: Event) => event.stopPropagation();
            const activateProjectCase = (event: Event) => {
              event.preventDefault();
              event.stopPropagation();
              projectCaseCallbackRef.current?.(projectCase);
            };
            caseLabel.addEventListener("pointerdown", stopCasePointer);
            caseLabel.addEventListener("pointerup", stopCasePointer);
            caseLabel.addEventListener("click", activateProjectCase);
            caseLabel.addEventListener("keydown", (event) => {
              if (event.key === "Enter" || event.key === " ") activateProjectCase(event);
            });
            label.appendChild(caseLabel);
          });
          cityEngineeringSites.forEach((engineeringSite) => {
            const siteLabel = document.createElement("small");
            const siteAccessibleLabel = `${engineeringSite.projectName}，工程现场，城市级定位，点击直达工程现场`;
            siteLabel.className = "three-city-case is-engineering-site";
            siteLabel.textContent = engineeringSite.projectName;
            siteLabel.dataset.projectRecordId = engineeringSite.projectRecordId;
            siteLabel.dataset.projectDestination = engineeringSite.destination;
            siteLabel.setAttribute("role", "button");
            siteLabel.setAttribute("tabindex", "0");
            siteLabel.setAttribute("aria-label", siteAccessibleLabel);
            siteLabel.title = siteAccessibleLabel;
            siteLabel.style.pointerEvents = "auto";
            siteLabel.style.color = "#f6d98b";
            siteLabel.style.border = "1px solid rgba(246, 217, 139, .72)";
            siteLabel.style.borderRadius = "4px";
            siteLabel.style.padding = "2px 5px";
            siteLabel.style.background = "linear-gradient(90deg, rgba(106, 51, 157, .94), rgba(48, 22, 83, .96))";
            siteLabel.style.boxShadow = "0 0 12px rgba(150, 82, 218, .5)";
            const stopSitePointer = (event: Event) => event.stopPropagation();
            const activateEngineeringSite = (event: Event) => {
              event.preventDefault();
              event.stopPropagation();
              window.open(engineeringSite.url, "_blank", "noopener,noreferrer");
            };
            siteLabel.addEventListener("pointerdown", stopSitePointer);
            siteLabel.addEventListener("pointerup", stopSitePointer);
            siteLabel.addEventListener("click", activateEngineeringSite);
            siteLabel.addEventListener("keydown", (event) => {
              if (event.key === "Enter" || event.key === " ") activateEngineeringSite(event);
            });
            label.appendChild(siteLabel);
          });
          if (cityProjectCases.length || cityEngineeringSites.length) label.title = mapHighlightSummary.slice(1);
          label.setAttribute("role", "button");
          label.setAttribute("tabindex", "0");
          label.setAttribute(
            "aria-label",
            interactionMode === "locate"
              ? `${city.name}，${city.count}个项目，点击定位城市${mapHighlightSummary}`
              : interactionMode === "metrics"
                ? `${city.name}，点击查看城市指标${mapHighlightSummary}`
                : `${city.name}，${city.count}个项目，点击查看项目列表${mapHighlightSummary}`,
          );
          label.style.pointerEvents = "auto";
          const stopMapPointer = (event: Event) => event.stopPropagation();
          label.addEventListener("pointerdown", stopMapPointer);
          label.addEventListener("pointerup", stopMapPointer);
          const activateCity = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
            cityCallbackRef.current({
              cityAdcode: city.cityAdcode,
              provinceAdcode: city.provinceAdcode,
              provinceName: city.provinceName,
              name: city.name,
              count: scopedCityProjectCountsRef.current[city.cityAdcode] ?? city.count,
            });
          };
          label.addEventListener("click", activateCity);
          label.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") activateCity(event);
          });
          const labelOffset = CITY_LABEL_OFFSETS[city.name];
          if (labelOffset) {
            label.dataset.offsetX = String(labelOffset[0]);
            label.dataset.offsetY = String(labelOffset[1]);
            label.style.marginLeft = `${labelOffset[0]}px`;
            label.style.marginTop = `${labelOffset[1]}px`;
          } else {
            label.dataset.offsetX = "0";
            label.dataset.offsetY = "0";
          }
          const labelObject = new CSS2DObject(label);
          labelObject.position.set(projected.x, projected.y, MAP_DEPTH + height + .22);
          mapRoot.add(labelObject);

          const hitMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
          });
          const hitTarget = new THREE.Mesh(new THREE.SphereGeometry(.66, 12, 8), hitMaterial);
          hitTarget.position.set(projected.x, projected.y, MAP_DEPTH + height * .7);
          mapRoot.add(hitTarget);

          cityVisuals.push({
            city: {
              cityAdcode: city.cityAdcode,
              provinceAdcode: city.provinceAdcode,
              provinceName: city.provinceName,
              name: city.name,
              count: city.count,
            },
            displayCount: city.count,
            projectCases: cityProjectCases,
            engineeringSites: cityEngineeringSites,
            hitTarget,
            projectCloud,
            objects: [projectCloud, core, beam, glow, ring, labelObject, hitTarget],
            labelObject,
            coreMaterial,
            beamMaterial,
            glowMaterial,
            ringMaterial,
            cloudMaterial,
            labelElement: label,
          });
        });

        const hub = visibleCities.find((city) => city.hub);
        if (hub) {
          const hubPoint = projectPosition([hub.lon, hub.lat]);
          visibleCities.filter((city) => city.major && !city.hub).forEach((city, index) => {
            const target = projectPosition([city.lon, city.lat]);
            const start = new THREE.Vector3(hubPoint.x, hubPoint.y, MAP_DEPTH + .62);
            const end = new THREE.Vector3(target.x, target.y, MAP_DEPTH + .46);
            const distance = start.distanceTo(end);
            const control = new THREE.Vector3(
              (start.x + end.x) / 2,
              (start.y + end.y) / 2,
              MAP_DEPTH + .8 + distance * .045,
            );
            const curve = new THREE.QuadraticBezierCurve3(start, control, end);
            const isWarmAccent = index === 0 || index === 3;
            const arcColor = isWarmAccent ? palette.arcWarm : palette.arcPrimary;
            const haloMaterial = new THREE.MeshBasicMaterial({
              color: arcColor,
              transparent: true,
              opacity: isWarmAccent ? .065 : .075,
              blending: palette.blending,
              depthWrite: false,
            });
            const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, .032, 5, false), haloMaterial);
            const arcMaterial = new THREE.MeshBasicMaterial({
              color: arcColor,
              transparent: true,
              opacity: isWarmAccent ? .55 : .5,
              blending: palette.blending,
              depthWrite: false,
            });
            const arc = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .008, 4, false), arcMaterial);
            mapRoot.add(halo, arc);

            const travelMaterial = new THREE.SpriteMaterial({
              map: glowTexture,
              color: arcColor,
              transparent: true,
              opacity: isWarmAccent ? .68 : .62,
              blending: palette.blending,
              depthWrite: false,
            });
            const travel = new THREE.Sprite(travelMaterial);
            travel.scale.set(.34, .34, 1);
            mapRoot.add(travel);
            travellingLights.push({
              sprite: travel,
              curve,
              phase: index / 7,
              speed: .055 + index * .005,
            });
            networkVisuals.push({ provinceAdcode: city.provinceAdcode, cityAdcode: city.cityAdcode, arc, halo, light: travel });
          });
        }

        if (!isOutline) {
          applySelection(
            activeAdcodesRef.current,
            activeCityAdcodeRef.current,
            scopedCityAdcodesRef.current,
            scopedCityProjectCountsRef.current,
          );
        }
        if (isOutline) composer.render();
        mount.dataset.renderState = "ready";
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") {
          mount.classList.add("is-fallback");
          mount.dataset.renderState = "error";
          mount.textContent = "地图加载失败，请刷新页面重试";
        }
      });

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      const nextViewOffsetX = resolveViewOffset(width, height);
      if (nextViewOffsetX !== currentViewOffsetX) {
        const offsetDelta = nextViewOffsetX - currentViewOffsetX;
        currentViewOffsetX = nextViewOffsetX;
        cameraStart.x += offsetDelta;
        cameraEnd.x += offsetDelta;
        camera.position.x += offsetDelta;
        controls.target.x += offsetDelta;
        if (focusTransition) {
          focusTransition.fromCamera.x += offsetDelta;
          focusTransition.toCamera.x += offsetDelta;
          focusTransition.fromTarget.x += offsetDelta;
          focusTransition.toTarget.x += offsetDelta;
        }
      }
      camera.aspect = width / height;
      const mountBounds = mount.getBoundingClientRect();
      const viewportOccluders = viewportOcclusionSelector
        ? Array.from(document.querySelectorAll<HTMLElement>(viewportOcclusionSelector), (element) => element.getBoundingClientRect())
        : [];
      const safeArea = resolveMapSafeArea(mountBounds, viewportOccluders);
      // The map remains a full-screen background, while its camera leaves enough
      // breathing room for the visible centre stage between side rails and docks.
      const viewportFit = resolveMapViewportFit(width, height, safeArea);
      currentFitAspect = viewportFit.widthFitAspect;
      currentFitHeightRatio = viewportFit.heightFitRatio;
      camera.fov = viewportFit.fov;

      const nationalDistance = cameraEnd.y;
      const visibleWorldHeight = 2 * nationalDistance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const nextViewOffsetZ = -viewportFit.centerOffsetYPx * visibleWorldHeight / height;
      if (nextViewOffsetZ !== currentViewOffsetZ) {
        const offsetDelta = nextViewOffsetZ - currentViewOffsetZ;
        currentViewOffsetZ = nextViewOffsetZ;
        cameraStart.z += offsetDelta;
        cameraEnd.z += offsetDelta;
        const currentDistanceScale = introFinished
          ? camera.position.distanceTo(controls.target) / nationalDistance
          : 1;
        camera.position.z += offsetDelta * currentDistanceScale;
        controls.target.z += offsetDelta * currentDistanceScale;
        if (focusTransition) {
          const fromScale = focusTransition.fromCamera.distanceTo(focusTransition.fromTarget) / nationalDistance;
          const toScale = focusTransition.toCamera.distanceTo(focusTransition.toTarget) / nationalDistance;
          focusTransition.fromCamera.z += offsetDelta * fromScale;
          focusTransition.fromTarget.z += offsetDelta * fromScale;
          focusTransition.toCamera.z += offsetDelta * toScale;
          focusTransition.toTarget.z += offsetDelta * toScale;
        }
      }
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(rendererPixelRatio);
      renderer.setSize(width, height, false);
      composer.setPixelRatio(rendererPixelRatio);
      composer.setSize(width, height);
      bloomPass.resolution.set(width, height);
      labelRenderer.setSize(width, height);
      collisionFrame = 60;
      if (isOutline && introFinished) composer.render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const introStart = performance.now();
    const baseColor = new THREE.Color(palette.land);
    const baseEmissive = new THREE.Color(palette.landEmissive);
    const selectedColor = new THREE.Color(palette.selectedLand);
    const selectedEmissive = new THREE.Color(palette.selectedEmissive);
    const baseBoundary = new THREE.Color(palette.boundary);
    const selectedBoundary = new THREE.Color(palette.selectedBoundary);
    const baseBoundaryGlow = palette.boundaryGlow.clone();
    const selectedBoundaryGlow = palette.boundarySelected.clone();

    const resolveCityLabelCollisions = () => {
      const occupied: DOMRect[] = [];
      const mapBounds = mount.getBoundingClientRect();
      const occlusionBounds = labelOcclusionSelector
        ? Array.from(document.querySelectorAll<HTMLElement>(labelOcclusionSelector), (element) => element.getBoundingClientRect())
        : [];
      const visibleLabels = cityVisuals
        .filter((visual) => visual.labelObject.visible && visual.labelElement.offsetParent !== null)
        .sort((left, right) => {
          const priority = (visual: CityVisual) => {
            if (visual.labelElement.classList.contains("is-selected")) return 1_000_000 + visual.city.count;
            if (visual.labelElement.classList.contains("is-in-scope")) return 750_000 + visual.city.count;
            if (visual.labelElement.classList.contains("has-project-case")) return 600_000 + visual.city.count;
            if (visual.city.name === "杭州") return 500_000 + visual.city.count;
            if (!visual.labelElement.classList.contains("is-minor")) return 100_000 + visual.city.count;
            return visual.city.count;
          };
          return priority(right) - priority(left);
        });

      visibleLabels.forEach((visual) => {
        const baseOffsetX = Number(visual.labelElement.dataset.offsetX ?? 0);
        const baseOffsetY = Number(visual.labelElement.dataset.offsetY ?? 0);
        visual.labelElement.style.marginLeft = `${baseOffsetX}px`;
        visual.labelElement.style.marginTop = `${baseOffsetY}px`;
        const initialRect = visual.labelElement.getBoundingClientRect();
        const occlusionShift = resolveOcclusionShift(initialRect, occlusionBounds, mapBounds);
        if (!occlusionShift) {
          visual.labelElement.style.opacity = "0";
          visual.labelElement.style.pointerEvents = "none";
          visual.labelElement.setAttribute("aria-hidden", "true");
          visual.labelElement.tabIndex = -1;
          return;
        }
        let boundaryShiftX = occlusionShift.x;
        let boundaryShiftY = occlusionShift.y;
        const shiftedRect = {
          left: initialRect.left + boundaryShiftX,
          top: initialRect.top + boundaryShiftY,
          right: initialRect.right + boundaryShiftX,
          bottom: initialRect.bottom + boundaryShiftY,
        };
        if (shiftedRect.left < mapBounds.left + 12) boundaryShiftX += mapBounds.left + 12 - shiftedRect.left;
        if (shiftedRect.right > mapBounds.right - 12) boundaryShiftX += mapBounds.right - 12 - shiftedRect.right;
        if (shiftedRect.top < mapBounds.top + 12) boundaryShiftY += mapBounds.top + 12 - shiftedRect.top;
        if (shiftedRect.bottom > mapBounds.bottom - 12) boundaryShiftY += mapBounds.bottom - 12 - shiftedRect.bottom;
        visual.labelElement.style.marginLeft = `${baseOffsetX + boundaryShiftX}px`;
        visual.labelElement.style.marginTop = `${baseOffsetY + boundaryShiftY}px`;
        const rect = visual.labelElement.getBoundingClientRect();
        const overlaps = occupied.some((placed) => (
          rect.left < placed.right + 10
          && rect.right > placed.left - 10
          && rect.top < placed.bottom + 8
          && rect.bottom > placed.top - 8
        ));
        visual.labelElement.style.opacity = overlaps ? "0" : "1";
        visual.labelElement.style.pointerEvents = overlaps ? "none" : "auto";
        visual.labelElement.setAttribute("aria-hidden", overlaps ? "true" : "false");
        visual.labelElement.tabIndex = overlaps ? -1 : 0;
        if (!overlaps && rect.width > 0 && rect.height > 0) occupied.push(rect);
      });
    };

    const animate = (now: number) => {
      if (disposed || !sceneVisible) return;
      if (!isOutline || !introFinished) animationFrame = requestAnimationFrame(animate);
      const elapsed = Math.max(0, (now - introStart) / 1000);

      if (!introFinished) {
        const progress = Math.min(1, (now - introStart) / 1100);
        const eased = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(cameraStart, cameraEnd, eased);
        mapRoot.scale.setScalar(.92 + eased * .11);
        if (progress >= 1) {
          introFinished = true;
          controls.enabled = !isOutline;
          if (pendingFocusAdcodes) {
            const nextFocus = pendingFocusAdcodes;
            pendingFocusAdcodes = null;
            focusSelection(nextFocus);
          }
        }
      }

      if (introFinished && focusTransition) {
        const progress = Math.min(1, (now - focusTransition.start) / 850);
        const eased = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(focusTransition.fromCamera, focusTransition.toCamera, eased);
        controls.target.lerpVectors(focusTransition.fromTarget, focusTransition.toTarget, eased);
        if (progress >= 1) focusTransition = null;
      }

      if (controls.enabled) controls.update();

      regions.forEach((region) => {
        const blend = region.selected ? .115 : .075;
        region.topMaterial.color.lerp(region.selected ? selectedColor : baseColor, blend);
        region.topMaterial.emissive.lerp(region.selected ? selectedEmissive : baseEmissive, blend);
        const targetIntensity = region.selected
          ? (isLightTheme ? .18 : .6)
          : palette.landEmissiveIntensity;
        region.topMaterial.emissiveIntensity += (targetIntensity - region.topMaterial.emissiveIntensity) * .08;
        region.topMaterial.opacity += ((region.selected ? .99 : palette.landOpacity) - region.topMaterial.opacity) * .08;
        region.sideMaterial.emissiveIntensity += (sideEmissiveIntensity - region.sideMaterial.emissiveIntensity) * .08;
        region.boundaryMaterial.color.lerp(region.selected ? selectedBoundary : baseBoundary, blend);
        region.boundaryMaterial.opacity += ((region.selected ? .94 : palette.boundaryOpacity) - region.boundaryMaterial.opacity) * .08;
        region.boundaryGlowMaterial.color.lerp(region.selected ? selectedBoundaryGlow : baseBoundaryGlow, blend);
        region.boundaryGlowMaterial.opacity += ((region.selected ? .22 : palette.boundaryGlowOpacity) - region.boundaryGlowMaterial.opacity) * .08;
        region.group.position.z += (0 - region.group.position.z) * .085;
      });

      pulseRings.forEach((item, index) => {
        const cycle = (elapsed * .3 + item.phase) % 1;
        const scale = 1 + cycle * .65;
        const scopeWeight = item.mesh.material.userData.scopeWeight ?? 1;
        item.mesh.scale.set(scale, scale, scale);
        item.mesh.material.opacity = (1 - cycle) * (index === 0 ? .44 : .32) * scopeWeight;
      });

      travellingLights.forEach((item) => {
        const progress = (elapsed * item.speed + item.phase) % 1;
        item.sprite.position.copy(item.curve.getPointAt(progress));
        const pulse = .22 + Math.sin(progress * Math.PI) * .3;
        item.sprite.scale.setScalar(pulse);
      });

      spaceMaterial.opacity = palette.spaceOpacity + Math.sin(elapsed * .55) * (isLightTheme ? .002 : .006);
      if (mapParticles) {
        mapParticles.material.opacity = palette.particleOpacity + Math.sin(elapsed * 1.2) * (isLightTheme ? .015 : .04);
        mapParticles.rotation.z = Math.sin(elapsed * .13) * .001;
      }
      platformMaterial.opacity = palette.platformOpacity + Math.sin(elapsed * .7) * (isLightTheme ? .003 : .002);

      composer.render();
      labelRenderer.render(scene, camera);
      if (!isOutline) {
        collisionFrame += 1;
        const collisionInterval = !introFinished || focusTransition ? 12 : 60;
        if (collisionFrame >= collisionInterval) {
          collisionFrame = 0;
          resolveCityLabelCollisions();
        }
      }
    };

    const handleVisibility = () => {
      sceneVisible = !document.hidden;
      if (sceneVisible && (!isOutline || !introFinished)) {
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationFrame);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    animationFrame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      if (landParticleTimer !== null) window.clearTimeout(landParticleTimer);
      updateSelectionRef.current = null;
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("visibilitychange", handleVisibility);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      controls.dispose();
      scene.traverse((object) => {
        const renderable = object as THREE.Mesh | THREE.Points | THREE.LineSegments;
        if ("geometry" in renderable && renderable.geometry) renderable.geometry.dispose();
        if ("material" in renderable && renderable.material) {
          const materials = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
          materials.forEach((material) => material.dispose());
        }
      });
      glowTexture.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      mount.replaceChildren();
    };
  }, [engineeringSites, interactionMode, isLightTheme, isOutline, labelOcclusionSelector, palette, projectCases, selectedCityActionLabel, viewportOcclusionSelector, viewOffsetX, visualTheme]);

  return (
    <div
      className={`tech-map${isOutline ? " is-outline" : ""}`}
      aria-hidden={isOutline ? true : undefined}
      aria-label={isOutline ? undefined : `${scopeName}三维经营地图，可按行政区和城市${interactionMode === "locate" ? "定位" : interactionMode === "metrics" ? "查看指标" : "穿透"}`}
      data-map-presentation={presentationMode}
      data-visual-theme={visualTheme}
      data-city-anchor-count={isOutline ? undefined : WENSHU_COVERED_CITY_COUNT}
      data-project-cloud-count={isOutline ? undefined : WENSHU_DOMESTIC_PROJECT_COUNT}
      data-project-case-count={isOutline ? undefined : projectCases.length}
      data-project-case-location={isOutline ? undefined : "city"}
      data-engineering-site-count={isOutline ? undefined : engineeringSites.length}
      data-city-label-mode={isOutline ? undefined : "all-with-collision-avoidance"}
      data-label-occlusion={labelOcclusionSelector ? "measured-panel" : "none"}
      data-viewport-fit={viewportOcclusionSelector ? "safe-stage" : "full-canvas"}
      style={isOutline ? { pointerEvents: "none" } : undefined}
    >
      <div ref={mountRef} className="tech-map-webgl" />
      <span className="tech-map-loading-state">地图加载中 · 首次打开约需数秒</span>
      {isOutline ? null : (
        <ul aria-label="重资产项目案例（城市级定位）" style={ACCESSIBLE_ONLY_STYLE}>
          {projectCases.map((projectCase) => (
            <li key={projectCase.id} data-project-record-id={projectCase.projectRecordId}>
              <strong>{projectCase.projectName}</strong>
              {`，${projectCase.cityName}，${projectCase.highlight}，城市级定位`}
            </li>
          ))}
        </ul>
      )}
      {isOutline ? null : (
        <ul aria-label="工程现场（城市级定位）" style={ACCESSIBLE_ONLY_STYLE}>
          {engineeringSites.map((engineeringSite) => (
            <li
              key={engineeringSite.id}
              data-project-record-id={engineeringSite.projectRecordId}
              data-project-destination={engineeringSite.destination}
            >
              <strong>{engineeringSite.projectName}</strong>
              {`，${engineeringSite.cityName}锚点，工程现场，点击直达现场`}
            </li>
          ))}
        </ul>
      )}
      {isOutline ? null : <div ref={tooltipRef} className="tech-map-tooltip" />}
      <div className="tech-map-scan" aria-hidden="true" />
      {isOutline ? null : (
        <>
          <div className="tech-map-status"><i /> THREE.JS · REALTIME</div>
          <div className="tech-map-controls">拖拽旋转 · 滚轮缩放 · 点击行政区 · 点击城市{interactionMode === "locate" ? "定位" : interactionMode === "metrics" ? "查看指标" : "穿透项目"}</div>
          <div className="tech-map-legend"><span><i />项目数量点簇</span><span><i />城市定位锚点</span></div>
          <div className="tech-map-note">点簇表示城市项目数量，不代表项目精确地址</div>
        </>
      )}
    </div>
  );
}
