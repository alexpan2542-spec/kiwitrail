import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type Track3DRoute = {
  id: number;
  name: string;
  seq: number;
  route_no: number;
  length_m: number;
  elev_min: number;
  elev_max: number;
  elevations: number[];
  coordinates: [number, number][];
};

export type Track3DModalProps = {
  open: boolean;
  onClose: () => void;
  trackName: string;
  routes: Track3DRoute[];
  highlightRouteKey?: string | null;
  getRouteKey?: (route: Track3DRoute, index: number) => string;
};

const DEFAULT_VERTICAL_EXAGGERATION = 4;

function metersPerDegreeLon(latDeg: number): number {
  return 111320 * Math.cos((latDeg * Math.PI) / 180);
}

const METERS_PER_DEGREE_LAT = 110540;

type ProjectedRoute = {
  key: string;
  name: string;
  routeNo: number;
  positions: Float32Array;
  elevMin: number;
  elevMax: number;
  lengthM: number;
};

type SceneRefs = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  trackGroup: THREE.Group;
  groundMesh: THREE.Mesh | null;
  gridHelper: THREE.GridHelper | null;
  rafId: number;
  resizeObserver: ResizeObserver | null;
};

function projectRoutes(
  routes: Track3DRoute[],
  getRouteKey: (route: Track3DRoute, index: number) => string,
): {
  projected: ProjectedRoute[];
  centerLng: number;
  centerLat: number;
  globalElevMin: number;
  globalElevMax: number;
  horizontalExtent: number;
} {
  if (routes.length === 0) {
    return {
      projected: [],
      centerLng: 0,
      centerLat: 0,
      globalElevMin: 0,
      globalElevMax: 0,
      horizontalExtent: 1,
    };
  }

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let globalElevMin = Infinity;
  let globalElevMax = -Infinity;

  for (const r of routes) {
    for (const [lng, lat] of r.coordinates) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    if (r.elev_min < globalElevMin) globalElevMin = r.elev_min;
    if (r.elev_max > globalElevMax) globalElevMax = r.elev_max;
  }

  if (!Number.isFinite(globalElevMin)) globalElevMin = 0;
  if (!Number.isFinite(globalElevMax)) globalElevMax = globalElevMin + 1;

  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const mLng = metersPerDegreeLon(centerLat);

  const projected: ProjectedRoute[] = routes.map((route, index) => {
    const coords = route.coordinates;
    const n = coords.length;
    const positions = new Float32Array(n * 3);
    const elevs = route.elevations ?? [];
    const elevN = elevs.length;

    for (let i = 0; i < n; i++) {
      const [lng, lat] = coords[i];
      const x = (lng - centerLng) * mLng;
      const z = -(lat - centerLat) * METERS_PER_DEGREE_LAT;

      let y: number;
      if (elevN === 0) {
        y = route.elev_min ?? 0;
      } else if (elevN === 1) {
        y = elevs[0];
      } else {
        const t = n === 1 ? 0 : i / (n - 1);
        const f = t * (elevN - 1);
        const i0 = Math.floor(f);
        const i1 = Math.min(elevN - 1, i0 + 1);
        const frac = f - i0;
        y = elevs[i0] * (1 - frac) + elevs[i1] * frac;
      }

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    return {
      key: getRouteKey(route, index),
      name: route.name,
      routeNo: route.route_no,
      positions,
      elevMin: route.elev_min ?? globalElevMin,
      elevMax: route.elev_max ?? globalElevMax,
      lengthM: route.length_m ?? 0,
    };
  });

  const extentX = (maxLng - minLng) * mLng;
  const extentZ = (maxLat - minLat) * METERS_PER_DEGREE_LAT;
  const horizontalExtent = Math.max(1, extentX, extentZ);

  return {
    projected,
    centerLng,
    centerLat,
    globalElevMin,
    globalElevMax,
    horizontalExtent,
  };
}

function colorForElevation(
  y: number,
  minY: number,
  maxY: number,
  out: THREE.Color,
): THREE.Color {
  const span = maxY - minY;
  const t = span > 0 ? (y - minY) / span : 0;
  const hue = (1 - t) * 0.45;
  out.setHSL(hue, 0.85, 0.5);
  return out;
}

export default function Track3DModal({
  open,
  onClose,
  trackName,
  routes,
  highlightRouteKey,
  getRouteKey,
}: Track3DModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRefs = useRef<SceneRefs | null>(null);
  const [verticalExaggeration, setVerticalExaggeration] = useState(
    DEFAULT_VERTICAL_EXAGGERATION,
  );

  const resolveKey =
    getRouteKey ?? ((r: Track3DRoute, i: number) => `${r.id}-${r.seq}-${i}`);

  const projectionData = useMemo(
    () => projectRoutes(routes, resolveKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routes],
  );

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1620);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1e7);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);

    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    const refs: SceneRefs = {
      renderer,
      scene,
      camera,
      controls,
      trackGroup,
      groundMesh: null,
      gridHelper: null,
      rafId: 0,
      resizeObserver: null,
    };
    sceneRefs.current = refs;

    const animate = () => {
      refs.rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth || width;
      const h = container.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(handleResize);
      ro.observe(container);
      refs.resizeObserver = ro;
    } else {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      cancelAnimationFrame(refs.rafId);
      refs.resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
        const mat = (obj as THREE.Mesh).material;
        if (mat) {
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRefs.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const refs = sceneRefs.current;
    if (!refs) return;

    const { trackGroup, scene } = refs;

    while (trackGroup.children.length > 0) {
      const child = trackGroup.children[0];
      trackGroup.remove(child);
      const anyChild = child as THREE.Mesh | THREE.Line | THREE.LineSegments;
      anyChild.geometry?.dispose();
      const mat = anyChild.material;
      if (mat) {
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
        }
      }
    }

    if (refs.groundMesh) {
      scene.remove(refs.groundMesh);
      refs.groundMesh.geometry.dispose();
      const gMat = refs.groundMesh.material;
      if (Array.isArray(gMat)) {
        gMat.forEach((m) => m.dispose());
      } else {
        gMat.dispose();
      }
      refs.groundMesh = null;
    }
    if (refs.gridHelper) {
      scene.remove(refs.gridHelper);
      refs.gridHelper.geometry.dispose();
      const ghMat = refs.gridHelper.material;
      if (Array.isArray(ghMat)) {
        ghMat.forEach((m) => m.dispose());
      } else {
        ghMat.dispose();
      }
      refs.gridHelper = null;
    }

    const {
      projected,
      globalElevMin,
      globalElevMax,
      horizontalExtent,
    } = projectionData;

    if (projected.length === 0) {
      return;
    }

    const baseY = globalElevMin * verticalExaggeration;
    const tmpColor = new THREE.Color();

    projected.forEach((route) => {
      const isHighlighted =
        highlightRouteKey != null && route.key === highlightRouteKey;

      const positions = new Float32Array(route.positions.length);
      const colors = new Float32Array(route.positions.length);

      for (let i = 0; i < route.positions.length; i += 3) {
        positions[i] = route.positions[i];
        positions[i + 1] = route.positions[i + 1] * verticalExaggeration;
        positions[i + 2] = route.positions[i + 2];

        colorForElevation(
          route.positions[i + 1],
          globalElevMin,
          globalElevMax,
          tmpColor,
        );
        if (isHighlighted) {
          tmpColor.lerp(new THREE.Color(0xff3da6), 0.55);
        }
        colors[i] = tmpColor.r;
        colors[i + 1] = tmpColor.g;
        colors[i + 2] = tmpColor.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: isHighlighted ? 3 : 1,
        transparent: !isHighlighted && highlightRouteKey != null,
        opacity: !isHighlighted && highlightRouteKey != null ? 0.55 : 1,
      });

      const line = new THREE.Line(geometry, material);
      trackGroup.add(line);

      const dropPositions = new Float32Array(route.positions.length / 3 * 6);
      for (
        let i = 0, j = 0;
        i < route.positions.length;
        i += 3, j += 6
      ) {
        dropPositions[j + 0] = route.positions[i];
        dropPositions[j + 1] = route.positions[i + 1] * verticalExaggeration;
        dropPositions[j + 2] = route.positions[i + 2];
        dropPositions[j + 3] = route.positions[i];
        dropPositions[j + 4] = baseY;
        dropPositions[j + 5] = route.positions[i + 2];
      }
      const dropGeom = new THREE.BufferGeometry();
      dropGeom.setAttribute(
        "position",
        new THREE.BufferAttribute(dropPositions, 3),
      );
      const dropMat = new THREE.LineBasicMaterial({
        color: 0x4a6079,
        transparent: true,
        opacity: 0.18,
      });
      const dropLines = new THREE.LineSegments(dropGeom, dropMat);
      trackGroup.add(dropLines);
    });

    const gridSize = Math.max(horizontalExtent * 1.6, 1000);
    const gridDivisions = 20;
    const grid = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      0x4a6079,
      0x2a3b50,
    );
    grid.position.y = baseY;
    scene.add(grid);
    refs.gridHelper = grid;

    const groundGeom = new THREE.PlaneGeometry(gridSize, gridSize, 1, 1);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x152030,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = baseY - 0.5;
    scene.add(ground);
    refs.groundMesh = ground;

    const elevSpan =
      (globalElevMax - globalElevMin) * verticalExaggeration || 1;
    const cameraDistance = horizontalExtent * 1.4 + elevSpan * 1.5;
    refs.camera.position.set(
      cameraDistance * 0.7,
      baseY + elevSpan * 1.4 + horizontalExtent * 0.6,
      cameraDistance,
    );
    refs.controls.target.set(0, baseY + elevSpan * 0.3, 0);
    refs.controls.update();
  }, [open, projectionData, verticalExaggeration, highlightRouteKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const { globalElevMin, globalElevMax } = projectionData;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="3D track view"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0f1620",
          color: "#e8eef6",
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          width: "min(1100px, 96vw)",
          height: "min(720px, 90vh)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid #1f2a3a",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            3D View — {trackName}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close 3D view"
            style={{
              border: "none",
              background: "transparent",
              color: "#e8eef6",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
          <div
            ref={containerRef}
            style={{ position: "absolute", inset: 0 }}
          />

          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "rgba(15,22,32,0.85)",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.4,
              pointerEvents: "none",
              maxWidth: 280,
            }}
          >
            <div>Drag: rotate · Right-drag: pan · Scroll: zoom</div>
            <div style={{ marginTop: 4, opacity: 0.85 }}>
              Elev range: {Math.round(globalElevMin)} m –{" "}
              {Math.round(globalElevMax)} m
            </div>
            <div style={{ marginTop: 2, opacity: 0.85 }}>
              Routes: {routes.length}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(15,22,32,0.85)",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            <label htmlFor="vex-slider" style={{ whiteSpace: "nowrap" }}>
              Vertical exaggeration: {verticalExaggeration.toFixed(1)}×
            </label>
            <input
              id="vex-slider"
              type="range"
              min={1}
              max={20}
              step={0.5}
              value={verticalExaggeration}
              onChange={(e) =>
                setVerticalExaggeration(parseFloat(e.target.value))
              }
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() =>
                setVerticalExaggeration(DEFAULT_VERTICAL_EXAGGERATION)
              }
              style={{
                background: "#1f2a3a",
                color: "#e8eef6",
                border: "1px solid #2a3b50",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
