from fastapi import FastAPI

from app.config import get_settings
from app.db.neo4j import close_driver, get_driver
from app.auth.router import router as auth_router

app = FastAPI(title="GreenTrip AI API")

app.include_router(auth_router)


@app.on_event("startup")
async def startup_event() -> None:
    get_driver()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    close_driver()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "greentrip-api"}


@app.get("/")
async def root() -> dict[str, str]:
    return {"status": "ok", "service": "greentrip-api"}
