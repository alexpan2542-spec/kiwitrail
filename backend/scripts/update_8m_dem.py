import os

from sqlalchemy import create_engine, text
import rasterio
from shapely.geometry import box
from shapely.ops import transform
from pyproj import CRS, Transformer


DATABASE_URL = "postgresql+psycopg2://alex@localhost:5432/postgres"
TIFF_FOLDER = "/Users/alex/Downloads/lds-nz-8m-digital-elevation-model-2012-GTiff_2"

DB_SRID = 4326


def build_tif_index(folder):
    tif_index = {}
    for root, _, files in os.walk(folder):
        for f in files:
            if f.lower().endswith((".tif", ".tiff")):
                tif_index[f.lower()] = os.path.join(root, f)
    return tif_index


def find_tif_by_name(file_name, tif_index):
    if not file_name:
        return None

    name = file_name.strip().lower()

    if name in tif_index:
        return tif_index[name]

    if not name.endswith(".tif") and not name.endswith(".tiff"):
        if name + ".tif" in tif_index:
            return tif_index[name + ".tif"]
        if name + ".tiff" in tif_index:
            return tif_index[name + ".tiff"]

    return None


def reproject_geom(geom, src_crs, dst_crs):
    src = CRS.from_user_input(src_crs)
    dst = CRS.from_user_input(dst_crs)

    if src == dst:
        return geom

    transformer = Transformer.from_crs(src, dst, always_xy=True)
    return transform(transformer.transform, geom)


def get_tif_bounds_polygon_in_4326(tif_path):
    with rasterio.open(tif_path) as ds:
        bounds = ds.bounds
        tif_crs = ds.crs
        tif_poly = box(bounds.left, bounds.bottom, bounds.right, bounds.top)

    if tif_crs is None:
        raise ValueError(f"tif 没有 CRS: {tif_path}")

    tif_poly_4326 = reproject_geom(tif_poly, tif_crs, CRS.from_epsg(DB_SRID))
    return tif_poly_4326


def update_polygon_by_file_name(file_name):
    """
    用 folder 中指定 file_name 的 tif 边界更新数据库 kiwi_nz_8m_dem.geom
    """
    engine = create_engine(DATABASE_URL)
    tif_index = build_tif_index(TIFF_FOLDER)

    tif_path = find_tif_by_name(file_name, tif_index)
    if not tif_path:
        print(f"[找不到 tif] {file_name}")
        return

    try:
        poly_4326 = get_tif_bounds_polygon_in_4326(tif_path)
        wkt_text = poly_4326.wkt

        update_sql = text("""
            UPDATE kiwi_nz_8m_dem
            SET geom = ST_SetSRID(ST_GeomFromText(:wkt), 4326)
            WHERE lower(file_name) = lower(:file_name)
               OR lower(file_name) = lower(:file_name_no_ext)
        """)

        file_name_no_ext = os.path.splitext(file_name)[0]

        with engine.begin() as conn:
            result = conn.execute(
                update_sql,
                {
                    "wkt": wkt_text,
                    "file_name": file_name,
                    "file_name_no_ext": file_name_no_ext,
                },
            )

        print(f"[更新完成] {file_name} -> 更新了 {result.rowcount} 条记录")

    except Exception as e:
        print(f"[更新失败] {file_name}: {e}")


if __name__ == '__main__':
    #update_polygon_by_file_name("92L8Z-92L35.tif")
    update_polygon_by_file_name("92L93-92L35.tif")