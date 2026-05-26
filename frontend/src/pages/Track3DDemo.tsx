import { useMemo, useState } from "react";
import Track3DModal from "../components/track/Track3DModal";
import type { Track3DRoute } from "../components/track/Track3DModal";

/**
 * Standalone demo route for the 3D track viewer.
 *
 * Renders the same `Track3DModal` component used from the real Track page
 * but feeds it synthetic (lng, lat, elevation) data so the visual can be
 * inspected without a backend running. No production code depends on this
 * page; it is a visual sandbox only.
 */

const CENTER_LNG = 170.135;
const CENTER_LAT = -43.595;

function trailShape(
  t: number,
): { lng: number; lat: number; elev: number } {
  const lng =
    CENTER_LNG +
    Math.sin(t * Math.PI * 2.2) * 0.045 +
    (t - 0.5) * 0.05;
  const lat =
    CENTER_LAT +
    Math.cos(t * Math.PI * 1.7) * 0.035 +
    (t - 0.5) * 0.04;
  const climb = Math.sin(t * Math.PI) ** 1.4;
  const ridges = Math.sin(t * Math.PI * 5.5) * 0.06;
  const noise = Math.sin(t * 47.1) * 0.012;
  const elev = 760 + (2120 - 760) * (climb + ridges + noise);
  return { lng, lat, elev };
}

function makeRoute(
  id: number,
  seq: number,
  name: string,
  startT: number,
  endT: number,
): Track3DRoute {
  const n = 180;
  const coordinates: [number, number][] = [];
  const elevations: number[] = [];

  let minE = Infinity;
  let maxE = -Infinity;

  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const t = startT + (endT - startT) * u;
    const { lng, lat, elev } = trailShape(t);
    coordinates.push([lng, lat]);
    elevations.push(Math.round(elev));
    if (elev < minE) minE = elev;
    if (elev > maxE) maxE = elev;
  }

  return {
    id,
    name,
    seq,
    route_no: seq,
    length_m: Math.round((endT - startT) * 14000),
    elev_min: Math.round(minE),
    elev_max: Math.round(maxE),
    elevations,
    coordinates,
  };
}

export default function Track3DDemo() {
  const [open, setOpen] = useState(true);

  const routes = useMemo<Track3DRoute[]>(
    () => [
      makeRoute(1, 1, "Lower Valley Approach", 0.0, 0.28),
      makeRoute(2, 2, "Bush Edge Climb", 0.28, 0.52),
      makeRoute(3, 3, "Ridge Traverse", 0.52, 0.78),
      makeRoute(4, 4, "Summit Spur", 0.78, 1.0),
    ],
    [],
  );

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #1c2a3a 0%, #243549 50%, #2a3b50 100%)",
        color: "#e8eef6",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", padding: 24 }}>
        <h1 style={{ marginBottom: 12 }}>3D Track Viewer — Demo</h1>
        <p style={{ opacity: 0.8, marginBottom: 20, maxWidth: 480 }}>
          Synthetic mountain track data, rendered through the same{" "}
          <code>Track3DModal</code> component used by the live{" "}
          <code>/track/:trackId</code> page.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: "#ff69b4",
            color: "#fff",
            border: "none",
            fontWeight: 700,
            padding: "10px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Open 3D Viewer
        </button>
      </div>

      <Track3DModal
        open={open}
        onClose={() => setOpen(false)}
        trackName="Demo Alpine Track"
        routes={routes}
        highlightRouteKey="3-3-2"
      />
    </div>
  );
}
