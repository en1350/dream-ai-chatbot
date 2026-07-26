import json
import os
import re
import urllib.request
import urllib.error
import urllib.parse
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
VK_API_VERSION = "5.199"

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
# Телефон: 10-11 цифр, допускаем +, пробелы, скобки, дефисы.
PHONE_RE = re.compile(r"(?:\+?\d[\s\-()]?){10,15}")


def extract_contacts(text: str) -> dict:
    """Достаёт email и телефон из текста сообщения."""
    result = {"email": "", "phone": ""}
    email_match = EMAIL_RE.search(text or "")
    if email_match:
        result["email"] = email_match.group(0).strip()
    for m in PHONE_RE.finditer(text or ""):
        digits = re.sub(r"\D", "", m.group(0))
        if 10 <= len(digits) <= 15:
            if len(digits) == 11 and digits[0] in ("7", "8"):
                digits = "7" + digits[1:]
            result["phone"] = "+" + digits
            break
    return result


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def escape(value: str) -> str:
    return (value or "").replace("'", "''")


def build_system_prompt(bot: dict) -> str:
    """Собирает системный промпт из полей персоны бота."""
    parts = []
    name = (bot.get("prompt_bot_name") or "").strip()
    role = (bot.get("prompt_bot_role") or "").strip()
    persona = (bot.get("prompt_persona") or "").strip()
    goal = (bot.get("prompt_goal") or "").strip()
    tasks = (bot.get("prompt_tasks") or "").strip()
    context = (bot.get("prompt_context") or "").strip()
    instructions = (bot.get("prompt_instructions") or "").strip()
    constraints = (bot.get("prompt_constraints") or "").strip()
    traits = (bot.get("prompt_traits") or "").strip()
    tone = (bot.get("prompt_tone") or "").strip()
    address = (bot.get("prompt_address") or "ты").strip()
    examples = (bot.get("prompt_examples") or "").strip()

    if name or role:
        parts.append(f"Тебя зовут {name or 'ассистент'}. Твоя роль: {role or 'помощник сообщества'}.")
    if persona:
        parts.append(f"Личность: {persona}")
    if traits:
        parts.append(f"Черты характера: {traits}")
    if goal:
        parts.append(f"Твоя цель: {goal}")
    if tasks:
        parts.append(f"Задачи: {tasks}")
    if context:
        parts.append(f"Контекст: {context}")
    if instructions:
        parts.append(f"Инструкции: {instructions}")
    if constraints:
        parts.append(f"Ограничения: {constraints}")
    if tone:
        parts.append(f"Тон общения: {tone}")
    parts.append(f"Обращайся к собеседнику на «{address}».")
    if examples:
        parts.append(f"Примеры ответов: {examples}")

    lead_instruction = (
        "Важно: в подходящий момент вежливо предложи оставить контакт (телефон или email), "
        "чтобы менеджер связался с человеком. Не будь навязчивым и проси контакт только один раз."
    )
    if not parts:
        return (
            "Ты — дружелюбный ассистент сообщества. Отвечай кратко, вежливо и по делу.\n"
            + lead_instruction
        )
    parts.append("Отвечай кратко и по делу, как живой человек в переписке.")
    parts.append(lead_instruction)
    return "\n".join(parts)


def call_ai(system_prompt: str, history: list) -> str:
    api_key = os.environ.get("API_CHATBOT", "")
    if not api_key:
        raise ValueError("AI ключ не настроен")
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
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    return body["choices"][0]["message"]["content"].strip()


