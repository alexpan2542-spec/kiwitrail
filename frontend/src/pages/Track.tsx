import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  Marker,
  Popup,
} from "react-leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { useParams } from "react-router-dom";
import type { GeoJsonObject } from "geojson";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Fix default Leaflet marker icon
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const backendUrl = import.meta.env.VITE_BACKEND_URL;

type TrackRoute = {
  id: number;
  name: string;
  seq: number;
  route_no: number;
  length_m: number;
  elev_min: number;
  elev_max: number;
  elevations: number[];

  geojson: {
    type: "Feature";
    properties: {
      id: number;
      name: string;
      seq: number;
    };
    geometry: {
      type: "LineString";
      coordinates: [number, number][];
    };
  };
};

type TrackInfo = {
  id: number;
  name: string;
  introduction?: string;
  region?: string;
  difficulty?: string;
  completion_time?: string;
  thumbnail_url?: string;
  source_page_url?: string;
  bookable?: string;
  facilities?: string;
  geom_geojson: GeoJsonObject;
};

function CenterToTrack({ items }: { items: TrackRoute[] }) {
  const map = useMap();

  useEffect(() => {
    if (!items.length) return;

    const coords = items[0]?.geojson?.geometry?.coordinates;
    if (!coords || !coords.length) return;

    const midIndex = Math.floor(coords.length / 2);
    const [lng, lat] = coords[midIndex];
    map.setView([lat, lng], 12);
  }, [items, map]);

  return null;
}

function FitBoundsToTrack({ geojson }: { geojson: GeoJsonObject | null }) {
  const map = useMap();

  useEffect(() => {
    if (!geojson) return;

    const layer = L.geoJSON(geojson as GeoJSON.GeoJsonObject);
    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [24, 24],
      });
    }
  }, [geojson, map]);

  return null;
}

