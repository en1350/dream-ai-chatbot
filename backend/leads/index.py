import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
DEFAULT_USER_ID = 1


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def row_to_lead(row) -> dict:
    return {
        "id": row[0],
        "botId": row[1],
        "botName": row[2] or "",
        "landingId": row[3],
        "landingName": row[4] or "",
        "email": row[5],
        "name": row[6] or "",
        "phone": row[7] or "",
        "createdAt": row[8].isoformat() if row[8] else None,
    }


def handler(event: dict, context) -> dict:
    """Список заявок (лидов), собранных ботами и лендингами пользователя. GET — список, DELETE ?id= — удалить заявку."""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
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

        if method == "GET":
            cur.execute(
                f"""SELECT l.id, l.bot_id, b.name, l.landing_id, ld.name, l.email, l.name, l.phone, l.created_at
                    FROM {SCHEMA}.leads l
                    LEFT JOIN {SCHEMA}.bots b ON b.id = l.bot_id
                    LEFT JOIN {SCHEMA}.landings ld ON ld.id = l.landing_id
                    WHERE b.user_id = {DEFAULT_USER_ID} OR ld.user_id = {DEFAULT_USER_ID}
                    ORDER BY l.created_at DESC"""
            )
            rows = cur.fetchall()
            leads = [row_to_lead(r) for r in rows]
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"leads": leads, "total": len(leads)})}

        if method == "DELETE":
            lead_id = params.get("id")
            if not lead_id or not str(lead_id).isdigit():
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "id is required"})}
            cur.execute(
                f"""DELETE FROM {SCHEMA}.leads l
                    USING {SCHEMA}.bots b, {SCHEMA}.landings ld
                    WHERE l.id = {int(lead_id)}
                    AND (l.bot_id = b.id AND b.user_id = {DEFAULT_USER_ID}
                         OR l.landing_id = ld.id AND ld.user_id = {DEFAULT_USER_ID})"""
            )
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"success": True})}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        conn.close()
