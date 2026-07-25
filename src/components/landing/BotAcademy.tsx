import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

type BlockType = "greeting" | "message" | "question" | "buttons" | "condition" | "end";

interface FlowBlock {
  id: string;
  type: BlockType;
  title: string;
  text?: string;
  variable?: string;
  buttons?: string[];
  value?: string;
  thenText?: string;
  elseText?: string;
}

interface Niche {
  niche: string;
  icon: string;
  title: string;
  desc: string;
}

const NICHES: Niche[] = [
  { niche: "Свечная мастерская", icon: "🕯️", title: "Свечная мастерская", desc: "Бот-продавец авторских свечей" },
  { niche: "Английский язык", icon: "🇬🇧", title: "English Tutor", desc: "Бот-репетитор английского" },
  { niche: "Салон красоты", icon: "💇", title: "Beauty Studio", desc: "Запись на стрижку и уход" },
  { niche: "Психологическая поддержка", icon: "🌸", title: "Soul Support", desc: "Бот-поддержка и медитации" },
];

const TONES: Record<string, string> = {
  friendly: "🤗 Заботливый и дружелюбный",
  sassy: "😏 Дерзкий и саркастичный",
  strict: "💼 Строгий и деловой",
  mystic: "🔮 Мистический и загадочный",
};

const TONE_LABELS: Record<string, string> = {
  friendly: "🤗 Заботливый",
  sassy: "😏 Дерзкий",
  strict: "💼 Строгий",
  mystic: "🔮 Мистический",
};

const PLATFORMS = ["Telegram", "WhatsApp", "Виджет на сайте", "VK Мессенджер"];

const PALETTE: { block: BlockType; icon: string; label: string }[] = [
  { block: "greeting", icon: "👋", label: "Приветствие" },
  { block: "message", icon: "💬", label: "Сообщение" },
  { block: "question", icon: "❓", label: "Вопрос" },
  { block: "buttons", icon: "🔘", label: "Кнопки" },
  { block: "condition", icon: "🔀", label: "Условие" },
  { block: "end", icon: "🏁", label: "Финал" },
];

const uid = () => Date.now().toString() + Math.random().toString(36).slice(2);

interface ChatMsg {
  text: string;
  sender: "bot" | "user";
  buttons?: string[];
}

