import json

import geopandas as gpd
import pandas as pd
from sqlalchemy import create_engine

GEOJSON_PATH = "/Users/alex/Downloads/osm_resources.geojson"

engine = create_engine(
    "postgresql+psycopg2://alex@localhost:5432/postgres"
)


def get_facility_type(row):
    if row.get("amenity") == "toilets":
        return "toilet"
    if row.get("amenity") == "parking":
        return "parking"
    if row.get("amenity") == "drinking_water":
        return "drinking_water"
    if row.get("amenity") == "shelter":
        return "shelter"
    if row.get("tourism") == "viewpoint":
        return "viewpoint"
    if row.get("tourism") == "picnic_site":
        return "picnic_site"
    if row.get("natural") == "peak":
        return "peak"
    return None


ALLOWED_ATTR_FIELDS = [
    "amenity",
    "tourism",
    "natural",
    "access",
    "wheelchair",
    "fee",
    "opening_hours",
    "operator",
    "description",
    "capacity",
    "surface",
    "website",
    "url",
    "phone",
    "shelter",
    "shelter_type",
    "drinking_water",
    "toilets",
    "toilet",
    "parking",
    "viewpoint",
    "picnic_table",
    "bbq",
    "bench",
    "dog",
    "lit",
    "covered",
    "indoor",
    "supervised",
    "reservation",
    "caravans",
    "tents",
    "sanitary_dump_station",
    "power_supply",
    "shower",
    "hot_water",
    "cold_water",
    "male",
    "female",
    "unisex",
    "gender_segregated",
    "toilets:wheelchair",
    "toilets:access",
    "toilets:disabled",
    "toilets:fee",
    "toilets:number",
    "toilets:paper_supplied",
    "toilets:handwashing",
    "toilets:handwashing:soap",
    "toilets:hot_water",
]

TIME_FIELDS = [
    "check_date",
    "check_date:fee",
    "check_date:opening_hours",
    "check_date:wheelchair",
    "survey:date",
    "start_date",
]


def normalize_value(value):
    if pd.isna(value):
        return None

    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass

    if isinstance(value, pd.Timestamp):
        return None

    return value


def build_attr(row):
    tags = {}

    for col in ALLOWED_ATTR_FIELDS:
        if col in row.index and col not in TIME_FIELDS:
            value = normalize_value(row.get(col))
            if value is not None:
                tags[col] = value

    return tags


gdf = gpd.read_file(GEOJSON_PATH)

print("Original columns:")
print(gdf.columns.tolist())
print(f"Total records: {len(gdf)}")

gdf["facility_type"] = gdf.apply(get_facility_type, axis=1)
gdf = gdf[gdf["facility_type"].notnull()].copy()

print(f"Facilities after filtering: {len(gdf)}")

if "ele" in gdf.columns:
    gdf["elevation"] = pd.to_numeric(gdf["ele"], errors="coerce")
elif "elevation" in gdf.columns:
    gdf["elevation"] = pd.to_numeric(gdf["elevation"], errors="coerce")
else:
    gdf["elevation"] = pd.Series([pd.NA] * len(gdf), dtype="Int64")

gdf["elevation"] = gdf["elevation"].round().astype("Int64")

if "@id" in gdf.columns:
    gdf["osm_id"] = gdf["@id"].astype(str)
elif "id" in gdf.columns:
    gdf["osm_id"] = gdf["id"].astype(str)
else:
    raise ValueError("No OSM id column found ('@id' or 'id').")

gdf["osm_type"] = "node"

gdf["attr"] = gdf.apply(build_attr, axis=1)
gdf["attr"] = gdf["attr"].apply(lambda x: json.dumps(x, ensure_ascii=False))

if gdf.crs is None:
    gdf = gdf.set_crs(epsg=4326)
elif gdf.crs.to_epsg() != 4326:
    gdf = gdf.to_crs(epsg=4326)

gdf = gdf[gdf.geometry.notnull()].copy()
gdf = gdf[gdf.geometry.geom_type == "Point"].copy()

gdf = gdf.rename_geometry("geom")

gdf = gdf[
    [
        "osm_id",
        "osm_type",
        "name",
        "facility_type",
        "elevation",
        "attr",
        "geom",
    ]
].copy()

print("Final columns:")
print(gdf.columns.tolist())
print(gdf.head())

gdf.to_postgis(
    name="kiwi_osm_facilities",
    con=engine,
    if_exists="append",
    index=False,
)

print("OSM facilities import completed successfully.")