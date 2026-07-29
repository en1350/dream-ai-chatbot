import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
DEFAULT_USER_ID = 1


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_id(cur, event) -> int:
    """Определяет пользователя по токену входа (X-Auth-Token). Фолбэк — DEFAULT_USER_ID."""
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token") or ""
    if token:
        cur.execute(
            f"""SELECT user_id FROM {SCHEMA}.sessions
                WHERE token = %s AND (expires_at IS NULL OR expires_at > now())""",
            (token,),
        )
        row = cur.fetchone()
        if row:
            return int(row[0])
    return DEFAULT_USER_ID


def escape(value: str) -> str:
    return (value or "").replace("'", "''")


def row_to_event(row) -> dict:
    return {
        "id": row[0],
        "type": row[1],
        "text": row[2],
        "icon": row[3],
        "color": row[4],
        "createdAt": row[5].isoformat() if row[5] else None,
    }


def handler(event: dict, context) -> dict:
    """Счётчик событий аккаунта. GET — последние события пользователя (лимит ?limit=), POST — записать новое событие (type, text, icon, color)."""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    try:
        cur = conn.cursor()
        user_id = get_user_id(cur, event)

        if method == "GET":
            limit = params.get("limit", "10")
            limit = int(limit) if str(limit).isdigit() else 10
            limit = min(limit, 50)

            cur.execute(
                f"""SELECT id, type, text, icon, color, created_at
                    FROM {SCHEMA}.events
                    WHERE user_id = {user_id}
                    ORDER BY created_at DESC
                    LIMIT {limit}"""
            )
            rows = cur.fetchall()

            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.events WHERE user_id = {user_id}")
            total = cur.fetchone()[0]

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({"events": [row_to_event(r) for r in rows], "total": total}),
            }

        if method == "POST":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

            text = (body.get("text") or "").strip()[:500]
            if not text:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "text is required"})}

            event_type = (body.get("type") or "info").strip()[:50]
            icon = (body.get("icon") or "Bell").strip()[:50]
            color = (body.get("color") or "text-aqua").strip()[:50]

            cur.execute(
                f"""INSERT INTO {SCHEMA}.events (user_id, type, text, icon, color)
                    VALUES ({user_id}, '{escape(event_type)}', '{escape(text)}', '{escape(icon)}', '{escape(color)}')
                    RETURNING id, type, text, icon, color, created_at"""
            )
            row = cur.fetchone()
            conn.commit()
            return {"statusCode": 201, "headers": headers, "body": json.dumps({"event": row_to_event(row)})}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        conn.close()