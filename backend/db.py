import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

class Base(DeclarativeBase):
    pass


engine = create_engine(
    DATABASE_URL,
    echo=True,   # shows SQL in terminal, useful for learning
    pool_pre_ping=True,   # test connections before use; reconnect if stale
    pool_recycle=1800,    # recycle connections every 30 min
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()