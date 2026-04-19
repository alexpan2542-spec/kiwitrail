from fastapi import Depends

from main import get_db
from repositories.campsite_repository import select_map_items_campsite
from repositories.hut_repository import select_map_items_hut
from repositories.track_repository import select_map_items_track
from repositories.weather_station_repository import select_map_items_weather_station
from schema import TrackSearchRequest


def search_map_items(
    filters: TrackSearchRequest,
    db: Session = Depends(get_db),
):
    items = []

    if filters.show_tracks:
        tracks = select_map_items_track(db, filters)
        items.extend(tracks)

    if filters.show_huts:
        huts = select_map_items_hut(db, filters)
        items.extend(huts)

    if filters.show_campsites:
        campsites = select_map_items_campsite(db, filters)
        items.extend(campsites)

    if filters.show_weather_station:
        weather_station = select_map_items_weather_station(db, filters)
        items.extend(weather_station)

    return items