"use client";

import { useEffect, useRef } from "react";
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

type TechMapProps = {
  activeAdcodes: number[];
  activeCityAdcode: number | null;
  scopedCityAdcodes?: number[];
  scopeName: string;
  viewOffsetX?: number;
  labelOcclusionSelector?: string;
  viewportOcclusionSelector?: string;
  interactionMode?: "drilldown" | "locate" | "metrics";
  onProvinceSelect: (province: ProvinceSelection) => void;
  onCitySelect: (city: CitySelection) => void;
};

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
  hitTarget: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
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

const CENTER_LON = 104;
const CENTER_LAT = 35.5;
const LONGITUDE_SCALE = Math.cos((35 * Math.PI) / 180);
const MAP_SCALE = 1.03;
const MAP_DEPTH = .012;
const MAP_GRADIENT_INDIGO = new THREE.Color(0x1c3a73);
const MAP_GRADIENT_VIOLET = new THREE.Color(0x354b8f);
const MAP_GRADIENT_CYAN = new THREE.Color(0x17677e);
const MAP_GRADIENT_MINT = new THREE.Color(0x358987);
const MAP_GRADIENT_BAND = new THREE.Color(0x6b9bc7);
const MAP_PARTICLE_LIGHT = new THREE.Color(0x8ceaf2);
const NEON_BOUNDARY_GLOW = new THREE.Color().setRGB(.18, 1.02, 1.62);
const NEON_BOUNDARY_SELECTED = new THREE.Color().setRGB(.42, 1.65, 1.12);
const NEON_CITY_CYAN = new THREE.Color().setRGB(.18, 1.3, 1.72);
const NEON_CITY_VIOLET = new THREE.Color().setRGB(.62, .72, 1.72);
const NEON_CITY_MINT = new THREE.Color().setRGB(.38, 1.52, 1.04);
const NEON_CITY_GOLD = new THREE.Color().setRGB(1.42, .88, .22);
const NEON_ARC_CYAN = new THREE.Color().setRGB(.1, 1.05, 1.5);
const NEON_ARC_GOLD = new THREE.Color().setRGB(1.28, .7, .12);

const CITY_LABEL_OFFSETS: Record<string, [number, number]> = {
  北京: [-48, -22],
  大连: [52, -8],
  上海: [92, -34],
  苏州: [-82, -26],
  杭州: [-6, 18],
  宁波: [92, 48],
  金华: [-72, 52],
};

