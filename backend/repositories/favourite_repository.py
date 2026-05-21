from sqlalchemy import text
from sqlalchemy.orm import Session

from repositories.campsite_repository import select_map_items_campsite_by_ids
from repositories.hut_repository import select_map_items_hut_by_ids
from repositories.track_repository import select_map_items_track_by_ids
from repositories.weather_station_repository import (
    select_map_items_weather_station_by_ids,
)


def is_favourited(
    db: Session, user_email: str, item_type: str, item_id: int
) -> bool:
    sql = text("""
        SELECT 1
        FROM kiwi_user_favourites
        WHERE user_email = :user_email
          AND item_type = :item_type
          AND item_id = :item_id
        LIMIT 1
    """)
    row = db.execute(
        sql,
        {
            "user_email": user_email,
            "item_type": item_type,
            "item_id": item_id,
        },
    ).first()
    return row is not None


def insert_favourite(
    db: Session, user_email: str, item_type: str, item_id: int
) -> int:
    sql = text("""
        INSERT INTO kiwi_user_favourites (user_email, item_type, item_id)
        VALUES (:user_email, :item_type, :item_id)
        ON CONFLICT (user_email, item_type, item_id) DO NOTHING
        RETURNING id
    """)
    result = db.execute(
        sql,
        {
            "user_email": user_email,
            "item_type": item_type,
            "item_id": item_id,
        },
    )
    db.commit()
    row = result.fetchone()
    return row[0] if row else None


def delete_favourite(
    db: Session, user_email: str, item_type: str, item_id: int
) -> bool:
    sql = text("""
        DELETE FROM kiwi_user_favourites
        WHERE user_email = :user_email
          AND item_type = :item_type
          AND item_id = :item_id
        RETURNING id
    """)
    result = db.execute(
        sql,
        {
            "user_email": user_email,
            "item_type": item_type,
            "item_id": item_id,
        },
    )
    db.commit()
    return result.fetchone() is not None


def select_favourites_by_user(db: Session, user_email: str):
    sql = text("""
        SELECT item_type,
               item_id,
               TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS created_at
        FROM kiwi_user_favourites
        WHERE user_email = :user_email
        ORDER BY created_at DESC
    """)
    rows = db.execute(sql, {"user_email": user_email}).mappings().all()
    return [dict(row) for row in rows]


def select_favourite_items_enriched(db: Session, user_email: str):
    favourites = select_favourites_by_user(db, user_email)
    if not favourites:
        return []

    ids_by_type: dict[str, list[int]] = {}
    for fav in favourites:
        ids_by_type.setdefault(fav["item_type"], []).append(fav["item_id"])

    item_lookup: dict[tuple[str, int], dict] = {}

    if track_ids := ids_by_type.get("track"):
        for item in select_map_items_track_by_ids(db, track_ids):
            item_lookup[("track", item["id"])] = item

    if hut_ids := ids_by_type.get("hut"):
        for item in select_map_items_hut_by_ids(db, hut_ids):
            item_lookup[("hut", item["id"])] = item

    if campsite_ids := ids_by_type.get("campsite"):
        for item in select_map_items_campsite_by_ids(db, campsite_ids):
            item_lookup[("campsite", item["id"])] = item

    if station_ids := ids_by_type.get("weather_station"):
        for item in select_map_items_weather_station_by_ids(db, station_ids):
            item_lookup[("weather_station", item["id"])] = item

    enriched = []
    for fav in favourites:
        key = (fav["item_type"], fav["item_id"])
        item = item_lookup.get(key)
        if not item:
            continue
        enriched.append({**item, "favourited_at": fav["created_at"]})

    return enriched
