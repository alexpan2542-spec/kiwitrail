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

type Track = {
  id: number;
  name: string;
  difficulty: string;
  completion_time: string;
  introduction: string;
  has_alerts: string;
  geom_geojson: GeoJsonObject;
  thumbnail_url: string;
  source_page_url: string;
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
  }, [data, map]);

  return null;
}

export default function HomePage2() {
  const [count, setCount] = useState(0);
  const position: [number, number] = [-36.8485, 174.7633];

  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<GeoJsonObject | null>(
    null,
  );

  const [selectedDifficulty, setSelectedDifficulty] = useState("Easiest");
  const [selectedRegionCode, setSelectedRegionCode] = useState("03");
  const [regionGeoJson, setRegionGeoJson] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

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
      // extract geometry only
      const geometry = data?.geometry ?? data;
      setRegionGeoJson(geometry);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/tracks/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficulty: selectedDifficulty,
          selected_area: regionGeoJson,
          limit: 3,
          offset: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();

      setTracks(data);
      setSelectedTrack(null);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSearch = () => {
    setShowResults(false);
  };

  useEffect(() => {
    console.log("regionGeoJson changed");
  }, [regionGeoJson]);

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
              key={selectedTrackId}
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
          <div className="card-header fw-bold">KiwiTrail</div>

          <div
            className="card-body"
            style={{
              overflowY: "auto",
              flexGrow: 1,
            }}
          >
            {!showResults ? (
              <>
                <h6 className="mb-3 flex-shrink-0">Search Tracks</h6>

                <form
                  onSubmit={handleSearch}
                  className="d-flex flex-column flex-grow-1 overflow-hidden"
                >
                  <div className="flex-grow-1 overflow-auto pe-1">
                    <label htmlFor="regions" className="form-label">
                      Where I want to hike
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
                    <button type="submit" className="btn btn-primary w-100">
                      Submit
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
                  <h5 className="mb-0">Track Results</h5>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleBackToSearch}
                  >
                    ← Return
                  </button>
                </div>

                <div className="flex-grow-1 overflow-auto pe-1">
                  {tracks.length === 0 ? (
                    <p className="text-muted small mb-0">No tracks found.</p>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {tracks.map((track) => (
                        <div
                          key={track.id}
                          className="card shadow-sm flex-shrink-0"
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSelectedTrackId(track.id);
                            setSelectedTrack(track.geom_geojson);
                          }}
                        >
                          {track.thumbnail_url && (
                            <img
                              src={track.thumbnail_url}
                              className="card-img-top"
                              alt={track.name}
                            />
                          )}

                          <div className="card-body">
                            <h5 className="card-title">{track.name}</h5>

                            <p className="card-text mb-2">
                              <strong>Difficulty:</strong> {track.difficulty}
                              <br />
                              <strong>Time:</strong> {track.completion_time}
                            </p>

                            {track.has_alerts && (
                              <span className="badge bg-warning text-dark mb-2">
                                Alerts
                              </span>
                            )}

                            <div className="d-flex gap-2 mt-2">
                              <a
                                href={track.source_page_url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View Details
                              </a>

                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTrackId(track.id);
                                  setSelectedTrack(track.geom_geojson);
                                }}
                              >
                                Show on Map
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
