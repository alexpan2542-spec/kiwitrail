
CREATE TABLE kiwi_tracks (
    id SERIAL PRIMARY KEY,

    source_objectid BIGINT UNIQUE,

    name TEXT,
    introduction TEXT,

    difficulty VARCHAR(50),
    completion_time TEXT,

    has_alerts TEXT,

    thumbnail_url TEXT,
    source_page_url TEXT,

    source_loaded_at TIMESTAMP,

    geom geometry(LineString, 4326)
);

CREATE INDEX idx_tracks_geom
ON kiwi_tracks
USING GIST (geom);

CREATE INDEX idx_tracks_difficulty
ON kiwi_tracks (difficulty);

