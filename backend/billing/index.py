import json
import os
from datetime import datetime, timedelta

import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
DEFAULT_USER_ID = 1

# price_kopecks — стоимость тарифа в копейках (списывается с баланса кошелька при активации).
# demo=True — бесплатный пробный тариф на demo_days дней.
PLANS = {
    "demo": {
        "name": "Демо",
        "maxBots": 1,
        "maxDialogs": 100,
        "aiEnabled": False,
        "landings": True,
        "vk": True,
        "priceKopecks": 0,
        "demo": True,
        "demoDays": 7,
    },
    "standard": {
        "name": "Стандарт",
        "maxBots": 5,
        "maxDialogs": 500,
        "aiEnabled": True,
        "landings": True,
        "vk": True,
        "priceKopecks": 39000,
        "demo": False,
        "demoDays": 0,
    },
    "pro": {
        "name": "Профи",
        "maxBots": None,
        "maxDialogs": None,
        "aiEnabled": True,
        "landings": True,
        "vk": True,
        "priceKopecks": 99000,
        "demo": False,
        "demoDays": 0,
        "prioritySupport": True,
    },
}

# Старые идентификаторы тарифов -> новые, для обратной совместимости уже сохранённых значений.
LEGACY_PLAN_MAP = {"start": "demo", "business": "standard", "agency": "pro"}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def normalize_plan(raw):
    if raw in PLANS:
        return raw
    if raw in LEGACY_PLAN_MAP:
        return LEGACY_PLAN_MAP[raw]
    return "demo"


def plans_public():
    result = {}
    for pid, p in PLANS.items():
        result[pid] = {
            "name": p["name"],
            "maxBots": p["maxBots"],
            "maxDialogs": p["maxDialogs"],
            "aiEnabled": p["aiEnabled"],
            "landings": p["landings"],
            "vk": p["vk"],
            "priceKopecks": p["priceKopecks"],
            "demo": p["demo"],
            "demoDays": p["demoDays"],
            "prioritySupport": p.get("prioritySupport", False),
        }
    return result


def handler(event: dict, context) -> dict:
    """Тариф, лимиты и баланс кошелька. GET — план, счётчики, баланс. PUT — сменить тариф (plan: demo|standard|pro); платные тарифы списываются с баланса кошелька."""
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
            cur.execute(
                f"SELECT plan, balance_kopecks, plan_expires_at, demo_started_at FROM {SCHEMA}.users WHERE id = {DEFAULT_USER_ID}"
            )
            row = cur.fetchone()
            plan_id = normalize_plan(row[0] if row else "demo")
            balance = int(row[1]) if row and row[1] is not None else 0
            plan_expires_at = row[2] if row else None
            plan = PLANS[plan_id]

            cur.execute(
                f"SELECT COUNT(*), COALESCE(SUM(dialogs_count), 0) FROM {SCHEMA}.bots WHERE user_id = {DEFAULT_USER_ID}"
            )
            bots_count, dialogs_sum = cur.fetchone()

            demo_days_left = None
            if plan.get("demo") and plan_expires_at:
                delta = plan_expires_at - datetime.utcnow()
                demo_days_left = max(0, delta.days + (1 if delta.seconds > 0 else 0))

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "planId": plan_id,
                    "planName": plan["name"],
                    "balanceKopecks": balance,
                    "planExpiresAt": plan_expires_at.isoformat() if plan_expires_at else None,
                    "demoDaysLeft": demo_days_left,
                    "usage": {
                        "bots": {"current": bots_count, "max": plan["maxBots"]},
                        "dialogs": {"current": dialogs_sum, "max": plan["maxDialogs"]},
                    },
                    "aiEnabled": plan["aiEnabled"],
                    "plans": plans_public(),
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

            plan = PLANS[plan_id]

            cur.execute(f"SELECT balance_kopecks FROM {SCHEMA}.users WHERE id = {DEFAULT_USER_ID}")
            brow = cur.fetchone()
            balance = int(brow[0]) if brow and brow[0] is not None else 0

            price = plan["priceKopecks"]

            if plan.get("demo"):
                # Демо активируется бесплатно на demoDays дней.
                expires = datetime.utcnow() + timedelta(days=plan["demoDays"])
                cur.execute(
                    f"""UPDATE {SCHEMA}.users
                        SET plan = '{plan_id}', plan_expires_at = '{expires.isoformat()}',
                            demo_started_at = COALESCE(demo_started_at, now())
                        WHERE id = {DEFAULT_USER_ID}"""
                )
                conn.commit()
                return {
                    "statusCode": 200,
                    "headers": headers,
                    "body": json.dumps({"success": True, "planId": plan_id, "balanceKopecks": balance}),
                }

            # Платный тариф — списываем стоимость с баланса кошелька.
            if balance < price:
                return {
                    "statusCode": 402,
                    "headers": headers,
                    "body": json.dumps({
                        "error": "Недостаточно средств на балансе. Пополните кошелёк.",
                        "needKopecks": price - balance,
                    }),
                }

            new_balance = balance - price
            expires = datetime.utcnow() + timedelta(days=30)
            cur.execute(
                f"""UPDATE {SCHEMA}.users
                    SET plan = '{plan_id}', balance_kopecks = {new_balance},
                        plan_expires_at = '{expires.isoformat()}'
                    WHERE id = {DEFAULT_USER_ID}"""
            )
            desc = f"Оплата тарифа «{plan['name']}»".replace("'", "''")
            cur.execute(
                f"""INSERT INTO {SCHEMA}.wallet_transactions
                    (user_id, amount_kopecks, kind, status, description, provider)
                    VALUES ({DEFAULT_USER_ID}, {-price}, 'plan', 'succeeded', '{desc}', 'wallet')"""
            )
            conn.commit()
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({"success": True, "planId": plan_id, "balanceKopecks": new_balance}),
            }

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        conn.close()
