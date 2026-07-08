import json
import os
import base64
import uuid
import boto3

ALLOWED_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
}

MAX_SIZE_BYTES = 25 * 1024 * 1024


def handler(event: dict, context) -> dict:
    """Загрузка изображений и видео (base64) в S3-хранилище проекта. POST: {fileBase64, contentType, folder?} -> {url}."""
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

    content_type = (body.get("contentType") or "").lower()
    file_b64 = body.get("fileBase64") or ""
    folder = (body.get("folder") or "media").strip("/")

    if content_type not in ALLOWED_TYPES:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Недопустимый тип файла. Разрешены изображения (png, jpg, webp, gif) и видео (mp4, webm, mov)"})}

    if "," in file_b64:
        file_b64 = file_b64.split(",", 1)[1]

    try:
        raw = base64.b64decode(file_b64)
    except Exception:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Не удалось декодировать файл"})}

    if len(raw) > MAX_SIZE_BYTES:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Файл слишком большой. Максимум 25 МБ"})}

    if not raw:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Пустой файл"})}

    ext = ALLOWED_TYPES[content_type]
    key = f"{folder}/{uuid.uuid4().hex}.{ext}"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=content_type)

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {"statusCode": 200, "headers": headers, "body": json.dumps({"url": cdn_url})}
