import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
DEFAULT_USER_ID = 1

PLANS = {
    "start": {"name": "Старт", "maxBots": 1, "maxDialogs": 100, "aiEnabled": False},
    "business": {"name": "Бизнес", "maxBots": 5, "maxDialogs": None, "aiEnabled": True},
    "agency": {"name": "Агентство", "maxBots": None, "maxDialogs": None, "aiEnabled": True},
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Тариф пользователя и текущее использование лимитов. GET — план и счётчики (боты, диалоги), PUT — сменить тариф (plan: start|business|agency)."""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
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
            cur.execute(f"SELECT plan FROM {SCHEMA}.users WHERE id = {DEFAULT_USER_ID}")
            row = cur.fetchone()
            plan_id = row[0] if row and row[0] in PLANS else "start"
            plan = PLANS[plan_id]

            cur.execute(f"SELECT COUNT(*), COALESCE(SUM(dialogs_count), 0) FROM {SCHEMA}.bots WHERE user_id = {DEFAULT_USER_ID}")
            bots_count, dialogs_sum = cur.fetchone()

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "planId": plan_id,
                    "planName": plan["name"],
                    "usage": {
                        "bots": {"current": bots_count, "max": plan["maxBots"]},
                        "dialogs": {"current": dialogs_sum, "max": plan["maxDialogs"]},
                    },
                    "aiEnabled": plan["aiEnabled"],
                    "plans": PLANS,
                }),
            }

        if method == "PUT":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

            plan_id = body.get("plan")
            if plan_id not in PLANS:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Некорректный тариф"})}

            cur.execute(f"UPDATE {SCHEMA}.users SET plan = '{plan_id}' WHERE id = {DEFAULT_USER_ID}")
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"success": True, "planId": plan_id})}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        conn.close()
