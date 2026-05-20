from rapidfuzz import process, fuzz
from sqlalchemy.orm import Session

from repositories.track_repository import select_track_names_for_fuzzy, select_map_items_track_by_ids


def fuzzy_search_tracks(
    db: Session,
    filters,limit,score_cutoff
):

    query = filters.fuzzy_search
    if not query or not query.strip():
        return []

    rows = select_track_names_for_fuzzy(db=db, filters=filters)
    choices = {r["id"]: r["name"] for r in rows}

    results = process.extract(
        query,
        choices,
        scorer=fuzz.WRatio,
        limit=limit,
        score_cutoff=score_cutoff,
    )

    # step 4 get matched_id
    matched_ids = [track_id for _, _, track_id in results]

    if not matched_ids:
        return []

    items = select_map_items_track_by_ids(db=db, track_ids=matched_ids)

    id_to_item = {item["id"]: item for item in items}
    ordered_items = [id_to_item[i] for i in matched_ids if i in id_to_item]

    return ordered_items