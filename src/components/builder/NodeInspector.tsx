import { useState } from "react";
import Icon from "@/components/ui/icon";
import { BotNode } from "./types";
import { NODE_DEF_MAP, CATEGORY_META } from "./nodeDefs";

interface Props {
  node: BotNode;
  onUpdate: (patch: Partial<BotNode>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function NodeInspector({ node, onUpdate, onDelete, onClose }: Props) {
  const def = NODE_DEF_MAP[node.subtype];
  const meta = CATEGORY_META[node.category];
  const [newBtn, setNewBtn] = useState("");
  const supportsButtons = node.subtype === "text" || node.subtype === "buttons";
  const isEmailCollect = node.subtype === "email-collect";

  return (
    <aside className="w-80 shrink-0 h-full border-l border-white/8 bg-ink2/60 backdrop-blur-xl flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-white/8">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}22` }}>
          <Icon name={def?.icon || "Box"} size={16} style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</div>
          <div className="text-sm text-white/70 truncate">{def?.label}</div>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <Icon name="X" size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Название блока</label>
          <input
            value={node.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white focus:border-electric focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1.5 block">
            {def?.fieldLabel || "Текст / содержание"}
          </label>
          <textarea
            value={node.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder={def?.fieldPlaceholder}
            rows={4}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors resize-none"
          />
        </div>

        {supportsButtons && (
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Кнопки быстрых ответов</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {node.buttons.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-electric/10 border border-electric/25 text-electric">
                  {b}
                  <button
                    onClick={() => onUpdate({ buttons: node.buttons.filter((_, idx) => idx !== i) })}
                    className="hover:text-white transition-colors"
                  >
                    <Icon name="X" size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newBtn}
                onChange={(e) => setNewBtn(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newBtn.trim() && node.buttons.length < 10) {
                    onUpdate({ buttons: [...node.buttons, newBtn.trim()] });
                    setNewBtn("");
                  }
                }}
                placeholder="Текст кнопки"
                className="flex-1 h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
              />
              <button
                onClick={() => {
                  if (newBtn.trim() && node.buttons.length < 10) {
                    onUpdate({ buttons: [...node.buttons, newBtn.trim()] });
                    setNewBtn("");
                  }
                }}
                className="w-9 h-9 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white transition-colors shrink-0"
              >
                <Icon name="Plus" size={15} />
              </button>
            </div>
            {node.buttons.length > 0 && (
              <p className="text-[11px] text-white/35 mt-2 leading-relaxed">
                У каждой кнопки на холсте своя точка снизу блока — соедините её со следующим шагом, чтобы диалог шёл в нужную ветку.
              </p>
            )}
          </div>
        )}

        {isEmailCollect && (
          <>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Текст после отправки</label>
              <input
                value={node.successText || ""}
                onChange={(e) => onUpdate({ successText: e.target.value })}
                placeholder="Спасибо! Мы свяжемся с вами."
                className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                <Icon name="Info" size={13} className="text-aqua" />
                Как это работает
              </div>
              <p className="text-xs text-white/45 leading-relaxed">
                Бот попросит пользователя ввести email прямо в диалоге, проверит формат и сохранит заявку
                в раздел «Заявки» личного кабинета.
              </p>
            </div>
          </>
        )}

        {node.category === "ai" && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
              <Icon name="Info" size={13} className="text-aqua" />
              Подсказка
            </div>
            <p className="text-xs text-white/45 leading-relaxed">
              Опишите роль бота и тон общения — это станет системным промптом для GPT на этом шаге.
            </p>
          </div>
        )}

        {node.category === "integration" && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3.5">
            <div className="flex items-center gap-2 text-xs text-amber-400 mb-1">
              <Icon name="TriangleAlert" size={13} />
              Требуется подключение
            </div>
            <p className="text-xs text-white/45 leading-relaxed">
              Укажите API-ключ или адрес в разделе «Интеграции», иначе блок не сработает.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/8">
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-red-500/25 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
        >
          <Icon name="Trash2" size={15} />
          Удалить блок
        </button>
      </div>
    </aside>
  );
}