import { Grid, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { Feature, FeatureCollection, LineString } from "geojson";

import ElevationPointerTracker, {
  type ElevationHoverInfo,
} from "./ElevationPointerTracker";
import { buildElevationSamples } from "./track3dElevation";
import {
  computeOrigin,
  computeTrackExtents,
  computeVerticalExaggeration,
  toScenePoints,
  type LngLatElev,
} from "./track3dCoords";

const ROUTE_COLORS = [
  "#ff3366",
  "#3366ff",
  "#33cc66",
  "#ff9933",
  "#9933ff",
  "#00cccc",
];

type RouteFeature = Feature<LineString, { route_no: number }>;

function coordToLngLatElev(coord: number[]): LngLatElev | null {
  if (coord.length < 2) return null;
  const lng = coord[0];
  const lat = coord[1];
  const elev = coord.length >= 3 && coord[2] != null ? coord[2] : 0;
  if (
    !Number.isFinite(lng) ||
    !Number.isFinite(lat) ||
    !Number.isFinite(elev)
  ) {
    return null;
  }
  return [lng, lat, elev];
}

function RouteLine({
  coordinates,
  color,
  originLng,
  originLat,
  baseElevationM,
  verticalExaggeration,
  compact,
}: {
  coordinates: LngLatElev[];
  color: string;
  originLng: number;
  originLat: number;
  baseElevationM: number;
  verticalExaggeration: number;
  compact: boolean;
}) {
  const points = useMemo(() => {
    const vectors = toScenePoints(
      coordinates,
      originLng,
      originLat,
      baseElevationM,
      verticalExaggeration,
    ).map(([x, y, z]) => new THREE.Vector3(x, y, z));
    return vectors.length >= 2 ? vectors : null;
  }, [coordinates, originLng, originLat, baseElevationM, verticalExaggeration]);

  if (!points) return null;

  return <Line points={points} color={color} lineWidth={compact ? 3 : 2} />;
}

function pickGridCellSizeM(horizontalSpanM: number): number {
  const targetCells = 12;
  const rough = horizontalSpanM / targetCells;
  const power = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  return Math.max(25, Math.round(rough / power) * power);
}

/** Infinite horizontal grid at the track base (Y = 0). */
function TrackBaseGrid({
  centerX,
  centerY,
  centerZ,
  horizontalSpanM,
  fadeDistance,
}: {
  centerX: number;
  centerY: number;
  centerZ: number;
  horizontalSpanM: number;
  fadeDistance: number;
}) {
  const cellSize = pickGridCellSizeM(horizontalSpanM);
  const sectionSize = cellSize * 5;

  return (
    <Grid
      position={[centerX, centerY, centerZ]}
      args={[sectionSize, sectionSize]}
      cellSize={cellSize}
      cellThickness={0.7}
      cellColor="#ced4da"
      sectionSize={sectionSize}
      sectionThickness={1.1}
      sectionColor="#6c757d"
      fadeDistance={fadeDistance}
      fadeStrength={1.25}
      infiniteGrid
    />
  );
}

function CameraRig({
  center,
  distance,
}: {
  center: THREE.Vector3;
  distance: number;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(
      center.x + distance * 0.42,
      center.y + distance * 0.34,
      center.z + distance * 0.58,
    );
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }, [camera, center, distance]);

  return null;
}

