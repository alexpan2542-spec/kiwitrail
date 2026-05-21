import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { MapItem, MapItemType } from "../home/MapItem";

const MODAL_Z = 1200;

export type FavouriteListItem = MapItem & {
  favourited_at?: string;
};

export type FavouritesModalProps = {
  open: boolean;
  onClose: () => void;
  backendUrl: string;
  userEmail: string;
  /** Focus the map on this saved item and open its detail panel. */
  onShowOnMap?: (item: MapItem) => void;
};

function buildFavouriteItemsUrl(base: string, userEmail: string): string {
  const origin = base.replace(/\/$/, "");
  const email = encodeURIComponent(userEmail);
  return `${origin}/favourites/items?user_email=${email}`;
}

function typeLabel(type: MapItemType): string {
  switch (type) {
    case "track":
      return "Track";
    case "hut":
      return "Hut";
    case "campsite":
      return "Campsite";
    case "weather_station":
      return "Weather station";
    default:
      return type;
  }
}

function thumbnailForItem(item: FavouriteListItem): string | null {
  if (item.thumbnail_url?.trim()) {
    return item.thumbnail_url.trim();
  }
  if (item.type === "weather_station") {
    return "/niwa.png";
  }
  return null;
}

export default function FavouritesModal({
  open,
  onClose,
  backendUrl,
  userEmail,
  onShowOnMap,
}: FavouritesModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<FavouriteListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!open || !backendUrl || !userEmail) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setItems([]);

    fetch(buildFavouriteItemsUrl(backendUrl, userEmail))
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load favourites (${res.status})`);
        }
        const data = (await res.json()) as { items?: FavouriteListItem[] };
        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("Could not load your saved items. Try again later.");
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, backendUrl, userEmail]);

  if (!open) return null;

  const handleShowOnMap = (item: FavouriteListItem) => {
    onShowOnMap?.(item);
    onClose();
  };

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
        className="register-modal__dialog favourites-modal__dialog"
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
              My saved items
            </h2>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            />
          </div>
          <div
            className="card-body py-3 favourites-modal__body"
            style={{ maxHeight: "65vh", overflowY: "auto" }}
          >
            {loading ? (
              <p className="text-muted mb-0 small">Loading…</p>
            ) : error ? (
              <p className="text-danger mb-0 small" role="alert">
                {error}
              </p>
            ) : items.length === 0 ? (
              <p className="text-muted mb-0 small">
                No favourites yet. Use the heart on a track, hut, campsite, or
                weather station to save it here.
              </p>
            ) : (
              <ul className="list-unstyled mb-0 favourites-modal__list">
                {items.map((item) => {
                  const thumb = thumbnailForItem(item);
                  return (
                    <li
                      key={`${item.type}-${item.id}`}
                      className="favourites-modal__row"
                    >
                      <div className="favourites-modal__thumb-wrap">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="favourites-modal__thumb"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="favourites-modal__thumb favourites-modal__thumb--placeholder"
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="favourites-modal__meta flex-grow-1 min-w-0">
                        <div className="fw-medium text-truncate">
                          {item.name}
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2 mt-1 small text-muted">
                          <span className="badge text-bg-light border">
                            {typeLabel(item.type)}
                          </span>
                          {item.region ? (
                            <span className="text-truncate">{item.region}</span>
                          ) : null}
                          {item.favourited_at ? (
                            <span className="text-truncate">
                              Saved {item.favourited_at}
                            </span>
                          ) : null}
                        </div>
                        {onShowOnMap ? (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 mt-2"
                            onClick={() => handleShowOnMap(item)}
                          >
                            Show on map
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
