import { useMemo } from "react";

import Track3DScene from "./Track3DScene";
import { computeElevationRangeM } from "./track3dElevation";
import { useTrack3dCollection } from "./useTrack3dCollection";

export type Track3DPanelProps = {
  trackId: number;
  trackName: string;
  backendUrl: string;
};

export default function Track3DPanel({
  trackId,
  trackName,
  backendUrl,
}: Track3DPanelProps) {
  const { collection, loading, error } = useTrack3dCollection(
    trackId,
    backendUrl,
    true,
  );

  const elevationRange = useMemo(
    () => computeElevationRangeM(collection),
    [collection],
  );

  return (
    <aside
      className="track-3d-panel"
      aria-label={`3D elevation preview for ${trackName}`}
    >
      <div className="track-3d-panel__header">
        <span className="track-3d-panel__title text-truncate">{trackName}</span>
        {elevationRange && !loading && !error ? (
          <span className="track-3d-panel__elev">
            {Math.round(elevationRange.minM)}–{Math.round(elevationRange.maxM)}{" "}
            m
          </span>
        ) : (
          <span className="track-3d-panel__badge">3D</span>
        )}
      </div>
      <div className="track-3d-panel__viewport">
        {loading && <div className="track-3d-panel__status">Loading…</div>}
        {error && !loading && (
          <div className="track-3d-panel__status track-3d-panel__status--error">
            {error}
          </div>
        )}
        {!loading && !error && <Track3DScene collection={collection} compact />}
      </div>
      <p className="track-3d-panel__hint">
        Hover to select a point · Drag to rotate · Scroll to zoom in/out
      </p>
    </aside>
  );
}
