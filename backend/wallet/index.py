import json
import os
import uuid
import base64
import urllib.request
import urllib.error

import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
DEFAULT_USER_ID = 1

YOOKASSA_API = "https://api.yookassa.ru/v3/payments"

# Быстрые суммы пополнения (в копейках).
QUICK_AMOUNTS = [50000, 100000, 200000, 500000]
MIN_TOPUP_KOPECKS = 10000  # минимум 100 ₽


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
        "Access-Control-Max-Age": "86400",
    }


def json_resp(status, payload):
    return {
        "statusCode": status,
        "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
        "body": json.dumps(payload),
    }


def yookassa_create_payment(amount_kopecks, description, return_url, idempotence_key):
    shop_id = os.environ.get("YOOKASSA_SHOP_ID")
    secret_key = os.environ.get("YOOKASSA_SECRET_KEY")
    if not shop_id or not secret_key:
        return None, "YooKassa не настроена: отсутствуют ключи магазина"

    rub = f"{amount_kopecks / 100:.2f}"
    payload = {
        "amount": {"value": rub, "currency": "RUB"},
        "capture": True,
        "confirmation": {"type": "redirect", "return_url": return_url},
        "description": description[:128],
    }
    data = json.dumps(payload).encode("utf-8")
    auth = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()
    req = urllib.request.Request(YOOKASSA_API, data=data, method="POST")
    req.add_header("Authorization", f"Basic {auth}")
    req.add_header("Idempotence-Key", idempotence_key)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        return body, None
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        return None, f"YooKassa error {e.code}: {detail}"
    except Exception as e:  # noqa: BLE001
        return None, f"YooKassa request failed: {e}"


def handler(event: dict, context) -> dict:
    """Кошелёк: пополнение баланса через ЮKassa. GET — список транзакций и быстрые суммы; POST {action:'topup', amountKopecks} — создать платёж; POST от ЮKassa (webhook) — зачислить средства после оплаты."""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    conn = get_conn()
    try:
        cur = conn.cursor()

        if method == "GET":
            cur.execute(
                f"""SELECT id, amount_kopecks, kind, status, description, created_at
                    FROM {SCHEMA}.wallet_transactions
                    WHERE user_id = {DEFAULT_USER_ID}
                    ORDER BY created_at DESC LIMIT 30"""
            )
            rows = cur.fetchall()
            txs = [
                {
                    "id": r[0],
                    "amountKopecks": int(r[1]),
                    "kind": r[2],
                    "status": r[3],
                    "description": r[4],
                    "createdAt": r[5].isoformat() if r[5] else None,
                }
                for r in rows
            ]
            cur.execute(f"SELECT balance_kopecks FROM {SCHEMA}.users WHERE id = {DEFAULT_USER_ID}")
            brow = cur.fetchone()
            balance = int(brow[0]) if brow and brow[0] is not None else 0
            return json_resp(200, {
                "balanceKopecks": balance,
                "transactions": txs,
                "quickAmounts": QUICK_AMOUNTS,
                "minKopecks": MIN_TOPUP_KOPECKS,
            })

        if method == "POST":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return json_resp(400, {"error": "Invalid JSON"})

            # Webhook от ЮKassa: событие payment.* с объектом платежа.
            # Проверяем именно наличие ключей (пустой object {} тоже webhook, не пополнение).
            if body.get("event") and "object" in body:
                return handle_webhook(cur, conn, body)

            action = body.get("action", "topup")
            if action == "topup":
                return handle_topup(cur, conn, body)

            return json_resp(400, {"error": "Неизвестное действие"})

        return json_resp(405, {"error": "Method not allowed"})
    finally:
        conn.close()


def handle_topup(cur, conn, body):
    amount = body.get("amountKopecks")
    if not isinstance(amount, int) or amount < MIN_TOPUP_KOPECKS:
        return json_resp(400, {"error": f"Минимальная сумма пополнения — {MIN_TOPUP_KOPECKS // 100} ₽"})

    return_url = body.get("returnUrl") or "https://poehali.dev"
    desc = f"Пополнение кошелька на {amount / 100:.0f} ₽"

    payment, err = yookassa_create_payment(amount, desc, return_url, str(uuid.uuid4()))
    if err:
        return json_resp(502, {"error": err})

    payment_id = payment.get("id")
    confirmation_url = (payment.get("confirmation") or {}).get("confirmation_url")
    safe_desc = desc.replace("'", "''")
    cur.execute(
        f"""INSERT INTO {SCHEMA}.wallet_transactions
            (user_id, amount_kopecks, kind, status, description, provider, provider_payment_id)
            VALUES ({DEFAULT_USER_ID}, {amount}, 'topup', 'pending', '{safe_desc}', 'yookassa', '{payment_id}')"""
    )
    conn.commit()
    return json_resp(200, {"confirmationUrl": confirmation_url, "paymentId": payment_id})


def handle_webhook(cur, conn, body):
    obj = body.get("object") or {}
    event_type = body.get("event")
    payment_id = obj.get("id")
    status = obj.get("status")

    if not payment_id:
        return json_resp(200, {"ok": True})

    # Обрабатываем только успешную оплату один раз (защита от повторного зачисления).
    if event_type == "payment.succeeded" and status == "succeeded":
        safe_pid = payment_id.replace("'", "''")
        cur.execute(
            f"""SELECT id, user_id, amount_kopecks, status FROM {SCHEMA}.wallet_transactions
                WHERE provider_payment_id = '{safe_pid}' AND provider = 'yookassa' LIMIT 1"""
        )
        row = cur.fetchone()
        if row and row[3] == "pending":
            tx_id, user_id, amount = row[0], row[1], int(row[2])
            cur.execute(
                f"UPDATE {SCHEMA}.wallet_transactions SET status = 'succeeded', updated_at = now() WHERE id = {tx_id}"
            )
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance_kopecks = balance_kopecks + {amount} WHERE id = {user_id}"
            )
            conn.commit()

    elif event_type == "payment.canceled":
        safe_pid = payment_id.replace("'", "''")
        cur.execute(
            f"""UPDATE {SCHEMA}.wallet_transactions SET status = 'canceled', updated_at = now()
                WHERE provider_payment_id = '{safe_pid}' AND status = 'pending'"""
        )
        conn.commit()

    return json_resp(200, {"ok": True})