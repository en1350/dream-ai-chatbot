import { useState } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../../backend/func2url.json";

interface Props {
  onClose: () => void;
  onGenerated: (data: { nodes: { id: string; subtype: string; category: string; title: string; text: string }[]; edges: { source: string; target: string }[] }) => void;
}

const examples = [
  "Бот для записи в барбершоп: спроси услугу, дату и телефон",
  "Бот-консультант для интернет-магазина одежды с ответами на вопросы",
  "Бот для сбора заявок на ремонт квартир под ключ",
];

export default function AiScenarioModal({ onClose, onGenerated }: Props) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(func2url["ai-scenario"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось собрать сценарий");
        return;
      }
      onGenerated(data);
      onClose();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink2 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric to-aqua flex items-center justify-center shrink-0">
            <Icon name="Sparkles" size={18} className="text-ink" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Собрать сценарий с AI</h3>
            <p className="text-xs text-white/50">Опишите бота словами — AI соберёт граф блоков</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/40 hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Например: бот для записи в барбершоп, спрашивает услугу, дату и телефон, отправляет заявку в CRM"
          rows={4}
          autoFocus
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors resize-none"
        />

        <div className="flex flex-wrap gap-2 mt-3">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setDescription(ex)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors"
            >
              {ex.length > 36 ? ex.slice(0, 36) + "…" : ex}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
            <Icon name="TriangleAlert" size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={generate}
          disabled={!description.trim() || loading}
          className="w-full mt-5 flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-electric to-aqua text-ink font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(43,127,255,0.4)] transition-all"
        >
          {loading ? (
            <>
              <Icon name="Loader2" size={16} className="animate-spin" />
              Собираю сценарий…
            </>
          ) : (
            <>
              <Icon name="Wand2" size={16} />
              Сгенерировать
            </>
          )}
        </button>
      </div>
    </div>
  );
}
