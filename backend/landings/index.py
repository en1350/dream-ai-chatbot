import json
import os
import re
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
DEFAULT_USER_ID = 1


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def escape(value: str) -> str:
    return (value or "").replace("'", "''")


def slugify(value: str) -> str:
    value = value.lower().strip()
    translit = {
        "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
        "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
        "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
        "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
        "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    }
    result = "".join(translit.get(ch, ch) for ch in value)
    result = re.sub(r"[^a-z0-9]+", "-", result).strip("-")
    return result[:100] or "landing"


def row_to_landing(row) -> dict:
    return {
        "id": row[0],
        "name": row[1],
        "slug": row[2],
        "blocks": row[3] if isinstance(row[3], (list, dict)) else json.loads(row[3] or "[]"),
        "theme": row[4] if isinstance(row[4], dict) else json.loads(row[4] or "{}"),
        "published": row[5],
        "createdAt": row[6].isoformat() if row[6] else None,
        "updatedAt": row[7].isoformat() if row[7] else None,
        "botId": row[8] if len(row) > 8 else None,
    }


def handler(event: dict, context) -> dict:
    """CRUD лендингов. GET (список или ?id=) — получить, POST — создать, PUT — сохранить блоки/тему/публикацию, DELETE ?id= — удалить."""
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
            landing_id = params.get("id")
            if landing_id:
                if not str(landing_id).isdigit():
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid id"})}
                cur.execute(
                    f"""SELECT id, name, slug, blocks, theme, published, created_at, updated_at, bot_id
                        FROM {SCHEMA}.landings WHERE id = {int(landing_id)} AND user_id = {DEFAULT_USER_ID}"""
                )
                row = cur.fetchone()
                if not row:
                    return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Landing not found"})}

                cur.execute(f"SELECT id, name FROM {SCHEMA}.bots WHERE user_id = {DEFAULT_USER_ID} ORDER BY created_at DESC")
                bots = [{"id": b[0], "name": b[1]} for b in cur.fetchall()]
                result = row_to_landing(row)
                result["bots"] = bots
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"landing": result})}

            cur.execute(
                f"""SELECT id, name, slug, blocks, theme, published, created_at, updated_at, bot_id
                    FROM {SCHEMA}.landings WHERE user_id = {DEFAULT_USER_ID} ORDER BY created_at DESC"""
            )
            rows = cur.fetchall()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"landings": [row_to_landing(r) for r in rows]})}

        if method == "POST":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

            name = (body.get("name") or "Мой лендинг").strip()[:200]
            base_slug = slugify(body.get("slug") or name)
            slug = base_slug
            suffix = 1
            while True:
                cur.execute(f"SELECT id FROM {SCHEMA}.landings WHERE slug = '{escape(slug)}'")
                if not cur.fetchone():
                    break
                suffix += 1
                slug = f"{base_slug}-{suffix}"

            default_blocks = json.dumps(body.get("blocks") or [
                {"type": "hero", "title": "Заголовок вашего предложения", "subtitle": "Короткое пояснение, почему стоит оставить заявку прямо сейчас",
                 "ctaText": "Оставить заявку", "ctaLink": "#cta", "image": ""},
            ])
            default_theme = json.dumps(body.get("theme") or {"primaryColor": "#2B7FFF", "accentColor": "#18E0C8"})

            bot_id = body.get("botId")
            bot_id_sql = int(bot_id) if bot_id else "NULL"

            cur.execute(
                f"""INSERT INTO {SCHEMA}.landings (user_id, name, slug, blocks, theme, published, bot_id)
                    VALUES ({DEFAULT_USER_ID}, '{escape(name)}', '{escape(slug)}', '{escape(default_blocks)}'::jsonb, '{escape(default_theme)}'::jsonb, false, {bot_id_sql})
                    RETURNING id, name, slug, blocks, theme, published, created_at, updated_at, bot_id"""
            )
            row = cur.fetchone()
            conn.commit()
            return {"statusCode": 201, "headers": headers, "body": json.dumps({"landing": row_to_landing(row)})}

        if method == "PUT":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

            landing_id = body.get("id")
            if not landing_id:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "id is required"})}
            landing_id = int(landing_id)

            cur.execute(f"SELECT id, slug FROM {SCHEMA}.landings WHERE id = {landing_id} AND user_id = {DEFAULT_USER_ID}")
            existing = cur.fetchone()
            if not existing:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Landing not found"})}

            name = (body.get("name") or "Мой лендинг").strip()[:200]
            blocks = json.dumps(body.get("blocks") or [])
            theme = json.dumps(body.get("theme") or {})
            published = bool(body.get("published", False))

            slug = existing[1]
            if body.get("slug"):
                new_slug = slugify(body.get("slug"))
                if new_slug != slug:
                    cur.execute(f"SELECT id FROM {SCHEMA}.landings WHERE slug = '{escape(new_slug)}' AND id != {landing_id}")
                    if not cur.fetchone():
                        slug = new_slug

            bot_id = body.get("botId")
            bot_id_sql = int(bot_id) if bot_id else "NULL"

            cur.execute(
                f"""UPDATE {SCHEMA}.landings SET name = '{escape(name)}', slug = '{escape(slug)}',
                    blocks = '{escape(blocks)}'::jsonb, theme = '{escape(theme)}'::jsonb,
                    published = {published}, bot_id = {bot_id_sql}, updated_at = now()
                    WHERE id = {landing_id}
                    RETURNING id, name, slug, blocks, theme, published, created_at, updated_at, bot_id"""
            )
            row = cur.fetchone()
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"landing": row_to_landing(row)})}

        if method == "DELETE":
            landing_id = params.get("id")
            if not landing_id or not str(landing_id).isdigit():
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "id is required"})}
            cur.execute(f"DELETE FROM {SCHEMA}.landings WHERE id = {int(landing_id)} AND user_id = {DEFAULT_USER_ID}")
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"success": True})}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        conn.close()