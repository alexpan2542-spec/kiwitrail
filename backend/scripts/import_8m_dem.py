import os
from pathlib import Path

from sqlalchemy import create_engine, text
import rasterio
from shapely.geometry import box
from shapely.ops import transform as shapely_transform
from shapely.wkt import dumps as wkt_dumps
from pyproj import Transformer


DATABASE_URL = "postgresql+psycopg2://alex@localhost:5432/postgres"
DEM_FOLDER = "/Users/alex/Downloads/lds-nz-8m-digital-elevation-model-2012-GTiff"
TARGET_EPSG = 4326


def get_tif_files(folder: str):
    return sorted(Path(folder).rglob("*.tif"))


def build_footprint_in_4326(tif_path: str):
    with rasterio.open(tif_path) as src:
        if src.crs is None:
            raise ValueError(f"No CRS found in raster: {tif_path}")

        bounds = src.bounds
        geom = box(bounds.left, bounds.bottom, bounds.right, bounds.top)

        src_epsg = src.crs.to_epsg()
        if src_epsg is None:
            raise ValueError(f"Could not determine EPSG for raster: {tif_path} (CRS={src.crs})")

        if src_epsg != TARGET_EPSG:
            transformer = Transformer.from_crs(src.crs, f"EPSG:{TARGET_EPSG}", always_xy=True)
            geom = shapely_transform(transformer.transform, geom)

        return {
            "name": os.path.basename(tif_path),
            "file_path": str(Path(tif_path).resolve()),
            "geom_wkt": wkt_dumps(geom),
            "src_epsg": src_epsg,
        }


def main():
    tif_files = get_tif_files(DEM_FOLDER)

    if not tif_files:
        print(f"No .tif files found in: {DEM_FOLDER}")
        return

    print(f"Found {len(tif_files)} tif files")

    rows = []
    failed = []

    for tif in tif_files:
        try:
            row = build_footprint_in_4326(str(tif))
            rows.append(row)
            print(f"Prepared: {tif.name} (source EPSG: {row['src_epsg']})")
        except Exception as e:
            failed.append((str(tif), str(e)))
            print(f"Failed: {tif} -> {e}")

    if not rows:
        print("No valid rasters to insert.")
        return

    engine = create_engine(DATABASE_URL)

    insert_sql = text("""
        INSERT INTO kiwi_nz_8m_dem (name, file_path, geom)
        VALUES (:name, :file_path, ST_GeomFromText(:geom_wkt, 4326))
        ON CONFLICT (name)
        DO UPDATE SET
            file_path = EXCLUDED.file_path,
            geom = EXCLUDED.geom
    """)

    try:
        with engine.begin() as conn:
            for row in rows:
                conn.execute(insert_sql, row)

        print(f"\nInserted/updated {len(rows)} DEM tiles into kiwi_nz_8m_dem.")

        if failed:
            print("\nFailed files:")
            for path, err in failed:
                print(f"- {path}: {err}")

    finally:
        engine.dispose()


if __name__ == "__main__":
    main()