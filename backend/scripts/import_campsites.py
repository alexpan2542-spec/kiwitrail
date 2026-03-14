import geopandas as gpd
from sqlalchemy import create_engine
import pandas as pd

GEOJSON_PATH = "/Users/alex/Downloads/DOC_Campsites_2849368550195278262.geojson"
engine = create_engine("postgresql+psycopg2://alex@localhost:5432/postgres")

gdf = gpd.read_file(GEOJSON_PATH)

print("Original columns:")
print(gdf.columns.tolist())
print(f"Total records: {len(gdf)}")


column_mapping = {
    "OBJECTID": "source_objectid",
    "assetId": "asset_id",
    "name": "name",
    "region": "region",
    "campsiteCategory": "campsite_category",
    "numberOfPoweredSites": "number_of_powered_sites",
    "numberOfUnpoweredSites": "number_of_unpowered_sites",
    "bookable": "bookable",
    "facilities": "facilities",
    "staticLink": "source_page_url",
}

gdf = gdf.rename(columns=column_mapping)

# ===== 5. 只保留表里需要的字段 =====
keep_cols = [
    "source_objectid",
    "asset_id",
    "name",
    "region",
    "campsite_category",
    "number_of_powered_sites",
    "number_of_unpowered_sites",
    "bookable",
    "facilities",
    "source_page_url",
    "geometry",
]

existing_cols = [c for c in keep_cols if c in gdf.columns]
gdf = gdf[existing_cols].copy()

# ===== 6. CRS 检查 =====
if gdf.crs is None:
    gdf = gdf.set_crs(epsg=4326)
elif gdf.crs.to_epsg() != 4326:
    gdf = gdf.to_crs(epsg=4326)

# ===== 7. 删除空 geometry =====
gdf = gdf[gdf.geometry.notnull()].copy()

# campsites 应该都是 Point，保守一点还是过滤一下
gdf = gdf[gdf.geometry.geom_type.isin(["Point", "MultiPoint"])].copy()

print(f"Valid records after cleaning: {len(gdf)}")

# ===== 8. geometry 改名为 geom =====
gdf = gdf.rename_geometry("geom")

# ===== 9. 导入数据库 =====
gdf.to_postgis(
    name="kiwi_campsites",
    con=engine,
    if_exists="append",
    index=False,
)

print("Campsites import completed successfully.")