import geopandas as gpd
import pandas as pd
from sqlalchemy import create_engine

GEOJSON_PATH = "/Users/alex/Downloads/DOC_Campsites_2849368550195278262.geojson"
DATABASE_URL = "postgresql+psycopg2://alex@localhost:5432/postgres"
TABLE_NAME = "kiwi_campsites"

engine = create_engine(DATABASE_URL)

gdf = gpd.read_file(GEOJSON_PATH)

print("Original columns:")
print(gdf.columns.tolist())
print(f"Total records: {len(gdf)}")

column_mapping = {
    "OBJECTID": "source_objectid",
    "assetId": "asset_id",
    "GlobalID": "global_id",
    "name": "name",
    "place": "place",
    "region": "region",
    "introduction": "introduction",
    "introductionThumbnail": "introduction_thumbnail",
    "staticLink": "source_page_url",
    "campsiteCategory": "campsite_category",
    "numberOfPoweredSites": "number_of_powered_sites",
    "numberOfUnpoweredSites": "number_of_unpowered_sites",
    "bookable": "bookable",
    "free": "free",
    "hasAlerts": "has_alerts",
    "facilities": "facilities",
    "activities": "activities",
    "dogsAllowed": "dogs_allowed",
    "access": "access",
    "landscape": "landscape",
    "locationString": "location_string",
    "x": "x",
    "y": "y",
    "dateLoadedToGIS": "date_loaded_to_gis",
}

gdf = gdf.rename(columns=column_mapping)

keep_cols = [
    "source_objectid",
    "asset_id",
    "global_id",
    "name",
    "place",
    "region",
    "introduction",
    "introduction_thumbnail",
    "source_page_url",
    "campsite_category",
    "number_of_powered_sites",
    "number_of_unpowered_sites",
    "bookable",
    "free",
    "has_alerts",
    "facilities",
    "activities",
    "dogs_allowed",
    "access",
    "landscape",
    "location_string",
    "x",
    "y",
    "date_loaded_to_gis",
    "geometry",
]

gdf = gdf[[c for c in keep_cols if c in gdf.columns]].copy()

print("Columns after selection:")
print(gdf.columns.tolist())

# CRS normalization
if gdf.crs is None:
    gdf = gdf.set_crs(epsg=4326)
elif gdf.crs.to_epsg() != 4326:
    gdf = gdf.to_crs(epsg=4326)

# Keep valid geometries only
gdf = gdf[gdf.geometry.notnull()].copy()
gdf = gdf[gdf.geometry.geom_type == "Point"].copy()

# Boolean normalization
for col in ["bookable", "free", "has_alerts", "dogs_allowed"]:
    if col in gdf.columns:
        gdf[col] = gdf[col].apply(
            lambda v: v if isinstance(v, bool)
            else str(v).strip().lower() in {"true", "t", "1", "yes", "y"}
        )

# Numeric conversion
for col in [
    "source_objectid",
    "asset_id",
    "number_of_powered_sites",
    "number_of_unpowered_sites",
]:
    if col in gdf.columns:
        gdf[col] = pd.to_numeric(gdf[col], errors="coerce")

for col in ["x", "y"]:
    if col in gdf.columns:
        gdf[col] = pd.to_numeric(gdf[col], errors="coerce")

# Timestamp parsing
if "date_loaded_to_gis" in gdf.columns:
    gdf["date_loaded_to_gis"] = pd.to_datetime(
        gdf["date_loaded_to_gis"], errors="coerce"
    )

# Rename geometry column
gdf = gdf.rename_geometry("geom")

print(f"Valid records after cleaning: {len(gdf)}")
print("Final columns:")
print(gdf.columns.tolist())

gdf.to_postgis(
    name=TABLE_NAME,
    con=engine,
    if_exists="append",
    index=False,
)

print("Import completed successfully.")