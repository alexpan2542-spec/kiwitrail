# schemas/track.py

from pydantic import BaseModel, Field
from typing import Any

class TrackSearchRequest(BaseModel):
    name: str | None = None
    difficulty: str | None = None
    has_alerts: str | None = None
    completion_time: str | None = None

    selected_area: dict[str, Any] | None = None

    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)