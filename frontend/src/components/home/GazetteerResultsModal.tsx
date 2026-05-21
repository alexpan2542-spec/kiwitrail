import type { GeoJsonObject } from "geojson";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

const MODAL_Z = 1200;

/** Normalized row from `/search/gatezzer` (backend may add fields). */
export type GazetteerSearchHit = {
  id: string | number | null;
  name: string;
  region: string | null;
  lat: number | null;
  lng: number | null;
  fuzzy_score: number | null;
  items_len: number | null;
  /** Search circle geometry for `/search/items` with `selected_area`. */
  geojson: GeoJsonObject | null;
};

export type GazetteerResultsModalProps = {
  open: boolean;
  onClose: () => void;
  results: GazetteerSearchHit[];
  query: string;
  isLoading?: boolean;
  /** Load map items inside this hit’s circle (same filters as the main search form). */
  onLoadItemsOnMap?: (hit: GazetteerSearchHit) => void | Promise<void>;
};

function formatScore(score: number | null): string {
  if (score === null || Number.isNaN(score)) return "—";
  return `${score}%`;
}

function formatItemsLen(len: number | null): string {
  if (len === null || Number.isNaN(len)) return "—";
  return `${len}`;
}

export default function GazetteerResultsModal({
  open,
  onClose,
  results,
  query,
  isLoading = false,
  onLoadItemsOnMap,
}: GazetteerResultsModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="register-modal__backdrop"
      style={{ zIndex: MODAL_Z }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="register-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="register-modal__content card border-0 bg-white"
          data-bs-theme="light"
        >
          <div className="card-header fw-bold d-flex align-items-center border-bottom py-3 bg-white">
            <h2 className="fs-5 mb-0 flex-grow-1 text-truncate" id={titleId}>
              Place matches{query ? ` — “${query}”` : ""}
            </h2>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            />
          </div>
          <div
            className="card-body py-3"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            {results.length === 0 ? (
              <p className="text-muted mb-0 small">No matching names.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {results.map((row, i) => (
                  <li
                    key={`${row.id ?? "x"}-${i}`}
                    className="list-group-item px-0 border-0 border-bottom small py-3"
                  >
                    <div className="fw-medium">{row.name}</div>
                    {row.region ? (
                      <div className="text-muted mt-1">{row.region}</div>
                    ) : null}
                    <div className="d-flex flex-wrap gap-3 mt-2 text-muted">
                      <span>
                        Matching rate:{" "}
                        <span className="text-body fw-medium">
                          {formatScore(row.fuzzy_score)}
                        </span>
                      </span>
                      <span>
                        Items Found:{" "}
                        <span className="text-body fw-medium">
                          {formatItemsLen(row.items_len)}
                        </span>
                      </span>
                    </div>
                    {onLoadItemsOnMap ? (
                      <div className="mt-2">
                        {row.geojson ? (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0"
                            disabled={isLoading}
                            onClick={() => void onLoadItemsOnMap(row)}
                          >
                            Shown on the Map
                          </button>
                        ) : (
                          <span className="text-muted small">No Data</span>
                        )}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
