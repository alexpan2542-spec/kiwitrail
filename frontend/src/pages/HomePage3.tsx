import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import type { GeoJsonObject } from "geojson";
import L from "leaflet";

const trackIcon = L.divIcon({
  html: `
    <svg width="28" height="28" class="text-success">
      <use href="/spritemap.svg#sprite-advanced-tramping-track" />
    </svg>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const createTrackIcon = (spriteId: string) =>
  L.divIcon({
    html: `
      <svg width="28" height="28" class="text-success">
        <use href="/spritemap.svg#${spriteId}" />
      </svg>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

const trackIconsByDifficulty: Record<string, L.DivIcon> = {
  Easiest: createTrackIcon("sprite-easiest-tramping-track"),
  Easy: createTrackIcon("sprite-easy-walking-track"),
  Intermediate: createTrackIcon("sprite-intermediate-tramping-track"),
  Advanced: createTrackIcon("sprite-advanced-tramping-track"),
  Expert: createTrackIcon("sprite-expert-route"),
};

const defaultTrackIcon = createTrackIcon("sprite-advanced-tramping-track");

const hutIcon = L.divIcon({
  html: `<svg width="28" height="28" class="text-success">
      <use href="/spritemap.svg#sprite-hut" />
    </svg>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const campsiteIcon = L.divIcon({
  html: `<svg width="28" height="28" class="text-success">
      <use href="/spritemap.svg#sprite-camping" />
    </svg>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

type MapItemType = "track" | "hut" | "campsite";

type MapItem = {
  id: number;
  name: string;
  introduction?: string;
  type: MapItemType;
  retion?: string;
  lat: number;
  lng: number;
  facilities?: string;
  difficulty?: string;
  completion_time?: string;
  thumbnail_url?: string;
  geom_geojson?: string;
};

type TrackDetail = {
  id: number;
  name?: string;
  difficulty?: string;
  completion_time?: string;
  introduction?: string;
  has_alerts?: string;
  thumbnail_url?: string;
  source_page_url?: string;
  geom_geojson?: GeoJsonObject;
  geometry?: string;
};

type HutDetail = {
  id: number;
  name?: string;
  region?: string;
  place?: string;
  bookable?: string;
  facilities?: string;
  source_page_url?: string;
};

type CampsiteDetail = {
  id: number;
  name?: string;
  region?: string;
  campsite_category?: string;
  number_of_powered_sites?: number;
  number_of_unpowered_sites?: number;
  bookable?: string;
  facilities?: string;
  source_page_url?: string;
};

function FitBoundsToGeoJSON({
  data,
  leftPanelWidth,
}: {
  data: GeoJsonObject;
  leftPanelWidth: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!data) return;

    const layer = L.geoJSON(data as any);
    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        paddingTopLeft: [leftPanelWidth + 24, 24],
        paddingBottomRight: [24, 24],
      });
    }
  }, [data, map, leftPanelWidth]);

  return null;
}

const getIconByType = (type: string) => {
  if (type === "track") return trackIcon;
  if (type === "hut") return hutIcon;
  if (type === "campsite") return campsiteIcon;
  return trackIcon;
};

export default function HomePage2() {
  const [items, setItems] = useState<MapItem[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<GeoJsonObject | null>(
    null,
  );

  const [selectedDifficulty, setSelectedDifficulty] = useState("Easiest");
  const [selectedRegionCode, setSelectedRegionCode] = useState("");
  const [regionGeoJson, setRegionGeoJson] = useState<GeoJsonObject | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelWidth, setPanelWidth] = useState(0);

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

    try {
      const response = await fetch("http://127.0.0.1:8000/search/map", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficulty: selectedDifficulty,
          selected_area: regionGeoJson,
          limit: 300,
          offset: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();

      setItems(data.items ?? []);
      setSelectedTrack(null);
      setSelectedTrackId(null);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItemDetail = async (item: MapItem) => {
    setDetailLoading(true);

    try {
      let endpoint = "";

      if (item.type === "track") {
        endpoint = `http://127.0.0.1:8000/tracks/${item.id}`;
      } else if (item.type === "hut") {
        endpoint = `http://127.0.0.1:8000/huts/${item.id}`;
      } else {
        endpoint = `http://127.0.0.1:8000/campsites/${item.id}`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${item.type} details`);
      }

      const detail = await response.json();

      if (item.type === "track") {
        const geometry =
          detail?.geom_geojson ??
          (detail?.geometry ? JSON.parse(detail.geometry) : null);

        setSelectedTrackId(item.id);
        setSelectedTrack(geometry ?? null);
      } else {
        setSelectedTrackId(null);
        setSelectedTrack(null);
      }
    } catch (error) {
      console.error("Detail fetch error:", error);

      setSelectedTrack(null);
      setSelectedTrackId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const updatePanelWidth = () => {
      if (panelRef.current) {
        setPanelWidth(panelRef.current.offsetWidth);
      }
    };

    updatePanelWidth();
    window.addEventListener("resize", updatePanelWidth);

    return () => window.removeEventListener("resize", updatePanelWidth);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <MapContainer
        center={[-41.2865, 174.7762]}
        zoom={5}
        zoomControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="© CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="topright" />

        {selectedTrack && (
          <>
            <GeoJSON
              key={selectedTrackId ?? "selected-track"}
              data={selectedTrack}
              style={{
                color: "#ff3b3b",
                weight: 4,
              }}
            />
            <FitBoundsToGeoJSON
              data={selectedTrack}
              leftPanelWidth={panelWidth}
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
              leftPanelWidth={panelWidth}
            />
          </>
        )}

        {items.map((item) => (
          <Marker
            key={`${item.type}-${item.id}`}
            position={[item.lat, item.lng]}
            icon={getIconByType(item.type)}
            eventHandlers={{
              click: () => fetchItemDetail(item),
            }}
          >
            <Popup className="custom-popup" minWidth={220} closeButton={false}>
              <div className="card" data-bs-theme="light">
                {item.thumbnail_url && (
                  <img
                    src={item.thumbnail_url}
                    alt={`${item.type} ${item.id}`}
                    className="card-img-top"
                    style={{ height: "120px", objectFit: "cover" }}
                  />
                )}

                <div className="card-body">
                  <h6 className="card-title">{item.name}</h6>
                  {item.introduction && (
                    <p className="card-text small">{item.introduction}</p>
                  )}
                  {item.difficulty && (
                    <p className="card-text small">
                      <strong>Difficulty:</strong> {item.difficulty}
                    </p>
                  )}

                  {item.completion_time && (
                    <p className="card-text small">
                      <strong>Duration:</strong> {item.completion_time}
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div
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
        ref={panelRef}
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
                  <label htmlFor="iwanttohave" className="form-label">
                    I also want to have
                  </label>
                  <input className="form-control" id="iwanttohave" />
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
    </div>
  );
}
