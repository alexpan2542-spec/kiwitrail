import math
import os
from typing import Dict, List, Optional, Tuple

from sqlalchemy import create_engine, text
from shapely import wkb
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import transform
from pyproj import Transformer
import rasterio


DATABASE_URL = "postgresql+psycopg2://alex@localhost:5432/postgres"
DEM_FOLDER = "/Users/alex/Downloads/lds-nz-8m-digital-elevation-model-2012-GTiff"
TARGET_EPSG = 4326

ROUTE_TABLE = "kiwi_track_route"
DEM_TABLE = "kiwi_nz_8m_dem"

SAMPLE_STEP_M = 10
LENGTH_EPSG = 2193  # NZTM2000


def ensure_columns(engine) -> None:
    ddl = f"""
    ALTER TABLE {ROUTE_TABLE}
    ADD COLUMN IF NOT EXISTS length_m integer,
    ADD COLUMN IF NOT EXISTS elev_min integer,
    ADD COLUMN IF NOT EXISTS elev_max integer,
    ADD COLUMN IF NOT EXISTS elevation_profile integer[],
    ADD COLUMN IF NOT EXISTS elevation_step_m integer;
    """
    with engine.begin() as conn:
        conn.execute(text(ddl))


def get_routes(engine) -> List[Tuple[int, LineString]]:
    sql = text(f"""
        SELECT id, ST_AsBinary(geom) AS geom_wkb
        FROM {ROUTE_TABLE}
        WHERE geom IS NOT NULL
        and length_m is null
        ORDER BY id
    """)
    routes = []
    with engine.connect() as conn:
        rows = conn.execute(sql).fetchall()
        for row in rows:
            geom = wkb.loads(bytes(row.geom_wkb))
            if geom.is_empty:
                continue
            if geom.geom_type != "LineString":
                continue
            routes.append((row.id, geom))
    return routes


def get_dem_candidates(engine, route_geom: LineString) -> List[Tuple[str, Polygon]]:
    sql = text(f"""
        SELECT
            COALESCE(file_path, '') AS filepath,
            ST_AsBinary(geom) AS geom_wkb
        FROM {DEM_TABLE}
        WHERE ST_Intersects(
            geom,
            ST_GeomFromText(:wkt, :srid)
        )
    """)
    candidates = []
    with engine.connect() as conn:
        rows = conn.execute(sql, {"wkt": route_geom.wkt, "srid": TARGET_EPSG}).fetchall()
        for row in rows:
            footprint = wkb.loads(bytes(row.geom_wkb))
            filepath = row.filepath.strip() if row.filepath else ""
            if not filepath:
                continue
            if not os.path.isabs(filepath):
                filepath = os.path.join(DEM_FOLDER, os.path.basename(filepath))
            if not os.path.exists(filepath):
                alt = os.path.join(DEM_FOLDER, os.path.basename(filepath))
                if os.path.exists(alt):
                    filepath = alt
                else:
                    continue
            candidates.append((filepath, footprint))
    return candidates


def build_sample_distances(length_m: float, step_m: int) -> List[float]:
    if length_m <= 0:
        return [0.0]

    distances = list(range(0, int(math.floor(length_m)), step_m))
    if not distances or distances[-1] != int(round(length_m)):
        distances.append(length_m)
    return distances


