import geopandas as gpd
import pandas as pd
from sqlalchemy import create_engine

GEOJSON_PATH = "/Users/alex/Downloads/DOC_Walking_Experiences_5222839699300357084.geojson"
DATABASE_URL = "postgresql+psycopg2://alex@localhost:5432/postgres"
TABLE_NAME = "kiwi_tracks"

engine = create_engine(DATABASE_URL)

gdf = gpd.read_file(GEOJSON_PATH)

print("Original columns:")
print(gdf.columns.tolist())
print(f"Total records: {len(gdf)}")

column_mapping = {
    "OBJECTID": "source_objectid",
    "name": "name",
    "introduction": "introduction",
    "difficulty": "difficulty",
    "completionTime": "completion_time",
    "hasAlerts": "has_alerts",
    "introductionThumbnail": "thumbnail_url",
    "walkingAndTrampingWebPage": "source_page_url",
    "dateLoadedToGIS": "source_loaded_at",
}

gdf = gdf.rename(columns=column_mapping)

keep_cols = [
    "source_objectid",
    "name",
    "introduction",
    "difficulty",
    "completion_time",
    "has_alerts",
    "thumbnail_url",
    "source_page_url",
    "source_loaded_at",
    "geometry",
]

gdf = gdf[[c for c in keep_cols if c in gdf.columns]].copy()

print("Columns after selection:")
print(gdf.columns.tolist())

if gdf.crs is None:
    gdf = gdf.set_crs(epsg=4326)
elif gdf.crs.to_epsg() != 4326:
    gdf = gdf.to_crs(epsg=4326)

gdf = gdf[gdf.geometry.notnull()].copy()
gdf = gdf[gdf.geometry.geom_type.isin(["LineString", "MultiLineString"])].copy()

if "source_objectid" in gdf.columns:
    gdf["source_objectid"] = pd.to_numeric(gdf["source_objectid"], errors="coerce")

if "source_loaded_at" in gdf.columns:
    gdf["source_loaded_at"] = pd.to_datetime(gdf["source_loaded_at"], errors="coerce")

gdf = gdf.rename_geometry("geom")

print(f"Valid records after cleaning: {len(gdf)}")
print("Final columns:")
print(gdf.columns.tolist())
print("\nNull count:")
print(gdf.isna().sum().sort_values(ascending=False))

gdf.to_postgis(
    name=TABLE_NAME,
    con=engine,
    if_exists="append",
    index=False,
)

print("Tracks import completed successfully.")