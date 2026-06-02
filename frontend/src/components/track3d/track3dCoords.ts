export type LngLatElev = [number, number, number];

const EARTH_RADIUS_M = 6_371_000;

/** Metres east / north from a local origin (WGS84). */
export function toLocalMeters(
  lng: number,
  lat: number,
  originLng: number,
  originLat: number,
): { x: number; z: number } {
  const latRad = (originLat * Math.PI) / 180;
  const x =
    ((lng - originLng) * Math.PI) / 180 * EARTH_RADIUS_M * Math.cos(latRad);
  const z = -(((lat - originLat) * Math.PI) / 180) * EARTH_RADIUS_M;
  return { x, z };
}

export function computeMinElevationM(allCoords: LngLatElev[]): number {
  if (!allCoords.length) return 0;
  return Math.min(...allCoords.map(([, , elev]) => elev));
}

export function computeOrigin(
  allCoords: LngLatElev[],
): { lng: number; lat: number } {
  if (!allCoords.length) return { lng: 0, lat: 0 };
  let lng = 0;
  let lat = 0;
  for (const [lon, la] of allCoords) {
    lng += lon;
    lat += la;
  }
  return { lng: lng / allCoords.length, lat: lat / allCoords.length };
}

export type TrackExtents = {
  minElevM: number;
  maxElevM: number;
  elevSpanM: number;
  /** Axis-aligned horizontal span in local metres (east/north). */
  horizontalSpanM: number;
};

export function computeTrackExtents(
  allCoords: LngLatElev[],
  originLng: number,
  originLat: number,
): TrackExtents {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let minElevM = Infinity;
  let maxElevM = -Infinity;

  for (const [lng, lat, elev] of allCoords) {
    const { x, z } = toLocalMeters(lng, lat, originLng, originLat);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
    minElevM = Math.min(minElevM, elev);
    maxElevM = Math.max(maxElevM, elev);
  }

  const horizontalSpanM =
    Math.hypot(maxX - minX, maxZ - minZ) || 1;
  const elevSpanM = Math.max(maxElevM - minElevM, 0);

  return {
    minElevM: Number.isFinite(minElevM) ? minElevM : 0,
    maxElevM: Number.isFinite(maxElevM) ? maxElevM : 0,
    elevSpanM,
    horizontalSpanM,
  };
}

/** Default vertical : horizontal scale (~1 m rise per 1 m run, +20%). */
const BASE_VERTICAL_EXAGGERATION = 1.2;

/**
 * Vertical scale for the 3D scene. Horizontal axes are true metres; Y uses
 * (elevation − track minimum) × this factor. Defaults to 1:1.2; only boosts very
 * flat tracks so relief stays visible (capped at 3×).
 */
export function computeVerticalExaggeration(extents: TrackExtents): number {
  const { elevSpanM, horizontalSpanM } = extents;
  if (elevSpanM < 1) return BASE_VERTICAL_EXAGGERATION;

  const naturalRatio = elevSpanM / horizontalSpanM;
  const minVisibleRatio = 0.08;
  if (naturalRatio >= minVisibleRatio) return BASE_VERTICAL_EXAGGERATION;

  return Math.min(minVisibleRatio / naturalRatio, 3);
}

export function toScenePoints(
  coordinates: LngLatElev[],
  originLng: number,
  originLat: number,
  baseElevationM: number,
  verticalExaggeration: number,
): [number, number, number][] {
  return coordinates.map(([lng, lat, elev]) => {
    const { x, z } = toLocalMeters(lng, lat, originLng, originLat);
    const relativeElevM = Math.max(0, elev - baseElevationM);
    return [x, relativeElevM * verticalExaggeration, z];
  });
}
