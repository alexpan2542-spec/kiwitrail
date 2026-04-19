import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
  ZoomControl,
  LayersControl,
  useMapEvents,
  Tooltip,
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
    popupAnchor: [0, -28],
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
  popupAnchor: [0, -28],
});

const campsiteIcon = L.divIcon({
  html: `<svg width="28" height="28" class="text-primary">
      <use href="/spritemap.svg#sprite-camping" />
    </svg>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const weatherStationIcon = new L.Icon({
  iconUrl: "/niwa.png",
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
  leftPanelWidth,
  padding = 24,
}: {
  data: GeoJsonObject;
  leftPanelWidth: number;
  padding?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!data) return;

    const layer = L.geoJSON(data as any);
    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        paddingTopLeft: [leftPanelWidth + padding, padding],
        paddingBottomRight: [padding, padding],
      });
    }
  }, [data, map, leftPanelWidth]);

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
  if (type === "weather_station") return weatherStationIcon;

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
  const [regionGeoJson1, setRegionGeoJson1] = useState<GeoJsonObject | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const detailsPanelRef = useRef<HTMLDivElement | null>(null);
  const [panelWidth, setPanelWidth] = useState(0);

  const [showTracks, setShowTracks] = useState(true);
  const [showHuts, setShowHuts] = useState(true);
  const [showCampsites, setShowCampsites] = useState(true);
  const [showWeatherStation, setShowWeatherStation] = useState(false);

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
          show_weather_station: showWeatherStation,
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

  function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
    useMapEvents({
      click: () => {
        onMapClick();
      },
    });

    return null;
  }

  const showDetails = async (item: MapItem) => {
    try {
      setSelectedTrack(null);
      setSelectedTrackId(null);
      setSelectedItem(item);
      if (item.type === "track") {
        console.log(item.geom_geojson);
        setSelectedTrack(item.geom_geojson ?? null);
        setSelectedTrackId(item.id);
      }
    } catch (error) {
    } finally {
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
        center={[-41.2865, 170]}
        zoom={5}
        zoomControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Topo Maps">
            <TileLayer url="https://basemaps.linz.govt.nz/v1/tiles/topo-raster-gridded/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01kmpdda6jzktbg56tppczpak5"></TileLayer>
          </BaseLayer>
          <BaseLayer name="Aerial Imagery">
            <TileLayer url="https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01kmpdda6jzktbg56tppczpak5"></TileLayer>
          </BaseLayer>
          <BaseLayer name="CARTO Light">
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
              leftPanelWidth={panelWidth}
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
              leftPanelWidth={panelWidth}
            />
          </>
        )}

        <MapClickHandler
          onMapClick={() => {
            setSelectedItem(null);
            setSelectedTrack(null);
            setSelectedTrackId(null);
            setRegionGeoJson1(regionGeoJson);
            setRegionGeoJson(null);
            setRegionGeoJson(regionGeoJson1);
          }}
        />
        {items.map((item) => (
          <Marker
            key={`${item.type}-${item.id}`}
            position={[item.lat, item.lng]}
            icon={getIconByType(item.type, item.difficulty)}
            eventHandlers={{
              click: () => {
                showDetails(item);
              },
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -20]}
              opacity={1}
              sticky={false}
            >
              {item.name}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      <div style={{ display: "flex" }}>
        <div style={{ width: 380 }}>Main Panel</div>

        {selectedItem && (
          <div style={{ width: 300, marginLeft: 16 }}>Detail Panel</div>
        )}
      </div>
    </div>
  );
}