def vk_send_message(access_token: str, peer_id: int, text: str) -> None:
    params = urllib.parse.urlencode({
        "peer_id": peer_id,
        "message": text,
        "random_id": 0,
        "access_token": access_token,
        "v": VK_API_VERSION,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.vk.com/method/messages.send",
        data=params,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        resp.read()


def vk_get_user_name(access_token: str, vk_user_id: int) -> str:
    """Получает имя и фамилию пользователя ВК."""
    try:
        params = urllib.parse.urlencode({
            "user_ids": vk_user_id,
            "access_token": access_token,
            "v": VK_API_VERSION,
        })
        url = f"https://api.vk.com/method/users.get?{params}"
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        users = data.get("response") or []
        if users:
            u = users[0]
            return f"{u.get('first_name', '')} {u.get('last_name', '')}".strip()
    except Exception:
        pass
    return ""


def save_lead(cur, conn, bot_id: int, vk_user_id: int, access_token: str, contacts: dict) -> None:
    """Создаёт заявку в разделе «Лиды» по контакту из переписки.
    Один контакт на пользователя ВК — повторные сообщения дополняют запись."""
    name = vk_get_user_name(access_token, vk_user_id)
    email = contacts.get("email") or f"vk{vk_user_id}@vk.lead"
    phone = contacts.get("phone") or ""
    extra = json.dumps({"source": "vk", "vk_user_id": vk_user_id}, ensure_ascii=False)

    # Не дублируем: ищем существующий лид этого пользователя ВК.
    cur.execute(
        f"""SELECT id FROM {SCHEMA}.leads
            WHERE bot_id = {bot_id} AND extra->>'vk_user_id' = '{vk_user_id}' LIMIT 1"""
    )
    existing = cur.fetchone()
    if existing:
        sets = []
        if contacts.get("email"):
            sets.append(f"email = '{escape(email)}'")
        if phone:
            sets.append(f"phone = '{escape(phone)}'")
        if name:
            sets.append(f"name = '{escape(name)}'")
        if sets:
            cur.execute(f"UPDATE {SCHEMA}.leads SET {', '.join(sets)} WHERE id = {existing[0]}")
            conn.commit()
        return

    cur.execute(
        f"""INSERT INTO {SCHEMA}.leads (bot_id, email, name, phone, extra)
            VALUES ({bot_id}, '{escape(email)}', '{escape(name)}', '{escape(phone)}', '{escape(extra)}'::jsonb)"""
    )
    conn.commit()


def load_history(cur, bot_id: int, vk_user_id: int) -> list:
    cur.execute(
        f"""SELECT vars FROM {SCHEMA}.vk_sessions
            WHERE bot_id = {bot_id} AND vk_user_id = {vk_user_id} LIMIT 1"""
    )
    row = cur.fetchone()
    if row and row[0]:
        vars_data = row[0] if isinstance(row[0], dict) else json.loads(row[0])
        return vars_data.get("history", [])
    return []


def save_history(cur, conn, bot_id: int, vk_user_id: int, history: list) -> None:
    trimmed = history[-20:]
    payload = escape(json.dumps({"history": trimmed}, ensure_ascii=False))
    cur.execute(
        f"""SELECT id FROM {SCHEMA}.vk_sessions
            WHERE bot_id = {bot_id} AND vk_user_id = {vk_user_id} LIMIT 1"""
    )
    if cur.fetchone():
        cur.execute(
            f"""UPDATE {SCHEMA}.vk_sessions SET vars = '{payload}'::jsonb, updated_at = now()
                WHERE bot_id = {bot_id} AND vk_user_id = {vk_user_id}"""
        )
    else:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.vk_sessions (vk_user_id, bot_id, vars)
                VALUES ({vk_user_id}, {bot_id}, '{payload}'::jsonb)"""
        )
    conn.commit()


def handler(event: dict, context) -> dict:
    """Callback API ВКонтакте: подтверждение сервера (confirmation) и приём сообщений (message_new).
    На новое сообщение генерирует ответ от лица бота и отправляет его пользователю сообщества.
    ВК всегда ожидает в ответ строку 'ok' (или confirmation-код)."""
    method = event.get("httpMethod", "POST")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": ""}

    plain = {"statusCode": 200, "headers": {"Content-Type": "text/plain; charset=utf-8"}}

    if method != "POST":
        return {**plain, "body": "ok"}

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return {**plain, "body": "ok"}

    vk_type = body.get("type")
    group_id = body.get("group_id")
    secret = body.get("secret") or ""

    if not group_id:
        return {**plain, "body": "ok"}

    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            f"""SELECT vk.bot_id, vk.access_token, vk.secret_key, vk.confirm_code, vk.active
                FROM {SCHEMA}.vk_integrations vk
                WHERE vk.group_id = {int(group_id)} LIMIT 1"""
        )
        row = cur.fetchone()
        if not row:
            return {**plain, "body": "ok"}

        bot_id, access_token, secret_key, confirm_code, active = row

        # Подтверждение адреса сервера — возвращаем строку confirmation.
        if vk_type == "confirmation":
            return {**plain, "body": confirm_code or "ok"}

        # Проверка секрета (если он задан в настройках Callback API).
        if secret_key and secret and secret != secret_key:
            return {**plain, "body": "ok"}

        if not active:
            return {**plain, "body": "ok"}

        if vk_type == "message_new":
            obj = body.get("object") or {}
            message = obj.get("message") or obj  # VK 5.199: object.message; старые: object
            text = (message.get("text") or "").strip()
            peer_id = message.get("peer_id") or message.get("from_id")
            from_id = message.get("from_id")

            if not text or not peer_id or (from_id and from_id < 0):
                return {**plain, "body": "ok"}

            # Автосбор заявки: если в сообщении есть телефон или email — сохраняем лид.
            contacts = extract_contacts(text)
            if contacts["email"] or contacts["phone"]:
                try:
                    save_lead(cur, conn, int(bot_id), int(from_id), access_token, contacts)
                except Exception:
                    pass

            cur.execute(
                f"""SELECT prompt_bot_name, prompt_bot_role, prompt_persona, prompt_goal,
                           prompt_tasks, prompt_context, prompt_instructions, prompt_constraints,
                           prompt_traits, prompt_tone, prompt_address, prompt_examples
                    FROM {SCHEMA}.bots WHERE id = {int(bot_id)} LIMIT 1"""
            )
            brow = cur.fetchone()
            cols = ["prompt_bot_name", "prompt_bot_role", "prompt_persona", "prompt_goal",
                    "prompt_tasks", "prompt_context", "prompt_instructions", "prompt_constraints",
                    "prompt_traits", "prompt_tone", "prompt_address", "prompt_examples"]
            bot = dict(zip(cols, brow)) if brow else {}

            history = load_history(cur, int(bot_id), int(from_id))
            history.append({"from": "user", "text": text})

            try:
                reply = call_ai(build_system_prompt(bot), history)
            except Exception:
                reply = "Извините, сейчас не могу ответить. Напишите чуть позже."

            history.append({"from": "bot", "text": reply})
            save_history(cur, conn, int(bot_id), int(from_id), history)

            try:
                vk_send_message(access_token, int(peer_id), reply)
            except Exception:
                pass

            return {**plain, "body": "ok"}

        return {**plain, "body": "ok"}
    finally:
        conn.close()