import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
DEFAULT_USER_ID = 1


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def escape(value: str) -> str:
    return value.replace("'", "''")


def row_to_bot(row) -> dict:
    return {
        "id": row[0],
        "name": row[1],
        "description": row[2] or "",
        "status": row[3] or "inactive",
        "dialogsCount": row[4] or 0,
        "createdAt": row[5].isoformat() if row[5] else None,
    }


def handler(event: dict, context) -> dict:
    """Список ботов пользователя и создание нового бота. GET — список, POST — создать бота (name, description)."""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}

    conn = get_conn()
    try:
        cur = conn.cursor()

        if method == "GET":
            cur.execute(
                f"""SELECT id, name, description, status, dialogs_count, created_at
                    FROM {SCHEMA}.bots
                    WHERE user_id = {DEFAULT_USER_ID}
                    ORDER BY created_at DESC"""
            )
            rows = cur.fetchall()
            bots = [row_to_bot(r) for r in rows]
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"bots": bots})}

        if method == "POST":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

            name = (body.get("name") or "Новый бот").strip()[:255]
            description = (body.get("description") or "").strip()

            cur.execute(
                f"""INSERT INTO {SCHEMA}.bots (user_id, name, description, status, dialogs_count)
                    VALUES ({DEFAULT_USER_ID}, '{escape(name)}', '{escape(description)}', 'inactive', 0)
                    RETURNING id, name, description, status, dialogs_count, created_at"""
            )
            row = cur.fetchone()
            conn.commit()
            return {"statusCode": 201, "headers": headers, "body": json.dumps({"bot": row_to_bot(row)})}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        conn.close()
