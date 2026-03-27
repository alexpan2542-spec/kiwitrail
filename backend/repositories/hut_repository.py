import json
from sqlalchemy import text
from sqlalchemy.orm import Session


def select_map_items_hut(db: Session, filters):
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
            region,
            facilities,
            bookable,
            'hut' AS type,
            ST_Y(geom) AS lat,
            ST_X(geom) AS lng,
            source_page_url,
            thumbnail_url AS thumbnail_url
        FROM kiwi_huts
        {where_sql}
        ORDER BY id ASC
        LIMIT :limit OFFSET :offset
    """)

    rows = db.execute(sql, params).mappings().all()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "region": row["region"],
            "facilities": row["facilities"],
            "type": row["type"],
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
            "thumbnail_url": row["thumbnail_url"],
            "source_page_url": row["source_page_url"],
            "bookable": row["bookable"],
        }
        for row in rows
    ]