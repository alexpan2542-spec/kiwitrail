DROP TABLE IF EXISTS kiwi_campsites;

CREATE TABLE kiwi_campsites (
    id SERIAL PRIMARY KEY,

    -- ===== Source identifiers =====
    source_objectid BIGINT UNIQUE,
    asset_id BIGINT,
    global_id UUID,

    -- ===== Basic information =====
    name TEXT NOT NULL,
    place TEXT,
    region TEXT,

    -- ===== Description =====
    introduction TEXT,
    thumbnail_url TEXT,
    source_page_url TEXT,

    -- ===== Classification =====
    campsite_category TEXT,

    -- ===== Capacity =====
    number_of_powered_sites INTEGER,
    number_of_unpowered_sites INTEGER,

    -- ===== Status flags =====
    bookable BOOLEAN,
    free BOOLEAN,
    has_alerts BOOLEAN,

    -- ===== JSON fields (semi-structured data) =====
    facilities TEXT,
    activities TEXT,

    -- ===== Rules =====
    dogs_allowed BOOLEAN,

    -- ===== Environment =====
    access TEXT,
    landscape TEXT,

    -- ===== Location description =====
    location_string TEXT,

    -- ===== Raw coordinates (redundant but useful) =====
    x DOUBLE PRECISION,
    y DOUBLE PRECISION,

    -- ===== System metadata =====
    date_loaded_to_gis TIMESTAMP,

    -- ===== Spatial column =====
    geom geometry(Point, 4326) NOT NULL
);

-- Spatial index for fast geographic queries
CREATE INDEX idx_campsites_geom
ON kiwi_campsites
USING GIST (geom);

-- Frequently queried attributes
CREATE INDEX idx_campsites_region ON kiwi_campsites(region);
CREATE INDEX idx_campsites_category ON kiwi_campsites(campsite_category);
CREATE INDEX idx_campsites_bookable ON kiwi_campsites(bookable);