export default function BotAcademy() {
  const [level, setLevel] = useState(1);

  // Level 1 state
  const [niche, setNiche] = useState<string | null>(null);
  const [nicheIcon, setNicheIcon] = useState("🤖");
  const [tone, setTone] = useState("friendly");
  const [platform, setPlatform] = useState("Telegram");
  const [scenario, setScenario] = useState("");

  // Level 2 state
  const [flow, setFlow] = useState<FlowBlock[]>([]);

  // Level 3 chat
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const flowState = useRef({ pointer: 0, awaitingInput: false, awaitingButtons: false, varValue: "" });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const l1Ready = !!niche && scenario.trim().length > 10;

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  const makeBlock = (type: BlockType): FlowBlock => {
    const base = { id: uid(), type };
    switch (type) {
      case "greeting":
        return { ...base, title: "👋 Приветствие", text: `Привет! Я бот "${niche || "..."}" в ${platform}. Чем могу помочь?` };
      case "message":
        return { ...base, title: "💬 Сообщение", text: "Введите текст сообщения..." };
      case "question":
        return { ...base, title: "❓ Вопрос", text: "Какой у вас вопрос?", variable: "userAnswer" };
      case "buttons":
        return { ...base, title: "🔘 Кнопки", text: "Выберите вариант:", buttons: ["Вариант 1", "Вариант 2"] };
      case "condition":
        return { ...base, title: "🔀 Условие", variable: "userAnswer", value: "", thenText: "Если ДА — ответь...", elseText: "Если НЕТ — ответь..." };
      case "end":
        return { ...base, title: "🏁 Финал", text: "Спасибо за общение! До связи! 👋" };
    }
  };

  const addBlock = (type: BlockType) => setFlow((f) => [...f, makeBlock(type)]);
  const updateBlock = (idx: number, field: keyof FlowBlock, value: string) =>
    setFlow((f) => f.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));
  const deleteBlock = (idx: number) => setFlow((f) => f.filter((_, i) => i !== idx));
  const clearCanvas = () => setFlow([]);
  const updateButton = (bi: number, ti: number, value: string) =>
    setFlow((f) => f.map((b, i) => (i === bi ? { ...b, buttons: b.buttons!.map((x, j) => (j === ti ? value : x)) } : b)));
  const addButton = (bi: number) =>
    setFlow((f) => f.map((b, i) => (i === bi ? { ...b, buttons: [...b.buttons!, "Новая кнопка"] } : b)));
  const removeButton = (bi: number, ti: number) =>
    setFlow((f) => f.map((b, i) => (i === bi ? { ...b, buttons: b.buttons!.filter((_, j) => j !== ti) } : b)));

  const buttonsCount = flow.filter((b) => b.type === "buttons").reduce((s, b) => s + (b.buttons?.length || 0), 0);
  const conditionsCount = flow.filter((b) => b.type === "condition").length;

  const goToLevel = (lvl: number) => {
    setLevel(lvl);
    if (lvl === 3) launchBot();
  };

  const pushMsg = (msg: ChatMsg) => setChat((c) => [...c, msg]);
  const t = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };

  const runFlow = (idx: number) => {
    if (idx >= flow.length) {
      pushMsg({ text: '🏁 Сценарий завершён. Напиши "старт" чтобы начать сначала.', sender: "bot" });
      return;
    }
    const block = flow[idx];
    flowState.current.pointer = idx;

    if (block.type === "greeting" || block.type === "message" || block.type === "end") {
      pushMsg({ text: block.text || "", sender: "bot" });
      t(() => runFlow(idx + 1), 1200);
    } else if (block.type === "question") {
      pushMsg({ text: block.text || "", sender: "bot" });
      flowState.current.awaitingInput = true;
      flowState.current.awaitingButtons = false;
    } else if (block.type === "buttons") {
      pushMsg({ text: block.text || "", sender: "bot", buttons: block.buttons });
      flowState.current.awaitingButtons = true;
      flowState.current.awaitingInput = false;
    } else if (block.type === "condition") {
      const v = flowState.current.varValue;
      const response =
        v.toLowerCase() === (block.value || "").toLowerCase() && block.value ? block.thenText : block.elseText;
      pushMsg({ text: response || "", sender: "bot" });
      t(() => runFlow(idx + 1), 1200);
    }
  };

  const launchBot = () => {
    setChat([]);
    flowState.current = { pointer: 0, awaitingInput: false, awaitingButtons: false, varValue: "" };
    t(() => runFlow(0), 500);
  };

  const handleButtonClick = (text: string) => {
    setChat((c) => [...c.map((m) => ({ ...m, buttons: undefined })), { text, sender: "user" as const }]);
    flowState.current.varValue = text;
    flowState.current.awaitingButtons = false;
    t(() => runFlow(flowState.current.pointer + 1), 800);
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");

    if (text.toLowerCase() === "старт" || text.toLowerCase() === "start") {
      setChat([{ text, sender: "user" }]);
      flowState.current.pointer = 0;
      t(() => runFlow(0), 500);
      return;
    }
    if (flowState.current.awaitingInput) {
      pushMsg({ text, sender: "user" });
      flowState.current.varValue = text;
      flowState.current.awaitingInput = false;
      t(() => runFlow(flowState.current.pointer + 1), 800);
    } else {
      pushMsg({ text, sender: "user" });
      t(() => pushMsg({ text: '💡 Подсказка: бот ждёт действия по сценарию. Напиши "старт" чтобы перезапустить.', sender: "bot" }), 600);
    }
  };

  const restart = () => {
    setFlow([]);
    setNiche(null);
    setNicheIcon("🤖");
    setScenario("");
    setChat([]);
    setLevel(1);
  };

  const STEPS = [
    { n: 1, label: "Архитектор", mark: "1" },
    { n: 2, label: "Сборщик", mark: "2" },
    { n: 3, label: "Запуск", mark: "🚀" },
  ];

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-ink border border-white/10 text-white/90 text-sm focus:outline-none focus:border-electric/60 focus:ring-2 focus:ring-electric/20 transition";

  return (
    <div className="rounded-2xl bg-ink2 border border-white/10 shadow-2xl overflow-hidden text-white max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="text-center px-6 pt-7 pb-5 bg-gradient-to-br from-electric/20 to-aqua/10">
        <h1 className="font-display text-2xl md:text-3xl text-white">🎓 Академия Чат-Ботов</h1>
        <div className="text-white/60 text-sm mt-1">No-Code Интерактив</div>
      </div>

      {/* Progress */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-white/10" />
          <div
            className="absolute top-5 left-6 h-0.5 bg-gradient-to-r from-electric to-aqua transition-all duration-500"
            style={{ width: level === 1 ? "0%" : level === 2 ? "45%" : "90%", maxWidth: "calc(100% - 3rem)" }}
          />
          {STEPS.map((s) => {
            const status = s.n < level ? "done" : s.n === level ? "active" : "idle";
            return (
              <div key={s.n} className="relative z-10 text-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-bold border-2 transition-all ${
                    status === "active"
                      ? "bg-electric border-electric text-white shadow-[0_0_0_5px_rgba(43,127,255,0.2)]"
                      : status === "done"
                      ? "bg-aqua border-aqua text-ink"
                      : "bg-ink border-white/15 text-white/40"
                  }`}
                >
                  {s.mark}
                </div>
                <div
                  className={`text-xs font-medium ${
                    status === "active" ? "text-electric" : status === "done" ? "text-aqua" : "text-white/40"
                  }`}
                >
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {/* ===== LEVEL 1 ===== */}
        {level === 1 && (
          <div className="animate-fade-up">
            <h2 className="font-display text-xl text-white mb-3 flex items-center gap-2">
              🏗️ Уровень 1: Архитектор
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-aqua/20 text-aqua">Проектирование</span>
            </h2>
            <Theory>
              <strong className="text-aqua">📖 Теория:</strong> Прежде чем собирать бота в конструкторе, нужно
              спроектировать его «душу». В визуальных редакторах (Botpress, Voiceflow, ManyChat) ты работаешь с{" "}
              <strong className="text-white">деревом диалога</strong> — схемой, где каждый блок это шаг разговора. Но
              сначала — идея!
            </Theory>

            <h3 className="font-semibold text-white/90 mt-5 mb-2">🎯 Шаг 1.1. Выбери нишу бота</h3>
            <p className="text-white/60 text-sm mb-3">Кликни на карточку — это будет основа твоего проекта:</p>
            <div className="grid grid-cols-2 gap-3">
              {NICHES.map((n) => (
                <button
                  key={n.niche}
                  onClick={() => {
                    setNiche(n.niche);
                    setNicheIcon(n.icon);
                  }}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    niche === n.niche
                      ? "border-electric bg-electric/15 shadow-[0_8px_20px_rgba(43,127,255,0.2)]"
                      : "border-white/10 bg-ink hover:border-electric/50 hover:-translate-y-0.5"
                  }`}
                >
                  <div className="text-3xl mb-2">{n.icon}</div>
                  <div className="font-bold text-white text-sm">{n.title}</div>
                  <div className="text-xs text-white/50 mt-1">{n.desc}</div>
                </button>
              ))}
            </div>

            <h3 className="font-semibold text-white/90 mt-6 mb-2">🎨 Шаг 1.2. Настрой характер и платформу</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Tone of Voice (характер)</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className={inputCls}>
                  {Object.entries(TONES).map(([k, v]) => (
                    <option key={k} value={k} className="bg-ink2">
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Платформа</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={inputCls}>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p} className="bg-ink2">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <h3 className="font-semibold text-white/90 mt-6 mb-2">🌳 Шаг 1.3. Набросай сценарий</h3>
            <Theory>
              <strong className="text-aqua">💡 Подсказка:</strong> В конструкторах ты создаёшь блоки:{" "}
              <strong className="text-white">«Приветствие» → «Вопрос» → «Условие» → «Ответ»</strong>. Опиши свой сценарий
              в 2-3 предложениях.
            </Theory>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="Например: Бот приветствует → спрашивает, для какого случая свеча → предлагает 3 варианта → принимает заказ..."
              className={`${inputCls} mt-2 min-h-[90px] resize-y`}
            />

            <div className="flex justify-end mt-6">
              <PrimaryBtn disabled={!l1Ready} onClick={() => goToLevel(2)}>
                Перейти к сборке →
              </PrimaryBtn>
            </div>
          </div>
        )}

        {/* ===== LEVEL 2 ===== */}
        {level === 2 && (
          <div className="animate-fade-up">
            <h2 className="font-display text-xl text-white mb-3 flex items-center gap-2">
              🧩 Уровень 2: Сборщик
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-aqua/20 text-aqua">No-Code</span>
            </h2>
            <Theory>
              <strong className="text-aqua">📖 Теория:</strong> Теперь мы в визуальном редакторе! Слева — палитра блоков.
              Кликни на блок, чтобы добавить его на холст.
            </Theory>

            <div className="grid lg:grid-cols-[210px_1fr_240px] gap-4 mt-4">
              {/* Palette */}
              <div className="rounded-xl bg-ink border border-white/10 p-4">
                <h3 className="text-electric font-semibold text-sm mb-3">📦 Блоки</h3>
                {PALETTE.map((p) => (
                  <button
                    key={p.block}
                    onClick={() => addBlock(p.block)}
                    className="w-full flex items-center gap-2.5 rounded-lg border-2 border-dashed border-white/15 p-2.5 mb-2 hover:border-electric hover:border-solid hover:bg-electric/10 transition text-left"
                  >
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-sm font-medium text-white/80">{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Canvas */}
              <div className="rounded-xl bg-ink border border-white/10 p-4 min-h-[420px]">
                <div className="flex justify-between items-center pb-3 mb-3 border-b border-white/10">
                  <h3 className="text-electric font-semibold">🎨 Холст сценария</h3>
                  <button onClick={clearCanvas} className="text-xs px-2.5 py-1 rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition">
                    🗑️ Очистить
                  </button>
                </div>
                {flow.length === 0 ? (
                  <div className="text-center py-14 text-white/40">
                    <div className="text-4xl mb-2">📭</div>
                    <div className="text-sm">Холст пуст. Кликни на блок слева, чтобы добавить первый шаг!</div>
                  </div>
                ) : (
                  flow.map((block, idx) => (
                    <div key={block.id}>
                      <div className="rounded-xl bg-gradient-to-br from-electric/15 to-aqua/5 border border-electric/30 p-4 animate-fade-up">
                        <div className="flex justify-between items-center mb-2.5">
                          <div className="font-bold text-white text-sm">{block.title}</div>
                          <button onClick={() => deleteBlock(idx)} className="text-red-400 hover:text-red-400 w-6 h-6 leading-none text-lg">
                            ×
                          </button>
                        </div>
                        <BlockBody
                          block={block}
                          idx={idx}
                          inputCls={inputCls}
                          updateBlock={updateBlock}
                          updateButton={updateButton}
                          addButton={addButton}
                          removeButton={removeButton}
                        />
                      </div>
                      {idx < flow.length - 1 && <div className="text-center text-electric/60 text-xl -my-0.5">↓</div>}
                    </div>
                  ))
                )}
              </div>

              {/* Stats */}
              <div className="rounded-xl bg-ink border border-white/10 p-4">
                <h3 className="text-electric font-semibold text-sm mb-3">📊 Статистика</h3>
                <Stat label="Блоков" value={flow.length} />
                <Stat label="Кнопок" value={buttonsCount} />
                <Stat label="Условий" value={conditionsCount} />
                <div className="border-t border-white/10 my-3" />
                <h3 className="text-electric font-semibold text-sm mb-2">💡 Советы</h3>
                <div className="text-xs text-white/60 leading-relaxed bg-white/5 rounded-lg p-3">
                  Всегда начинай с <strong className="text-white">Приветствия</strong>. Заканчивай{" "}
                  <strong className="text-white">Финалом</strong>. Используй <strong className="text-white">Кнопки</strong>{" "}
                  вместо свободного ввода.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 flex-wrap">
              <SecondaryBtn onClick={() => goToLevel(1)}>← Назад</SecondaryBtn>
              <PrimaryBtn onClick={() => goToLevel(3)}>Запустить бота 🚀</PrimaryBtn>
            </div>
          </div>
        )}

        {/* ===== LEVEL 3 ===== */}
        {level === 3 && (
          <div className="animate-fade-up">
            <div className="rounded-xl bg-gradient-to-br from-aqua/25 to-electric/15 border border-aqua/30 p-5 text-center mb-5">
              <h2 className="font-display text-2xl text-white mb-1">🎉 Бот запущен!</h2>
              <div className="text-white/70 text-sm">Твой no-code бот готов. Протестируй его в чате справа!</div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <div className="rounded-xl bg-gradient-to-br from-electric/15 to-aqua/5 border border-white/10 p-5">
                  <h3 className="text-electric font-semibold mb-3">📋 Паспорт бота</h3>
                  <SummaryRow label="Ниша:" value={niche || "—"} />
                  <SummaryRow label="Характер:" value={TONE_LABELS[tone]} />
                  <SummaryRow label="Платформа:" value={platform} />
                  <SummaryRow label="Блоков в сценарии:" value={String(flow.length)} />
                  <SummaryRow label="Сценарий:" value={scenario || "—"} />
                </div>

                <div className="rounded-xl bg-ink border border-white/10 p-5 mt-4">
                  <h3 className="text-electric font-semibold mb-2">🎓 Что ты освоил(а):</h3>
                  <ul className="text-sm text-white/75 space-y-1.5">
                    <li>✅ Проектирование ниши и Tone of Voice</li>
                    <li>✅ Построение дерева диалога</li>
                    <li>✅ Работа с блоками: приветствие, вопрос, условие, кнопки</li>
                    <li>✅ Принципы no-code конструкторов</li>
                  </ul>
                  <div className="mt-3">
                    <Theory>
                      <strong className="text-aqua">🚀 Следующие шаги:</strong> Зарегистрируйся в{" "}
                      <strong className="text-white">Botpress</strong>, <strong className="text-white">Voiceflow</strong>{" "}
                      или <strong className="text-white">ManyChat</strong> и повтори свой сценарий там!
                    </Theory>
                  </div>
                  <SecondaryBtn onClick={restart} className="w-full mt-3 justify-center">
                    🔄 Начать заново
                  </SecondaryBtn>
                </div>
              </div>

              {/* Chat */}
              <div className="rounded-xl bg-ink border border-white/10 overflow-hidden flex flex-col h-[500px]">
                <div className="bg-electric text-white px-4 py-3 font-semibold flex items-center gap-2">
                  <span>{nicheIcon}</span>
                  <span>{niche || "Твой Бот"}</span>
                  <span className="ml-auto w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_5px_#4ade80]" />
                </div>
                <div ref={chatRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                  {chat.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-snug animate-fade-up ${
                          m.sender === "user"
                            ? "bg-gradient-to-br from-electric to-aqua text-white rounded-br-sm"
                            : "bg-white/10 text-white/90 rounded-bl-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                      {m.buttons && m.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {m.buttons.map((b, j) => (
                            <button
                              key={j}
                              onClick={() => handleButtonClick(b)}
                              className="px-3.5 py-2 rounded-full border-2 border-electric text-electric text-xs font-semibold hover:bg-electric hover:text-white transition"
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-white/10 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder="Напиши сообщение..."
                    className={inputCls}
                  />
                  <button onClick={sendChat} className="px-4 rounded-lg bg-electric text-white hover:bg-electric/80 transition">
                    <Icon name="Send" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Theory({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-electric/10 border-l-4 border-electric rounded-lg px-4 py-3 my-3 text-sm text-white/75 leading-relaxed">
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between bg-white/5 rounded-lg px-3 py-2 mb-2 text-sm">
      <strong className="text-white/70">{label}:</strong>
      <span className="text-aqua font-bold">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3 bg-ink2 rounded-lg px-3.5 py-2.5 mb-2">
      <span className="text-white/50 text-sm shrink-0">{label}</span>
      <span className="text-white font-semibold text-sm text-right">{value}</span>
    </div>
  );
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-3 rounded-xl bg-gradient-to-r from-electric to-aqua text-white font-semibold hover:shadow-[0_6px_20px_rgba(43,127,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {children}
    </button>
  );
}

function SecondaryBtn({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl border-2 border-electric text-electric font-semibold hover:bg-electric/10 transition inline-flex items-center ${className}`}
    >
      {children}
    </button>
  );
}

function BlockBody({
  block,
  idx,
  inputCls,
  updateBlock,
  updateButton,
  addButton,
  removeButton,
}: {
  block: FlowBlock;
  idx: number;
  inputCls: string;
  updateBlock: (i: number, f: keyof FlowBlock, v: string) => void;
  updateButton: (bi: number, ti: number, v: string) => void;
  addButton: (bi: number) => void;
  removeButton: (bi: number, ti: number) => void;
}) {
  if (block.type === "greeting" || block.type === "message" || block.type === "end") {
    return (
      <textarea
        value={block.text}
        onChange={(e) => updateBlock(idx, "text", e.target.value)}
        className={`${inputCls} min-h-[60px] resize-y`}
      />
    );
  }
  if (block.type === "question") {
    return (
      <>
        <input value={block.text} onChange={(e) => updateBlock(idx, "text", e.target.value)} placeholder="Текст вопроса" className={inputCls} />
        <div className="text-xs text-white/50 mt-2">
          Сохранить ответ в переменную: <strong className="text-aqua">{block.variable}</strong>
        </div>
      </>
    );
  }
  if (block.type === "buttons") {
    return (
      <>
        <input value={block.text} onChange={(e) => updateBlock(idx, "text", e.target.value)} placeholder="Текст над кнопками" className={inputCls} />
        <div className="mt-2.5 space-y-1.5">
          {block.buttons!.map((b, i) => (
            <div key={i} className="flex gap-2 items-center bg-white/5 rounded-lg px-2 py-1.5">
              <input value={b} onChange={(e) => updateButton(idx, i, e.target.value)} className={`${inputCls} flex-1 py-1 text-xs`} />
              <button onClick={() => removeButton(idx, i)} className="text-red-400 text-lg leading-none w-5">
                ×
              </button>
            </div>
          ))}
          <button onClick={() => addButton(idx)} className="text-xs px-2.5 py-1 rounded-lg border border-dashed border-electric/50 text-electric hover:bg-electric/10 transition">
            + Добавить кнопку
          </button>
        </div>
      </>
    );
  }
  if (block.type === "condition") {
    return (
      <>
        <div className="text-sm text-white/70">
          Если переменная <strong className="text-aqua">{block.variable}</strong> равна:
        </div>
        <input value={block.value} onChange={(e) => updateBlock(idx, "value", e.target.value)} placeholder="Значение" className={`${inputCls} mt-1.5`} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <div className="text-xs text-aqua mb-1">✅ Тогда:</div>
            <textarea value={block.thenText} onChange={(e) => updateBlock(idx, "thenText", e.target.value)} className={`${inputCls} min-h-[50px] text-xs`} />
          </div>
          <div>
            <div className="text-xs text-red-400 mb-1">❌ Иначе:</div>
            <textarea value={block.elseText} onChange={(e) => updateBlock(idx, "elseText", e.target.value)} className={`${inputCls} min-h-[50px] text-xs`} />
          </div>
        </div>
      </>
    );
  }
  return null;
}