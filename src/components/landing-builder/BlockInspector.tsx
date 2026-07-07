import Icon from "@/components/ui/icon";
import { LandingBlock } from "./types";

interface Props {
  block: LandingBlock;
  onUpdate: (patch: Partial<LandingBlock>) => void;
  onDelete: () => void;
  onClose: () => void;
  bots: { id: number; name: string }[];
  botId: number | null;
  onBotChange: (botId: number | null) => void;
}

const BLOCK_LABELS: Record<string, string> = {
  hero: "Заголовок и визуал",
  features: "Преимущества",
  cta: "Призыв к действию",
  vk: "Интеграция с ВКонтакте",
  "email-form": "Форма — email",
};

export default function BlockInspector({ block, onUpdate, onDelete, onClose, bots, botId, onBotChange }: Props) {
  return (
    <aside className="w-80 shrink-0 h-full border-l border-white/8 bg-ink2/60 backdrop-blur-xl flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-white/8">
        <div className="w-9 h-9 rounded-lg bg-electric/15 flex items-center justify-center">
          <Icon name="LayoutTemplate" size={16} className="text-aqua" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-aqua">Блок</div>
          <div className="text-sm text-white/70 truncate">{BLOCK_LABELS[block.type] || block.type}</div>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <Icon name="X" size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {(block.type === "hero" || block.type === "cta" || block.type === "vk" || block.type === "email-form") && (
          <>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Заголовок</label>
              <input
                value={block.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white focus:border-electric focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Подзаголовок</label>
              <textarea
                value={block.subtitle || ""}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
                rows={3}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:border-electric focus:outline-none transition-colors resize-none"
              />
            </div>
          </>
        )}

        {block.type === "hero" && (
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Ссылка на визуал</label>
            <input
              value={block.image || ""}
              onChange={(e) => onUpdate({ image: e.target.value })}
              placeholder="https://…"
              className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
            />
          </div>
        )}

        {(block.type === "hero" || block.type === "cta") && (
          <>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Текст кнопки (CTA)</label>
              <input
                value={block.ctaText || ""}
                onChange={(e) => onUpdate({ ctaText: e.target.value })}
                className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white focus:border-electric focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Ссылка кнопки</label>
              <input
                value={block.ctaLink || ""}
                onChange={(e) => onUpdate({ ctaLink: e.target.value })}
                placeholder="#cta или https://…"
                className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
              />
            </div>
          </>
        )}

        {block.type === "features" && (
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Карточки преимуществ</label>
            <div className="space-y-3">
              {(block.features || []).map((f, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={f.icon}
                      onChange={(e) => {
                        const next = [...(block.features || [])];
                        next[i] = { ...f, icon: e.target.value };
                        onUpdate({ features: next });
                      }}
                      placeholder="Zap"
                      className="w-20 h-8 rounded-md bg-white/5 border border-white/10 px-2 text-xs text-white focus:border-electric focus:outline-none transition-colors"
                    />
                    <input
                      value={f.title}
                      onChange={(e) => {
                        const next = [...(block.features || [])];
                        next[i] = { ...f, title: e.target.value };
                        onUpdate({ features: next });
                      }}
                      placeholder="Название"
                      className="flex-1 h-8 rounded-md bg-white/5 border border-white/10 px-2 text-xs text-white focus:border-electric focus:outline-none transition-colors"
                    />
                    <button
                      onClick={() => onUpdate({ features: (block.features || []).filter((_, idx) => idx !== i) })}
                      className="text-white/30 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                  <input
                    value={f.text}
                    onChange={(e) => {
                      const next = [...(block.features || [])];
                      next[i] = { ...f, text: e.target.value };
                      onUpdate({ features: next });
                    }}
                    placeholder="Описание"
                    className="w-full h-8 rounded-md bg-white/5 border border-white/10 px-2 text-xs text-white focus:border-electric focus:outline-none transition-colors"
                  />
                </div>
              ))}
              {(block.features || []).length < 6 && (
                <button
                  onClick={() =>
                    onUpdate({ features: [...(block.features || []), { icon: "Star", title: "Название", text: "Описание" }] })
                  }
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs transition-colors"
                >
                  <Icon name="Plus" size={13} /> Добавить карточку
                </button>
              )}
            </div>
          </div>
        )}

        {block.type === "vk" && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
              <Icon name="Info" size={13} className="text-aqua" />
              Кнопка ведёт в сообщения сообщества
            </div>
            <p className="text-xs text-white/45 leading-relaxed">
              Работает после подключения бота к сообществу ВКонтакте в разделе «Интеграции».
            </p>
          </div>
        )}

        {block.type === "email-form" && (
          <>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Текст кнопки</label>
              <input
                value={block.ctaText || ""}
                onChange={(e) => onUpdate({ ctaText: e.target.value })}
                className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white focus:border-electric focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Дополнительные поля</label>
              <div className="space-y-2">
                {[
                  { key: "name" as const, label: "Имя" },
                  { key: "phone" as const, label: "Телефон" },
                ].map((f) => {
                  const checked = (block.formFields || []).includes(f.key);
                  return (
                    <label key={f.key} className="flex items-center gap-2.5 text-sm text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const current = block.formFields || [];
                          const next = e.target.checked
                            ? [...current, f.key]
                            : current.filter((k) => k !== f.key);
                          onUpdate({ formFields: next });
                        }}
                        className="w-4 h-4 rounded accent-electric"
                      />
                      {f.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Текст после отправки</label>
              <input
                value={block.successText || ""}
                onChange={(e) => onUpdate({ successText: e.target.value })}
                placeholder="Спасибо! Мы свяжемся с вами."
                className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                <Icon name="Info" size={13} className="text-aqua" />
                Заявки попадают в раздел «Заявки»
              </div>
              <p className="text-xs text-white/45 leading-relaxed">
                Email обязателен для отправки. После публикации лендинга форма начнёт собирать заявки в личный кабинет.
              </p>
            </div>
          </>
        )}

        <div className="pt-2 border-t border-white/8">
          <label className="text-xs text-white/50 mb-1.5 block">Привязанный чат-бот</label>
          <select
            value={botId ?? ""}
            onChange={(e) => onBotChange(e.target.value ? Number(e.target.value) : null)}
            className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white focus:border-electric focus:outline-none transition-colors"
          >
            <option value="" className="bg-ink2">Не выбран</option>
            {bots.map((b) => (
              <option key={b.id} value={b.id} className="bg-ink2">{b.name}</option>
            ))}
          </select>
          <p className="text-xs text-white/35 mt-1.5">Определяет, куда ведёт блок «ВКонтакте»</p>
        </div>

        <button
          onClick={onDelete}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-red-500/25 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
        >
          <Icon name="Trash2" size={15} /> Удалить блок
        </button>
      </div>
    </aside>
  );
}