import json
import os
from datetime import datetime, timedelta

import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
PLANS = {"demo", "standard", "pro"}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}
JSON_HEADERS = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": JSON_HEADERS, "body": json.dumps(body, default=str)}


def iso(v):
    return v.isoformat() if v else None


def get_admin(cur, event):
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token") or ""
    if not token:
        return None
    cur.execute(
        f"""SELECT u.id, u.is_admin FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND (s.expires_at IS NULL OR s.expires_at > now())""",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "isAdmin": bool(row[1])}


def handler(event: dict, context) -> dict:
    """Админка: статистика сервиса, список клиентов, смена тарифа/срока, начисление баланса, блокировка админ-прав, удаление клиента. Доступ только администраторам."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    try:
        body = json.loads(event.get("body") or "{}")
    except (ValueError, TypeError):
        body = {}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cur = conn.cursor()
        admin = get_admin(cur, event)
        if not admin:
            return resp(401, {"error": "Требуется авторизация"})
        if not admin["isAdmin"]:
            return resp(403, {"error": "Доступ только для администратора"})

        if method == "GET":
            cur.execute(
                f"""SELECT
                      COUNT(*),
                      COUNT(*) FILTER (WHERE created_at > now() - interval '7 days'),
                      COUNT(*) FILTER (WHERE plan IN ('standard','pro') AND plan_expires_at > now()),
                      COUNT(*) FILTER (WHERE plan IN ('demo','start') AND plan_expires_at > now()),
                      COUNT(*) FILTER (WHERE plan_expires_at IS NOT NULL AND plan_expires_at <= now())
                    FROM {SCHEMA}.users"""
            )
            s = cur.fetchone()
            cur.execute(
                f"""SELECT COALESCE(SUM(amount_kopecks), 0) FROM {SCHEMA}.wallet_transactions
                    WHERE kind = 'topup' AND status = 'succeeded'"""
            )
            revenue = int(cur.fetchone()[0] or 0)
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.bots")
            bots_total = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.leads")
            leads_total = cur.fetchone()[0]

            search = (params.get("q") or "").strip().lower()
            where = ""
            args: tuple = ()
            if search:
                where = "WHERE lower(u.email) LIKE %s OR lower(u.name) LIKE %s"
                like = f"%{search}%"
                args = (like, like)

            cur.execute(
                f"""SELECT u.id, u.email, u.name, u.plan, u.created_at, u.plan_expires_at,
                           u.balance_kopecks, u.email_verified, u.is_admin,
                           (SELECT COUNT(*) FROM {SCHEMA}.bots b WHERE b.user_id = u.id),
                           (SELECT COUNT(*) FROM {SCHEMA}.leads l
                              WHERE l.bot_id IN (SELECT id FROM {SCHEMA}.bots WHERE user_id = u.id)),
                           (SELECT MAX(created_at) FROM {SCHEMA}.sessions se WHERE se.user_id = u.id)
                    FROM {SCHEMA}.users u
                    {where}
                    ORDER BY u.created_at DESC
                    LIMIT 500""",
                args,
            )
            users = []
            now = datetime.utcnow()
            for r in cur.fetchall():
                expires = r[5]
                users.append({
                    "id": r[0],
                    "email": r[1],
                    "name": r[2],
                    "plan": "demo" if r[3] in ("start", None) else ("standard" if r[3] == "business" else ("pro" if r[3] == "agency" else r[3])),
                    "createdAt": iso(r[4]),
                    "planExpiresAt": iso(expires),
                    "expired": bool(expires and expires <= now),
                    "balanceKopecks": int(r[6] or 0),
                    "emailVerified": bool(r[7]),
                    "isAdmin": bool(r[8]),
                    "botsCount": r[9],
                    "leadsCount": r[10],
                    "lastLoginAt": iso(r[11]),
                })

            return resp(200, {
                "stats": {
                    "usersTotal": s[0],
                    "usersWeek": s[1],
                    "paying": s[2],
                    "onTrial": s[3],
                    "expired": s[4],
                    "revenueKopecks": revenue,
                    "botsTotal": bots_total,
                    "leadsTotal": leads_total,
                },
                "users": users,
            })

        if method == "PUT":
            uid = body.get("id")
            if not isinstance(uid, int):
                return resp(400, {"error": "Не указан клиент"})
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE id = %s", (uid,))
            if not cur.fetchone():
                return resp(404, {"error": "Клиент не найден"})

            if "plan" in body:
                plan = body.get("plan")
                if plan not in PLANS:
                    return resp(400, {"error": "Неизвестный тариф"})
                cur.execute(f"UPDATE {SCHEMA}.users SET plan = %s WHERE id = %s", (plan, uid))

            if "extendDays" in body:
                days = body.get("extendDays")
                if not isinstance(days, int) or days < -365 or days > 3650:
                    return resp(400, {"error": "Некорректное число дней"})
                if days > 0:
                    # Продлеваем от текущей даты окончания (или от сегодня, если срок уже истёк).
                    cur.execute(
                        f"""UPDATE {SCHEMA}.users
                            SET plan_expires_at = GREATEST(COALESCE(plan_expires_at, now()), now()) + (%s * interval '1 day')
                            WHERE id = %s""",
                        (days, uid),
                    )
                else:
                    # 0 или минус — завершить доступ сейчас (или сдвинуть в прошлое).
                    cur.execute(
                        f"UPDATE {SCHEMA}.users SET plan_expires_at = %s WHERE id = %s",
                        (datetime.utcnow() + timedelta(days=days), uid),
                    )

            if "balanceDeltaKopecks" in body:
                delta = body.get("balanceDeltaKopecks")
                if not isinstance(delta, int) or delta == 0 or abs(delta) > 100_000_000:
                    return resp(400, {"error": "Некорректная сумма"})
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance_kopecks = GREATEST(0, balance_kopecks + %s) WHERE id = %s",
                    (delta, uid),
                )
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.wallet_transactions
                        (user_id, amount_kopecks, kind, status, description, provider)
                        VALUES (%s, %s, 'admin', 'succeeded', %s, 'admin')""",
                    (uid, delta, "Начисление администратором" if delta > 0 else "Списание администратором"),
                )

            if "emailVerified" in body:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET email_verified = %s, email_verify_token = NULL WHERE id = %s",
                    (bool(body.get("emailVerified")), uid),
                )

            if "isAdmin" in body:
                if uid == admin["id"] and not body.get("isAdmin"):
                    return resp(400, {"error": "Нельзя снять права администратора с самого себя"})
                cur.execute(f"UPDATE {SCHEMA}.users SET is_admin = %s WHERE id = %s", (bool(body.get("isAdmin")), uid))

            conn.commit()
            return resp(200, {"success": True})

        if method == "DELETE":
            raw = params.get("id") or ""
            if not raw.isdigit():
                return resp(400, {"error": "Не указан клиент"})
            uid = int(raw)
            if uid == admin["id"]:
                return resp(400, {"error": "Нельзя удалить свой аккаунт из админки"})
            bots_sub = f"SELECT id FROM {SCHEMA}.bots WHERE user_id = %s"
            for table in ("vk_integrations", "vk_sessions", "bot_edges", "bot_nodes"):
                cur.execute(f"DELETE FROM {SCHEMA}.{table} WHERE bot_id IN ({bots_sub})", (uid,))
            cur.execute(
                f"""DELETE FROM {SCHEMA}.leads WHERE bot_id IN ({bots_sub})
                    OR landing_id IN (SELECT id FROM {SCHEMA}.landings WHERE user_id = %s)""",
                (uid, uid),
            )
            for table in ("landings", "bots", "wallet_transactions", "events", "password_resets", "sessions"):
                cur.execute(f"DELETE FROM {SCHEMA}.{table} WHERE user_id = %s", (uid,))
            cur.execute(f"DELETE FROM {SCHEMA}.users WHERE id = %s", (uid,))
            conn.commit()
            return resp(200, {"success": True})

        return resp(405, {"error": "Method not allowed"})
    finally:
        conn.close()