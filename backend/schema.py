# schemas/track.py

from pydantic import BaseModel, Field, model_validator
from typing import Any, Optional


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

class CommentSchema(BaseModel):
    item_type: str
    item_id: int
    user_name: Optional[str] = None
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment_text: str = Field(default="", max_length=8000)
    image_url_1: Optional[str] = None
    image_url_2: Optional[str] = None
    image_url_3: Optional[str] = None

    @model_validator(mode="after")
    def require_text_or_image(self) -> "CommentSchema":
        text = (self.comment_text or "").strip()
        has_image = any(
            (u or "").strip()
            for u in (self.image_url_1, self.image_url_2, self.image_url_3)
        )
        if not text and not has_image:
            raise ValueError("Provide comment text and/or at least one image URL.")
        return self

    class Config:
        from_attributes = True