-- One LineStringZ per track segment (a track may have several routes).
-- Used by the 3D viewer to show all routes for a track at once.
-- Does not depend on kiwi_track_route.

DROP TABLE IF EXISTS kiwi_track_3d;

CREATE TABLE kiwi_track_3d (
    track_id  INTEGER NOT NULL
        REFERENCES kiwi_tracks (id) ON DELETE CASCADE,
    route_no  INTEGER NOT NULL,
    step_m    INTEGER NOT NULL DEFAULT 10,
    length_m  INTEGER,
    elev_min  INTEGER,
    elev_max  INTEGER,
    geom      geometry (LineStringZ, 4326) NOT NULL,
    PRIMARY KEY (track_id, route_no)
);

CREATE INDEX idx_kiwi_track_3d_geom
ON kiwi_track_3d
USING GIST (geom);

CREATE INDEX idx_kiwi_track_3d_track_id
ON kiwi_track_3d (track_id);
