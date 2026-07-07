import json
import os
import re
import urllib.request
import urllib.error

ALLOWED_SUBTYPES = {
    "start": "trigger", "keyword": "trigger", "button-trigger": "trigger", "webhook-in": "trigger",
    "text": "message", "image": "message", "buttons": "message", "typing": "message",
    "condition": "logic", "random": "logic", "delay": "logic",
    "save-var": "data", "validate": "data",
    "gpt": "ai", "intent": "ai",
    "crm": "integration", "webhook-out": "integration", "telegram": "integration", "operator": "integration",
}

SYSTEM_PROMPT = """Ты — помощник конструктора чат-ботов для ВКонтакте. По короткому описанию бизнеса и задачи собери граф сценария бота.

Используй ТОЛЬКО такие subtype блоков: start, keyword, button-trigger, webhook-in, text, image, buttons, typing, condition, random, delay, save-var, validate, gpt, intent, crm, webhook-out, telegram, operator.

Правила:
- Сценарий должен начинаться с ровно одного блока subtype="start".
- Каждый блок: id (строка n1, n2, ...), subtype, title (короткое название на русском), text (текст сообщения/вопроса/инструкции на русском, 1-2 предложения).
- Соедини блоки массивом edges: {"source": "n1", "target": "n2"}.
- Собери от 4 до 8 блоков логичной цепочкой под задачу пользователя.
- Отвечай ТОЛЬКО валидным JSON без markdown, без комментариев, в формате:
{"nodes":[{"id":"n1","subtype":"start","title":"...","text":"..."}],"edges":[{"source":"n1","target":"n2"}]}
"""


def call_aitunnel(description: str) -> dict:
    api_key = os.environ.get("API_CHATBOT", "")
    payload = json.dumps({
        "model": "gpt-4o-mini",
        "max_tokens": 2000,
        "temperature": 0.4,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Опиши сценарий бота для: {description}"},
        ],
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.aitunnel.ru/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    return body


def extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group(0)
    return json.loads(text)


def handler(event: dict, context) -> dict:
    """Генерирует граф сценария чат-бота (ноды и связи) по текстовому описанию через AI (AITUNNEL)."""
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

    if method != "POST":
        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Invalid JSON"})}

    description = (body.get("description") or "").strip()
    if not description:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "description is required"})}

    if not os.environ.get("API_CHATBOT"):
        return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": "AI ключ не настроен"})}

    try:
        ai_response = call_aitunnel(description)
        content = ai_response["choices"][0]["message"]["content"]
        graph = extract_json(content)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        return {"statusCode": 502, "headers": headers, "body": json.dumps({"error": "AI сервис недоступен", "detail": detail[:300]})}
    except Exception as e:
        return {"statusCode": 502, "headers": headers, "body": json.dumps({"error": "Не удалось разобрать ответ AI", "detail": str(e)})}

    raw_nodes = graph.get("nodes", [])
    raw_edges = graph.get("edges", [])

    clean_nodes = []
    valid_ids = set()
    for n in raw_nodes:
        subtype = n.get("subtype")
        if subtype not in ALLOWED_SUBTYPES:
            continue
        node_id = str(n.get("id") or f"n{len(clean_nodes) + 1}")
        valid_ids.add(node_id)
        clean_nodes.append({
            "id": node_id,
            "subtype": subtype,
            "category": ALLOWED_SUBTYPES[subtype],
            "title": (n.get("title") or subtype)[:80],
            "text": (n.get("text") or "")[:400],
        })

    clean_edges = []
    for e in raw_edges:
        s, t = str(e.get("source", "")), str(e.get("target", ""))
        if s in valid_ids and t in valid_ids and s != t:
            clean_edges.append({"source": s, "target": t})

    if not clean_nodes:
        return {"statusCode": 502, "headers": headers, "body": json.dumps({"error": "AI не вернул ни одного корректного блока"})}

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({"nodes": clean_nodes, "edges": clean_edges}),
    }
