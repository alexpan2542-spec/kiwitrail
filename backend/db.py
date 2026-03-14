from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "postgresql+psycopg://alex@localhost:5432/postgres"

class Base(DeclarativeBase):
    pass


engine = create_engine(
    DATABASE_URL,
    echo=True,   # shows SQL in terminal, useful for learning
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)