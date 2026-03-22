CREATE TABLE kiwi_regional_boundaries (
    id            BIGSERIAL PRIMARY KEY,
    region_code   VARCHAR(2),
    region_name   VARCHAR(50),
    land_area     DOUBLE PRECISION,
    area_sq_km    DOUBLE PRECISION,
    shape_length  DOUBLE PRECISION,
    geom          GEOMETRY(GEOMETRY, 4326)
);

CREATE INDEX kiwi_regional_council_boundaries_geom_gix
ON kiwi_regional_council_boundaries
USING GIST (geom);

UPDATE kiw_regional_boundaries
SET geom_simple = ST_Simplify(geom, 0.01);

CREATE INDEX kiwi_geom_simple_gix
ON kiwi_regional_boundaries
USING GIST (geom_simple);