export type HomeWelcomeOverlayProps = {
  visible: boolean;
  mapAreaLeft: number;
  onDismiss: () => void;
};

export default function HomeWelcomeOverlay({
  visible,
  mapAreaLeft,
  onDismiss,
}: HomeWelcomeOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="home-welcome-box"
      style={{
        left: `calc(${mapAreaLeft}px + (100vw - ${mapAreaLeft}px) / 2)`,
      }}
      role="dialog"
      aria-labelledby="home-welcome-title"
      aria-describedby="home-welcome-desc"
    >
      <div className="home-welcome-box__card card shadow">
        <div className="card-body">
          <h2 id="home-welcome-title" className="home-welcome-box__title h5 mb-2">
            Welcome to KiwiTrail
          </h2>
          <p id="home-welcome-desc" className="home-welcome-box__text text-muted mb-3">
            Explore tramping tracks, huts and campsites across New Zealand.
            Regions are lighting up on the map — click a region to start, or use
            the search panel on the left.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onDismiss}
          >
            Start exploring
          </button>
        </div>
      </div>
    </div>
  );
}
