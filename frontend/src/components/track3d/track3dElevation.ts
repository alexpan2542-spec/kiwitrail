import type { FeatureCollection, LineString } from "geojson";
import * as THREE from "three";

import {
  computeOrigin,
  computeTrackExtents,
  computeVerticalExaggeration,
  toScenePoints,
  type LngLatElev,
} from "./track3dCoords";

export type ElevationSample = {
  position: THREE.Vector3;
  elevationM: number;
};

function parseCoord(coord: number[]): LngLatElev | null {
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

export function collectLngLatElev(
  collection: FeatureCollection<LineString>,
): LngLatElev[] {
  const coords: LngLatElev[] = [];
  for (const feature of collection.features ?? []) {
    if (feature.geometry?.type !== "LineString") continue;
    for (const c of feature.geometry.coordinates) {
      const parsed = parseCoord(c);
      if (parsed) coords.push(parsed);
    }
  }
  return coords;
}

export function computeElevationRangeM(
  collection: FeatureCollection<LineString>,
): { minM: number; maxM: number } | null {
  const coords = collectLngLatElev(collection);
  if (!coords.length) return null;
  const elevations = coords.map(([, , elev]) => elev);
  return {
    minM: Math.min(...elevations),
    maxM: Math.max(...elevations),
  };
}

export function buildElevationSamples(
  collection: FeatureCollection<LineString>,
): ElevationSample[] {
  const allCoords = collectLngLatElev(collection);
  if (!allCoords.length) return [];

  const origin = computeOrigin(allCoords);
  const extents = computeTrackExtents(allCoords, origin.lng, origin.lat);
  const verticalExaggeration = computeVerticalExaggeration(extents);

  return toScenePoints(
    allCoords,
    origin.lng,
    origin.lat,
    extents.minElevM,
    verticalExaggeration,
  ).map(([x, y, z], index) => ({
    position: new THREE.Vector3(x, y, z),
    elevationM: allCoords[index][2],
  }));
}
