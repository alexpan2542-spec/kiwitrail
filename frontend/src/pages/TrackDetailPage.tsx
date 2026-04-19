import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
  useMap,
  ZoomControl,
  LayersControl,
} from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import type { GeoJsonObject } from "geojson";
import L from "leaflet";

const { BaseLayer } = LayersControl;

const createTrackIcon = (spriteId: string) =>
  L.divIcon({
    html: `
      <svg width="28" height="28" class="text-primary">
        <use href="/spritemap.svg#${spriteId}" />
      </svg>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

const trackIconsByDifficulty: Record<string, L.DivIcon> = {
  Easiest: createTrackIcon("sprite-easiest-short-walk"),
  Easy: createTrackIcon("sprite-easy-walking-track"),
  Intermediate: createTrackIcon(
    "sprite-Intermediate-great-walk-or-easier-tramping-track",
  ),
  Advanced: createTrackIcon("sprite-advanced-tramping-track"),
  Expert: createTrackIcon("sprite-expert-route"),
};

const defaultTrackIcon = createTrackIcon("sprite-advanced-tramping-track");

const hutIcon = L.divIcon({
  html: `<svg width="28" height="28" class="text-primary">
      <use href="/spritemap.svg#sprite-hut" />
    </svg>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const campsiteIcon = L.divIcon({
  html: `<svg width="28" height="28" class="text-primary">
      <use href="/spritemap.svg#sprite-camping" />
    </svg>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

type MapItemType = "track" | "hut" | "campsite";

type MapItem = {
  id: number;
  name: string;
  introduction?: string;
  type: MapItemType;
  region?: string;
  bookable?: string;
  lat: number;
  lng: number;
  facilities?: string;
  difficulty?: string;
  completion_time?: string;
  thumbnail_url?: string;
  source_page_url?: string;
  geom_geojson?: GeoJsonObject;
};

function FitBoundsToGeoJSON({
  data,
  leftOffset,
  padding = 24,
}: {
  data: GeoJsonObject;
  leftOffset: number;
  padding?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!data) return;

    const layer = L.geoJSON(data as any);
    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        paddingTopLeft: [leftOffset + padding, padding],
        paddingBottomRight: [padding, padding],
      });
    }
  }, [data, map, leftOffset, padding]);

  return null;
}

const getIconByType = (type: string, difficulty?: string) => {
  if (type === "track") {
    return difficulty
      ? (trackIconsByDifficulty[difficulty] ?? defaultTrackIcon)
      : defaultTrackIcon;
  }

  if (type === "hut") return hutIcon;
  if (type === "campsite") return campsiteIcon;

  return defaultTrackIcon;
};

export default function HomePage2() {
  const [items, setItems] = useState<MapItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<GeoJsonObject | null>(
    null,
  );

  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedRegionCode, setSelectedRegionCode] = useState("");
  const [regionGeoJson, setRegionGeoJson] = useState<GeoJsonObject | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(false);

  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const detailsPanelRef = useRef<HTMLDivElement | null>(null);

  const [searchPanelWidth, setSearchPanelWidth] = useState(0);
  const [detailsPanelWidth, setDetailsPanelWidth] = useState(0);

  const [showTracks, setShowTracks] = useState(true);
  const [showHuts, setShowHuts] = useState(true);
  const [showCampsites, setShowCampsites] = useState(true);

  const totalLeftOffset =
    searchPanelWidth + (selectedItem ? detailsPanelWidth + 16 : 0);

  const handleRegionChange = async (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const regionCode = event.target.value;
    setSelectedRegionCode(regionCode);
    setRegionGeoJson(null);

    if (!regionCode) {
      setRegionGeoJson(null);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/regions/${regionCode}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch region polygon");
      }

      const data = await response.json();
      const geometry = data?.geometry ?? data;
      setRegionGeoJson(geometry);
    } catch (error) {
      console.error("Region fetch error:", error);
    }
  };

  const handleSearch = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setRegionGeoJson(null);
    setSelectedTrack(null);
    setSelectedTrackId(null);
    setSelectedItem(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/search/map", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficulty: selectedDifficulty,
          selected_area: regionGeoJson,
          show_tracks: showTracks,
          show_huts: showHuts,
          show_campsites: showCampsites,
          limit: 300,
          offset: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();
      setItems(data.items ?? []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
      setRegionGeoJson(regionGeoJson);
    }
  };

  const showTrack = async (item: MapItem) => {
    setSelectedItem(item);

    if (item.type === "track") {
      setSelectedTrack(item.geom_geojson ?? null);
      setSelectedTrackId(item.id);
    } else {
      setSelectedTrack(null);
      setSelectedTrackId(null);
    }
  };

  useEffect(() => {
    const updatePanelWidths = () => {
      if (searchPanelRef.current) {
        setSearchPanelWidth(searchPanelRef.current.offsetWidth);
      }
      if (detailsPanelRef.current) {
        setDetailsPanelWidth(detailsPanelRef.current.offsetWidth);
      } else {
        setDetailsPanelWidth(0);
      }
    };

    updatePanelWidths();
    window.addEventListener("resize", updatePanelWidths);

    return () => window.removeEventListener("resize", updatePanelWidths);
  }, [selectedItem]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <MapContainer
        center={[-41.2865, 170]}
        zoom={5}
        zoomControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <LayersControl position="topright">
          <BaseLayer name="Topo Maps">
            <TileLayer url="https://basemaps.linz.govt.nz/v1/tiles/topo-raster-gridded/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01kmpdda6jzktbg56tppczpak5" />
          </BaseLayer>
          <BaseLayer name="Aerial Imagery">
            <TileLayer url="https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01kmpdda6jzktbg56tppczpak5" />
          </BaseLayer>
          <BaseLayer checked name="CARTO Light">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          </BaseLayer>
          <BaseLayer name="Esri Satellite">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </BaseLayer>
        </LayersControl>
        <ZoomControl position="topright" />

        {selectedTrack && (
          <>
            <GeoJSON
              key={selectedTrackId ?? "selected-track"}
              data={selectedTrack}
              style={{
                color: "#ff0000",
                weight: 4,
              }}
            />
            <FitBoundsToGeoJSON
              data={selectedTrack}
              leftOffset={totalLeftOffset}
              padding={120}
            />
          </>
        )}

        {regionGeoJson && (
          <>
            <GeoJSON
              key={selectedRegionCode}
              data={regionGeoJson}
              style={() => ({
                weight: 5,
                opacity: 0.8,
                fill: false,
              })}
            />
            <FitBoundsToGeoJSON
              data={regionGeoJson}
              leftOffset={totalLeftOffset}
            />
          </>
        )}

        {items.map((item) => (
          <Marker
            key={`${item.type}-${item.id}`}
            position={[item.lat, item.lng]}
            icon={getIconByType(item.type, item.difficulty)}
            eventHandlers={{
              click: () => showTrack(item),
            }}
          />
        ))}
      </MapContainer>

      {/* Search panel */}
      <div
        ref={searchPanelRef}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          width: 380,
          height: "calc(100vh - 32px)",
          background: "#eee",
          borderRadius: 0,
          boxShadow: "0 6px 24px rgba(0,0,0,0.16)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          className="card h-100"
          style={{
            borderRadius: 0,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          <div className="card-header fw-bold">
            <svg
              className="text-success me-2"
              style={{ width: "2em", height: "2em" }}
            >
              <use href="/spritemap.svg#sprite-advanced-tramping-track" />
            </svg>
            KiwiTrail
          </div>

          <div
            className="card-body"
            style={{
              overflowY: "auto",
              flexGrow: 1,
            }}
          >
            <form
              onSubmit={handleSearch}
              className="d-flex flex-column flex-grow-1 overflow-hidden"
            >
              <div className="flex-grow-1 overflow-auto pe-1">
                <label htmlFor="regions" className="form-label">
                  Choose a region for hiking
                </label>
                <div className="mb-3">
                  <select
                    id="regions"
                    className="form-select"
                    value={selectedRegionCode}
                    onChange={handleRegionChange}
                  >
                    <option value="">All New Zealand</option>
                    <option value="01">Northland Region</option>
                    <option value="02">Auckland</option>
                    <option value="03">Waikato Region</option>
                    <option value="04">Bay of Plenty Region</option>
                    <option value="05">Gisborne Region</option>
                    <option value="06">Hawke's Bay Region</option>
                    <option value="07">Taranaki Region</option>
                    <option value="08">Manawatū-Whanganui Region</option>
                    <option value="09">Wellington Region</option>
                    <option value="12">West Coast Region</option>
                    <option value="13">Canterbury Region</option>
                    <option value="14">Otago Region</option>
                    <option value="15">Southland Region</option>
                    <option value="16">Tasman Region</option>
                    <option value="17">Nelson Region</option>
                    <option value="18">Marlborough Region</option>
                    <option value="99">Area Outside Region</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="difficulty" className="form-label">
                    Track Difficulty
                  </label>
                  <select
                    id="difficulty"
                    className="form-select"
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                  >
                    <option value="">Any Difficulty</option>
                    <option value="Easiest">Easiest</option>
                    <option value="Easy">Easy</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Choose what you want</label>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="tracks"
                      checked={showTracks}
                      onChange={(e) => setShowTracks(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="tracks">
                      Tracks
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="huts"
                      checked={showHuts}
                      onChange={(e) => setShowHuts(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="huts">
                      Huts
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="campsites"
                      checked={showCampsites}
                      onChange={(e) => setShowCampsites(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="campsites">
                      Campsites
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-top flex-shrink-0">
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isLoading}
                >
                  {isLoading ? "Searching..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Fixed details panel */}
      {selectedItem && (
        <div
          ref={detailsPanelRef}
          style={{
            position: "absolute",
            top: 16,
            left: 412, // 16 + 380 + 16 gap
            width: 380,
            height: "calc(100vh - 32px)",
            background: "#eee",
            borderRadius: 0,
            boxShadow: "0 6px 24px rgba(0,0,0,0.16)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            className="card h-100"
            style={{
              borderRadius: 0,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            <div className="card-header d-flex justify-content-between align-items-center fw-bold">
              <span>{selectedItem.name}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setSelectedItem(null);
                  setSelectedTrack(null);
                  setSelectedTrackId(null);
                }}
              >
                Close
              </button>
            </div>

            <div
              className="card-body"
              style={{
                overflowY: "auto",
              }}
            >
              {selectedItem.thumbnail_url && (
                <img
                  src={selectedItem.thumbnail_url}
                  alt={`${selectedItem.type} ${selectedItem.id}`}
                  className="card-img-top mb-3"
                  style={{ height: "220px", objectFit: "cover" }}
                />
              )}

              {selectedItem.introduction && (
                <p className="card-text small">{selectedItem.introduction}</p>
              )}

              {selectedItem.difficulty && (
                <p className="card-text small">
                  <strong>Difficulty:</strong> {selectedItem.difficulty}
                </p>
              )}

              {selectedItem.completion_time && (
                <p className="card-text small">
                  <strong>Duration:</strong> {selectedItem.completion_time}
                </p>
              )}

              {selectedItem.region && (
                <p className="card-text small">
                  <strong>Region:</strong> {selectedItem.region}
                </p>
              )}

              {selectedItem.bookable && (
                <p className="card-text small">
                  <strong>Bookable:</strong> {selectedItem.bookable}
                </p>
              )}

              {selectedItem.facilities && (
                <p className="card-text small">
                  <strong>Facilities:</strong> {selectedItem.facilities}
                </p>
              )}

              <p className="card-text small">
                <strong>Type:</strong> {selectedItem.type}
              </p>

              {selectedItem.source_page_url && (
                <a
                  href={selectedItem.source_page_url}
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
    </div>
  );
}
