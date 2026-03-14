from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from db import SessionLocal
from model import KiwiHut
from sqlalchemy import select

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


@app.get("/huts")
def get_huts(db: Session = Depends(get_db)):
    huts = db.scalars(
        select(KiwiHut).limit(10)
    ).all()

    return [
        {
            "id": hut.id,
            "name": hut.name,
            "region": hut.region,
            "place": hut.place,
            "bookable": hut.bookable,
        }
        for hut in huts
    ]
