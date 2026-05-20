import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
  useMap,
  ZoomControl,
  LayersControl,
  useMapEvents,
  Tooltip,
  CircleMarker,
} from "react-leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoJsonObject } from "geojson";
import L from "leaflet";

import {
  CommentsPanel,
  HomeAccountMenu,
  HomeLayersCollapseBridge,
  HomeSearchPanel,
  HomeSelectedItemPanel,
  WeatherWidgetPanel,
  type MapItem,
} from "../components";
import GazetteerResultsModal, {
  type GazetteerSearchHit,
} from "../components/home/GazetteerResultsModal";
import { HomeAuthProvider } from "../contexts/HomeAuthContext";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

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

/** Center pin for a gazetteer search circle (distinct from track/hut markers). */
const gazetteerCenterIcon = L.divIcon({
  className: "gazetteer-center-pin",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#0d6efd;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/** Region boundary and gazetteer circle use the same map styling. */
const areaSearchOverlayStyle: L.PathOptions = {
  color: "#0d6efd",
  weight: 2,
  opacity: 0.95,
  fillColor: "#0d6efd",
  fillOpacity: 0.14,
};

function parseGeoJsonField(v: unknown): GeoJsonObject | null {
  if (!v || typeof v !== "object" || v === null) return null;
  if (!("type" in v)) return null;
  const t = (v as { type: unknown }).type;
  if (typeof t !== "string") return null;
  return v as GeoJsonObject;
}

function boundsCenterFromGeoJson(
  g: GeoJsonObject,
): { lat: number; lng: number } | null {
  try {
    const bounds = L.geoJSON(g as any).getBounds();
    if (!bounds.isValid()) return null;
    const c = bounds.getCenter();
    return { lat: c.lat, lng: c.lng };
  } catch {
    return null;
  }
}

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

function parseGazetteerHit(raw: unknown): GazetteerSearchHit {
  if (typeof raw === "string") {
    return {
      id: null,
      name: raw,
      region: null,
      lat: null,
      lng: null,
      fuzzy_score: null,
      items_len: null,
      geojson: null,
    };
  }
  if (!raw || typeof raw !== "object") {
    return {
      id: null,
      name: String(raw),
      region: null,
      lat: null,
      lng: null,
      fuzzy_score: null,
      items_len: null,
      geojson: null,
    };
  }
  const o = raw as Record<string, unknown>;
  const name =
    typeof o.name === "string"
      ? o.name
      : typeof o.title === "string"
        ? o.title
        : "—";
  const regionVal = o.region;
  const region =
    typeof regionVal === "string"
      ? regionVal
      : regionVal != null
        ? String(regionVal)
        : null;
  const id = o.id;
  const idNorm = typeof id === "string" || typeof id === "number" ? id : null;
  const lat = typeof o.lat === "number" ? o.lat : null;
  const lng = typeof o.lng === "number" ? o.lng : null;
  const fuzzy_score = typeof o.fuzzy_score === "number" ? o.fuzzy_score : null;
  const items_len = typeof o.items_len === "number" ? o.items_len : null;
  const geojson = parseGeoJsonField(o.geojson);
  return {
    id: idNorm,
    name,
    region,
    lat,
    lng,
    fuzzy_score,
    items_len,
    geojson,
  };
}

export default function HomePage2() {
  const MAIN_PANEL_LEFT = 16;
  const PANEL_GAP = 16;
  const DETAIL_PANEL_WIDTH = 300;

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
  const [fuzzySearch, setFuzzySearch] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [gazetteerModalOpen, setGazetteerModalOpen] = useState(false);
  const [gazetteerResults, setGazetteerResults] = useState<
    GazetteerSearchHit[]
  >([]);
  const [gazetteerQuery, setGazetteerQuery] = useState("");
  /** Circle from last “load on map” gazetteer action + label at center. */
  const [gazetteerMapOverlay, setGazetteerMapOverlay] = useState<{
    circleGeoJson: GeoJsonObject;
    label: string;
    center: { lat: number; lng: number };
  } | null>(null);

  const detailsPanelRef = useRef<HTMLDivElement | null>(null);

  const SEARCH_PANEL_EXPANDED_W = 380;
  const SEARCH_PANEL_COLLAPSED_W = 56;
  const [searchPanelCollapsed, setSearchPanelCollapsed] = useState(false);
  const searchPanelWidth = searchPanelCollapsed
    ? SEARCH_PANEL_COLLAPSED_W
    : SEARCH_PANEL_EXPANDED_W;

  const [showTracks, setShowTracks] = useState(true);
  const [showHuts, setShowHuts] = useState(true);
  const [showCampsites, setShowCampsites] = useState(true);
  const [showWeatherStation, setShowWeatherStation] = useState(false);

  /** Weather iframe URL (station `source_page_url` or any item `weather_url`). */
  const [weatherEmbedUrl, setWeatherEmbedUrl] = useState<string | null>(null);
  /** Same slot as weather side panel; mutually exclusive with `weatherEmbedUrl` when open. */
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleRegionChange = async (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setGazetteerMapOverlay(null);
    setItems([]);
    setFuzzySearch("");
    setGazetteerModalOpen(false);
    setGazetteerResults([]);
    setGazetteerQuery("");
    setSelectedItem(null);
    setSelectedTrack(null);
    setSelectedTrackId(null);
    setWeatherEmbedUrl(null);
    setCommentsOpen(false);
    setSearchPanelCollapsed(false);

    const regionCode = event.target.value;
    setSelectedRegionCode(regionCode);
    setRegionGeoJson(null);

    if (!regionCode) {
      setRegionGeoJson(null);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/regions/${regionCode}`);
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
    const regionSnapshot = regionGeoJson;
    setRegionGeoJson(null);
    setGazetteerMapOverlay(null);
    setSelectedTrack(null);
    setSelectedItem(null);
    setSearchPanelCollapsed(false);
    setCommentsOpen(false);
    setGazetteerModalOpen(false);

    const trimmedFuzzy = fuzzySearch.trim();
    const requestBody = {
      difficulty: selectedDifficulty,
      selected_area: regionSnapshot,
      show_tracks: showTracks,
      show_huts: showHuts,
      show_campsites: showCampsites,
      show_weather_station: showWeatherStation,
      fuzzy_search: trimmedFuzzy,
      limit: 300,
      offset: 0,
    };

    try {
      if (!trimmedFuzzy) {
        const response = await fetch(`${backendUrl}/search/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data = await response.json();

        const rawItems = (data.items ?? []) as Array<
          MapItem & { weahter_url?: string }
        >;
        setItems(
          rawItems.map(({ weahter_url, ...rest }) => ({
            ...rest,
            weather_url: rest.weather_url ?? weahter_url,
          })),
        );
      } else {
        const response = await fetch(`${backendUrl}/search/gazetteer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error("Gazetteer search request failed");
        }

        const data = await response.json();
        const rawItems = (data.items ?? []) as unknown[];
        setGazetteerResults(rawItems.map(parseGazetteerHit));
        setGazetteerQuery(trimmedFuzzy);
        setGazetteerModalOpen(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
      setRegionGeoJson(regionSnapshot);
    }
  };

  const loadItemsInGazetteerCircle = useCallback(
    async (hit: GazetteerSearchHit) => {
      if (!hit.geojson) return;
      setIsLoading(true);
      setCommentsOpen(false);
      setSelectedItem(null);
      setSelectedTrack(null);
      setSelectedTrackId(null);
      setWeatherEmbedUrl(null);
      try {
        const response = await fetch(`${backendUrl}/search/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            difficulty: selectedDifficulty,
            selected_area: hit.geojson,
            show_tracks: showTracks,
            show_huts: showHuts,
            show_campsites: showCampsites,
            show_weather_station: showWeatherStation,
            fuzzy_search: "",
            limit: 300,
            offset: 0,
          }),
        });

        if (!response.ok) {
          throw new Error("Search items in circle failed");
        }

        const data = await response.json();

        const rawItems = (data.items ?? []) as Array<
          MapItem & { weahter_url?: string }
        >;
        setItems(
          rawItems.map(({ weahter_url, ...rest }) => ({
            ...rest,
            weather_url: rest.weather_url ?? weahter_url,
          })),
        );

        const center =
          hit.lat != null && hit.lng != null
            ? { lat: hit.lat, lng: hit.lng }
            : boundsCenterFromGeoJson(hit.geojson);
        if (!center) throw new Error("Could not determine circle center");

        setGazetteerMapOverlay({
          circleGeoJson: hit.geojson,
          label: hit.name,
          center,
        });
        setGazetteerModalOpen(false);
        setSearchPanelCollapsed(false);
      } catch (error) {
        console.error("Search items in gazetteer circle:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedDifficulty,
      showTracks,
      showHuts,
      showCampsites,
      showWeatherStation,
    ],
  );

  function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
    useMapEvents({
      click: () => {
        onMapClick();
      },
    });

    return null;
  }

  const showDetails = async (
    item: MapItem,
    options?: { replaceMapItems?: boolean },
  ) => {
    try {
      // Map name labels are drawn on markers in `items`; ensure the item has a marker.
      if (options?.replaceMapItems) {
        setItems([item]);
      } else {
        setItems((prev) => {
          const exists = prev.some(
            (i) => i.type === item.type && i.id === item.id,
          );
          if (exists) return prev;
          return [...prev, item];
        });
      }
      setSelectedTrack(null);
      setSelectedTrackId(null);
      setSelectedItem(item);
      setSearchPanelCollapsed(true);
      setCommentsOpen(false);
      if (item.type === "track") {
        console.log(item.geom_geojson);
        setSelectedTrack(item.geom_geojson ?? null);
        setSelectedTrackId(item.id);
      }
      if (item.type === "weather_station" && item.source_page_url) {
        setWeatherEmbedUrl(item.source_page_url);
      } else {
        setWeatherEmbedUrl(null);
      }
    } catch (error) {
    } finally {
    }
  };

  function MapStatus() {
    const map = useMap();
    /** When set, readout follows cursor at this container pixel (stays correct while panning). */
    const lastContainerPointRef = useRef<{ x: number; y: number } | null>(null);

    const [position, setPosition] = useState(() => {
      const c = map.getCenter();
      return { lat: c.lat, lng: c.lng, zoom: map.getZoom() };
    });

    const syncFromPointerOrCenter = useCallback(() => {
      const zoom = map.getZoom();
      const pt = lastContainerPointRef.current;
      if (pt) {
        const ll = map.containerPointToLatLng(L.point(pt.x, pt.y));
        setPosition({ lat: ll.lat, lng: ll.lng, zoom });
      } else {
        const c = map.getCenter();
        setPosition({ lat: c.lat, lng: c.lng, zoom });
      }
    }, [map]);

    useMapEvents({
      mousemove: (e) => {
        const c = map.mouseEventToContainerPoint(e.originalEvent);
        lastContainerPointRef.current = { x: c.x, y: c.y };
        setPosition({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          zoom: map.getZoom(),
        });
      },
      mouseout: () => {
        lastContainerPointRef.current = null;
        const center = map.getCenter();
        setPosition({
          lat: center.lat,
          lng: center.lng,
          zoom: map.getZoom(),
        });
      },
      move: syncFromPointerOrCenter,
      zoom: syncFromPointerOrCenter,
    });

    return (
      <div
        className="kiwi-map-coords"
        role="status"
        aria-live="polite"
        aria-label={`Latitude ${position.lat.toFixed(4)}, longitude ${position.lng.toFixed(4)}, zoom ${position.zoom}`}
      >
        <span className="kiwi-map-coords__field">
          Lat&nbsp;{position.lat.toFixed(4)}°
        </span>
        <span className="kiwi-map-coords__sep" aria-hidden>
          ·
        </span>
        <span className="kiwi-map-coords__field">
          Lon&nbsp;{position.lng.toFixed(4)}°
        </span>
        <span className="kiwi-map-coords__sep" aria-hidden>
          ·
        </span>
        <span className="kiwi-map-coords__field">z&nbsp;{position.zoom}</span>
      </div>
    );
  }

  function FlyToItem({
    item,
    zoom = 12,
    leftPanelWidth = 0,
    padding = 24,
  }: {
    item: { lat: number; lng: number } | null;
    zoom?: number;
    leftPanelWidth?: number;
    padding?: number;
  }) {
    const map = useMap();

    useEffect(() => {
      if (!item) return;

      // Convert lat/lng to pixel point
      const point = map.project([item.lat, item.lng], zoom);

      // Shift right by half panel width + padding
      const offsetX = leftPanelWidth / 2 + padding;

      const adjustedPoint = point.subtract([offsetX, 0]);

      // Convert back to lat/lng
      const adjustedLatLng = map.unproject(adjustedPoint, zoom);

      map.flyTo(adjustedLatLng, zoom, {
        duration: 0.8,
      });
    }, [item, map, zoom, leftPanelWidth, padding]);

    return null;
  }

  const sidePanelLeft =
    MAIN_PANEL_LEFT +
    searchPanelWidth +
    PANEL_GAP +
    DETAIL_PANEL_WIDTH +
    PANEL_GAP;

  return (
    <HomeAuthProvider>
      <div
        className="kiwitrail-home position-relative"
        style={{ width: "100vw", height: "100vh" }}
      >
        <HomeAccountMenu
          backendUrl={backendUrl}
          onShowFavouriteOnMap={(item) => {
            void showDetails(item, { replaceMapItems: true });
          }}
        />
        <MapContainer
          center={[-41.2865, 170]}
          zoom={5}
          zoomControl={false}
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <LayersControl position="topright">
            <HomeLayersCollapseBridge />
            <BaseLayer checked name="Topo Maps">
              <TileLayer url="https://basemaps.linz.govt.nz/v1/tiles/topo-raster-gridded/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01kmpdda6jzktbg56tppczpak5"></TileLayer>
            </BaseLayer>
            <BaseLayer name="Aerial Imagery">
              <TileLayer url="https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=c01kmpdda6jzktbg56tppczpak5"></TileLayer>
            </BaseLayer>
            <BaseLayer name="OSM">
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </BaseLayer>
            <BaseLayer name="CARTO Light">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            </BaseLayer>
            <BaseLayer name="Esri Satellite">
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            </BaseLayer>
          </LayersControl>
          <ZoomControl position="topright" />
          <MapStatus />
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
            </>
          )}

          {regionGeoJson && !gazetteerMapOverlay && (
            <>
              <GeoJSON
                key={selectedRegionCode}
                data={regionGeoJson}
                style={areaSearchOverlayStyle}
              />
              <FitBoundsToGeoJSON
                data={regionGeoJson}
                leftPanelWidth={searchPanelWidth}
              />
            </>
          )}
          {gazetteerMapOverlay && (
            <>
              <GeoJSON
                key="gazetteer-circle"
                data={gazetteerMapOverlay.circleGeoJson}
                style={areaSearchOverlayStyle}
              />
              <FitBoundsToGeoJSON
                data={gazetteerMapOverlay.circleGeoJson}
                leftPanelWidth={searchPanelWidth}
              />
              <Marker
                position={[
                  gazetteerMapOverlay.center.lat,
                  gazetteerMapOverlay.center.lng,
                ]}
                icon={gazetteerCenterIcon}
                interactive
              >
                <Tooltip
                  direction="top"
                  offset={[0, -12]}
                  opacity={1}
                  permanent
                >
                  {gazetteerMapOverlay.label}
                </Tooltip>
              </Marker>
            </>
          )}
          {/* 视觉定位圈：当有选中项时显示 */}
          {selectedItem &&
            (selectedItem.type === "track" ||
              selectedItem.type === "hut" ||
              selectedItem.type === "campsite") && (
              <CircleMarker
                center={[selectedItem.lat, selectedItem.lng]}
                pathOptions={{
                  color: "#28a745",
                  fillColor: "#28a745",
                  fillOpacity: 0.4,
                  weight: 2,
                  dashArray: "5, 10",
                }}
                radius={40}
                interactive={false}
              />
            )}
          <MapClickHandler
            onMapClick={() => {
              setSelectedItem(null);
              setSelectedTrack(null);
              setSelectedTrackId(null);
              setRegionGeoJson(null);
              setGazetteerMapOverlay(null);
              setWeatherEmbedUrl(null);
              setSearchPanelCollapsed(false);
              setCommentsOpen(false);
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
          {selectedItem && (
            <FlyToItem
              item={selectedItem}
              zoom={10}
              leftPanelWidth={searchPanelWidth}
            />
          )}
        </MapContainer>
        <HomeSearchPanel
          width={searchPanelWidth}
          collapsed={searchPanelCollapsed}
          onExpandSearch={() => setSearchPanelCollapsed(false)}
          selectedRegionCode={selectedRegionCode}
          onRegionChange={handleRegionChange}
          selectedDifficulty={selectedDifficulty}
          onSelectedDifficultyChange={setSelectedDifficulty}
          showTracks={showTracks}
          onShowTracksChange={setShowTracks}
          showHuts={showHuts}
          onShowHutsChange={setShowHuts}
          showCampsites={showCampsites}
          onShowCampsitesChange={setShowCampsites}
          showWeatherStation={showWeatherStation}
          onShowWeatherStationChange={setShowWeatherStation}
          fuzzySearch={fuzzySearch}
          onFuzzySearchChange={setFuzzySearch}
          isLoading={isLoading}
          onSearchSubmit={handleSearch}
        />
        {selectedItem && (
          <HomeSelectedItemPanel
            item={selectedItem}
            panelRef={detailsPanelRef}
            top={PANEL_GAP}
            left={MAIN_PANEL_LEFT + searchPanelWidth + PANEL_GAP}
            width={DETAIL_PANEL_WIDTH}
            backendUrl={backendUrl}
            onWeatherClick={(url) => {
              setCommentsOpen(false);
              setWeatherEmbedUrl((prev) => (prev === url ? null : url));
            }}
            onCommentsClick={() => {
              setCommentsOpen((prev) => {
                if (prev) return false;
                setWeatherEmbedUrl(null);
                return true;
              });
            }}
          />
        )}
        {weatherEmbedUrl && !commentsOpen && (
          <WeatherWidgetPanel
            top={16}
            left={sidePanelLeft}
            sourcePageUrl={weatherEmbedUrl}
          />
        )}
        {commentsOpen && selectedItem && (
          <CommentsPanel
            top={16}
            left={sidePanelLeft}
            item={selectedItem}
            backendUrl={backendUrl}
          />
        )}
        <GazetteerResultsModal
          open={gazetteerModalOpen}
          onClose={() => setGazetteerModalOpen(false)}
          results={gazetteerResults}
          query={gazetteerQuery}
          isLoading={isLoading}
          onLoadItemsOnMap={loadItemsInGazetteerCircle}
        />
      </div>
    </HomeAuthProvider>
  );
}
