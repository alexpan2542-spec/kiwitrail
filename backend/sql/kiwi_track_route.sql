DROP TABLE IF EXISTS kiwi_track_route;

CREATE TABLE kiwi_track_route (
    id bigserial PRIMARY KEY,
    track_id bigint NOT NULL,
    route_no integer NOT NULL,
    geom geometry(LineString, 4326) NOT NULL
);

INSERT INTO kiwi_track_route (track_id, route_no, geom)
SELECT
    kt.id AS track_id,
    COALESCE((d.path)[1], 1) AS route_no,
    d.geom::geometry(LineString, 4326) AS geom
FROM kiwi_tracks kt
CROSS JOIN LATERAL ST_Dump(kt.geom) AS d
WHERE GeometryType(d.geom) = 'LINESTRING';

ALTER TABLE kiwi_track_route
ADD COLUMN IF NOT EXISTS length_m integer,
ADD COLUMN IF NOT EXISTS elev_min integer,
ADD COLUMN IF NOT EXISTS elev_max integer,
ADD COLUMN IF NOT EXISTS elevation_profile integer[];

ALTER TABLE kiwi_track_route
ADD COLUMN IF NOT EXISTS elev_gain integer,
ADD COLUMN IF NOT EXISTS elev_loss integer;