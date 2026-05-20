import os
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends
from fastapi import FastAPI
from fastapi import UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.staticfiles import StaticFiles

from db import engine, get_db, SessionLocal
from repositories.region_repository import select_dem_tif_polygons_geojson
from repositories.track_repository import select_track_by_id, select_track_routes_by_track_id
from schema import TrackSearchRequest, CommentSchema, FavouriteSchema
from services.search_gazetteer_service import gazetteer_searcher
from services.search_items_service import search_items


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Preloading...")
    db = SessionLocal()
    try:
        gazetteer_searcher.preload_data(db)
    finally:
        db.close()
    yield

app = FastAPI(lifespan=lifespan)

origins = os.getenv("ALLOWED_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.getenv("COMMENT_UPLOAD_DIR", "uploads/comments")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

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

@app.post("/search/items")
def search_map_items(
    filters: TrackSearchRequest,
    db: Session = Depends(get_db),
):
    items = []
    items.extend(search_items(db, filters))

    return {
        "count": len(items),
        "items": items,
    }


@app.post("/search/gazetteer")
def search_gatezzeer(
    filters: TrackSearchRequest,
    db: Session = Depends(get_db),
):

    items = gazetteer_searcher.search(db, filters)
    for item in items:
        print(item["name"] )
        print("lat=" + str(item["lat"]) + ", lon=" + str(item["lng"]))

    return {
        "count": len(items),
        "items": items,
    }

from repositories.comment_repository import select_comments_by_item, insert_user_comment
from repositories.favourite_repository import (
    is_favourited,
    insert_favourite,
    delete_favourite,
    select_favourites_by_user,
    select_favourite_items_enriched,
)

@app.get("/comments/{item_type}/{item_id}")
async def get_comments(item_type: str, item_id: int, db: Session = Depends(get_db)):
    comments = select_comments_by_item(db, item_type, item_id)
    return {
        "item_type": item_type,
        "item_id": item_id,
        "count": len(comments),
        "items": comments
    }

@app.post("/comments/add")
async def add_comment(comment_data: CommentSchema, db: Session = Depends(get_db)):
    new_entry = insert_user_comment(
        db,
        comment_data.item_type,
        comment_data.item_id,
        comment_data.user_name,
        comment_data.rating,
        comment_data.comment_text,
        comment_data.image_url_1,
        comment_data.image_url_2,
        comment_data.image_url_3
    )
    return {"status": "success", "id": new_entry[0]}

@app.get("/favourites")
async def list_favourites(user_email: str, db: Session = Depends(get_db)):
    items = select_favourites_by_user(db, user_email)
    return {
        "user_email": user_email,
        "count": len(items),
        "items": items,
    }


@app.get("/favourites/items")
async def list_favourite_items(user_email: str, db: Session = Depends(get_db)):
    items = select_favourite_items_enriched(db, user_email)
    return {
        "user_email": user_email,
        "count": len(items),
        "items": items,
    }


@app.get("/favourites/{item_type}/{item_id}")
async def get_favourite_status(
    item_type: str,
    item_id: int,
    user_email: str,
    db: Session = Depends(get_db),
):
    favoured = is_favourited(db, user_email, item_type, item_id)
    return {
        "item_type": item_type,
        "item_id": item_id,
        "user_email": user_email,
        "favoured": favoured,
    }


@app.post("/favourites")
async def add_favourite(favourite: FavouriteSchema, db: Session = Depends(get_db)):
    new_id = insert_favourite(
        db,
        favourite.user_email,
        favourite.item_type,
        favourite.item_id,
    )
    return {
        "status": "success",
        "favoured": True,
        "id": new_id,
    }


@app.delete("/favourites/{item_type}/{item_id}")
async def remove_favourite(
    item_type: str,
    item_id: int,
    user_email: str,
    db: Session = Depends(get_db),
):
    removed = delete_favourite(db, user_email, item_type, item_id)
    return {
        "status": "success",
        "favoured": False,
        "removed": removed,
    }


@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    raw = (file.filename or "").strip() or "upload"
    if "." in raw:
        ext = raw.rsplit(".", 1)[-1].lower()
        file_extension = ext if ext.isalnum() else "bin"
    else:
        file_extension = "bin"
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {"url": f"/static/{file_name}"}
