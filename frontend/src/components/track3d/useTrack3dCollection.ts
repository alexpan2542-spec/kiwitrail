import type { FeatureCollection, LineString } from "geojson";
import { useEffect, useState } from "react";

import { normalizeTrack3dCollection } from "./normalizeTrack3dCollection";

export function useTrack3dCollection(
  trackId: number | null,
  backendUrl: string,
  enabled: boolean,
) {
  const [collection, setCollection] = useState<FeatureCollection<LineString>>(
    () => normalizeTrack3dCollection(null),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || trackId == null) {
      setCollection(normalizeTrack3dCollection(null));
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setCollection(normalizeTrack3dCollection(null));

      try {
        if (!backendUrl?.trim()) {
          throw new Error("VITE_BACKEND_URL is not set");
        }
        const base = backendUrl.replace(/\/$/, "");
        const response = await fetch(`${base}/tracks/${trackId}/3d`);
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(
            detail
              ? `HTTP ${response.status}: ${detail}`
              : `HTTP ${response.status}`,
          );
        }
        const data: unknown = await response.json();
        if (!cancelled) {
          setCollection(normalizeTrack3dCollection(data));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load 3D track");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, trackId, backendUrl]);

  return { collection, loading, error };
}
