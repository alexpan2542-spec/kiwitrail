import geopandas as gpd
from sqlalchemy import create_engine
import pandas as pd

# ===== 1. 文件路径 =====
GEOJSON_PATH = "/Users/alex/Downloads/DOC_Huts_-8641252350040959704.geojson"

# ===== 2. 数据库连接 =====
engine = create_engine("postgresql+psycopg2://alex@localhost:5432/postgres")

# ===== 3. 读取 GeoJSON =====
gdf = gpd.read_file(GEOJSON_PATH)

print("Original columns:")
print(gdf.columns.tolist())
print(f"Total records: {len(gdf)}")

# ===== 4. 字段映射 =====
column_mapping = {
    "OBJECTID": "source_objectid",
    "assetId": "asset_id",
    "GlobalID": "global_id",
    "name": "name",
    "place": "place",
    "region": "region",
    "locationString": "location_string",
    "bookable": "bookable",
    "facilities": "facilities",
    "hasAlerts": "has_alerts",
    "introductionThumbnail": "thumbnail_url",
    "staticLink": "source_page_url",
    "x": "source_x",
    "y": "source_y",
    "dateLoadedToGIS": "source_loaded_at",
}

gdf = gdf.rename(columns=column_mapping)

# ===== 5. 保留需要的字段 =====
keep_cols = [
    "source_objectid",
    "asset_id",
    "global_id",
    "name",
    "place",
    "region",
    "location_string",
    "bookable",
    "facilities",
    "has_alerts",
    "thumbnail_url",
    "source_page_url",
    "source_x",
    "source_y",
    "source_loaded_at",
    "geometry",
]

existing_cols = [c for c in keep_cols if c in gdf.columns]
gdf = gdf[existing_cols].copy()

# ===== 6. 清理数据 =====
if "source_loaded_at" in gdf.columns:
    gdf["source_loaded_at"] = pd.to_datetime(
        gdf["source_loaded_at"], errors="coerce"
    )

if gdf.crs is None:
    gdf = gdf.set_crs(epsg=4326)
elif gdf.crs.to_epsg() != 4326:
    gdf = gdf.to_crs(epsg=4326)

gdf = gdf[gdf.geometry.notnull()].copy()
gdf = gdf[gdf.geometry.geom_type.isin(["Point", "MultiPoint"])].copy()

print(f"Valid records after cleaning: {len(gdf)}")

# ===== 7. geometry 改名 =====
gdf = gdf.rename_geometry("geom")

# ===== 8. 导入数据库 =====
gdf.to_postgis(
    name="kiwi_huts",
    con=engine,
    if_exists="append",
    index=False,
)

print("Huts import completed successfully.")