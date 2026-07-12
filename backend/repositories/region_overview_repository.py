from sqlalchemy import text
from sqlalchemy.orm import Session


def select_regions_overview(db: Session):
    sql = text("""
        SELECT
            rb.region_code,
            rb.region_name,
            ST_AsGeoJSON(rb.geom)::json AS geometry,
            ST_Y(ST_PointOnSurface(rb.geom)) AS lat,
            ST_X(ST_PointOnSurface(rb.geom)) AS lng,
            (
                SELECT COUNT(*)
                FROM kiwi_tracks t
                WHERE ST_Intersects(t.geom, rb.geom)
            ) AS tracks,
            (
                SELECT COUNT(*)
                FROM kiwi_huts h
                WHERE ST_Intersects(h.geom, rb.geom)
            ) AS huts,
            (
                SELECT COUNT(*)
                FROM kiwi_campsites c
                WHERE ST_Intersects(c.geom, rb.geom)
            ) AS campsites
        FROM kiwi_regional_boundaries rb
        ORDER BY rb.region_code ASC
    """)

    rows = db.execute(sql).mappings().all()

    regions = []
    for row in rows:
        tracks = int(row["tracks"] or 0)
        huts = int(row["huts"] or 0)
        campsites = int(row["campsites"] or 0)
        regions.append(
            {
                "region_code": row["region_code"],
                "region_name": row["region_name"],
                "geometry": row["geometry"],
                "lat": float(row["lat"]),
                "lng": float(row["lng"]),
                "tracks": tracks,
                "huts": huts,
                "campsites": campsites,
                "item_count": tracks + huts + campsites,
            }
        )

    return regions