def sample_route_elevations(
    route_geom_4326: LineString,
    dem_candidates: List[Tuple[str, Polygon]],
    step_m: int = SAMPLE_STEP_M,
) -> Tuple[int, Optional[int], Optional[int], List[Optional[int]]]:
    to_length_crs = Transformer.from_crs(TARGET_EPSG, LENGTH_EPSG, always_xy=True)
    from_length_crs = Transformer.from_crs(LENGTH_EPSG, TARGET_EPSG, always_xy=True)

    route_geom_metric = transform(to_length_crs.transform, route_geom_4326)
    route_length_m = route_geom_metric.length
    distances = build_sample_distances(route_length_m, step_m)

    datasets = []
    raster_transformers: Dict[str, Transformer] = {}

    try:
        for filepath, footprint in dem_candidates:
            ds = rasterio.open(filepath)
            datasets.append((filepath, ds, footprint))
            raster_transformers[filepath] = Transformer.from_crs(
                TARGET_EPSG, ds.crs, always_xy=True
            )

        profile: List[Optional[int]] = []

        for dist_m in distances:
            pt_metric = route_geom_metric.interpolate(dist_m)
            pt_4326 = transform(from_length_crs.transform, pt_metric)
            x, y = pt_4326.x, pt_4326.y
            point_4326 = Point(x, y)

            elevation = None

            for filepath, ds, footprint in datasets:
                if not (footprint.contains(point_4326) or footprint.intersects(point_4326)):
                    continue

                tx = raster_transformers[filepath]
                rx, ry = tx.transform(x, y)

                left, bottom, right, top = ds.bounds
                if not (left <= rx <= right and bottom <= ry <= top):
                    continue

                value = next(ds.sample([(rx, ry)]))[0]

                if hasattr(value, "item"):
                    value = value.item()

                if value is None:
                    continue

                nodata = ds.nodata
                if nodata is not None and value == nodata:
                    continue

                try:
                    if math.isnan(float(value)):
                        continue
                except Exception:
                    pass

                elevation = int(round(float(value)))
                break

            profile.append(elevation)

        valid = [v for v in profile if v is not None]
        elev_min = min(valid) if valid else None
        elev_max = max(valid) if valid else None

        return int(round(route_length_m)), elev_min, elev_max, profile

    finally:
        for _, ds, _ in datasets:
            ds.close()


def update_route(
    engine,
    route_id: int,
    length_m: Optional[int],
    elev_min: Optional[int],
    elev_max: Optional[int],
    elevation_profile: List[Optional[int]],
    elevation_step_m: int,
) -> None:
    sql = text(f"""
        UPDATE {ROUTE_TABLE}
        SET
            length_m = :length_m,
            elev_min = :elev_min,
            elev_max = :elev_max,
            elevation_profile = :elevation_profile,
            elevation_step_m = :elevation_step_m
        WHERE id = :route_id
    """)
    with engine.begin() as conn:
        conn.execute(
            sql,
            {
                "route_id": route_id,
                "length_m": length_m,
                "elev_min": elev_min,
                "elev_max": elev_max,
                "elevation_profile": elevation_profile,
                "elevation_step_m": elevation_step_m,
            },
        )


def main() -> None:
    engine = create_engine(DATABASE_URL)

    ensure_columns(engine)
    routes = get_routes(engine)

    print(f"Found {len(routes)} routes")

    for idx, (route_id, route_geom) in enumerate(routes, start=1):
        try:
            dem_candidates = get_dem_candidates(engine, route_geom)

            if not dem_candidates:
                print(f"[{idx}/{len(routes)}] route {route_id}: no DEM tiles found")
                update_route(
                    engine,
                    route_id=route_id,
                    length_m=None,
                    elev_min=None,
                    elev_max=None,
                    elevation_profile=[],
                    elevation_step_m=SAMPLE_STEP_M,
                )
                continue

            length_m, elev_min, elev_max, profile = sample_route_elevations(
                route_geom_4326=route_geom,
                dem_candidates=dem_candidates,
                step_m=SAMPLE_STEP_M,
            )

            update_route(
                engine,
                route_id=route_id,
                length_m=length_m,
                elev_min=elev_min,
                elev_max=elev_max,
                elevation_profile=profile,
                elevation_step_m=SAMPLE_STEP_M,
            )

            print(
                f"[{idx}/{len(routes)}] route {route_id}: "
                f"length={length_m}m, samples={len(profile)}, "
                f"min={elev_min}, max={elev_max}"
            )

        except Exception as e:
            print(f"[{idx}/{len(routes)}] route {route_id}: ERROR: {e}")


if __name__ == "__main__":
    main()