import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const HOME_REGION_ONBOARDING_TARGET_ID = "home-region-onboarding-target";

export type HomeWelcomeOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const OVERLAY_Z = 1150;
const SPOTLIGHT_PAD = 10;

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function useRegionOnboardingRect(active: boolean) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  useLayoutEffect(() => {
    if (!active) {
      setRect(null);
      return;
    }

    const update = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      const el = document.getElementById(HOME_REGION_ONBOARDING_TARGET_ID);
      if (!el) {
        setRect(null);
        return;
      }
      const box = el.getBoundingClientRect();
      setRect({
        top: box.top - SPOTLIGHT_PAD,
        left: box.left - SPOTLIGHT_PAD,
        width: box.width + SPOTLIGHT_PAD * 2,
        height: box.height + SPOTLIGHT_PAD * 2,
      });
    };

    update();
    const raf = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active]);

  return { rect, viewport };
}

function HomeWelcomeRegionMask({
  active,
  rect,
  viewport,
  maskId,
}: {
  active: boolean;
  rect: SpotlightRect | null;
  viewport: { w: number; h: number };
  maskId: string;
}) {
  if (!active || !rect || viewport.w <= 0 || viewport.h <= 0) return null;

  return (
    <svg
      className="home-welcome-region-mask"
      width={viewport.w}
      height={viewport.h}
      aria-hidden
    >
      <defs>
        <mask id={maskId}>
          <rect width={viewport.w} height={viewport.h} fill="white" />
          <rect
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width={viewport.w}
        height={viewport.h}
        fill="rgba(0, 0, 0, 0.5)"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

function HomeWelcomeRegionRing({ rect }: { rect: SpotlightRect | null }) {
  if (!rect) return null;

  return (
    <div
      className="home-welcome-region-ring"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
      aria-hidden
    />
  );
}

export default function HomeWelcomeOverlay({
  open,
  onClose,
}: HomeWelcomeOverlayProps) {
  const titleId = useId();
  const maskId = useId().replace(/:/g, "");
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const { rect, viewport } = useRegionOnboardingRect(open);

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
    <>
      <div
        className="home-welcome-onboarding-layer"
        style={{ zIndex: OVERLAY_Z }}
        aria-hidden
      >
        <HomeWelcomeRegionMask
          active={open}
          rect={rect}
          viewport={viewport}
          maskId={maskId}
        />
        <HomeWelcomeRegionRing rect={rect} />
      </div>
      <div
        className="home-welcome-overlay__shell"
        style={{ zIndex: OVERLAY_Z + 1 }}
        role="presentation"
      >
        <div
          className="register-modal__dialog home-welcome-overlay__dialog"
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
                Welcome to KiwiTrail
              </h2>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
              />
            </div>
            <div className="card-body py-4">
              <p className="mb-3">
                Discover tracks, huts, and campsites across New Zealand.
              </p>
              <p className="mb-2">
                <strong>Get started:</strong>
              </p>
              <ol className="small mb-0 ps-3">
                <li className="mb-2">
                  Choose a <strong>region</strong> in the highlighted menu on
                  the left.
                </li>
                <li className="mb-2">
                  Then set <strong>track difficulty</strong>, tick what you want
                  (tracks, huts, campsites, weather stations), and optionally
                  use <strong>fuzzy search</strong>.
                </li>
                <li>
                  Press <strong>Submit</strong> to load places on the map.
                </li>
              </ol>
            </div>
            <div className="card-footer bg-white border-top py-3">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={onClose}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
