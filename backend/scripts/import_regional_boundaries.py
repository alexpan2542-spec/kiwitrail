import geopandas as gpd
from sqlalchemy import create_engine

shp_path = "/Users/alex/Downloads/statsnz-regional-council-2025-SHP/regional-council-2025.shp"
db_url = "postgresql+psycopg2://alex@localhost:5432/postgres"

table_name = "kiwi_regional_boundaries"

gdf = gpd.read_file(shp_path)

# Rename columns
gdf = gdf.rename(columns={
    "REGC2025_V": "region_code",
    "REGC2025_1": "region_name",
    "LAND_AREA_": "land_area",
    "AREA_SQ_KM": "area_sq_km",
    "SHAPE_LENG": "shape_length"
})

# Keep only columns that actually exist
columns = ["region_code", "region_name", "land_area", "area_sq_km", "shape_length"]
columns = [c for c in columns if c in gdf.columns]

gdf = gdf[columns + ["geometry"]]

# Match database geometry column name
gdf = gdf.rename_geometry("geom")

engine = create_engine(db_url)

gdf.to_postgis(
    name=table_name,
    con=engine,
    schema="public",
    if_exists="append",
    index=False
)

print("Import completed successfully.")