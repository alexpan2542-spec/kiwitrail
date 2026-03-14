CREATE TABLE kiwi_osm_facilities (
    id SERIAL PRIMARY KEY,

    osm_id TEXT UNIQUE NOT NULL,
    osm_type VARCHAR(20),

    name TEXT,
    facility_type VARCHAR(50) NOT NULL,

    elevation INTEGER,

    attr JSONB,

    source TEXT DEFAULT 'OSM',

    geom geometry(Point, 4326) NOT NULL
);

CREATE INDEX idx_kiwi_osm_facilities_geom
ON kiwi_osm_facilities
USING GIST (geom);

CREATE INDEX idx_kiwi_osm_facilities_type
ON kiwi_osm_facilities(facility_type);

CREATE INDEX idx_kiwi_osm_facilities_attr
ON kiwi_osm_facilities
USING GIN (attr);
