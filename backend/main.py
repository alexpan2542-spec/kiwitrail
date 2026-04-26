import os

from fastapi import Depends
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from db import engine, get_db
from repositories.region_repository import select_dem_tif_polygons_geojson
from repositories.track_repository import select_track_by_id, select_track_routes_by_track_id
from schema import TrackSearchRequest
from services.exact_search_service import exact_search_tracks
from services.fuzzy_search_service import fuzzy_search_tracks

app = FastAPI()

origins = os.getenv("ALLOWED_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}

@app.get("/map")
async def map(db: Session = Depends(get_db)):
    # return select_missing_coverage_geojson(db)
    return select_dem_tif_polygons_geojson(db)


@app.get("/track-routes/{track_id}")
async def get_track_details(track_id: int, db: Session = Depends(get_db)):
    return select_track_routes_by_track_id(db, track_id)

@app.get("/track-info/{track_id}")
async def get_track_details(track_id: int, db: Session = Depends(get_db)):
    return select_track_by_id(db, track_id)

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

@app.post("/search/map")
def search_map_items(
    filters: TrackSearchRequest,
    db: Session = Depends(get_db),
):
    items = []
    fuzzy_search = filters.fuzzy_search
    print(f"fuzzySearch={fuzzy_search}, ,")

    if filters.fuzzy_search and filters.fuzzy_search.strip():
        items.extend(fuzzy_search_tracks(db, filters, 1, 70))
    else:
        items.extend(exact_search_tracks(db, filters))

    return {
        "count": len(items),
        "items": items,
    }

