from fastapi import FastAPI

from app.config import get_settings
from app.db.neo4j import close_driver, get_driver, verify_neo4j_connection

app = FastAPI(title="GreenTrip AI API")


@app.on_event("startup")
async def startup_event() -> None:
    get_driver()
    settings = get_settings()
    if settings.neo4j_configured:
        try:
            verify_neo4j_connection()
        except RuntimeError:
            pass


@app.on_event("shutdown")
async def shutdown_event() -> None:
    close_driver()


@app.get("/health")
async def health() -> dict[str, str]:
    settings = get_settings()
    if not settings.neo4j_configured:
        return {"status": "ok", "neo4j": "not_configured"}

    try:
        result = verify_neo4j_connection()
        return {"status": "ok", "neo4j": result.get("status", "unknown")}
    except RuntimeError:
        return {"status": "degraded", "neo4j": "unavailable"}
