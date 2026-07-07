import json
import os
import urllib.request
import urllib.error
import urllib.parse
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
DEFAULT_USER_ID = 1
VK_API_VERSION = "5.199"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def escape(value: str) -> str:
    return (value or "").replace("'", "''")


def fetch_vk_group(group_id: str, access_token: str):
    """Проверяет токен и получает данные сообщества через VK API groups.getById."""
    params = urllib.parse.urlencode({
        "group_id": group_id,
        "access_token": access_token,
        "v": VK_API_VERSION,
    })
    url = f"https://api.vk.com/method/groups.getById?{params}"
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if "error" in data:
        raise ValueError(data["error"].get("error_msg", "Ошибка VK API"))
    groups = data.get("response", {}).get("groups") or data.get("response")
    if not groups:
        raise ValueError("Сообщество не найдено")
    group = groups[0]
    return {"id": group["id"], "name": group.get("name", "")}


def row_to_integration(row) -> dict:
    return {
        "botId": row[0],
        "botName": row[1],
        "connected": row[2] is not None,
        "groupId": row[2],
        "groupName": row[3] or "",
        "active": bool(row[4]) if row[4] is not None else False,
        "confirmCode": row[5] or "",
    }


def handler(event: dict, context) -> dict:
    """Управление интеграцией ботов с сообществами ВКонтакте.
    GET — список ботов пользователя со статусом подключения VK.
    POST — подключить сообщество (botId, groupId, accessToken), проверяет токен через VK API.
    PUT — включить/выключить интеграцию (botId, active).
    DELETE ?bot_id= — отключить сообщество."""
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
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    try:
        cur = conn.cursor()

        if method == "GET":
            cur.execute(
                f"""SELECT b.id, b.name, vk.group_id, vk.group_name, vk.active, vk.confirm_code
                    FROM {SCHEMA}.bots b
                    LEFT JOIN {SCHEMA}.vk_integrations vk ON vk.bot_id = b.id
                    WHERE b.user_id = {DEFAULT_USER_ID}
                    ORDER BY b.created_at DESC"""
            )
            rows = cur.fetchall()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"integrations": [row_to_integration(r) for r in rows]})}

        if method == "POST":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

            bot_id = body.get("botId")
            group_id_input = str(body.get("groupId") or "").strip()
            access_token = (body.get("accessToken") or "").strip()

            if not bot_id or not group_id_input or not access_token:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "botId, groupId и accessToken обязательны"})}
            bot_id = int(bot_id)

            cur.execute(f"SELECT id FROM {SCHEMA}.bots WHERE id = {bot_id} AND user_id = {DEFAULT_USER_ID}")
            if not cur.fetchone():
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Bot not found"})}

            try:
                group = fetch_vk_group(group_id_input, access_token)
            except ValueError as e:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": str(e)})}
            except Exception:
                return {"statusCode": 502, "headers": headers, "body": json.dumps({"error": "Не удалось связаться с VK API"})}

            cur.execute(f"SELECT id FROM {SCHEMA}.vk_integrations WHERE bot_id = {bot_id}")
            existing = cur.fetchone()

            if existing:
                cur.execute(
                    f"""UPDATE {SCHEMA}.vk_integrations
                        SET group_id = {group['id']}, group_name = '{escape(group['name'])}',
                            access_token = '{escape(access_token)}', active = true, updated_at = now()
                        WHERE bot_id = {bot_id}"""
                )
            else:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.vk_integrations (bot_id, group_id, group_name, access_token, active)
                        VALUES ({bot_id}, {group['id']}, '{escape(group['name'])}', '{escape(access_token)}', true)"""
                )
            conn.commit()

            cur.execute(
                f"""SELECT b.id, b.name, vk.group_id, vk.group_name, vk.active, vk.confirm_code
                    FROM {SCHEMA}.bots b
                    LEFT JOIN {SCHEMA}.vk_integrations vk ON vk.bot_id = b.id
                    WHERE b.id = {bot_id}"""
            )
            row = cur.fetchone()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"integration": row_to_integration(row)})}

        if method == "PUT":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

            bot_id = body.get("botId")
            if not bot_id:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "botId is required"})}
            bot_id = int(bot_id)
            active = bool(body.get("active", True))

            cur.execute(
                f"""UPDATE {SCHEMA}.vk_integrations SET active = {active}, updated_at = now()
                    WHERE bot_id = {bot_id} AND EXISTS (
                        SELECT 1 FROM {SCHEMA}.bots WHERE id = {bot_id} AND user_id = {DEFAULT_USER_ID}
                    )"""
            )
            if cur.rowcount == 0:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Integration not found"})}
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"success": True})}

        if method == "DELETE":
            bot_id = params.get("bot_id")
            if not bot_id or not str(bot_id).isdigit():
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "bot_id is required"})}
            cur.execute(
                f"""DELETE FROM {SCHEMA}.vk_integrations WHERE bot_id = {int(bot_id)} AND EXISTS (
                        SELECT 1 FROM {SCHEMA}.bots WHERE id = {int(bot_id)} AND user_id = {DEFAULT_USER_ID}
                    )"""
            )
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"success": True})}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        conn.close()
