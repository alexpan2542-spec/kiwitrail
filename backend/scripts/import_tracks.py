import json
import psycopg

GEOJSON_FILE = "/Users/alex/Downloads/DOC_Tracks_EAM_-4932107665450125323.geojson"

DATABASE_URL = "postgresql://alex:password@localhost:5432/postgres"

def main():

    with open(GEOJSON_FILE, "r") as f:
        data = json.load(f)

    features = data["features"]

    print("tracks:", len(features))

    conn = psycopg.connect(DATABASE_URL)
    cur = conn.cursor()

    for feature in features:

        props = feature["properties"]
        geom = feature["geometry"]

        cur.execute(
            """
            INSERT INTO kiwi_tracks
            (objectid, tech_object_name, floc_id, equipment_id,
             object_type, sub_object_type, gis_status, geom)
            VALUES (
                %s,%s,%s,%s,%s,%s,%s,
                ST_GeomFromGeoJSON(%s)
            )
            """,
            (
                props.get("OBJECTID"),
                props.get("TechObjectName"),
                props.get("FlocID"),
                props.get("EquipmentID"),
                props.get("ObjectType"),
                props.get("SubObjectType"),
                props.get("GISStatus"),
                json.dumps(geom),
            ),
        )

    conn.commit()

    cur.close()
    conn.close()

    print("Import finished")


if __name__ == "__main__":
    main()