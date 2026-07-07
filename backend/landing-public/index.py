import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def escape(value: str) -> str:
    return (value or "").replace("'", "''")


def handler(event: dict, context) -> dict:
    """Публичный просмотр опубликованного лендинга по slug. GET ?slug=my-landing"""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}

    if method != "GET":
        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}

    params = event.get("queryStringParameters") or {}
    slug = params.get("slug")
    if not slug:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "slug is required"})}

    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            f"""SELECT l.id, l.name, l.blocks, l.theme, l.published, l.bot_id,
                       vk.group_id, vk.active
                FROM {SCHEMA}.landings l
                LEFT JOIN {SCHEMA}.vk_integrations vk ON vk.bot_id = l.bot_id
                WHERE l.slug = '{escape(slug)}'"""
        )
        row = cur.fetchone()
        if not row or not row[4]:
            return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Landing not found"})}

        blocks = row[2] if isinstance(row[2], (list, dict)) else json.loads(row[2] or "[]")
        theme = row[3] if isinstance(row[3], dict) else json.loads(row[3] or "{}")
        vk_group_id = row[6] if row[7] else None

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"name": row[1], "blocks": blocks, "theme": theme, "vkGroupId": vk_group_id}),
        }
    finally:
        conn.close()