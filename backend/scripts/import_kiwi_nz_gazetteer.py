import pandas as pd
import geopandas as gpd
from sqlalchemy import create_engine

CSV_PATH = "/Users/alex/Downloads/gaz_csv.csv"
DATABASE_URL = "postgresql+psycopg2://alex@localhost:5432/postgres"
TABLE_NAME = "kiwi_nz_gazetteer"

engine = create_engine(DATABASE_URL)

df = pd.read_csv(CSV_PATH)

print("Original columns:")
print(df.columns.tolist())
print(f"Total records: {len(df)}")

# Convert numeric fields
numeric_cols = [
    "name_id",
    "feat_id",
    "crd_north",
    "crd_east",
    "crd_latitude",
    "crd_longitude",
    "height",
    "accuracy_rating",
]

if "accuracy_rating" in df.columns:
    df["accuracy_rating"] = pd.to_numeric(df["accuracy_rating"], errors="coerce")
    df["accuracy_rating"] = df["accuracy_rating"].round().astype("Int64")

# Build geometry from lon/lat
gdf = gpd.GeoDataFrame(
    df,
    geometry=gpd.points_from_xy(
        df["crd_longitude"],
        df["crd_latitude"],
        crs="EPSG:4326",
    ),
)

# Set invalid coords to NULL geometry
gdf["geometry"] = gdf["geometry"].where(
    df["crd_longitude"].notna() & df["crd_latitude"].notna(),
    None,
)

# Rename geometry column
gdf = gdf.rename_geometry("geom")

print("Null count by column:")
print(gdf.isna().sum().sort_values(ascending=False).head(20))

print("Final columns:")
print(gdf.columns.tolist())

gdf.to_postgis(
    name=TABLE_NAME,
    con=engine,
    if_exists="append",
    index=False,
)

print("Gazetteer import completed successfully.")