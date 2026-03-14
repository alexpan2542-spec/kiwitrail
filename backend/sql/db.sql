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


CREATE TABLE campsites (
    id SERIAL PRIMARY KEY,

    source_objectid BIGINT UNIQUE,
    asset_id BIGINT,
    global_id UUID,

    name TEXT NOT NULL,
    place TEXT,
    region TEXT,
    location_string TEXT,

    introduction TEXT,
    campsite_category VARCHAR(100),

    number_of_powered_sites INTEGER,
    number_of_unpowered_sites INTEGER,

    bookable VARCHAR(20),
    is_free VARCHAR(20),

    facilities TEXT,
    activities TEXT,
    dogs_allowed TEXT,
    landscape TEXT,
    access TEXT,
    has_alerts TEXT,

    thumbnail_url TEXT,
    source_page_url TEXT,

    source_x NUMERIC,
    source_y NUMERIC,
    source_loaded_at TIMESTAMP,

    geom geometry(Point, 4326) NOT NULL
);
索引
CREATE INDEX idx_campsites_geom
ON campsites
USING GIST (geom);

CREATE INDEX idx_campsites_region
ON campsites (region);

CREATE INDEX idx_campsites_category
ON campsites (campsite_category);

CREATE INDEX idx_campsites_name
ON campsites (name);


CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE kiwi_campsites (
    id SERIAL PRIMARY KEY,
    source_objectid BIGINT UNIQUE,
    asset_id BIGINT,
    name TEXT NOT NULL,
    region TEXT,
    campsite_category VARCHAR(100),
    number_of_powered_sites INTEGER,
    number_of_unpowered_sites INTEGER,
    bookable VARCHAR(20),
    facilities TEXT,
    source_page_url TEXT,
    geom geometry(geometry, 4326) NOT NULL
);

CREATE INDEX idx_campsites_geom
ON kiwi_campsites
USING GIST (geom);

CREATE TABLE kiwi_huts (
    id SERIAL PRIMARY KEY,
    source_objectid BIGINT UNIQUE,
    asset_id BIGINT,
    global_id UUID,

    name TEXT NOT NULL,
    place TEXT,
    region TEXT,
    location_string TEXT,

    bookable VARCHAR(20),
    facilities TEXT,
    has_alerts TEXT,

    thumbnail_url TEXT,
    source_page_url TEXT,

    source_x NUMERIC,
    source_y NUMERIC,
    source_loaded_at TIMESTAMP,

    geom geometry(Point, 4326) NOT NULL
);