import json
import os
from datetime import datetime

import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

PLAN_ALIASES = {None: "demo", "start": "demo", "business": "standard", "agency": "pro"}
BOT_LIMITS = {"demo": 1, "standard": 5, "pro": None}
PLAN_NAMES = {"demo": "Демо", "standard": "Стандарт", "pro": "Профи"}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def escape(value: str) -> str:
    return value.replace("'", "''")


def get_user_id(cur, event) -> int | None:
    """Определяет пользователя по токену входа (X-Auth-Token). None — если не авторизован."""
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
    return None


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
    """Боты пользователя. GET — список и лимит тарифа, POST — создать (с проверкой срока и лимита тарифа), PUT — статус публикации, DELETE ?id= — удалить бота со всеми данными."""
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
        if user_id is None:
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Требуется авторизация"})}

        if method == "GET":
            cur.execute(
                f"""SELECT id, name, description, status, dialogs_count, created_at
                    FROM {SCHEMA}.bots
                    WHERE user_id = {user_id}
                    ORDER BY created_at DESC"""
            )
            rows = cur.fetchall()
            bots = [row_to_bot(r) for r in rows]
            cur.execute(f"SELECT plan, plan_expires_at FROM {SCHEMA}.users WHERE id = {user_id}")
            urow = cur.fetchone()
            u_plan = PLAN_ALIASES.get(urow[0] if urow else None, urow[0] if urow else "demo")
            expired = bool(urow and urow[1] is not None and urow[1] <= datetime.utcnow())
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "bots": bots,
                    "limit": BOT_LIMITS.get(u_plan),
                    "plan": u_plan,
                    "expired": expired,
                }),
            }

        if method == "POST":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

            name = (body.get("name") or "Новый бот").strip()[:255]
            description = (body.get("description") or "").strip()

            if not name:
                name = "Новый бот"

            cur.execute(
                f"SELECT plan, plan_expires_at FROM {SCHEMA}.users WHERE id = {user_id}"
            )
            urow = cur.fetchone()
            u_plan = PLAN_ALIASES.get(urow[0] if urow else None, urow[0] if urow else "demo")
            u_expires = urow[1] if urow else None

            # Срок доступа истёк (пробный или оплаченный) — создавать нельзя.
            if u_expires is not None and u_expires <= datetime.utcnow():
                msg = (
                    "Бесплатный период закончился. Оплатите тариф, чтобы продолжить."
                    if u_plan == "demo"
                    else "Срок действия тарифа закончился. Продлите тариф, чтобы создавать ботов."
                )
                return {
                    "statusCode": 402,
                    "headers": headers,
                    "body": json.dumps({"error": msg, "requiresPayment": True}),
                }

            # Лимит ботов по тарифу.
            limit = BOT_LIMITS.get(u_plan)
            if limit is not None:
                cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.bots WHERE user_id = {user_id}")
                count = cur.fetchone()[0]
                if count >= limit:
                    return {
                        "statusCode": 403,
                        "headers": headers,
                        "body": json.dumps({
                            "error": f"На тарифе «{PLAN_NAMES.get(u_plan, u_plan)}» можно создать до {limit} "
                                     f"{'бота' if limit == 1 else 'ботов'}. Удалите ненужного бота или перейдите на тариф выше.",
                            "limitReached": True,
                            "limit": limit,
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
            # Сначала убеждаемся, что бот принадлежит этому клиенту.
            cur.execute(f"SELECT id FROM {SCHEMA}.bots WHERE id = {bot_id} AND user_id = {user_id}")
            if not cur.fetchone():
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Бот не найден"})}
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