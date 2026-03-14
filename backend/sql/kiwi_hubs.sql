
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