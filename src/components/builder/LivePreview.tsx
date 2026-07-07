import { useState } from "react";
import Icon from "@/components/ui/icon";
import { BotNode } from "./types";

interface Props {
  nodes: BotNode[];
  activeNodeId: string | null;
  onClose: () => void;
  onReset: () => void;
}

interface Msg {
  from: "bot" | "user";
  text: string;
  buttons?: string[];
}

export default function LivePreview({ nodes, activeNodeId, onClose, onReset }: Props) {
  const [messages, setMessages] = useState<Msg[]>(() => {
    const start = nodes.find((n) => n.subtype === "start") || nodes[0];
    return start ? [{ from: "bot", text: start.text || start.title, buttons: start.buttons }] : [];
  });
  const [input, setInput] = useState("");

  const active = nodes.find((n) => n.id === activeNodeId);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTimeout(() => {
      const reply = nodes[Math.floor(Math.random() * nodes.length)];
      setMessages((m) => [
        ...m,
        { from: "bot", text: reply?.text || "Хорошо, продолжаем!", buttons: reply?.buttons },
      ]);
    }, 500);
  };

  const reset = () => {
    onReset();
    const start = nodes.find((n) => n.subtype === "start") || nodes[0];
    setMessages(start ? [{ from: "bot", text: start.text || start.title, buttons: start.buttons }] : []);
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
            {m.from === "bot" && m.buttons && m.buttons.length > 0 && (
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
            )}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-white/8 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Написать боту…"
          className="flex-1 h-10 rounded-full bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
        />
        <button
          onClick={() => send(input)}
          className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-electric to-aqua flex items-center justify-center"
        >
          <Icon name="Send" size={15} className="text-ink" />
        </button>
      </div>
    </aside>
  );
}
