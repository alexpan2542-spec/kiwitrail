import re
import unicodedata
import pandas as pd
from rapidfuzz import process, fuzz
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql+psycopg2://alex@localhost:5432/postgres"
WIDGET_TABLE = "kiwi_weather_widget"
GAZ_TABLE = "kiwi_nz_gazetteer"

engine = create_engine(DATABASE_URL)

HIGH_CONFIDENCE_SCORE = 92
REVIEW_SCORE = 80


def strip_accents(text: str) -> str:
    if text is None:
        return ""
    text = unicodedata.normalize("NFKD", str(text))
    return "".join(ch for ch in text if not unicodedata.combining(ch))


def normalize_name(name: str) -> str:
    if not name:
        return ""

    s = strip_accents(name).lower().strip()

    # 符号标准化
    s = s.replace("&", " and ")
    s = s.replace("/", " ")
    s = s.replace("-", " ")
    s = s.replace("(", " ")
    s = s.replace(")", " ")
    s = s.replace(",", " ")

    # 先统一常见缩写
    s = re.sub(r"\bmt\b", "mount", s)
    s = re.sub(r"\bnth\b", "north", s)
    s = re.sub(r"\blk\b", "lakes", s)

    # widget 里常见但 gazetteer 里不一定保留的词
    noise_words = [
        "vc", "visitor", "centre", "center",
        "hut", "lodge", "cafe", "café",
        "summit", "peak", "alpine", "crossing",
        "ews", "cws",
    ]
    for word in noise_words:
        s = re.sub(rf"\b{re.escape(word)}\b", " ", s)

    # 常见别名统一
    replacements = {
        "aoraki mount cook": "aoraki cook",
        "aoraki mt cook": "aoraki cook",
        "arthurs": "arthur",
        "rototi": "rotoiti",
        "nelson lk": "nelson lakes",
    }
    for old, new in replacements.items():
        s = s.replace(old, new)

    # 去掉非字母数字
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()

    return s


def ensure_columns():
    sqls = [
        f"ALTER TABLE {WIDGET_TABLE} ADD COLUMN IF NOT EXISTS gazetteer_id integer;",
        f"ALTER TABLE {WIDGET_TABLE} ADD COLUMN IF NOT EXISTS gazetteer_name text;",
        f"ALTER TABLE {WIDGET_TABLE} ADD COLUMN IF NOT EXISTS gazetteer_match_method text;",
        f"ALTER TABLE {WIDGET_TABLE} ADD COLUMN IF NOT EXISTS gazetteer_match_score double precision;",
    ]
    with engine.begin() as conn:
        for sql in sqls:
            conn.execute(text(sql))


def load_widgets():
    sql = f"""
        SELECT id, name, type, category_id, url
        FROM {WIDGET_TABLE}
        ORDER BY id
    """
    df = pd.read_sql(sql, engine)
    df["name_norm"] = df["name"].apply(normalize_name)
    return df


def load_gazetteer():
    sql = f"""
        SELECT
            id,
            name_id,
            name,
            status,
            feat_type,
            region
        FROM {GAZ_TABLE}
        WHERE name IS NOT NULL
    """
    df = pd.read_sql(sql, engine)
    df["name_norm"] = df["name"].apply(normalize_name)
    df = df[df["name_norm"] != ""].copy()
    return df


def build_gaz_index(gaz: pd.DataFrame):
    idx = {}
    for _, row in gaz.iterrows():
        idx.setdefault(row["name_norm"], []).append(row.to_dict())
    return idx


def choose_best_candidate(widget_row: dict, candidates: list[dict]) -> dict | None:
    if not candidates:
        return None

    df = pd.DataFrame(candidates).copy()

    # 优先 official
    if "status" in df.columns:
        official = df[df["status"].astype(str).str.contains("official", case=False, na=False)]
        if not official.empty:
            df = official

    # 轻微偏向常见地名类型
    if "feat_type" in df.columns:
        preferred_types = [
            "Locality", "Place", "Hill", "Mountain", "Peak",
            "Pass", "Lake", "Forest", "Valley", "Island",
            "Bay", "Point", "Glacier", "River"
        ]
        preferred = df[df["feat_type"].astype(str).isin(preferred_types)]
        if not preferred.empty:
            df = preferred

    # 如果 widget 是 national，尽量排除明显 hut/visitor centre 类影子项
    if widget_row.get("type") == "national" and "feat_type" in df.columns:
        less_specific = ["Building", "Structure"]
        preferred = df[~df["feat_type"].astype(str).isin(less_specific)]
        if not preferred.empty:
            df = preferred

    return df.iloc[0].to_dict() if not df.empty else None


