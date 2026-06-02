import type { FeatureCollection, LineString } from "geojson";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import Track3DScene from "./Track3DScene";
import { normalizeTrack3dCollection } from "./normalizeTrack3dCollection";

const MODAL_Z = 1250;

export type Track3DModalProps = {
  open: boolean;
  onClose: () => void;
  trackId: number;
  trackName: string;
  backendUrl: string;
};

export default function Track3DModal({
  open,
  onClose,
  trackId,
  trackName,
  backendUrl,
}: Track3DModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [collection, setCollection] = useState<FeatureCollection<LineString>>(
    () => normalizeTrack3dCollection(null),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    if (!open) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setCollection(normalizeTrack3dCollection(null));

      try {
        if (!backendUrl?.trim()) {
          throw new Error("VITE_BACKEND_URL is not set");
        }
        const base = backendUrl.replace(/\/$/, "");
        const response = await fetch(`${base}/tracks/${trackId}/3d`);
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(
            detail ? `HTTP ${response.status}: ${detail}` : `HTTP ${response.status}`,
          );
        }
        const data: unknown = await response.json();
        if (!cancelled) {
          setCollection(normalizeTrack3dCollection(data));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load 3D track");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, trackId, backendUrl]);

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
        className="register-modal__dialog track-3d-modal__dialog"
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
              3D track — {trackName}
            </h2>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            />
          </div>
          <div className="card-body p-0 track-3d-modal__body">
            {loading && (
              <div className="track-3d-modal__status">Loading elevation…</div>
            )}
            {error && !loading && (
              <div className="track-3d-modal__status track-3d-modal__status--error">
                {error}
              </div>
            )}
            {!loading && !error && <Track3DScene collection={collection} />}
          </div>
          <div className="card-footer small text-muted border-top py-2">
            Drag to rotate · scroll to zoom · each colour is a separate route
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
