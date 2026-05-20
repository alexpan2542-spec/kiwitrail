import json
from sqlalchemy import text
from sqlalchemy.orm import Session


def select_map_items_weather_station(db: Session, filters):
    where_clauses = []
    params = {
        "limit": filters.limit,
        "offset": filters.offset,
    }

    if filters.selected_area:
        where_clauses.append("""
            ST_Intersects(
                geom,
                ST_SetSRID(
                    ST_GeomFromGeoJSON(CAST(:selected_area AS text)),
                    4326
                )
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
            'weather_station' AS type,
            ST_Y(geom) AS lat,
            ST_X(geom) AS lng,
            url as source_page_url
        FROM kiwi_weather_station
        {where_sql}
        ORDER BY id ASC
        LIMIT :limit OFFSET :offset
    """)

    rows = db.execute(sql, params).mappings().all()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "type": row["type"],
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
            "source_page_url": row["source_page_url"],

        }
        for row in rows
    ]


def select_map_items_weather_station_by_ids(db: Session, station_ids: list[int]):
    if not station_ids:
        return []

    sql = text("""
        SELECT
            id,
            name,
            'weather_station' AS type,
            ST_Y(geom) AS lat,
            ST_X(geom) AS lng,
            url AS source_page_url
        FROM kiwi_weather_station
        WHERE id = ANY(:station_ids)
    """)

    rows = db.execute(sql, {"station_ids": station_ids}).mappings().all()
    items = [
        {
            "id": row["id"],
            "name": row["name"],
            "type": row["type"],
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
            "source_page_url": row["source_page_url"],
        }
        for row in rows
    ]
    item_map = {item["id"]: item for item in items}
    return [item_map[i] for i in station_ids if i in item_map]