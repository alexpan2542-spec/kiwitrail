from sqlalchemy import text
from sqlalchemy.orm import Session


def select_comments_by_item(db: Session, item_type: str, item_id: int):
    """
    Fetches all comments for a specific item (hut, track, etc.)
    """
    sql = text("""
               SELECT id,
                      user_name,
                      rating,
                      comment_text,
                      image_url_1,
                      image_url_2,
                      image_url_3,
                      TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at
               FROM kiwi_user_comments
               WHERE item_type = :item_type
                 AND item_id = :item_id
               ORDER BY created_at DESC
               """)

    params = {"item_type": item_type, "item_id": item_id}
    rows = db.execute(sql, params).mappings().all()

    return [dict(row) for row in rows]


def insert_user_comment(
    db: Session,
    item_type: str,
    item_id: int,
    user_name: str,
    rating: int,
    comment_text: str,
    image_url_1: str = None,
    image_url_2: str = None,
    image_url_3: str = None
):

    sql = text("""
        INSERT INTO kiwi_user_comments (
            item_type, 
            item_id, 
            user_name, 
            rating, 
            comment_text,
            image_url_1,
            image_url_2,
            image_url_3
        )
        VALUES (
            :item_type, 
            :item_id, 
            :user_name, 
            :rating, 
            :comment_text,
            :image_url_1,
            :image_url_2,
            :image_url_3
        ) 
        RETURNING id, created_at
    """)

    params = {
        "item_type": item_type,
        "item_id": item_id,
        "user_name": user_name,
        "rating": rating,
        "comment_text": comment_text,
        "image_url_1": image_url_1,
        "image_url_2": image_url_2,
        "image_url_3": image_url_3
    }

    result = db.execute(sql, params)
    db.commit()

    return result.fetchone()