function SceneContent({
  collection,
  compact,
  elevationSamples,
  onElevationHover,
  autoRotate,
}: {
  collection: FeatureCollection<LineString>;
  compact: boolean;
  elevationSamples: ReturnType<typeof buildElevationSamples>;
  onElevationHover: (info: ElevationHoverInfo | null) => void;
  autoRotate: boolean;
}) {
  const routeFeatures = useMemo(
    () => (collection.features ?? []) as RouteFeature[],
    [collection.features],
  );

  const allCoords = useMemo(() => {
    const coords: LngLatElev[] = [];
    for (const feature of routeFeatures) {
      for (const c of feature.geometry.coordinates) {
        const parsed = coordToLngLatElev(c);
        if (parsed) coords.push(parsed);
      }
    }
    return coords;
  }, [routeFeatures]);

  const origin = useMemo(() => computeOrigin(allCoords), [allCoords]);
  const extents = useMemo(
    () => computeTrackExtents(allCoords, origin.lng, origin.lat),
    [allCoords, origin.lat, origin.lng],
  );
  const verticalExaggeration = useMemo(
    () => computeVerticalExaggeration(extents),
    [extents],
  );

  const basePlaneY = 0;

  const { center, cameraDistance, horizontalSpan } = useMemo(() => {
    if (!allCoords.length) {
      return {
        center: new THREE.Vector3(0, 0, 0),
        cameraDistance: 1000,
        horizontalSpan: 500,
      };
    }

    const points = toScenePoints(
      allCoords,
      origin.lng,
      origin.lat,
      extents.minElevM,
      verticalExaggeration,
    );
    const box = new THREE.Box3();
    for (const [x, y, z] of points) {
      box.expandByPoint(new THREE.Vector3(x, y, z));
    }
    const c = new THREE.Vector3();
    box.getCenter(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const hSpan = Math.max(size.x, size.z, 100);
    const span = Math.max(size.x, size.y, size.z, 100);
    return {
      center: c,
      cameraDistance: span * 1.65,
      horizontalSpan: hSpan,
    };
  }, [
    allCoords,
    extents.minElevM,
    origin.lat,
    origin.lng,
    verticalExaggeration,
  ]);

  if (!routeFeatures.length || !allCoords.length) {
    return null;
  }

  return (
    <>
      <color attach="background" args={["#e9ecef"]} />
      <fog
        attach="fog"
        args={["#e9ecef", cameraDistance * 0.65, cameraDistance * 3.5]}
      />
      <ambientLight intensity={0.7} />
      <directionalLight position={[1, 2, 1]} intensity={0.95} />
      <TrackBaseGrid
        centerX={center.x}
        centerY={basePlaneY}
        centerZ={center.z}
        horizontalSpanM={horizontalSpan}
        fadeDistance={Math.max(horizontalSpan * 2.5, 800)}
      />
      {routeFeatures.map((feature, index) => {
        const coords = feature.geometry.coordinates
          .map(coordToLngLatElev)
          .filter((c): c is LngLatElev => c !== null);

        return (
          <RouteLine
            key={feature.properties?.route_no ?? index}
            coordinates={coords}
            color={ROUTE_COLORS[index % ROUTE_COLORS.length]}
            originLng={origin.lng}
            originLat={origin.lat}
            baseElevationM={extents.minElevM}
            verticalExaggeration={verticalExaggeration}
            compact={compact}
          />
        );
      })}
      <CameraRig center={center} distance={cameraDistance} />
      <OrbitControls
        target={center}
        makeDefault
        enablePan={!compact}
        enableZoom
        enableRotate
        autoRotate={autoRotate}
        autoRotateSpeed={2.3}
      />
      <ElevationPointerTracker
        samples={elevationSamples}
        onHover={onElevationHover}
      />
    </>
  );
}

export type Track3DSceneProps = {
  collection: FeatureCollection<LineString>;
  /** Smaller inset preview (map corner panel). */
  compact?: boolean;
};

export default function Track3DScene({
  collection,
  compact = false,
}: Track3DSceneProps) {
  const features = collection.features ?? [];
  const hasRoutes = features.length > 0;
  const [hover, setHover] = useState<ElevationHoverInfo | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  const elevationSamples = useMemo(
    () => buildElevationSamples(collection),
    [collection],
  );

  useEffect(() => {
    setAutoRotate(true);
  }, [collection]);

  return (
    <div
      className="track-3d-scene"
      onPointerEnter={() => setAutoRotate(false)}
      onPointerLeave={() => setAutoRotate(true)}
    >
      {hasRoutes ? (
        <>
          <Canvas
            camera={{
              fov: 50,
              near: 1,
              far: 1_000_000,
              position: [0, 800, 1200],
            }}
            style={{ width: "100%", height: "100%" }}
            gl={{ antialias: true }}
          >
            <SceneContent
              collection={collection}
              compact={compact}
              elevationSamples={elevationSamples}
              onElevationHover={setHover}
              autoRotate={autoRotate}
            />
          </Canvas>
          {hover && (
            <div
              className="track-3d-elev-tooltip"
              style={{ left: hover.x, top: hover.y }}
            >
              {Math.round(hover.elevationM)} m
            </div>
          )}
        </>
      ) : (
        <div className="track-3d-scene__empty">
          No 3D elevation data for this track.
        </div>
      )}
    </div>
  );
}
