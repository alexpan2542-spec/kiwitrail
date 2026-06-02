from sqlalchemy import text
from sqlalchemy.orm import Session

EMPTY_FEATURE_COLLECTION = {"type": "FeatureCollection", "features": []}


def select_track_3d_geojson_by_track_id(db: Session, track_id: int) -> dict:
    sql = text("""
        WITH features AS (
            SELECT
                route_no,
                json_build_object(
                    'type', 'Feature',
                    'properties', json_build_object(
                        'track_id', track_id,
                        'route_no', route_no,
                        'step_m', step_m,
                        'length_m', length_m,
                        'elev_min', elev_min,
                        'elev_max', elev_max
                    ),
                    'geometry', ST_AsGeoJSON(geom)::json
                ) AS feature
            FROM kiwi_track_3d
            WHERE track_id = :track_id
        )
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(
                (SELECT json_agg(feature ORDER BY route_no) FROM features),
                '[]'::json
            )
        ) AS geojson
    """)
    row = db.execute(sql, {"track_id": track_id}).mappings().one()
    return row["geojson"] or EMPTY_FEATURE_COLLECTION
