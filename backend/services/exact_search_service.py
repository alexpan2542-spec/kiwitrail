from sqlalchemy.orm import Session

from repositories.campsite_repository import select_map_items_campsite
from repositories.hut_repository import select_map_items_hut
from repositories.track_repository import select_map_items_track
from repositories.weather_station_repository import select_map_items_weather_station


def exact_search_tracks(db: Session, filters):
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