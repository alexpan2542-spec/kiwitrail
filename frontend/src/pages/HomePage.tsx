import { useEffect, useRef, useState } from "react";
import type { GeoJsonObject } from "geojson";

import "../App.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
} from "react-leaflet";

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

function FitBoundsToGeoJSON({ data }: { data: GeoJsonObject }) {
  const map = useMap();
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!geoJsonRef.current) return;

    const bounds = geoJsonRef.current.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds);
    }
  }, [data, map]);

  return <GeoJSON ref={geoJsonRef} data={data} />;
}

function HomePage() {
  const [count, setCount] = useState(0);
  const position: [number, number] = [-36.8485, 174.7633];

  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<GeoJsonObject | null>(
    null,
  );

  const [selectedDifficulty, setSelectedDifficulty] = useState("Easiest");
  const [selectedRegionCode, setSelectedRegionCode] = useState("03");
  const [regionGeoJson, setRegionGeoJson] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

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

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0">
      <header className="navbar navbar-dark bg-dark px-3">
        <div className="d-flex flex-column">
          <span className="navbar-brand mb-0 h1">KiwiTrail</span>
        </div>
      </header>
      <div className="row flex-grow-1 g-0 min-vh-0">
        <aside
          className="col-3 border-end bg-body-tertiary p-3 d-flex flex-column"
          style={{ height: "100%" }}
        >
          {!showResults ? (
            <>
              <h5 className="mb-3 flex-shrink-0">Search Tracks</h5>

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
                        onClick={() => setSelectedTrack(track.geom_geojson)}
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
        </aside>
        <main className="col-9 p-0" style={{ height: "100%" }}>
          <MapContainer
            center={[-41, 174]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {selectedTrack && <FitBoundsToGeoJSON data={selectedTrack} />}

            {regionGeoJson && (
              <GeoJSON key={selectedRegionCode} data={regionGeoJson} />
            )}
          </MapContainer>
        </main>
      </div>
    </div>
  );
}

export default HomePage;
