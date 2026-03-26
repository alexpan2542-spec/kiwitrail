import json
from sqlalchemy import text
from sqlalchemy.orm import Session


def select_map_items_campsite(db: Session, filters):
    where_clauses = []
    params = {
        "limit": filters.limit,
        "offset": filters.offset,
    }

    # 空间过滤（和 tracks / huts 一样）
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
            introduction,
            'campsite' AS type,
            ST_Y(ST_PointOnSurface(geom)) AS lat,
            ST_X(ST_PointOnSurface(geom)) AS lng,
            source_page_url,
            thumbnail_url AS thumbnail_url
        FROM kiwi_campsites
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
            "introduction": row["introduction"],
            "type": row["type"],
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
            "thumbnail_url": row["thumbnail_url"],
            "source_page_url": row["source_page_url"],
        }
        for row in rows
    ]