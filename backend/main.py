import asyncio

from fastapi import Depends
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy import select
from sqlalchemy.orm import Session

from db import SessionLocal
from model import KiwiHut
from repositories.campsite_repository import select_map_items_campsite
from repositories.hut_repository import select_map_items_hut
from repositories.track_repository import select_tracks, select_map_items_track
from schema import TrackSearchRequest

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "postgresql+psycopg2://alex@localhost:5432/postgres"
engine = create_engine(DATABASE_URL)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


@app.get("/regions/{region_code}")
def get_region(region_code: str):
    sql = text("""
        SELECT region_name,
            JSON_BUILD_OBJECT(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(geom)::JSON,
            'properties', JSON_BUILD_OBJECT(
                'region_code', region_code,
                'region_name', region_name,
                'land_area', land_area,
                'area_sq_km', area_sq_km,
                'shape_length', shape_length
            )
        ) AS geojson
        FROM kiwi_regional_boundaries
        WHERE region_code = :region_code
        LIMIT 1;
    """)

    with engine.connect() as conn:
        row = conn.execute(sql, {"region_code": region_code}).fetchone()

    region_name = row.region_name
    geojson = row.geojson

    return geojson

@app.post("/tracks/search")
async def search_tracks(
    filters: TrackSearchRequest,
    db: Session = Depends(get_db),
):
    print(f"{filters.difficulty}, {filters.selected_area},")

    result = select_tracks(db, filters)

    await asyncio.sleep(1)
    return result

@app.get("/tracks")
def get_tracks(db: Session = Depends(get_db)):

    sql = text("""
        SELECT
            id,
            name,
            ST_AsGeoJSON(geom) AS geojson
        FROM kiwi_tracks
        WHERE geom IS NOT NULL limit 2
    """)

    result = db.execute(sql)

    tracks = [
        {
            "id": row.id,
            "name": row.name,
            "geojson": row.geojson
        }
        for row in result
    ]

    return tracks
@app.get("/huts")
def get_huts(db: Session = Depends(get_db)):
    huts = db.scalars(
        select(KiwiHut).limit(10)
    ).all()

    return [
        {
            "id": hut.id,
            "name": hut.name,
            "region": hut.region,
            "place": hut.place,
            "bookable": hut.bookable,
        }
        for hut in huts
    ]

@app.post("/search/map")
def search_map_items(
    filters: TrackSearchRequest,
    db: Session = Depends(get_db),
):

    tracks = select_map_items_track(db, filters)
    huts = select_map_items_hut(db, filters)
    campsites = select_map_items_campsite(db, filters)

    items = [*tracks, *huts, *campsites]

    return {
        "count": len(items),
        "items": items,
    }

