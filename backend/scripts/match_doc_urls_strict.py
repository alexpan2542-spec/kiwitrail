import re
import unicodedata
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

import psycopg
import requests


DATABASE_URL = "postgresql://alex@localhost:5432/kiwitrail"
SITEMAP_URL = "https://www.doc.govt.nz/sitemap.xml"


def ascii_fold(text: str) -> str:
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")


def normalize_text(text: str) -> str:
    s = ascii_fold(text).lower().strip()

    # 常见缩写统一
    s = re.sub(r"\bmt[.]?\b", "mount", s)
    s = re.sub(r"\bst[.]?\b", "saint", s)

    # No. 1 / No 1 / No.1 -> no1
    s = re.sub(r"\bno\.\s*(\d+)\b", r"no\1", s)
    s = re.sub(r"\bno\s+(\d+)\b", r"no\1", s)

    s = s.replace("&", " and ")
    s = s.replace("'", "")

    # 非字母数字变成 -
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")

    return s


def strip_suffix(slug: str) -> str:
    return re.sub(r"-(track|tracks|walk|walks|route|routes)$", "", slug)


def extract_slug(url: str) -> str:
    path = urlparse(url).path.rstrip("/")
    return path.split("/")[-1].lower()


def fetch_track_urls_from_sitemap() -> list[str]:

    resp = requests.get(SITEMAP_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    resp.raise_for_status()

    text = resp.content.decode("utf-8-sig")
    root = ET.fromstring(text)

    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

    urls = []
    for loc in root.findall(".//sm:url/sm:loc", ns):
        url = loc.text.strip()
        if "/things-to-do/tracks/" in url:
            urls.append(url)

    return sorted(set(urls))


def build_strict_index(urls: list[str]) -> dict[str, str]:
    """
    建两个索引：
    1. 完整 normalized slug -> url
    2. 去掉 track/tracks/walk/walks/route/routes 后缀后的 slug -> url

    如果 key 冲突，保留第一个。
    """
    index = {}

    for url in urls:
        raw_slug = extract_slug(url)
        slug_norm = normalize_text(raw_slug)
        slug_simple = strip_suffix(slug_norm)

        if slug_norm not in index:
            index[slug_norm] = url

        if slug_simple not in index:
            index[slug_simple] = url

    return index


def find_strict_match(track_name: str, strict_index: dict[str, str]) -> tuple[str | None, float | None, str | None]:
    """
    返回: (url, score, method)
    """
    name_norm = normalize_text(track_name)
    name_simple = strip_suffix(name_norm)

    # 1) 完整匹配
    if name_norm in strict_index:
        return strict_index[name_norm], 100.0, "strict_exact"

    # 2) 去后缀匹配
    if name_simple in strict_index:
        return strict_index[name_simple], 98.0, "strict_suffix"

    return None, None, None


def load_tracks_without_url(conn) -> list[tuple[int, str]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, tech_object_name
            FROM kiwi_tracks
            WHERE tech_object_name IS NOT NULL
              AND (doc_url IS NULL OR doc_url = '')
            ORDER BY id
            """
        )
        return cur.fetchall()


def update_match(conn, track_id: int, url: str, score: float, method: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE kiwi_tracks
            SET doc_url = %s,
                match_score = %s,
                match_method = %s
            WHERE id = %s
            """,
            (url, score, method, track_id),
        )


def main():
    print("Fetching sitemap...")
    urls = fetch_track_urls_from_sitemap()
    print(f"Found {len(urls)} track URLs in sitemap")

    # strict_index = build_strict_index(urls)
    #
    # with psycopg.connect(DATABASE_URL) as conn:
    #     tracks = load_tracks_without_url(conn)
    #     print(f"Found {len(tracks)} tracks without doc_url")
    #
    #     matched = 0
    #     unmatched = 0
    #
    #     for track_id, tech_object_name in tracks:
    #         url, score, method = find_strict_match(tech_object_name, strict_index)
    #
    #         if url:
    #             update_match(conn, track_id, url, score, method)
    #             matched += 1
    #             print(f"[MATCH] {tech_object_name} -> {url}")
    #         else:
    #             unmatched += 1
    #             print(f"[MISS ] {tech_object_name}")
    #
    #     conn.commit()

    # print("\nDone.")
    # print(f"Matched:   {matched}")
    # print(f"Unmatched: {unmatched}")


if __name__ == "__main__":
    main()