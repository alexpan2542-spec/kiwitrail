from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, Numeric, Text, String
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry

from db import Base


class KiwiHut(Base):
    __tablename__ = "kiwi_huts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    source_objectid: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True)
    asset_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    global_id: Mapped[UUID | None] = mapped_column(nullable=True)

    name: Mapped[str] = mapped_column(Text, nullable=False)
    place: Mapped[str | None] = mapped_column(Text, nullable=True)
    region: Mapped[str | None] = mapped_column(Text, nullable=True)
    location_string: Mapped[str | None] = mapped_column(Text, nullable=True)

    bookable: Mapped[str | None] = mapped_column(String(20), nullable=True)
    facilities: Mapped[str | None] = mapped_column(Text, nullable=True)
    has_alerts: Mapped[str | None] = mapped_column(Text, nullable=True)

    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_page_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    source_x: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    source_y: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    source_loaded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    geom = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)