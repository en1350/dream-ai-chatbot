import { useState } from "react";
import Icon from "@/components/ui/icon";
import { BotNode, BotEdge } from "./types";
import { getResponseType, getCollectEmail } from "./nodeHelpers";
import func2url from "../../../backend/func2url.json";

interface Props {
  nodes: BotNode[];
  edges: BotEdge[];
  botId: number | null;
  activeNodeId: string | null;
  onClose: () => void;
  onReset: () => void;
}

interface Msg {
  from: "bot" | "user";
  text: string;
  buttons?: string[];
  isList?: boolean;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function findStart(nodes: BotNode[]): BotNode | null {
  return nodes.find((n) => n.subtype === "start") ?? null;
}

export default function LivePreview({ nodes, edges, botId, activeNodeId, onClose, onReset }: Props) {
  const start = findStart(nodes);
  const [messages, setMessages] = useState<Msg[]>(() =>
    start ? [{ from: "bot", text: start.text || start.title, buttons: start.buttons, isList: getResponseType(start) === "list" }] : []
  );
  const [currentId, setCurrentId] = useState<string | null>(start?.id ?? null);
  const [awaitingEmail, setAwaitingEmail] = useState(() => (start ? getCollectEmail(start) : false));
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const active = nodes.find((n) => n.id === activeNodeId);
  const aiNode = nodes.find((n) => n.category === "ai");

  const pushBot = (text: string, buttons?: string[], isList?: boolean) => {
    setMessages((m) => [...m, { from: "bot", text, buttons, isList }]);
  };

  const enterNode = async (node: BotNode) => {
    setCurrentId(node.id);

    if (node.subtype === "gpt") {
      setThinking(true);
      try {
        const res = await fetch(func2url["ai-chat"], {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: node.text || "Ты дружелюбный ассистент чат-бота. Отвечай кратко.",
            history: messages,
          }),
        });
        const data = await res.json();
        pushBot(res.ok ? data.reply : `⚠ ${data.error || "AI недоступен"}`);
      } catch {
        pushBot("⚠ Не удалось связаться с AI");
      } finally {
        setThinking(false);
      }
      return;
    }

