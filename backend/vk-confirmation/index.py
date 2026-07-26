import json

CONFIRMATION_CODE = "80a9e954"


def handler(event: dict, context) -> dict:
    """Callback API ВКонтакте (bot-flow.ru): на type='confirmation' возвращает код подтверждения, на остальные события — 'ok'."""
    method = event.get("httpMethod", "POST")

    plain = {"statusCode": 200, "headers": {"Content-Type": "text/plain; charset=utf-8"}}

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": ""}

    if method != "POST":
        return {**plain, "body": "ok"}

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return {**plain, "body": "ok"}

    if body.get("type") == "confirmation":
        return {**plain, "body": CONFIRMATION_CODE}

    return {**plain, "body": "ok"}
