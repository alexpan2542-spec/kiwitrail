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
            niwa_weather_url as weather_url,
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
            "weather_url": row["weather_url"],
        }
        for row in rows
    ]


def select_track_by_id(db: Session, track_id: int):
    sql = text("""
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
        WHERE id = :track_id
    """)

    row = db.execute(sql, {"track_id": track_id}).mappings().first()

    if not row:
        return None

    return {
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

def select_track_names_for_fuzzy(db: Session, filters: TrackSearchRequest):
    where_clauses = []
    params = {}

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
            name
        FROM kiwi_tracks
        {where_sql}
        ORDER BY id ASC
    """)

    rows = db.execute(sql, params).mappings().all()

    return [
        {
            "id": row["id"],
            "name": row["name"],
        }
        for row in rows
    ]

def select_map_items_track_by_ids(db: Session, track_ids: list[int]):
    if not track_ids:
        return []

    sql = text("""
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
        WHERE id = ANY(:track_ids)
    """)

    rows = db.execute(sql, {"track_ids": track_ids}).mappings().all()

    items = [
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

    item_map = {item["id"]: item for item in items}
    ordered_items = [item_map[item_id] for item_id in track_ids if item_id in item_map]

    return ordered_items


from sqlalchemy import text
from sqlalchemy.orm import Session


def select_track_routes_by_track_id(db: Session, track_id: int):
    sql = text("""
        SELECT
            r.id,
            r.name,
            r.track_id,
            r.route_no,
            r.length_m,
            r.elev_min,
            r.elev_max,
            r.elevation_profile,
            JSON_BUILD_OBJECT(
                'type', 'Feature',
                'properties', JSON_BUILD_OBJECT(
                    'id', r.id,
                    'track_id', r.track_id
                    
                ),
                'geometry', ST_AsGeoJSON(r.geom)::JSON
            ) AS geojson
        FROM kiwi_track_route r
        WHERE r.track_id = :track_id
        ORDER BY r.route_no, r.id
    """)

    rows = db.execute(sql, {"track_id": track_id}).mappings().all()

    return [
        {
            "id": row["id"],
            "track_id": row["track_id"],
            "name": row["name"],
            "route_no": row["route_no"],
            "length_m": row["length_m"],
            "elev_min": row["elev_min"],
            "elev_max": row["elev_max"],
            "elevations": row["elevation_profile"],
            "geojson": row["geojson"],
        }
        for row in rows
    ]