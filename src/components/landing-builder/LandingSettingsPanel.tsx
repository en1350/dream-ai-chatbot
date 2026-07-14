import Icon from "@/components/ui/icon";
import { LandingTheme } from "./types";

interface Props {
  slug: string;
  onSlugChange: (slug: string) => void;
  theme: LandingTheme;
  onThemeChange: (theme: LandingTheme) => void;
  bots: { id: number; name: string }[];
  botId: number | null;
  onBotChange: (botId: number | null) => void;
}

export default function LandingSettingsPanel({ slug, onSlugChange, theme, onThemeChange, bots, botId, onBotChange }: Props) {
  return (
    <aside className="w-80 shrink-0 h-full border-l border-white/8 bg-ink2/60 backdrop-blur-xl flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-white/8">
        <div className="w-9 h-9 rounded-lg bg-electric/15 flex items-center justify-center">
          <Icon name="Settings" size={16} className="text-aqua" />
        </div>
        <div className="text-sm text-white/70">Настройки лендинга</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Адрес страницы (slug)</label>
          <div className="flex items-center gap-1 h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white/40 focus-within:border-electric transition-colors">
            <span className="shrink-0">/l/</span>
            <input
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              className="flex-1 bg-transparent text-white focus:outline-none min-w-0"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Основной цвет</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => onThemeChange({ ...theme, primaryColor: e.target.value })}
              className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer"
            />
            <input
              value={theme.primaryColor}
              onChange={(e) => onThemeChange({ ...theme, primaryColor: e.target.value })}
              className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white focus:border-electric focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/50 mb-1.5 block">Акцентный цвет</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.accentColor}
              onChange={(e) => onThemeChange({ ...theme, accentColor: e.target.value })}
              className="w-10 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer"
            />
            <input
              value={theme.accentColor}
              onChange={(e) => onThemeChange({ ...theme, accentColor: e.target.value })}
              className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white focus:border-electric focus:outline-none transition-colors"
            />
          </div>
        </div>

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
          <p className="text-xs text-white/35 mt-1.5">
            Заявки с этого лендинга попадут к выбранному боту, а блок «ВКонтакте» поведёт в его сообщество
          </p>
          {bots.length === 0 && (
            <p className="text-xs text-amber-400/80 mt-1.5 flex items-center gap-1.5">
              <Icon name="TriangleAlert" size={12} className="shrink-0" />
              У вас пока нет ни одного бота
            </p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
            <Icon name="Info" size={13} className="text-aqua" />
            Подсказка
          </div>
          <p className="text-xs text-white/45 leading-relaxed">
            Выберите блок на холсте слева, чтобы отредактировать его текст и кнопку.
          </p>
        </div>
      </div>
    </aside>
  );
}