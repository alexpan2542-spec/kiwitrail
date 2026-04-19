import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import type { GeoJsonObject } from "geojson";

export default function MissingCoverageMapPage() {
  const [geojson, setGeojson] = useState<GeoJsonObject | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGeojson() {
      try {
        setError("");

        const response = await fetch("http://127.0.0.1:8000/map");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setGeojson(data);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Failed to load map data");
      }
    }

    loadGeojson();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <MapContainer
        center={[-41.0, 172.0]}
        zoom={6}
        zoomControl={true}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://basemaps.linz.govt.nz/v1/tiles/topo-raster-gridded/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01kmpdda6jzktbg56tppczpak5" />

        {geojson && (
          <GeoJSON
            data={geojson}
            style={{
              color: "#ff0000",
              weight: 2,
              fillColor: "#ff69b4",
              fillOpacity: 0.4,
            }}
          />
        )}
      </MapContainer>

      {error && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: "white",
            padding: 12,
            zIndex: 1000,
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
