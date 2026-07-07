import json
import os
import urllib.request
import urllib.error


def call_aitunnel(system_prompt: str, history: list) -> str:
    api_key = os.environ.get("API_CHATBOT", "")
    messages = [{"role": "system", "content": system_prompt}]
    for m in history[-10:]:
        role = "user" if m.get("from") == "user" else "assistant"
        messages.append({"role": role, "content": m.get("text", "")})

    payload = json.dumps({
        "model": "gpt-4o-mini",
        "max_tokens": 400,
        "temperature": 0.7,
        "messages": messages,
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
    return body["choices"][0]["message"]["content"].strip()


def handler(event: dict, context) -> dict:
    """Отвечает от лица AI-блока бота на сообщение пользователя в тест-чате конструктора, используя AITUNNEL (GPT-4o-mini)."""
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

    prompt = (body.get("prompt") or "Ты — дружелюбный ассистент чат-бота. Отвечай кратко и по делу.").strip()
    history = body.get("history") or []

    if not os.environ.get("API_CHATBOT"):
        return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": "AI ключ не настроен"})}

    try:
        reply = call_aitunnel(prompt, history)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        return {"statusCode": 502, "headers": headers, "body": json.dumps({"error": "AI сервис недоступен", "detail": detail[:300]})}
    except Exception as e:
        return {"statusCode": 502, "headers": headers, "body": json.dumps({"error": "Ошибка запроса к AI", "detail": str(e)})}

    return {"statusCode": 200, "headers": headers, "body": json.dumps({"reply": reply})}