def exact_match(widgets: pd.DataFrame, gaz: pd.DataFrame):
    gaz_index = build_gaz_index(gaz)
    matched = []
    unmatched = []

    for _, w in widgets.iterrows():
        candidates = gaz_index.get(w["name_norm"], [])
        if candidates:
            best = choose_best_candidate(w.to_dict(), candidates)
            matched.append({
                "widget_id": w["id"],
                "widget_name": w["name"],
                "gazetteer_id": best["id"],
                "gazetteer_name": best["name"],
                "gazetteer_match_method": "exact",
                "gazetteer_match_score": 100.0,
            })
        else:
            unmatched.append(w.to_dict())

    return pd.DataFrame(matched), pd.DataFrame(unmatched)


def fuzzy_match(unmatched: pd.DataFrame, gaz: pd.DataFrame):
    if unmatched.empty:
        return pd.DataFrame()

    gaz_name_norms = gaz["name_norm"].dropna().unique().tolist()
    gaz_index = build_gaz_index(gaz)

    results = []

    for _, w in unmatched.iterrows():
        query = w["name_norm"]
        if not query:
            continue

        best = process.extractOne(
            query,
            gaz_name_norms,
            scorer=fuzz.WRatio
        )
        if not best:
            continue

        matched_norm_name, score, _ = best
        candidates = gaz_index.get(matched_norm_name, [])
        chosen = choose_best_candidate(w.to_dict(), candidates)

        if chosen is None:
            continue

        method = "fuzzy"
        if score < REVIEW_SCORE:
            method = "low_confidence"

        results.append({
            "widget_id": w["id"],
            "widget_name": w["name"],
            "gazetteer_id": chosen["id"],
            "gazetteer_name": chosen["name"],
            "gazetteer_match_method": method,
            "gazetteer_match_score": float(score),
        })

    return pd.DataFrame(results)


def update_widget_table(matches: pd.DataFrame):
    if matches.empty:
        print("No matches found.")
        return

    sql = text(f"""
        UPDATE {WIDGET_TABLE} AS w
        SET
            gazetteer_id = :gazetteer_id,
            gazetteer_name = :gazetteer_name,
            gazetteer_match_method = :gazetteer_match_method,
            gazetteer_match_score = :gazetteer_match_score
        WHERE w.id = :widget_id
    """)

    records = matches.to_dict(orient="records")

    with engine.begin() as conn:
        conn.execute(sql, records)

    print(f"Updated {len(records)} widget rows.")


def export_review_file(matches: pd.DataFrame):
    if matches.empty:
        return

    review_df = matches[
        matches["gazetteer_match_score"] < HIGH_CONFIDENCE_SCORE
    ].copy()

    if review_df.empty:
        print("No review rows generated.")
        return

    out_path = "/mnt/data/widget_gazetteer_name_review.csv"
    review_df.to_csv(out_path, index=False)
    print(f"Review CSV written to: {out_path}")


def main():
    print("Ensuring columns...")
    ensure_columns()

    print("Loading tables...")
    widgets = load_widgets()
    gaz = load_gazetteer()

    print(f"Widgets: {len(widgets)}")
    print(f"Gazetteer names: {len(gaz)}")

    print("Running exact match...")
    exact_df, unmatched_df = exact_match(widgets, gaz)
    print(f"Exact matched: {len(exact_df)}")
    print(f"Unmatched after exact: {len(unmatched_df)}")

    print("Running fuzzy match...")
    fuzzy_df = fuzzy_match(unmatched_df, gaz)
    print(f"Fuzzy matched: {len(fuzzy_df)}")

    all_matches = pd.concat([exact_df, fuzzy_df], ignore_index=True)

    print("Writing matches back to DB...")
    update_widget_table(all_matches)

    print("Exporting review CSV...")
    export_review_file(all_matches)

    print("Done.")


if __name__ == "__main__":
    main()