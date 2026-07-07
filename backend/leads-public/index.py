import json
import os
import re
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def escape(value: str) -> str:
    return (value or "").replace("'", "''")


def handler(event: dict, context) -> dict:
    """Публичный приём заявки (email) с опубликованного лендинга. POST — slug, email, name (опц.), phone (опц.)."""
    method = event.get("httpMethod", "POST")

    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}

    if method != "POST":
        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

    slug = (body.get("slug") or "").strip()
    email = (body.get("email") or "").strip().lower()
    name = (body.get("name") or "").strip()[:255]
    phone = (body.get("phone") or "").strip()[:100]

    if not slug:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "slug is required"})}
    if not email or not EMAIL_RE.match(email):
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Введите корректный email"})}

    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(f"SELECT id, bot_id, published FROM {SCHEMA}.landings WHERE slug = '{escape(slug)}'")
        landing = cur.fetchone()
        if not landing or not landing[2]:
            return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Landing not found"})}

        landing_id, bot_id = landing[0], landing[1]
        bot_id_sql = int(bot_id) if bot_id else "NULL"

        cur.execute(
            f"""INSERT INTO {SCHEMA}.leads (bot_id, landing_id, email, name, phone, extra)
                VALUES ({bot_id_sql}, {landing_id}, '{escape(email)}', '{escape(name)}', '{escape(phone)}', '{{}}'::jsonb)
                RETURNING id"""
        )
        lead_id = cur.fetchone()[0]
        conn.commit()

        return {"statusCode": 201, "headers": headers, "body": json.dumps({"success": True, "leadId": lead_id})}
    finally:
        conn.close()
