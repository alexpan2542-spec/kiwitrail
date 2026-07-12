from sqlalchemy import text
from sqlalchemy.orm import Session


def insert_home_visit(
    db: Session,
    *,
    server: str,
    ip_address: str | None,
    user_agent: str | None,
    referer: str | None,
    user_email: str | None,
    page: str,
) -> int:
    sql = text("""
        INSERT INTO kiwi_home_visits (
            server,
            ip_address,
            user_agent,
            referer,
            user_email,
            page
        )
        VALUES (
            :server,
            :ip_address,
            :user_agent,
            :referer,
            :user_email,
            :page
        )
        RETURNING id
    """)

    result = db.execute(
        sql,
        {
            "server": server,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "referer": referer,
            "user_email": user_email,
            "page": page,
        },
    )
    db.commit()
    row = result.fetchone()
    return row[0]
