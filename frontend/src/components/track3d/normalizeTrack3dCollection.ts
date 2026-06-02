import type { FeatureCollection, LineString } from "geojson";

const EMPTY: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [],
};

/** API / DB may return null `features`; guard before rendering. */
export function normalizeTrack3dCollection(
  data: unknown,
): FeatureCollection<LineString> {
  if (
    !data ||
    typeof data !== "object" ||
    (data as FeatureCollection).type !== "FeatureCollection"
  ) {
    return EMPTY;
  }

  const raw = data as FeatureCollection<LineString>;
  const features = Array.isArray(raw.features) ? raw.features : [];

  return {
    type: "FeatureCollection",
    features: features.filter(
      (f) =>
        f?.type === "Feature" &&
        f.geometry?.type === "LineString" &&
        Array.isArray(f.geometry.coordinates) &&
        f.geometry.coordinates.length >= 2,
    ),
  };
}
