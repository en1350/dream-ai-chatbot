import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
DEFAULT_USER_ID = 1


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def escape(value: str) -> str:
    return value.replace("'", "''")


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
    """Боты пользователя. GET — список, POST — создать (name, description), PUT — сменить статус публикации (id, status)."""
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
        user_id = get_user_id(cur, event)

        if method == "GET":
            cur.execute(
                f"""SELECT id, name, description, status, dialogs_count, created_at
                    FROM {SCHEMA}.bots
                    WHERE user_id = {user_id}
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

            # Проверяем демо-период: если бесплатные 7 дней закончились без оплаты — блокируем.
            cur.execute(
                f"SELECT plan, plan_expires_at FROM {SCHEMA}.users WHERE id = {user_id}"
            )
            urow = cur.fetchone()
            if urow:
                u_plan = urow[0] or "demo"
                u_expires = urow[1]
                is_demo = u_plan in ("demo", "start")
                if is_demo and u_expires is not None:
                    from datetime import datetime as _dt
                    if u_expires <= _dt.utcnow():
                        return {
                            "statusCode": 402,
                            "headers": headers,
                            "body": json.dumps({
                                "error": "Бесплатный период закончился. Оплатите тариф, чтобы продолжить.",
                                "requiresPayment": True,
                            }),
                        }

            cur.execute(
                f"""INSERT INTO {SCHEMA}.bots (user_id, name, description, status, dialogs_count)
                    VALUES ({user_id}, '{escape(name)}', '{escape(description)}', 'inactive', 0)
                    RETURNING id, name, description, status, dialogs_count, created_at"""
            )
            row = cur.fetchone()
            conn.commit()
            return {"statusCode": 201, "headers": headers, "body": json.dumps({"bot": row_to_bot(row)})}

        if method == "PUT":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

            bot_id = body.get("id")
            if not bot_id or not str(bot_id).isdigit():
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "id is required"})}

            status = body.get("status")
            if status not in ("active", "inactive"):
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "status must be active or inactive"})}

            cur.execute(
                f"""UPDATE {SCHEMA}.bots
                    SET status = '{status}', updated_at = now()
                    WHERE id = {int(bot_id)} AND user_id = {user_id}
                    RETURNING id, name, description, status, dialogs_count, created_at"""
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Bot not found"})}
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"bot": row_to_bot(row)})}

        if method == "DELETE":
            params = event.get("queryStringParameters") or {}
            bot_id = params.get("id")
            if not bot_id or not str(bot_id).isdigit():
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "id is required"})}
            bot_id = int(bot_id)
            # Удаляем связанные записи, затем самого бота.
            cur.execute(f"DELETE FROM {SCHEMA}.vk_integrations WHERE bot_id = {bot_id}")
            cur.execute(f"DELETE FROM {SCHEMA}.vk_sessions WHERE bot_id = {bot_id}")
            cur.execute(f"DELETE FROM {SCHEMA}.leads WHERE bot_id = {bot_id}")
            cur.execute(f"UPDATE {SCHEMA}.landings SET bot_id = NULL WHERE bot_id = {bot_id}")
            cur.execute(f"DELETE FROM {SCHEMA}.bot_edges WHERE bot_id = {bot_id}")
            cur.execute(f"DELETE FROM {SCHEMA}.bot_nodes WHERE bot_id = {bot_id}")
            cur.execute(
                f"DELETE FROM {SCHEMA}.bots WHERE id = {bot_id} AND user_id = {user_id}"
            )
            if cur.rowcount == 0:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Bot not found"})}
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"success": True})}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        conn.close()