from app.db.postgres import get_connection
from app.pois.model import POI


def list_pois(limit: int, offset: int) -> tuple[list[POI], int]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, category, description, latitude, longitude, address, city
                FROM public.pois
                ORDER BY id ASC
                LIMIT %s OFFSET %s
                """,
                (limit, offset),
            )
            rows = cursor.fetchall()

        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM public.pois")
            count_row = cursor.fetchone()

    if count_row is None:
        raise RuntimeError("POI count query returned no result.")

    items = [POI(*row) for row in rows]
    return items, int(count_row[0])