import json
import os
import hashlib
import secrets
import re
import urllib.request
import urllib.parse
import urllib.error

import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

PLANS = {"start", "pro"}

SMTPBZ_API_KEY = os.environ.get("SMTPBZ_API_KEY", "")
MAIL_FROM = os.environ.get("MAIL_FROM", "noreply@bot-flow.ru")
MAIL_FROM_NAME = os.environ.get("MAIL_FROM_NAME", "БотВПотоке")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}
JSON_HEADERS = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()


def make_stored_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    return f"{salt}${hash_password(password, salt)}"


def verify_password(password: str, stored: str) -> bool:
    if "$" not in stored:
        return False
    salt, digest = stored.split("$", 1)
    return secrets.compare_digest(hash_password(password, salt), digest)


def user_to_dict(row) -> dict:
    return {
        "id": row[0],
        "email": row[1],
        "name": row[2],
        "plan": row[3],
        "createdAt": row[4].isoformat() if row[4] else None,
    }


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": JSON_HEADERS, "body": json.dumps(body)}


def send_reset_email(to_email: str, name: str, reset_url: str) -> bool:
    if not SMTPBZ_API_KEY:
        return False
    html = f"""
    <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #2B7FFF;">Восстановление пароля</h2>
      <p>Здравствуйте, {name}!</p>
      <p>Вы запросили сброс пароля в сервисе «БотВПотоке». Нажмите на кнопку ниже, чтобы задать новый пароль:</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="{reset_url}" style="display: inline-block; background: #2B7FFF; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600;">Сбросить пароль</a>
      </p>
      <p style="color: #666; font-size: 13px;">Ссылка действует 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
    </div>
    """
    payload = urllib.parse.urlencode(
        {
            "from": MAIL_FROM,
            "name": MAIL_FROM_NAME,
            "subject": "Восстановление пароля — БотВПотоке",
            "to": to_email,
            "html": html,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://api.smtp.bz/v1/smtp/send",
        data=payload,
        headers={"Authorization": SMTPBZ_API_KEY, "Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            print(f"[smtp.bz] status={r.status} body={r.read(500)}")
            return 200 <= r.status < 300
    except urllib.error.HTTPError as e:
        print(f"[smtp.bz] HTTPError status={e.code} body={e.read(500)}")
        return False
    except Exception as e:
        print(f"[smtp.bz] error: {e}")
        return False


def get_user_by_token(cur, token: str):
    cur.execute(
        f"""SELECT u.id, u.email, u.name, u.plan, u.created_at
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND (s.expires_at IS NULL OR s.expires_at > now())""",
        (token,),
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    """Регистрация, вход, восстановление пароля, профиль и смена тарифа. POST ?action=register|login|forgot|reset, GET профиль, PUT смена тарифа."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token") or ""
    origin = headers.get("Origin") or headers.get("origin") or ""

    try:
        body = json.loads(event.get("body") or "{}")
    except (ValueError, TypeError):
        body = {}

    conn = get_conn()
    try:
        cur = conn.cursor()

        if method == "POST":
            action = params.get("action") or body.get("action")

            if action == "register":
                email = (body.get("email") or "").strip().lower()
                name = (body.get("name") or "").strip()
                password = body.get("password") or ""
                consent = body.get("consent")

                if not EMAIL_RE.match(email):
                    return resp(400, {"error": "Введите корректный email"})
                if len(name) < 2:
                    return resp(400, {"error": "Укажите имя"})
                if len(password) < 6:
                    return resp(400, {"error": "Пароль должен быть не короче 6 символов"})
                if not consent:
                    return resp(400, {"error": "Необходимо согласие на обработку персональных данных"})

                cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
                if cur.fetchone():
                    return resp(409, {"error": "Пользователь с таким email уже существует"})

                cur.execute(
                    f"""INSERT INTO {SCHEMA}.users (email, password_hash, name, plan)
                        VALUES (%s, %s, %s, 'start')
                        RETURNING id, email, name, plan, created_at""",
                    (email, make_stored_hash(password), name),
                )
                user_row = cur.fetchone()
                new_token = secrets.token_hex(32)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)",
                    (user_row[0], new_token),
                )
                conn.commit()
                return resp(200, {"token": new_token, "user": user_to_dict(user_row)})

            if action == "login":
                email = (body.get("email") or "").strip().lower()
                password = body.get("password") or ""
                cur.execute(
                    f"SELECT id, email, name, plan, created_at, password_hash FROM {SCHEMA}.users WHERE email = %s",
                    (email,),
                )
                row = cur.fetchone()
                if not row or not verify_password(password, row[5]):
                    return resp(401, {"error": "Неверный email или пароль"})
                new_token = secrets.token_hex(32)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)",
                    (row[0], new_token),
                )
                conn.commit()
                return resp(200, {"token": new_token, "user": user_to_dict(row[:5])})

            if action == "forgot":
                email = (body.get("email") or "").strip().lower()
                if not EMAIL_RE.match(email):
                    return resp(400, {"error": "Введите корректный email"})
                cur.execute(f"SELECT id, name FROM {SCHEMA}.users WHERE email = %s", (email,))
                row = cur.fetchone()
                # Всегда отвечаем успехом, чтобы не раскрывать наличие email в базе.
                if row:
                    reset_token = secrets.token_hex(32)
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.password_resets (user_id, token) VALUES (%s, %s)",
                        (row[0], reset_token),
                    )
                    conn.commit()
                    base = origin.rstrip("/") if origin.startswith("http") else ""
                    reset_url = f"{base}/reset-password?token={reset_token}"
                    send_reset_email(email, row[1], reset_url)
                return resp(200, {"success": True})

            if action == "reset":
                reset_token = body.get("token") or ""
                new_password = body.get("password") or ""
                if len(new_password) < 6:
                    return resp(400, {"error": "Пароль должен быть не короче 6 символов"})
                cur.execute(
                    f"""SELECT id, user_id FROM {SCHEMA}.password_resets
                        WHERE token = %s AND used_at IS NULL AND expires_at > now()""",
                    (reset_token,),
                )
                pr = cur.fetchone()
                if not pr:
                    return resp(400, {"error": "Ссылка недействительна или устарела"})
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET password_hash = %s WHERE id = %s",
                    (make_stored_hash(new_password), pr[1]),
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.password_resets SET used_at = now() WHERE id = %s",
                    (pr[0],),
                )
                conn.commit()
                return resp(200, {"success": True})

            return resp(400, {"error": "Unknown action"})

        if method == "GET":
            if not token:
                return resp(401, {"error": "Требуется авторизация"})
            user = get_user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Сессия недействительна"})
            return resp(200, {"user": user_to_dict(user)})

        if method == "PUT":
            if not token:
                return resp(401, {"error": "Требуется авторизация"})
            user = get_user_by_token(cur, token)
            if not user:
                return resp(401, {"error": "Сессия недействительна"})
            plan = body.get("plan")
            if plan not in PLANS:
                return resp(400, {"error": "Неизвестный тариф"})
            cur.execute(
                f"UPDATE {SCHEMA}.users SET plan = %s WHERE id = %s RETURNING id, email, name, plan, created_at",
                (plan, user[0]),
            )
            updated = cur.fetchone()
            conn.commit()
            return resp(200, {"user": user_to_dict(updated)})

        return resp(405, {"error": "Method not allowed"})
    finally:
        conn.close()