function getMapGradientColor(x: number, y: number, target = new THREE.Color()) {
  const eastward = THREE.MathUtils.clamp((x + 28) / 56, 0, 1);
  const northward = THREE.MathUtils.clamp((y + 19) / 38, 0, 1);
  const progress = THREE.MathUtils.clamp(eastward * .82 + (1 - northward) * .18, 0, 1);

  if (progress < .42) {
    target.lerpColors(MAP_GRADIENT_INDIGO, MAP_GRADIENT_VIOLET, progress / .42);
  } else if (progress < .78) {
    target.lerpColors(MAP_GRADIENT_VIOLET, MAP_GRADIENT_CYAN, (progress - .42) / .36);
  } else {
    target.lerpColors(MAP_GRADIENT_CYAN, MAP_GRADIENT_MINT, (progress - .78) / .22);
  }

  const bandDistance = (y + x * .3 - 1) / 7.5;
  const directionalBand = Math.exp(-(bandDistance * bandDistance));
  target.lerp(MAP_GRADIENT_BAND, directionalBand * .16);
  return target.multiplyScalar(.98 + eastward * .05 + directionalBand * .17);
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
  activeAdcodes,
  activeCityAdcode,
  scopedCityAdcodes = [],
  scopeName,
  viewOffsetX = 0,
  labelOcclusionSelector,
  viewportOcclusionSelector,
  interactionMode = "drilldown",
  onProvinceSelect,
  onCitySelect,
}: TechMapProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const activeAdcodesRef = useRef<number[]>(activeAdcodes);
  const activeCityAdcodeRef = useRef<number | null>(activeCityAdcode);
  const scopedCityAdcodesRef = useRef<number[]>(scopedCityAdcodes);
  const provinceCallbackRef = useRef(onProvinceSelect);
  const cityCallbackRef = useRef(onCitySelect);
  const updateSelectionRef = useRef<((adcodes: number[], cityAdcode: number | null, cityAdcodes: number[]) => void) | null>(null);

  useEffect(() => {
    provinceCallbackRef.current = onProvinceSelect;
    cityCallbackRef.current = onCitySelect;
  }, [onCitySelect, onProvinceSelect]);

  useEffect(() => {
    activeAdcodesRef.current = activeAdcodes;
    activeCityAdcodeRef.current = activeCityAdcode;
    scopedCityAdcodesRef.current = scopedCityAdcodes;
    updateSelectionRef.current?.(activeAdcodes, activeCityAdcode, scopedCityAdcodes);
  }, [activeAdcodes, activeCityAdcode, scopedCityAdcodes]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const controller = new AbortController();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let animationFrame = 0;
    let landParticleTimer: number | null = null;
    mount.dataset.renderState = "loading";
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
    scene.fog = new THREE.FogExp2(0x020713, .0055);

    const camera = new THREE.PerspectiveCamera(30, 1, .1, 320);
    camera.up.set(0, 0, -1);
    const resolveViewOffset = (width: number, height: number) => (
      width < 900 || width / Math.max(1, height) < 1 ? 0 : viewOffsetX
    );
    let currentViewOffsetX = resolveViewOffset(mount.clientWidth, mount.clientHeight);
    const cameraStart = new THREE.Vector3(currentViewOffsetX, 98, 0);
    const cameraEnd = new THREE.Vector3(currentViewOffsetX, 76, 0);
    let currentFitAspect = 16 / 9;
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
      mount.textContent = "当前环境无法启用 WebGL 三维地图";
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .98;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-label", "可交互的三维中国经营版图");
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = "tech-map-label-layer";
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.inset = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    mount.appendChild(labelRenderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), .42, .24, .74);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = reducedMotion;
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

    scene.add(new THREE.HemisphereLight(0x75cfe2, 0x030713, .9));
    const keyLight = new THREE.DirectionalLight(0xc9eff4, 1.1);
    keyLight.position.set(-18, 42, 24);
    scene.add(keyLight);
    const blueLight = new THREE.PointLight(0x276cff, 4, 130, 2);
    blueLight.position.set(20, 28, 20);
    scene.add(blueLight);
    const cyanLight = new THREE.PointLight(0x45edff, 3, 105, 2);
    cyanLight.position.set(-25, 18, -14);
    scene.add(cyanLight);

    const platformMaterial = new THREE.MeshBasicMaterial({
      color: 0x276dff,
      transparent: true,
      opacity: .007,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const platform = new THREE.Mesh(new THREE.CircleGeometry(47, 96), platformMaterial);
    platform.rotation.x = -Math.PI / 2;
    platform.position.y = -.66;
    scene.add(platform);

    const grid = new THREE.GridHelper(105, 32, 0x31b6ff, 0x173e8f);
    grid.position.y = -.74;
    const gridMaterial = grid.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = .012;
    scene.add(grid);

    const mapRoot = new THREE.Group();
    mapRoot.rotation.x = -Math.PI / 2;
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
      color: 0x72ddff,
      size: .06,
      map: glowTexture,
      transparent: true,
      opacity: .025,
      blending: THREE.AdditiveBlending,
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
      const toTarget = new THREE.Vector3(currentViewOffsetX, 0, 0);
      const toCamera = cameraEnd.clone();

      if (selectedRegions.length) {
        mapRoot.updateMatrixWorld(true);
        const bounds = new THREE.Box3();
        selectedRegions.forEach((region) => bounds.expandByObject(region.group));
        bounds.getCenter(toTarget);
        const size = bounds.getSize(new THREE.Vector3());
        const halfFovTangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const widthDistance = size.x / Math.max(.01, 2 * halfFovTangent * currentFitAspect);
        const heightDistance = size.z / Math.max(.01, 2 * halfFovTangent);
        const distance = THREE.MathUtils.clamp(Math.max(widthDistance, heightDistance) * 1.35, 23, 64);
        const nationalDistance = cameraEnd.distanceTo(new THREE.Vector3(currentViewOffsetX, 0, 0));
        toTarget.x += currentViewOffsetX * distance / nationalDistance;
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

    const applySelection = (adcodes: number[], cityAdcode: number | null, scopedCityAdcodes: number[]) => {
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
        const baseNeon = isMinor ? NEON_CITY_VIOLET : NEON_CITY_CYAN;
        const activeNeon = citySelected || scopeSelected
          ? NEON_CITY_MINT
          : isHub
            ? NEON_CITY_GOLD
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
        visual.beamMaterial.opacity = (citySelected ? .84 : scopeSelected ? .78 : isHub ? .68 : visual.city.count > 10 ? .62 : .48) * scopeWeight;
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
      collisionFrame = 30;
    };
    updateSelectionRef.current = applySelection;

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
      tooltip.textContent = city
        ? `${city.city.name} · ${city.city.count}个项目 · 点击${interactionMode === "locate" ? "定位" : interactionMode === "metrics" ? "查看城市指标" : "穿透"}`
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
        cityCallbackRef.current(city.city);
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

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    fetch(publicAssetPath("/china-geo.json"), { signal: controller.signal })
      .then((response) => response.json() as Promise<MapCollection>)
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
            color: 0xeaf0ff,
            emissive: 0x0a2852,
            emissiveIntensity: .48,
            vertexColors: true,
            metalness: .02,
            roughness: .82,
            clearcoat: .05,
            clearcoatRoughness: .9,
            transparent: true,
            opacity: .95,
          });
          const sideMaterial = new THREE.MeshStandardMaterial({
            color: 0x020913,
            emissive: 0x000000,
            emissiveIntensity: 0,
            metalness: 0,
            roughness: 1,
            transparent: true,
            opacity: .015,
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
            getMapGradientColor(positionAttribute.getX(index), positionAttribute.getY(index), vertexColor);
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
            color: 0x66cadf,
            transparent: true,
            opacity: .7,
            blending: THREE.NormalBlending,
            depthWrite: false,
          });
          const boundary = new THREE.LineSegments(boundaryGeometry, boundaryMaterial);
          const boundaryGlowMaterial = new THREE.LineBasicMaterial({
            color: NEON_BOUNDARY_GLOW,
            transparent: true,
            opacity: .12,
            blending: THREE.AdditiveBlending,
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
        landParticleTimer = window.setTimeout(() => {
          if (disposed) return;
          const particlePositions: number[] = [];
          const particleColors: number[] = [];
          const particleColor = new THREE.Color();
          let attempts = 0;
          while (particlePositions.length < 4800 && attempts < 24000) {
            attempts += 1;
            const point: Position = [73 + random() * 62, 18 + random() * 36];
            if (!allPolygons.some((polygon) => isInsidePolygon(point, polygon))) continue;
            const projected = projectPosition(point);
            particlePositions.push(projected.x, projected.y, MAP_DEPTH + .014 + random() * .024);
            getMapGradientColor(projected.x, projected.y, particleColor);
            particleColor.lerp(MAP_PARTICLE_LIGHT, .22).multiplyScalar(1.12);
            particleColors.push(particleColor.r, particleColor.g, particleColor.b);
          }
          const particleGeometry = new THREE.BufferGeometry();
          particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlePositions, 3));
          particleGeometry.setAttribute("color", new THREE.Float32BufferAttribute(particleColors, 3));
          const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: .055,
            map: glowTexture,
            transparent: true,
            opacity: .34,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            alphaTest: .07,
          });
          mapParticles = new THREE.Points(particleGeometry, particleMaterial);
          mapRoot.add(mapParticles);
        }, 120);

        cities.forEach((city, index) => {
          const projected = projectPosition([city.lon, city.lat]);
          const radius = .06 + Math.sqrt(city.count) * .01;
          const height = .2 + Math.sqrt(city.count) * .065;
          const cityNeon = city.major ? NEON_CITY_CYAN : NEON_CITY_VIOLET;
          const cloudRandom = seededRandom(20250000 + city.cityAdcode);
          const projectCloudRadius = .24 + Math.sqrt(city.count) * .065;
          const projectCloudPositions: number[] = [];
          const goldenAngle = Math.PI * (3 - Math.sqrt(5));
          for (let projectIndex = 0; projectIndex < city.count; projectIndex += 1) {
            const progress = Math.sqrt((projectIndex + .5) / city.count);
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
          const cloudMaterial = new THREE.PointsMaterial({
            color: city.hub ? NEON_CITY_GOLD : cityNeon,
            size: city.hub ? .15 : city.major ? .13 : .12,
            map: glowTexture,
            transparent: true,
            opacity: city.hub ? .82 : city.major ? .72 : .64,
            blending: THREE.AdditiveBlending,
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
            color: city.hub ? NEON_CITY_GOLD : cityNeon,
            transparent: true,
            opacity: city.hub ? .88 : city.major ? .84 : .78,
            blending: THREE.AdditiveBlending,
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
            color: city.hub ? NEON_CITY_GOLD : cityNeon,
            transparent: true,
            opacity: city.hub ? .72 : city.count > 10 ? .68 : .56,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const beam = new THREE.Mesh(beamGeometry, beamMaterial);
          beam.position.set(projected.x, projected.y, MAP_DEPTH + height / 2);
          mapRoot.add(beam);

          const glowMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            color: city.hub ? NEON_CITY_GOLD : cityNeon,
            transparent: true,
            opacity: city.hub ? .62 : .46,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const glow = new THREE.Sprite(glowMaterial);
          glow.scale.set(city.hub ? .9 : .62, city.hub ? .9 : .62, 1);
          glow.position.set(projected.x, projected.y, MAP_DEPTH + height);
          mapRoot.add(glow);

          const ringMaterial = new THREE.MeshBasicMaterial({
            color: city.hub ? NEON_CITY_GOLD : cityNeon,
            transparent: true,
            opacity: city.hub ? .46 : .32,
            blending: THREE.AdditiveBlending,
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
          ].filter(Boolean).join(" ");
          label.innerHTML = "<b>" + city.name + "</b><span><strong>" + city.count + "</strong> 个项目</span>";
          label.setAttribute("role", "button");
          label.setAttribute("tabindex", "0");
          label.setAttribute(
            "aria-label",
            interactionMode === "locate"
              ? `${city.name}，${city.count}个项目，点击定位城市`
              : interactionMode === "metrics"
                ? `${city.name}，点击查看城市指标`
                : `${city.name}，${city.count}个项目，点击查看项目列表`,
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
              count: city.count,
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
            hitTarget,
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

        const hub = cities.find((city) => city.hub);
        if (hub) {
          const hubPoint = projectPosition([hub.lon, hub.lat]);
          cities.filter((city) => city.major && !city.hub).forEach((city, index) => {
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
            const arcColor = isWarmAccent ? NEON_ARC_GOLD : NEON_ARC_CYAN;
            const haloMaterial = new THREE.MeshBasicMaterial({
              color: arcColor,
              transparent: true,
              opacity: isWarmAccent ? .065 : .075,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            });
            const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, .032, 5, false), haloMaterial);
            const arcMaterial = new THREE.MeshBasicMaterial({
              color: arcColor,
              transparent: true,
              opacity: isWarmAccent ? .55 : .5,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            });
            const arc = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .008, 4, false), arcMaterial);
            mapRoot.add(halo, arc);

            const travelMaterial = new THREE.SpriteMaterial({
              map: glowTexture,
              color: arcColor,
              transparent: true,
              opacity: isWarmAccent ? .68 : .62,
              blending: THREE.AdditiveBlending,
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

        applySelection(activeAdcodesRef.current, activeCityAdcodeRef.current, scopedCityAdcodesRef.current);
        mount.dataset.renderState = "ready";
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") {
          mount.classList.add("is-fallback");
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
      let safeLeft = 0;
      let safeRight = width;
      if (viewportOcclusionSelector) {
        document.querySelectorAll<HTMLElement>(viewportOcclusionSelector).forEach((element) => {
          const bounds = element.getBoundingClientRect();
          const left = THREE.MathUtils.clamp(bounds.left - mountBounds.left, 0, width);
          const right = THREE.MathUtils.clamp(bounds.right - mountBounds.left, 0, width);
          if (right <= width / 2) safeLeft = Math.max(safeLeft, right);
          if (left >= width / 2) safeRight = Math.min(safeRight, left);
        });
      }
      const safeWidth = Math.max(1, safeRight - safeLeft);
      // The map remains a full-screen background, while its camera leaves enough
      // breathing room for the visible centre stage between the two metric rails.
      const fittedWidth = viewportOcclusionSelector
        ? Math.max(safeWidth, width * .64)
        : width;
      currentFitAspect = fittedWidth / height;
      const baselineAspect = 16 / 9;
      const baselineHalfFov = THREE.MathUtils.degToRad(15);
      const adaptiveFov = currentFitAspect < baselineAspect
        ? THREE.MathUtils.radToDeg(2 * Math.atan(
          Math.tan(baselineHalfFov) * baselineAspect / currentFitAspect,
        ))
        : 30;
      camera.fov = THREE.MathUtils.clamp(adaptiveFov, 30, 52);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      bloomPass.resolution.set(width, height);
      labelRenderer.setSize(width, height);
      collisionFrame = 30;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const introStart = performance.now();
    const baseColor = new THREE.Color(0xeaf0ff);
    const baseEmissive = new THREE.Color(0x0a2852);
    const selectedColor = new THREE.Color(0x8fd8cc);
    const selectedEmissive = new THREE.Color(0x07524f);
    const baseBoundary = new THREE.Color(0x66cadf);
    const selectedBoundary = new THREE.Color(0x9af1d8);
    const baseBoundaryGlow = NEON_BOUNDARY_GLOW.clone();
    const selectedBoundaryGlow = NEON_BOUNDARY_SELECTED.clone();

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
        const blockingBounds = occlusionBounds.find((bounds) => (
          initialRect.left < bounds.right + 12
          && initialRect.right > bounds.left - 12
          && initialRect.top < bounds.bottom + 12
          && initialRect.bottom > bounds.top - 12
        ));
        let safeLeft = mapBounds.left;
        let safeRight = mapBounds.right;
        if (blockingBounds) {
          const blockingCenter = (blockingBounds.left + blockingBounds.right) / 2;
          const mapCenter = (mapBounds.left + mapBounds.right) / 2;
          if (blockingCenter < mapCenter) {
            safeLeft = THREE.MathUtils.clamp(blockingBounds.right + 12, mapBounds.left, mapBounds.right - 24);
          } else if (blockingCenter > mapCenter) {
            safeRight = THREE.MathUtils.clamp(blockingBounds.left - 12, mapBounds.left + 24, mapBounds.right);
          } else {
            visual.labelElement.style.opacity = "0";
            visual.labelElement.style.pointerEvents = "none";
            visual.labelElement.setAttribute("aria-hidden", "true");
            visual.labelElement.tabIndex = -1;
            return;
          }
        }
        if (initialRect.right <= safeLeft + 4 || initialRect.left >= safeRight - 4) {
          visual.labelElement.style.opacity = "0";
          visual.labelElement.style.pointerEvents = "none";
          visual.labelElement.setAttribute("aria-hidden", "true");
          visual.labelElement.tabIndex = -1;
          return;
        }
        let boundaryShiftX = 0;
        let boundaryShiftY = 0;
        if (initialRect.left < safeLeft + 12) boundaryShiftX = safeLeft + 12 - initialRect.left;
        if (initialRect.right > safeRight - 12) boundaryShiftX = safeRight - 12 - initialRect.right;
        if (initialRect.top < mapBounds.top + 12) boundaryShiftY = mapBounds.top + 12 - initialRect.top;
        if (initialRect.bottom > mapBounds.bottom - 12) boundaryShiftY = mapBounds.bottom - 12 - initialRect.bottom;
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
      animationFrame = requestAnimationFrame(animate);
      const elapsed = Math.max(0, (now - introStart) / 1000);

      if (!introFinished) {
        const progress = Math.min(1, (now - introStart) / 1100);
        const eased = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(cameraStart, cameraEnd, eased);
        mapRoot.scale.setScalar(.92 + eased * .11);
        if (progress >= 1) {
          introFinished = true;
          controls.enabled = true;
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
        const targetIntensity = region.selected ? .6 : .48;
        region.topMaterial.emissiveIntensity += (targetIntensity - region.topMaterial.emissiveIntensity) * .08;
        region.topMaterial.opacity += ((region.selected ? .98 : .95) - region.topMaterial.opacity) * .08;
        region.sideMaterial.emissiveIntensity += (0 - region.sideMaterial.emissiveIntensity) * .08;
        region.boundaryMaterial.color.lerp(region.selected ? selectedBoundary : baseBoundary, blend);
        region.boundaryMaterial.opacity += ((region.selected ? .94 : .7) - region.boundaryMaterial.opacity) * .08;
        region.boundaryGlowMaterial.color.lerp(region.selected ? selectedBoundaryGlow : baseBoundaryGlow, blend);
        region.boundaryGlowMaterial.opacity += ((region.selected ? .22 : .12) - region.boundaryGlowMaterial.opacity) * .08;
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

      spaceMaterial.opacity = .018 + Math.sin(elapsed * .55) * .006;
      if (mapParticles) {
        mapParticles.material.opacity = .36 + Math.sin(elapsed * 1.2) * .04;
        mapParticles.rotation.z = Math.sin(elapsed * .13) * .001;
      }
      platformMaterial.opacity = .006 + Math.sin(elapsed * .7) * .002;

      composer.render();
      labelRenderer.render(scene, camera);
      collisionFrame += 1;
      const collisionInterval = !introFinished || focusTransition ? 6 : 30;
      if (collisionFrame >= collisionInterval) {
        collisionFrame = 0;
        resolveCityLabelCollisions();
      }
    };

    const handleVisibility = () => {
      sceneVisible = !document.hidden;
      if (sceneVisible) {
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
      controller.abort();
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
  }, [interactionMode, labelOcclusionSelector, viewportOcclusionSelector, viewOffsetX]);

  return (
    <div
      className="tech-map"
      aria-label={`${scopeName}三维经营地图，可按行政区和城市${interactionMode === "locate" ? "定位" : interactionMode === "metrics" ? "查看指标" : "穿透"}`}
      data-city-anchor-count={WENSHU_COVERED_CITY_COUNT}
      data-project-cloud-count={WENSHU_DOMESTIC_PROJECT_COUNT}
      data-city-label-mode="all-with-collision-avoidance"
      data-label-occlusion={labelOcclusionSelector ? "measured-panel" : "none"}
      data-viewport-fit={viewportOcclusionSelector ? "safe-stage" : "full-canvas"}
    >
      <div ref={mountRef} className="tech-map-webgl" />
      <div ref={tooltipRef} className="tech-map-tooltip" />
      <div className="tech-map-scan" aria-hidden="true" />
      <div className="tech-map-status"><i /> THREE.JS · REALTIME</div>
      <div className="tech-map-controls">拖拽旋转 · 滚轮缩放 · 点击行政区 · 点击城市{interactionMode === "locate" ? "定位" : interactionMode === "metrics" ? "查看指标" : "穿透项目"}</div>
      <div className="tech-map-legend"><span><i />项目数量点簇</span><span><i />城市定位锚点</span></div>
      <div className="tech-map-note">点簇表示城市项目数量，不代表项目精确地址</div>
    </div>
  );
}
