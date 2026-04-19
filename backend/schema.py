# schemas/track.py

from pydantic import BaseModel, Field
from typing import Any

class TrackSearchRequest(BaseModel):
    name: str | None = None
    difficulty: str | None = None
    has_alerts: str | None = None
    completion_time: str | None = None

    selected_area: dict[str, Any] | None = None

    show_tracks: bool = True
    show_huts: bool = True
    show_campsites: bool = True
    show_weather_station: bool = True

    fuzzy_search: str | None = None
    limit: int = Field(default=20, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)