    pushBot(node.text || node.title, node.buttons, getResponseType(node) === "list");
    setAwaitingEmail(getCollectEmail(node));
  };

  const advance = (label?: string) => {
    const edge = edges.find((e) => e.source === currentId && (e.label || "") === (label || ""));
    if (!edge) return false;
    const next = nodes.find((n) => n.id === edge.target);
    if (!next) return false;
    enterNode(next);
    return true;
  };

  const submitEmail = async (email: string) => {
    const node = nodes.find((n) => n.id === currentId);
    if (!EMAIL_RE.test(email)) {
      pushBot("Похоже, это не похоже на email. Попробуйте ещё раз, например: name@mail.ru");
      return;
    }
    setThinking(true);
    try {
      const res = await fetch(func2url["leads-public"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushBot(`⚠ ${data.error || "Не удалось сохранить заявку"}`);
        return;
      }
      pushBot(node?.successText || "Спасибо! Заявка сохранена.");
      setAwaitingEmail(false);
      if (!advance()) {
        // ветки дальше нет — диалог на этом завершается
      }
    } catch {
      pushBot("⚠ Не удалось сохранить заявку, попробуйте позже");
    } finally {
      setThinking(false);
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");

    if (awaitingEmail) {
      submitEmail(text.trim());
      return;
    }

    if (advance(text)) return;

    if (!aiNode) {
      setTimeout(() => {
        const reply = nodes[Math.floor(Math.random() * nodes.length)];
        pushBot(reply?.text || "Хорошо, продолжаем!", reply?.buttons);
      }, 500);
      return;
    }

    setThinking(true);
    try {
      const res = await fetch(func2url["ai-chat"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiNode.text || "Ты дружелюбный ассистент чат-бота. Отвечай кратко.",
          history: [...messages, { from: "user", text }],
        }),
      });
      const data = await res.json();
      pushBot(res.ok ? data.reply : `⚠ ${data.error || "AI недоступен"}`);
    } catch {
      pushBot("⚠ Не удалось связаться с AI");
    } finally {
      setThinking(false);
    }
  };

  const reset = () => {
    onReset();
    const s = findStart(nodes);
    setCurrentId(s?.id ?? null);
    setAwaitingEmail(s ? getCollectEmail(s) : false);
    setMessages(s ? [{ from: "bot", text: s.text || s.title, buttons: s.buttons, isList: getResponseType(s) === "list" }] : []);
  };

  return (
    <aside className="w-96 shrink-0 h-full border-l border-white/8 bg-ink2/60 backdrop-blur-xl flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-white/8">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric to-aqua flex items-center justify-center shrink-0">
          <Icon name="Bot" size={16} className="text-ink" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white font-medium">Тест-режим</div>
          <div className="text-[11px] text-aqua flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-aqua" /> {nodes.length} блоков в сценарии
          </div>
        </div>
        <button onClick={reset} title="Сбросить" className="text-white/40 hover:text-white transition-colors">
          <Icon name="RotateCcw" size={16} />
        </button>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <Icon name="X" size={18} />
        </button>
      </div>

      {active && (
        <div className="mx-4 mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-electric/10 border border-electric/25 text-electric/90">
          <Icon name="MousePointerClick" size={13} />
          Активный блок: <span className="font-medium">{active.title}</span>
        </div>
      )}

      {aiNode && (
        <div className="mx-4 mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-[#FF5C8A]/10 border border-[#FF5C8A]/25 text-[#FF5C8A]">
          <Icon name="Sparkles" size={13} />
          AI-режим доступен как запасной сценарий, если у блока нет связи
        </div>
      )}

      {awaitingEmail && (
        <div className="mx-4 mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-aqua/10 border border-aqua/25 text-aqua">
          <Icon name="Mail" size={13} />
          Бот ждёт email — введите его в поле снизу
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Icon name="MessagesSquare" size={32} className="text-white/15 mb-3" />
            <p className="text-white/30 text-sm">Добавьте блок «Старт диалога», чтобы начать тест</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.from === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 text-sm rounded-2xl ${
                m.from === "user" ? "bg-electric text-white rounded-br-sm" : "bg-white/8 text-white/90 rounded-bl-sm"
              }`}
            >
              {m.text}
            </div>
            {m.from === "bot" && m.buttons && m.buttons.length > 0 && i === messages.length - 1 && (
              m.isList ? (
                <div className="flex flex-col gap-1.5 mt-2 max-w-[85%] w-full">
                  {m.buttons.map((b, bi) => (
                    <button
                      key={bi}
                      onClick={() => send(b)}
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-electric/30 text-electric hover:bg-electric/10 transition-colors text-left"
                    >
                      <span className="text-electric/60 shrink-0">{bi + 1}.</span>
                      <span className="truncate">{b}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                  {m.buttons.map((b, bi) => (
                    <button
                      key={bi}
                      onClick={() => send(b)}
                      className="text-xs px-3 py-1.5 rounded-full border border-electric/30 text-electric hover:bg-electric/10 transition-colors"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex items-start">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/8 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/8 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          disabled={thinking}
          placeholder={thinking ? "AI печатает…" : awaitingEmail ? "Введите email…" : "Написать боту…"}
          type={awaitingEmail ? "email" : "text"}
          className="flex-1 h-10 rounded-full bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors disabled:opacity-50"
        />
        <button
          onClick={() => send(input)}
          disabled={thinking}
          className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-electric to-aqua flex items-center justify-center disabled:opacity-50"
        >
          <Icon name={thinking ? "Loader2" : "Send"} size={15} className={`text-ink ${thinking ? "animate-spin" : ""}`} />
        </button>
      </div>
    </aside>
  );
}