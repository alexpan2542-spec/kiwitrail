from sqlalchemy import text
from sqlalchemy.orm import Session


def select_missing_coverage_geojson(db: Session):
    sql = text("""
        WITH region_union AS (
            SELECT ST_Union(geom) AS geom
            FROM kiwi_regional_boundaries
        ),
        dem_union AS (
            SELECT ST_Union(geom) AS geom
            FROM kiwi_nz_8m_dem
        )
        SELECT
            ST_AsGeoJSON(
                ST_Difference(region_union.geom, dem_union.geom)
            )::json AS geojson
        FROM region_union, dem_union
    """)

    row = db.execute(sql).mappings().first()

    return row["geojson"] if row else None

from sqlalchemy import text
from sqlalchemy.orm import Session


def select_dem_tif_polygons_geojson(db: Session):
    sql = text("""
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(json_agg(feature), '[]'::json)
        ) AS geojson
        FROM (
            SELECT json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(geom)::json,
                'properties', json_build_object(
                    'id', id
                )
            ) AS feature
            FROM kiwi_nz_8m_dem
            WHERE geom IS NOT NULL
               
            ORDER BY id
        ) t
    """)

    row = db.execute(sql).mappings().first()
    return row["geojson"] if row else None