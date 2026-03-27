import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from schema import TrackSearchRequest


def select_map_items_track(db: Session, filters):
    where_clauses = []
    params = {
        "limit": filters.limit,
        "offset": filters.offset,
    }

    if filters.name:
        where_clauses.append("(name ILIKE :name OR introduction ILIKE :name)")
        params["name"] = f"%{filters.name.strip()}%"

    if filters.difficulty:
        where_clauses.append("difficulty ILIKE :difficulty")
        params["difficulty"] = f"%{filters.difficulty.strip()}%"

    if filters.has_alerts is not None:
        where_clauses.append("has_alerts = :has_alerts")
        params["has_alerts"] = filters.has_alerts

    if filters.completion_time:
        where_clauses.append("completion_time ILIKE :completion_time")
        params["completion_time"] = f"%{filters.completion_time.strip()}%"

    if filters.selected_area:
        where_clauses.append("""
            ST_Intersects(
                geom,
                ST_SetSRID(ST_GeomFromGeoJSON(:selected_area), 4326)
            )
        """)
        params["selected_area"] = json.dumps(filters.selected_area)

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    sql = text(f"""
        SELECT
            id,
            name,
            introduction,
            'track' AS type,
            ST_Y(ST_PointOnSurface(geom)) AS lat,
            ST_X(ST_PointOnSurface(geom)) AS lng,
            difficulty,
            completion_time,
            thumbnail_url,
            source_page_url,   
            JSON_BUILD_OBJECT(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(geom)::JSON
            ) AS geom_geojson
        FROM kiwi_tracks
        {where_sql}
        ORDER BY id ASC
        LIMIT :limit OFFSET :offset
    """)

    rows = db.execute(sql, params).mappings().all()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "introduction": row["introduction"],
            "type": row["type"],
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
            "difficulty": row["difficulty"],
            "completion_time": row["completion_time"],
            "thumbnail_url": row["thumbnail_url"],
            "source_page_url": row["source_page_url"],
            "geom_geojson": row["geom_geojson"],
        }
        for row in rows
    ]

def select_tracks(db: Session, filters: TrackSearchRequest):
    where_clauses = []
    params = {
        "limit": filters.limit,
        "offset": filters.offset,
    }

    if filters.name:
        where_clauses.append("(name ILIKE :name OR introduction ILIKE :name)")
        params["name"] = f"%{filters.name.strip()}%"

    if filters.difficulty:
        where_clauses.append("difficulty ILIKE :difficulty")
        params["difficulty"] = f"%{filters.difficulty.strip()}%"

    if filters.has_alerts is not None:
        where_clauses.append("has_alerts = :has_alerts")
        params["has_alerts"] = filters.has_alerts

    if filters.completion_time:
        where_clauses.append("completion_time ILIKE :completion_time")
        params["completion_time"] = f"%{filters.completion_time}%"

    if filters.selected_area:
        where_clauses.append("""
            ST_Intersects(
                geom,
                ST_SetSRID(ST_GeomFromGeoJSON(:selected_area), 4326)
            )
        """)
        params["selected_area"] = json.dumps(filters.selected_area)

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    sql = text(f"""
        SELECT
            id,
            source_objectid,
            name,
            introduction,
            difficulty,
            completion_time,
            has_alerts,
            thumbnail_url,
            source_page_url,
            source_loaded_at,
            ST_AsGeoJSON(geom) AS geom_geojson
        FROM kiwi_tracks
        {where_sql}
        ORDER BY name ASC NULLS LAST, id ASC
        LIMIT :limit OFFSET :offset
    """)

    rows = db.execute(sql, params).mappings().all()

    result = []
    for row in rows:
        item = dict(row)
        if item["geom_geojson"]:
            item["geom_geojson"] = json.loads(item["geom_geojson"])
        result.append(item)

    return result