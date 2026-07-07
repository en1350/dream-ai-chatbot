import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const bots = [
  { id: "1", name: "Салон «Локон»", dialogs: 512, status: "online" as const },
  { id: "2", name: "Автосервис RPM", dialogs: 388, status: "online" as const },
  { id: "3", name: "Кофейня Bloom", dialogs: 241, status: "warn" as const },
  { id: "4", name: "Фитнес Pulse", dialogs: 143, status: "online" as const },
];

export default function BotsList() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white">Мои боты</h1>
          <p className="text-white/50 text-sm mt-1">Выберите бота, чтобы открыть конструктор</p>
        </div>
        <button
          onClick={() => navigate("/builder/new")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-electric to-aqua text-ink font-semibold text-sm hover:shadow-[0_0_30px_rgba(43,127,255,0.4)] transition-all"
        >
          <Icon name="Plus" size={18} /> Новый бот
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bots.map((b) => (
          <button
            key={b.id}
            onClick={() => navigate(`/builder/${b.id}`)}
            className="text-left rounded-2xl border border-white/8 bg-ink2/50 p-6 hover:border-electric/40 hover:bg-ink2 transition-all group"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-electric/25 to-aqua/25 flex items-center justify-center">
                <Icon name="Bot" size={20} className="text-aqua" />
              </div>
              <span className={`flex items-center gap-1.5 text-xs ${b.status === "online" ? "text-aqua" : "text-amber-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${b.status === "online" ? "bg-aqua" : "bg-amber-400"}`} />
                {b.status === "online" ? "онлайн" : "ошибка"}
              </span>
            </div>
            <h3 className="text-white font-semibold mb-1 group-hover:text-aqua transition-colors">{b.name}</h3>
            <p className="text-white/50 text-sm">{b.dialogs} диалогов за 7 дней</p>
            <div className="flex items-center gap-1.5 text-sm text-electric mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              Открыть конструктор <Icon name="ArrowRight" size={14} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
