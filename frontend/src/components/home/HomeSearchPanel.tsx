import type { ChangeEvent, FormEvent, RefObject } from "react";

export type HomeSearchPanelProps = {
  panelRef?: RefObject<HTMLDivElement | null>;
  /** Panel width in px; parent should match map offset math (e.g. 380 expanded, 56 collapsed). */
  width?: number;
  /** When true, form is hidden and a narrow strip with expand control is shown. */
  collapsed?: boolean;
  onExpandSearch?: () => void;
  selectedRegionCode: string;
  onRegionChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  selectedDifficulty: string;
  onSelectedDifficultyChange: (value: string) => void;
  showTracks: boolean;
  onShowTracksChange: (checked: boolean) => void;
  showHuts: boolean;
  onShowHutsChange: (checked: boolean) => void;
  showCampsites: boolean;
  onShowCampsitesChange: (checked: boolean) => void;
  showWeatherStation: boolean;
  onShowWeatherStationChange: (checked: boolean) => void;
  fuzzySearch: string;
  onFuzzySearchChange: (value: string) => void;
  isLoading: boolean;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function HomeSearchPanel({
  panelRef,
  width = 380,
  collapsed = false,
  onExpandSearch,
  selectedRegionCode,
  onRegionChange,
  selectedDifficulty,
  onSelectedDifficultyChange,
  showTracks,
  onShowTracksChange,
  showHuts,
  onShowHutsChange,
  showCampsites,
  onShowCampsitesChange,
  showWeatherStation,
  onShowWeatherStationChange,
  fuzzySearch,
  onFuzzySearchChange,
  isLoading,
  onSearchSubmit,
}: HomeSearchPanelProps) {
  if (collapsed) {
    return (
      <div
        className="home-search-panel bg-white"
        data-bs-theme="light"
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          width,
          height: "calc(100vh - 32px)",
          borderRadius: 0,
          boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 12,
          gap: 12,
          overflow: "hidden",
          transition: "width 0.2s ease",
        }}
        ref={panelRef}
      >
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary border-0"
          aria-label="Expand search panel"
          title="Expand search"
          onClick={onExpandSearch}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 16 16"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
            />
          </svg>
        </button>
        <svg
          className="text-success"
          style={{ width: "1.75rem", height: "1.75rem", flexShrink: 0 }}
          aria-hidden
        >
          <use href="/spritemap.svg#sprite-advanced-tramping-track" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="home-search-panel bg-white"
      data-bs-theme="light"
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        width,
        height: "calc(100vh - 32px)",
        borderRadius: 0,
        boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.2s ease",
      }}
      ref={panelRef}
    >
      <div
        className="card h-100 border-0 shadow-none"
        style={{
          borderRadius: 0,
          backgroundColor: "#fff",
        }}
      >
        <div className="card-header d-flex align-items-center gap-2">
          <svg
            className="text-success flex-shrink-0"
            style={{ width: "2em", height: "2em" }}
          >
            <use href="/spritemap.svg#sprite-advanced-tramping-track" />
          </svg>
          <span className="fw-bold">KiwiTrail</span>
          <span className="small text-muted fw-normal ms-auto">
            version 2026.5.21
          </span>
        </div>
        <div
          className="card-body"
          style={{
            overflowY: "auto",
            flexGrow: 1,
          }}
        >
          <form
            onSubmit={onSearchSubmit}
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
                  onChange={onRegionChange}
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
                  onChange={(e) => onSelectedDifficultyChange(e.target.value)}
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
                    onChange={(e) => onShowTracksChange(e.target.checked)}
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
                    onChange={(e) => onShowHutsChange(e.target.checked)}
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
                    onChange={(e) => onShowCampsitesChange(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="campsites">
                    Campsites
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="weather_station"
                    checked={showWeatherStation}
                    onChange={(e) =>
                      onShowWeatherStationChange(e.target.checked)
                    }
                  />
                  <label className="form-check-label" htmlFor="weather_station">
                    Weather Station
                  </label>
                </div>
                <div className="mb-3">
                  <label htmlFor="fuzzy_search" className="form-label">
                    Fuzzy Search
                  </label>
                  <input
                    id="fuzzy_search"
                    type="text"
                    className="form-control"
                    value={fuzzySearch}
                    onChange={(e) => onFuzzySearchChange(e.target.value)}
                    placeholder="Rough Place Name"
                  />
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
  );
}
