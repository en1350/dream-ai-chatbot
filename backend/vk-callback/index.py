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
PHONE_RE = re.compile(r"(?:\+?\d[\s\-()]?){10,15}")

RESTART_WORDS = {"начать", "старт", "start", "начни", "заново", "restart", "/start", "меню", "привет"}


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


# ---------- ИИ (запасной вариант для нод типа gpt/ai) ----------

def build_system_prompt(bot: dict) -> str:
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

    if not parts:
        return "Ты — дружелюбный ассистент сообщества. Отвечай кратко, вежливо и по делу."
    parts.append("Отвечай кратко и по делу, как живой человек в переписке.")
    return "\n".join(parts)


def call_ai(system_prompt: str, user_text: str) -> str:
    api_key = os.environ.get("API_CHATBOT", "")
    if not api_key:
        raise ValueError("AI ключ не настроен")
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_text},
    ]
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


# ---------- Отправка сообщений и клавиатуры в ВК ----------

def build_keyboard(buttons: list) -> str:
    """Формирует JSON-клавиатуру ВК из списка подписей кнопок (по одной в строке)."""
    rows = []
    for label in buttons:
        label = (label or "").strip()
        if not label:
            continue
        rows.append([{
            "action": {"type": "text", "label": label[:40]},
            "color": "primary",
        }])
    return json.dumps({"one_time": False, "inline": False, "buttons": rows}, ensure_ascii=False)