export default function TrackLinesMapPage() {
  const [items, setItems] = useState<TrackRoute[]>([]);
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
  const [selectedRouteKey, setSelectedRouteKey] = useState<string | null>(null);
  const [hoveredRouteKey, setHoveredRouteKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { trackId } = useParams();

  const lineRefs = useRef<Record<string, L.Path>>({});

  useEffect(() => {
    async function loadData() {
      try {
        setError("");
        setSelectedRouteKey(null);
        setHoveredRouteKey(null);

        const [linesResponse, infoResponse] = await Promise.all([
          fetch(`${backendUrl}/track-routes/${trackId}`),
          fetch(`${backendUrl}/track-info/${trackId}`),
        ]);

        if (!linesResponse.ok) {
          throw new Error(`Track lines HTTP ${linesResponse.status}`);
        }

        if (!infoResponse.ok) {
          throw new Error(`Track info HTTP ${infoResponse.status}`);
        }

        const linesData: TrackRoute[] = await linesResponse.json();
        const infoData: TrackInfo = await infoResponse.json();

        setItems(linesData);
        setTrackInfo(infoData);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    }

    loadData();
  }, [trackId]);

  const selectedRoute = useMemo(() => {
    if (!selectedRouteKey) return null;

    return (
      items.find(
        (item, index) => `${item.id}-${item.seq}-${index}` === selectedRouteKey,
      ) ?? null
    );
  }, [items, selectedRouteKey]);

  const elevationChartData = useMemo(() => {
    if (!selectedRoute?.elevations?.length) return [];

    return selectedRoute.elevations.map((elevation, index) => ({
      point: index + 1,
      elevation,
    }));
  }, [selectedRoute]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <MapContainer
        center={[-42.7, 171.9]}
        zoom={9}
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://basemaps.linz.govt.nz/v1/tiles/topo-raster-gridded/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01kmpdda6jzktbg56tppczpak5" />

        {trackInfo && (
          <GeoJSON
            data={trackInfo.geom_geojson}
            style={{
              color: "#ff0000",
              weight: 3,
            }}
          />
        )}

        <FitBoundsToTrack geojson={trackInfo?.geom_geojson ?? null} />
        {items.map((item, index) => {
          const key = `${item.id}-${item.seq}-${index}`;
          const isHovered = hoveredRouteKey === key;
          const isSelected = selectedRouteKey === key;

          return (
            <GeoJSON
              key={`line-${key}`}
              data={item.geojson as GeoJSON.GeoJsonObject}
              style={{
                color: isHovered || isSelected ? "#ff69b4" : "#ff0000",
                weight: isHovered ? 8 : isSelected ? 7 : 3,
                opacity: isHovered || isSelected ? 1 : 0.9,
              }}
              onEachFeature={(_, layer) => {
                lineRefs.current[key] = layer as L.Path;
              }}
            />
          );
        })}

        {items.map((item, index) => {
          const coords = item.geojson?.geometry?.coordinates;
          if (!coords || !coords.length) return null;

          const midIndex = Math.floor(coords.length / 2);
          const [lng, lat] = coords[midIndex];

          const key = `${item.id}-${item.seq}-${index}`;

          return (
            <Marker
              key={`marker-${key}`}
              position={[lat, lng]}
              eventHandlers={{
                mouseover: (e) => {
                  setHoveredRouteKey(key);
                  e.target.openPopup();
                },
                mouseout: (e) => {
                  setHoveredRouteKey((current) =>
                    current === key ? null : current,
                  );
                  e.target.closePopup();
                },
                click: () => {
                  setSelectedRouteKey(key);
                },
              }}
            >
              <Popup autoClose={false} closeButton={false}>
                <div>
                  Name: {item.name}
                  <br />
                  Route: {item.route_no} / {items.length}
                  <br />
                  Length: {item.length_m} m
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {trackInfo && (
        <div
          className="detail-popup"
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            width: 320,
            maxHeight: "calc(100vh - 220px)",
            zIndex: 1000,
          }}
        >
          <div className="card" data-bs-theme="light">
            <div className="card-header fw-bold">{trackInfo.name}</div>

            <div
              className="card-body"
              style={{
                overflowY: "auto",
                maxHeight: "calc(100vh - 280px)",
              }}
            >
              {trackInfo.thumbnail_url && (
                <img
                  src={trackInfo.thumbnail_url}
                  alt={trackInfo.name}
                  className="card-img-top mb-3"
                  style={{ height: "160px", objectFit: "cover" }}
                />
              )}

              {trackInfo.introduction && (
                <p className="card-text small">{trackInfo.introduction}</p>
              )}

              {trackInfo.difficulty && (
                <p className="card-text small">
                  <strong>Difficulty:</strong> {trackInfo.difficulty}
                </p>
              )}

              {trackInfo.completion_time && (
                <p className="card-text small">
                  <strong>Duration:</strong> {trackInfo.completion_time}
                </p>
              )}

              {trackInfo.region && (
                <p className="card-text small">
                  <strong>Region:</strong> {trackInfo.region}
                </p>
              )}

              {trackInfo.bookable && (
                <p className="card-text small">
                  <strong>Bookable:</strong> {trackInfo.bookable}
                </p>
              )}

              {trackInfo.facilities && (
                <p className="card-text small">
                  <strong>Facilities:</strong> {trackInfo.facilities}
                </p>
              )}

              {trackInfo.source_page_url && (
                <a
                  href={trackInfo.source_page_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 text-decoration-underline mt-2 d-block"
                >
                  View Official Details →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedRoute && (
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            height: 190,
            zIndex: 1000,
            background: "white",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#666" }}>
                Route: {selectedRoute.route_no} / {items.length} | Length:{" "}
                {selectedRoute.length_m} m | Min: {selectedRoute.elev_min} m |
                Max: {selectedRoute.elev_max} m
              </div>
            </div>

            <button
              onClick={() => setSelectedRouteKey(null)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 20,
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {elevationChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={elevationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="point"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${Number(value) * 10}`}
                  label={{
                    value: "Distance (m)",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  tickFormatter={(value) => `${value}m`}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "",
                    position: "insideBottom",
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0)} m`,
                    "Elevation",
                  ]}
                  labelFormatter={(label) => `Distance ${label * 10} m`}
                />
                <Line
                  type="monotone"
                  dataKey="elevation"
                  stroke="#ff69b4"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: 130,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8f9fa",
                borderRadius: 6,
                color: "#666",
                fontSize: 14,
              }}
            >
              No elevation data
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: trackInfo ? 352 : 16,
            background: "white",
            padding: 12,
            zIndex: 1000,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
