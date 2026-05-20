import json
import time
from sqlalchemy import text
from rapidfuzz import process, fuzz
from sqlalchemy.orm import Session

from schema import TrackSearchRequest
from services.search_items_service import search_items


class GazetteerSearcher:
    def __init__(self):
        self._data_cache = []
        self._names_cache = []
        self.is_loaded = False

    def preload_data(self, db):
        start_time = time.time()

        query = text("""
                     SELECT id, name, region, ST_Y(geom) as lat, ST_X(geom) as lng
                     FROM public.kiwi_nz_gazetteer
                     """)

        rows = db.execute(query).mappings().all()

        # Storing the full dictionaries for retrieval
        self._data_cache = [dict(row) for row in rows]
        # Storing just the strings for high-speed fuzzy matching
        self._names_cache = [row["name"] for row in rows]

        self.is_loaded = True
        elapsed = time.time() - start_time
        print(f"GazetteerSearcher: Loaded {len(self._data_cache)} records in {elapsed:.2f}s")

    def search(self, db: Session, filters: TrackSearchRequest, limit: int = 10, score_cutoff: float = 65.0):

        query = filters.fuzzy_search
        if not query or not self.is_loaded:
            return []

        # RapidFuzz search
        matches = process.extract(
            query,
            self._names_cache,
            scorer=fuzz.WRatio,
            limit=limit,
            score_cutoff=score_cutoff
        )

        results = []
        for name, score, index in matches:
            # Get the full record from the cache using the index
            record = self._data_cache[index]
            geojson = self.get_circle_geojson(db, record.get("lat"), record.get("lng"))
            filters.selected_area = geojson
            items = search_items(db, filters)

            results.append({
                "id": record.get("id"),
                "name": record.get("name"),
                "region": record.get("region"),
                "lat": record.get("lat"),
                "lng": record.get("lng"),
                "fuzzy_score": round(score, 2),
                "geojson": geojson,
                "items_len": len(items),
            })

        return results


    # services/search_gazetteer_service.py

    def get_circle_geojson(self, db, lat, lng, radius_km=15.0):
        """
        Use PostGIS to create a proper circular polygon GeoJSON
        """
        sql = text("""
            SELECT ST_AsGeoJSON(
                ST_Buffer(
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 
                    :radius_meters
                )::geometry
            ) AS geojson
        """)

        result = db.execute(sql, {
            "lng": lng,
            "lat": lat,
            "radius_meters": radius_km * 1000
        }).scalar()

        return json.loads(result)

# Create the single instance to be imported by main.py
gazetteer_searcher = GazetteerSearcher()