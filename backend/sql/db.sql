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
