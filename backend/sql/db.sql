CREATE TABLE kiwi_tracks_all (
    id SERIAL PRIMARY KEY,
    objectid BIGINT,
    tech_object_name TEXT,
    floc_id TEXT,
    equipment_id TEXT,
    object_type TEXT,
    sub_object_type TEXT,
    gis_status TEXT,
    geom geometry(GeometryZ, 4326)
);

CREATE INDEX idx_kiwi_tracks_geom
ON kiwi_tracks
USING GIST (geom);

ALTER TABLE kiwi_tracks
ADD COLUMN doc_url TEXT;

ALTER TABLE kiwi_tracks
ADD COLUMN match_score NUMERIC,
ADD COLUMN match_method TEXT;

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




CREATE EXTENSION IF NOT EXISTS postgis;
