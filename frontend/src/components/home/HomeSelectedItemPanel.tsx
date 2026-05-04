import type { ReactNode, RefObject } from "react";
import { useEffect, useState } from "react";

import type { MapItem } from "./MapItem";

function IconDirections() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z"
      />
    </svg>
  );
}

function IconWeather() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.753C5.113 5.193 4.63 5.86 4.38 6.61 4.087 7.457 3.3 8.209 2.508 8.528 1.408 8.932.598 10.083.598 11.285 0 12.687 1.708 14 3.781 14h8.906C13.98 14 15 12.988 15 11.773c0-1.216-1.02-2.215-2.312-2.215h-.765c-.314 0-.62-.084-.884-.243C10.243 8.5 8.939 7.5 8 7.5c-.939 0-2.243 1-2.884 2.757-.264.159-.57.243-.884.243z" />
      <path d="M11.223 1.004a.5.5 0 0 0-.808.514l-.63 1.286-.53-.53a.5.5 0 0 0-.77.54l.774 1.145.004.004.004.004 1.144.774a.5.5 0 0 0 .697-.519L11.67 3.17l1.286-.63a.5.5 0 0 0-.514-.808h-1.219z" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
      <path d="M5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z" />
    </svg>
  );
}

function GmapsStyleAction({
  label,
  ariaLabel,
  onClick,
  disabled = false,
  favoured = false,
  isToggle = false,
  children,
}: {
  label: string;
  ariaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  /** When true, icon + label use favourite (red) styling. */
  favoured?: boolean;
  /** When true, expose `aria-pressed` from `favoured` (favourite control). */
  isToggle?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`gmaps-action${favoured ? " gmaps-action--favoured" : ""}`}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isToggle ? favoured : undefined}
    >
      <span className="gmaps-action__circle">{children}</span>
      <span className="gmaps-action__label">{label}</span>
    </button>
  );
}

export type HomeSelectedItemPanelProps = {
  item: MapItem;
  panelRef: RefObject<HTMLDivElement | null>;
  top: number;
  left: number;
  width: number;
  /** Optional; runs after opening Google Maps at the item coordinates. */
  onDirectionsClick?: () => void;
  /** Called with embed URL when Weather is clicked (track `weather_url` or station `source_page_url`). */
  onWeatherClick?: (embedUrl: string) => void;
  onCommentsClick?: () => void;
  onFavouriteClick?: () => void;
};

/**
 * Opens Google Maps at coordinates with a map pin.
 * `/@lat,lng,z` only recenters the view and often shows no dropped pin; `?q=lat,lng` triggers the red marker.
 */
function openGoogleMapsAtCoordinates(lat: number, lng: number, zoom = 14): void {
  const query = encodeURIComponent(`${lat},${lng}`);
  const url = `https://www.google.com/maps?q=${query}&z=${zoom}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function HomeSelectedItemPanel({
  item,
  panelRef,
  top,
  left,
  width,
  onDirectionsClick,
  onWeatherClick,
  onCommentsClick,
  onFavouriteClick,
}: HomeSelectedItemPanelProps) {
  const [favouriteOn, setFavouriteOn] = useState(false);

  useEffect(() => {
    setFavouriteOn(false);
  }, [item.id, item.type]);

  const handleFavouriteClick = () => {
    setFavouriteOn((v) => !v);
    onFavouriteClick?.();
  };

  const handleDirectionsClick = () => {
    openGoogleMapsAtCoordinates(item.lat, item.lng);
    onDirectionsClick?.();
  };

  const weatherEmbedUrl =
    item.weather_url ??
    (item.type === "weather_station" ? item.source_page_url : undefined);
  const hasWeatherEmbed = Boolean(weatherEmbedUrl);

  const handleWeatherClick = () => {
    if (!weatherEmbedUrl) return;
    onWeatherClick?.(weatherEmbedUrl);
  };

  return (
    <div
      ref={panelRef}
      className="detail-popup"
      style={{
        position: "absolute",
        top,
        left,
        width,
        zIndex: 1000,
      }}
    >
      <div className="card" data-bs-theme="light">
        <div className="card-header fw-bold">{item.name}</div>

        <div
          className="card-body"
          style={{
            overflowY: "auto",
          }}
        >
          {item.thumbnail_url && (
            <img
              src={item.thumbnail_url}
              alt={`${item.type} ${item.id}`}
              className="card-img-top mb-3"
              style={{ height: "120px", objectFit: "cover" }}
            />
          )}

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

          {item.region && (
            <p className="card-text small">
              <strong>Region:</strong> {item.region}
            </p>
          )}

          {item.bookable && (
            <p className="card-text small">
              <strong>Bookable:</strong> {item.bookable}
            </p>
          )}

          {item.facilities && (
            <p className="card-text small">
              <strong>Facilities:</strong> {item.facilities}
            </p>
          )}

          <p className="card-text small">
            <strong>Type:</strong> {item.type}
          </p>

          {item.type === "track" && (
            <a
              href={`track/${item.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 text-decoration-underline mt-2 d-block"
            >
              Track Details →
            </a>
          )}
          {(item.type === "hut" || item.type === "campsite") &&
            item.source_page_url && (
              <a
                href={item.source_page_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 text-decoration-underline mt-2 d-block"
              >
                View Official Details →
              </a>
            )}
        </div>

        <div className="card-footer border-top bg-white py-1 px-1">
          <div className="gmaps-actions">
            <GmapsStyleAction
              label="Directions"
              ariaLabel="Directions"
              onClick={handleDirectionsClick}
            >
              <IconDirections />
            </GmapsStyleAction>
            <GmapsStyleAction
              label="Weather"
              ariaLabel="Weather"
              disabled={!hasWeatherEmbed}
              onClick={handleWeatherClick}
            >
              <IconWeather />
            </GmapsStyleAction>
            <GmapsStyleAction
              label="Comments"
              ariaLabel="View comments"
              onClick={() => onCommentsClick?.()}
            >
              <IconChat />
            </GmapsStyleAction>
            <GmapsStyleAction
              label="Favourite"
              ariaLabel={
                favouriteOn ? "Remove from favourites" : "Add to favourites"
              }
              isToggle
              favoured={favouriteOn}
              onClick={handleFavouriteClick}
            >
              <IconHeart />
            </GmapsStyleAction>
          </div>
        </div>
      </div>
    </div>
  );
}
