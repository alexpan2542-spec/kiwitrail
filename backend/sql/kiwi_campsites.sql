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
