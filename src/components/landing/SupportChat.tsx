import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../../backend/func2url.json";

interface Msg {
  from: "user" | "bot";
  text: string;
}

const SYSTEM_PROMPT = `Ты — Юра, дружелюбный ассистент технической поддержки сервиса «БотВПотоке» (poehali-подобная платформа для создания чат-ботов).
О сервисе:
- Это конструктор чат-ботов для ВКонтакте без программирования: визуальные блоки соединяются стрелками.
- Подключение ВК: в личном кабинете вставляют числовой ID сообщества и ключ доступа (право «Сообщения сообщества»). Callback API настраивается по инструкции в кабинете.
- Собранные заявки (лиды) попадают в раздел «Заявки», их можно выгрузить в CSV.
- Есть встроенный тест-чат для проверки бота до запуска.
- Тарифы: Демо (0 ₽, 1 бот, 100 диалогов), Стандарт (390 ₽/мес, 5 ботов), Профи (990 ₽/мес, безлимит). Оплата — через кошелёк в кабинете.
- Бот умеет автоматически собирать контакты (телефон/email) прямо из переписки.
Правила: отвечай кратко, тепло и по делу, на «вы». Если вопрос не про сервис — мягко верни к теме. Если не знаешь — предложи написать в поддержку https://poehali.dev/help.`;

const QUICK = [
  "Как подключить ВКонтакте?",
  "Сколько стоит?",
  "Где мои заявки?",
];

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: "Привет! Я Юра — помощник поддержки. Задайте вопрос про сервис, и я помогу 🚀" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || sending) return;
    const history = [...messages, { from: "user" as const, text: value }];
    setMessages(history);
    setInput("");
    setSending(true);

    fetch(func2url["ai-chat"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: SYSTEM_PROMPT, history }),
    })
      .then((res) => res.json())
      .then((data) => {
        const reply = data.reply || "Извините, не удалось ответить. Напишите нам: poehali.dev/help";
        setMessages((m) => [...m, { from: "bot", text: reply }]);
      })
      .catch(() =>
        setMessages((m) => [
          ...m,
          { from: "bot", text: "Связь прервалась. Попробуйте ещё раз или напишите в поддержку: poehali.dev/help" },
        ]),
      )
      .finally(() => setSending(false));
  };

  return (
    <>
      {/* Кнопка открытия */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-electric to-aqua flex items-center justify-center shadow-[0_8px_30px_rgba(43,127,255,0.5)] hover:scale-105 transition-transform ${
          open ? "rotate-0" : ""
        }`}
        aria-label="Чат поддержки"
      >
        <Icon name={open ? "X" : "MessageCircle"} size={26} className="text-ink" />
      </button>

      {/* Окно чата */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm h-[70vh] max-h-[560px] rounded-3xl border border-white/10 bg-ink2/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Шапка */}
          <div className="flex items-center gap-3 p-4 border-b border-white/8 bg-gradient-to-r from-electric/15 to-aqua/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric to-aqua flex items-center justify-center shrink-0">
              <Icon name="Bot" size={20} className="text-ink" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm">Поддержка · Юра</div>
              <div className="text-[11px] text-aqua flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-aqua" /> Онлайн, отвечает сразу
              </div>
            </div>
          </div>

          {/* Сообщения */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.from === "user"
                      ? "bg-gradient-to-r from-electric to-aqua text-ink rounded-br-md"
                      : "bg-white/5 text-white/90 rounded-bl-md"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Быстрые вопросы */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/70 hover:border-electric/50 hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Ввод */}
          <div className="p-3 border-t border-white/8 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Напишите сообщение…"
              disabled={sending}
              className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 px-3.5 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors disabled:opacity-60"
            />
            <button
              onClick={() => send(input)}
              disabled={sending || !input.trim()}
              className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-r from-electric to-aqua flex items-center justify-center text-ink hover:shadow-[0_0_20px_rgba(43,127,255,0.4)] transition-all disabled:opacity-40"
            >
              <Icon name="Send" size={17} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
