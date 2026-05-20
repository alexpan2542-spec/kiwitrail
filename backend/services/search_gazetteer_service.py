import time
from sqlalchemy import text
from rapidfuzz import process, fuzz


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

    def search(self, query: str, limit: int = 10, score_cutoff: float = 65.0):
        if not query or not self.is_loaded:
            return []

        # Performing fuzzy matching against the string list
        matches = process.extract(
            query,
            self._names_cache,
            scorer=fuzz.WRatio,
            limit=limit,
            score_cutoff=score_cutoff
        )

        results = []
        for name, score, index in matches:
            # Retrieving the full record using the index provided by RapidFuzz
            item = self._data_cache[index].copy()
            item["fuzzy_score"] = round(score, 2)
            item["item_type"] = "gazetteer"
            results.append(item)

        return results


# Create the single instance to be imported by main.py
gazetteer_searcher = GazetteerSearcher()