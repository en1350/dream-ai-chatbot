import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
DEFAULT_USER_ID = 1


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def escape(value: str) -> str:
    return (value or "").replace("'", "''")


def handler(event: dict, context) -> dict:
    """Загрузка и сохранение сценария бота (ноды + связи). GET ?bot_id=1 — получить, PUT — сохранить весь граф целиком."""
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
            bot_id = params.get("bot_id")
            if not bot_id or not str(bot_id).isdigit():
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "bot_id is required"})}

            cur.execute(
                f"""SELECT id, name, description, status, dialogs_count
                    FROM {SCHEMA}.bots WHERE id = {int(bot_id)} AND user_id = {DEFAULT_USER_ID}"""
            )
            bot_row = cur.fetchone()
            if not bot_row:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Bot not found"})}

            cur.execute(
                f"""SELECT node_id, type, label, message, pos_x, pos_y, extra
                    FROM {SCHEMA}.bot_nodes WHERE bot_id = {int(bot_id)}"""
            )
            node_rows = cur.fetchall()
            nodes = []
            for r in node_rows:
                extra = r[6] or {}
                if isinstance(extra, str):
                    extra = json.loads(extra)
                nodes.append({
                    "id": r[0],
                    "subtype": r[1],
                    "title": r[2],
                    "text": r[3] or "",
                    "x": r[4] or 100,
                    "y": r[5] or 100,
                    "buttons": extra.get("buttons", []),
                    "category": extra.get("category", "message"),
                    "successText": extra.get("successText", ""),
                    "responseType": extra.get("responseType"),
                    "collectEmail": extra.get("collectEmail", False),
                    "linkUrl": extra.get("linkUrl", ""),
                    "imageUrl": extra.get("imageUrl", ""),
                    "videoUrl": extra.get("videoUrl", ""),
                })

            cur.execute(
                f"""SELECT edge_id, source_node_id, target_node_id, label
                    FROM {SCHEMA}.bot_edges WHERE bot_id = {int(bot_id)}"""
            )
            edge_rows = cur.fetchall()
            edges = [{"id": r[0], "source": r[1], "target": r[2], "label": r[3]} for r in edge_rows]

            bot = {
                "id": bot_row[0], "name": bot_row[1], "description": bot_row[2] or "",
                "status": bot_row[3] or "inactive", "dialogsCount": bot_row[4] or 0,
            }
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"bot": bot, "nodes": nodes, "edges": edges})}

        if method == "PUT":
            try:
                body = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

            bot_id = body.get("botId")
            if not bot_id:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "botId is required"})}
            bot_id = int(bot_id)

            cur.execute(f"SELECT id FROM {SCHEMA}.bots WHERE id = {bot_id} AND user_id = {DEFAULT_USER_ID}")
            if not cur.fetchone():
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Bot not found"})}

            name = (body.get("name") or "Бот").strip()[:255]
            nodes = body.get("nodes") or []
            edges = body.get("edges") or []

            cur.execute(f"UPDATE {SCHEMA}.bots SET name = '{escape(name)}', updated_at = now() WHERE id = {bot_id}")
            cur.execute(f"DELETE FROM {SCHEMA}.bot_edges WHERE bot_id = {bot_id}")
            cur.execute(f"DELETE FROM {SCHEMA}.bot_nodes WHERE bot_id = {bot_id}")

            for n in nodes:
                extra = json.dumps({
                    "buttons": n.get("buttons", []),
                    "category": n.get("category", "message"),
                    "successText": n.get("successText", ""),
                    "responseType": n.get("responseType"),
                    "collectEmail": bool(n.get("collectEmail", False)),
                    "linkUrl": n.get("linkUrl", ""),
                    "imageUrl": n.get("imageUrl", ""),
                    "videoUrl": n.get("videoUrl", ""),
                })
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.bot_nodes (bot_id, node_id, type, label, message, pos_x, pos_y, extra)
                        VALUES ({bot_id}, '{escape(n.get("id", ""))}', '{escape(n.get("subtype", "text"))}',
                                '{escape(n.get("title", ""))}', '{escape(n.get("text", ""))}',
                                {float(n.get("x", 100))}, {float(n.get("y", 100))}, '{escape(extra)}')"""
                )

            for e in edges:
                edge_id = e.get("id") or f"{e.get('source')}-{e.get('target')}"
                edge_label = e.get("label")
                label_sql = f"'{escape(edge_label)}'" if edge_label else "NULL"
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.bot_edges (bot_id, edge_id, source_node_id, target_node_id, label)
                        VALUES ({bot_id}, '{escape(edge_id)}', '{escape(e.get("source", ""))}', '{escape(e.get("target", ""))}', {label_sql})"""
                )

            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"success": True})}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        conn.close()