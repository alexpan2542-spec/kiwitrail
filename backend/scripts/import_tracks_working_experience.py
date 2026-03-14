import geopandas as gpd
from sqlalchemy import create_engine, text
from datetime import datetime
import pandas as pd

GEOJSON_PATH = "/Users/alex/Downloads/DOC_Walking_Experiences_5222839699300357084.geojson"

engine = create_engine(
    f"postgresql+psycopg2://alex@localhost:5432/postgres"
)

# ========= 4. Read GeoJSON =========
gdf = gpd.read_file(GEOJSON_PATH)

print("Original columns:")
print(gdf.columns.tolist())
print(f"Total records: {len(gdf)}")

# ========= 5. Rename columns to match tracks table =========
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

# Keep only needed columns if they exist
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

existing_cols = [col for col in keep_cols if col in gdf.columns]
gdf = gdf[existing_cols].copy()

# ========= 6. Clean data =========
# Convert dateLoadedToGIS to datetime if present
if "source_loaded_at" in gdf.columns:
    gdf["source_loaded_at"] = pd.to_datetime(
        gdf["source_loaded_at"], errors="coerce"
    )

# Ensure CRS is WGS84
if gdf.crs is None:
    gdf = gdf.set_crs(epsg=4326)
elif gdf.crs.to_epsg() != 4326:
    gdf = gdf.to_crs(epsg=4326)

# Remove rows with missing geometry
gdf = gdf[gdf.geometry.notnull()].copy()

# Keep only LineString / MultiLineString if needed
gdf = gdf[gdf.geometry.geom_type.isin(["LineString", "MultiLineString"])].copy()

print(f"Valid records after cleaning: {len(gdf)}")

# ========= 8. Rename geometry column for PostGIS =========
gdf = gdf.rename_geometry("geom")

# ========= 9. Import into database =========
# Use replace for first test, then change to append later if needed
gdf.to_postgis(
    name="kiwi_tracks",
    con=engine,
    if_exists="append",
    index=False,
)

print("Import completed successfully.")