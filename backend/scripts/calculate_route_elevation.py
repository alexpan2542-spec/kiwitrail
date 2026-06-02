import math
import os
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from sqlalchemy import create_engine, text
from shapely import wkb
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import transform
from pyproj import Transformer
import rasterio


DATABASE_URL = "postgresql+psycopg2://superpan:tobeaKiwi123!@170.64.197.91:5432/superpan"
DEM_FOLDER = "/Users/alex/Downloads/lds-nz-8m-digital-elevation-model-2012-GTiff"
TARGET_EPSG = 4326

TRACK_3D_TABLE = "kiwi_track_3d"

SAMPLE_STEP_M = 10
LENGTH_EPSG = 2193  # NZTM2000


@dataclass(frozen=True)
class TrackSegment:
    track_id: int
    route_no: int
    geom: LineString


@dataclass(frozen=True)
class RouteSample:
    seq: int
    dist_m: int
    lng: float
    lat: float
    elevation_m: Optional[int]


def get_track_segments(engine) -> List[TrackSegment]:
    """One LineString per route segment, split from kiwi_tracks.geom (same rules as kiwi_track_route)."""
    sql = text("""
        SELECT
            kt.id AS track_id,
            COALESCE((d.path)[1], 1) AS route_no,
            ST_AsBinary(d.geom::geometry(LineString, 4326)) AS geom_wkb
        FROM kiwi_tracks kt
        CROSS JOIN LATERAL ST_Dump(kt.geom) AS d
        WHERE GeometryType(d.geom) = 'LINESTRING'
        ORDER BY kt.id, route_no
    """)
    segments: List[TrackSegment] = []
    with engine.connect() as conn:
        for row in conn.execute(sql).fetchall():
            geom = wkb.loads(bytes(row.geom_wkb))
            if geom.is_empty or geom.geom_type != "LineString":
                continue
            segments.append(
                TrackSegment(
                    track_id=row.track_id,
                    route_no=row.route_no,
                    geom=geom,
                )
            )
    return segments


def get_dem_candidates(engine, route_geom: LineString) -> List[Tuple[str, Polygon]]:
    sql = text("""
        SELECT
            COALESCE(file_path, '') AS filepath,
            ST_AsBinary(geom) AS geom_wkb
        FROM kiwi_nz_8m_dem
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
) -> Tuple[int, Optional[int], Optional[int], List[RouteSample]]:
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

        samples: List[RouteSample] = []

        for seq, dist_m in enumerate(distances):
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

            samples.append(
                RouteSample(
                    seq=seq,
                    dist_m=int(round(dist_m)),
                    lng=x,
                    lat=y,
                    elevation_m=elevation,
                )
            )

        elevations = [s.elevation_m for s in samples]
        valid = [v for v in elevations if v is not None]
        elev_min = min(valid) if valid else None
        elev_max = max(valid) if valid else None

        return int(round(route_length_m)), elev_min, elev_max, samples

    finally:
        for _, ds, _ in datasets:
            ds.close()


def samples_to_linestring_z(samples: List[RouteSample]) -> Optional[LineString]:
    if len(samples) < 2:
        return None

    coords = [
        (
            sample.lng,
            sample.lat,
            float(sample.elevation_m if sample.elevation_m is not None else 0),
        )
        for sample in samples
    ]
    return LineString(coords)


def upsert_track_3d_line(
    engine,
    track_id: int,
    route_no: int,
    samples: List[RouteSample],
    step_m: int,
    length_m: Optional[int],
    elev_min: Optional[int],
    elev_max: Optional[int],
) -> None:
    delete_sql = text(f"""
        DELETE FROM {TRACK_3D_TABLE}
        WHERE track_id = :track_id AND route_no = :route_no
    """)
    upsert_sql = text(f"""
        INSERT INTO {TRACK_3D_TABLE} (
            track_id, route_no, step_m, length_m, elev_min, elev_max, geom
        )
        VALUES (
            :track_id,
            :route_no,
            :step_m,
            :length_m,
            :elev_min,
            :elev_max,
            ST_SetSRID(ST_GeomFromWKB(:geom_wkb), 4326)
        )
        ON CONFLICT (track_id, route_no) DO UPDATE
        SET
            step_m = EXCLUDED.step_m,
            length_m = EXCLUDED.length_m,
            elev_min = EXCLUDED.elev_min,
            elev_max = EXCLUDED.elev_max,
            geom = EXCLUDED.geom
    """)

    line = samples_to_linestring_z(samples)

    with engine.begin() as conn:
        if line is None:
            conn.execute(
                delete_sql, {"track_id": track_id, "route_no": route_no}
            )
            return

        conn.execute(
            upsert_sql,
            {
                "track_id": track_id,
                "route_no": route_no,
                "step_m": step_m,
                "length_m": length_m,
                "elev_min": elev_min,
                "elev_max": elev_max,
                "geom_wkb": wkb.dumps(line),
            },
        )


def main() -> None:
    engine = create_engine(DATABASE_URL)
    segments = get_track_segments(engine)

    print(f"Found {len(segments)} track segments")

    for idx, segment in enumerate(segments, start=1):
        label = f"track {segment.track_id} route {segment.route_no}"
        try:
            dem_candidates = get_dem_candidates(engine, segment.geom)

            if not dem_candidates:
                print(f"[{idx}/{len(segments)}] {label}: no DEM tiles found")
                upsert_track_3d_line(
                    engine,
                    track_id=segment.track_id,
                    route_no=segment.route_no,
                    samples=[],
                    step_m=SAMPLE_STEP_M,
                    length_m=None,
                    elev_min=None,
                    elev_max=None,
                )
                continue

            length_m, elev_min, elev_max, samples = sample_route_elevations(
                route_geom_4326=segment.geom,
                dem_candidates=dem_candidates,
                step_m=SAMPLE_STEP_M,
            )

            upsert_track_3d_line(
                engine,
                track_id=segment.track_id,
                route_no=segment.route_no,
                samples=samples,
                step_m=SAMPLE_STEP_M,
                length_m=length_m,
                elev_min=elev_min,
                elev_max=elev_max,
            )

            print(
                f"[{idx}/{len(segments)}] {label}: "
                f"length={length_m}m, vertices={len(samples)}, "
                f"min={elev_min}, max={elev_max}"
            )

        except Exception as e:
            print(f"[{idx}/{len(segments)}] {label}: ERROR: {e}")


if __name__ == "__main__":
    main()