def vk_send_message(access_token: str, peer_id: int, text: str, buttons: list = None) -> None:
    data = {
        "peer_id": peer_id,
        "message": text,
        "random_id": 0,
        "access_token": access_token,
        "v": VK_API_VERSION,
    }
    if buttons:
        data["keyboard"] = build_keyboard(buttons)
    else:
        data["keyboard"] = json.dumps({"buttons": [], "one_time": True}, ensure_ascii=False)
    params = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request("https://api.vk.com/method/messages.send", data=params, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        resp.read()


def vk_get_user_name(access_token: str, vk_user_id: int) -> str:
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
    """Создаёт/дополняет заявку в разделе «Лиды» по контакту из переписки."""
    name = vk_get_user_name(access_token, vk_user_id)
    email = contacts.get("email") or f"vk{vk_user_id}@vk.lead"
    phone = contacts.get("phone") or ""
    extra = json.dumps({"source": "vk", "vk_user_id": vk_user_id}, ensure_ascii=False)

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


# ---------- Движок сценария ----------

def load_scenario(cur, bot_id: int) -> dict:
    """Загружает сценарий бота: ноды и связи."""
    cur.execute(
        f"""SELECT node_id, type, message, extra FROM {SCHEMA}.bot_nodes WHERE bot_id = {bot_id}"""
    )
    nodes = {}
    for r in cur.fetchall():
        extra = r[3] or {}
        if isinstance(extra, str):
            extra = json.loads(extra)
        nodes[r[0]] = {
            "id": r[0],
            "type": r[1],
            "text": r[2] or "",
            "buttons": extra.get("buttons", []),
            "linkUrl": extra.get("linkUrl", ""),
            "collectEmail": bool(extra.get("collectEmail", False)),
        }
    cur.execute(
        f"""SELECT source_node_id, target_node_id, label FROM {SCHEMA}.bot_edges WHERE bot_id = {bot_id}"""
    )
    edges = [{"source": r[0], "target": r[1], "label": r[2]} for r in cur.fetchall()]
    return {"nodes": nodes, "edges": edges}


def find_start_node(scenario: dict) -> str:
    for nid, node in scenario["nodes"].items():
        if node["type"] == "start":
            return nid
    targets = {e["target"] for e in scenario["edges"]}
    for nid in scenario["nodes"]:
        if nid not in targets:
            return nid
    return next(iter(scenario["nodes"]), None)


def next_by_button(scenario: dict, node_id: str, text: str) -> str:
    """Ищет переход из ноды по нажатой кнопке (совпадение по тексту метки ребра)."""
    text_norm = (text or "").strip().lower()
    out_edges = [e for e in scenario["edges"] if e["source"] == node_id]
    for e in out_edges:
        if (e.get("label") or "").strip().lower() == text_norm:
            return e["target"]
    # Если у ноды один выход без метки — идём по нему (например, кнопка «Далее»).
    if len(out_edges) == 1:
        return out_edges[0]["target"]
    return None


def get_session(cur, bot_id: int, vk_user_id: int) -> dict:
    cur.execute(
        f"""SELECT current_node_id, awaiting_email FROM {SCHEMA}.vk_sessions
            WHERE bot_id = {bot_id} AND vk_user_id = {vk_user_id} LIMIT 1"""
    )
    row = cur.fetchone()
    if row:
        return {"current_node_id": row[0], "awaiting_email": bool(row[1])}
    return None


def save_session(cur, conn, bot_id: int, vk_user_id: int, node_id: str, awaiting_email: bool) -> None:
    node_sql = f"'{escape(node_id)}'" if node_id else "NULL"
    cur.execute(
        f"""SELECT id FROM {SCHEMA}.vk_sessions WHERE bot_id = {bot_id} AND vk_user_id = {vk_user_id} LIMIT 1"""
    )
    if cur.fetchone():
        cur.execute(
            f"""UPDATE {SCHEMA}.vk_sessions
                SET current_node_id = {node_sql}, awaiting_email = {awaiting_email}, updated_at = now()
                WHERE bot_id = {bot_id} AND vk_user_id = {vk_user_id}"""
        )
    else:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.vk_sessions (vk_user_id, bot_id, current_node_id, awaiting_email)
                VALUES ({vk_user_id}, {bot_id}, {node_sql}, {awaiting_email})"""
        )
    conn.commit()


def render_node(node: dict) -> dict:
    """Готовит текст и кнопки для отправки ноды в ВК."""
    text = node["text"]
    if node.get("linkUrl"):
        text = f"{text}\n{node['linkUrl']}".strip()
    return {"text": text or "…", "buttons": node.get("buttons", [])}


def handler(event: dict, context) -> dict:
    """Callback API ВКонтакте: подтверждение сервера и приём сообщений (message_new).
    Ведёт пользователя по сценарию бота (ноды, кнопки, связи). ИИ используется как запасной
    вариант в конце сценария. ВК всегда ожидает в ответ строку 'ok' (или confirmation-код)."""
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

        if vk_type == "confirmation":
            return {**plain, "body": confirm_code or "ok"}

        if secret_key and secret and secret != secret_key:
            return {**plain, "body": "ok"}

        if not active:
            return {**plain, "body": "ok"}

        if vk_type != "message_new":
            return {**plain, "body": "ok"}

        obj = body.get("object") or {}
        message = obj.get("message") or obj
        text = (message.get("text") or "").strip()
        peer_id = message.get("peer_id") or message.get("from_id")
        from_id = message.get("from_id")

        if not text or not peer_id or (from_id and from_id < 0):
            return {**plain, "body": "ok"}

        bot_id = int(bot_id)
        from_id = int(from_id)
        peer_id = int(peer_id)

        scenario = load_scenario(cur, bot_id)
        has_scenario = bool(scenario["nodes"])
        session = get_session(cur, bot_id, from_id)

        # Сбор email на нодах с collectEmail.
        if session and session.get("awaiting_email"):
            contacts = extract_contacts(text)
            if contacts["email"] or contacts["phone"]:
                try:
                    save_lead(cur, conn, bot_id, from_id, access_token, contacts)
                except Exception:
                    pass
                save_session(cur, conn, bot_id, from_id, session["current_node_id"], False)
                vk_send_message(access_token, peer_id, "Спасибо! Мы сохранили ваш контакт и скоро свяжемся.")
                return {**plain, "body": "ok"}

        # Нет сценария — работаем через ИИ (как раньше).
        if not has_scenario:
            reply = ai_fallback(cur, bot_id, text)
            vk_send_message(access_token, peer_id, reply)
            return {**plain, "body": "ok"}

        text_lower = text.lower()
        start_id = find_start_node(scenario)

        # Старт диалога: первое сообщение, слова-триггеры или нет активной сессии.
        if not session or not session.get("current_node_id") or text_lower in RESTART_WORDS:
            node = scenario["nodes"].get(start_id)
            r = render_node(node)
            save_session(cur, conn, bot_id, from_id, start_id, node.get("collectEmail", False))
            vk_send_message(access_token, peer_id, r["text"], r["buttons"])
            return {**plain, "body": "ok"}

        current_id = session["current_node_id"]
        current_node = scenario["nodes"].get(current_id)
        next_id = next_by_button(scenario, current_id, text)

        # Кнопка не распознана.
        if not next_id:
            # Финальная нода с ИИ — отвечает помощник.
            if current_node and current_node["type"] in ("gpt", "ai"):
                reply = ai_fallback(cur, bot_id, text)
                vk_send_message(access_token, peer_id, reply)
                return {**plain, "body": "ok"}
            r = render_node(current_node) if current_node else {"text": "Выберите один из вариантов ниже.", "buttons": []}
            hint = "Пожалуйста, выберите вариант кнопкой ниже." if r["buttons"] else r["text"]
            vk_send_message(access_token, peer_id, hint, r["buttons"])
            return {**plain, "body": "ok"}

        # Переход на следующую ноду.
        next_node = scenario["nodes"].get(next_id)
        r = render_node(next_node)
        awaiting = next_node.get("collectEmail", False)
        save_session(cur, conn, bot_id, from_id, next_id, awaiting)

        if next_node["type"] in ("gpt", "ai"):
            # Показать сообщение ноды и дальше отвечать ИИ.
            vk_send_message(access_token, peer_id, r["text"], r["buttons"])
            return {**plain, "body": "ok"}

        vk_send_message(access_token, peer_id, r["text"], r["buttons"])
        return {**plain, "body": "ok"}
    finally:
        conn.close()


def ai_fallback(cur, bot_id: int, user_text: str) -> str:
    """Ответ через ИИ по персоне бота (используется в конце сценария или без сценария)."""
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
    try:
        return call_ai(build_system_prompt(bot), user_text)
    except Exception:
        return "Извините, сейчас не могу ответить. Напишите чуть позже."
