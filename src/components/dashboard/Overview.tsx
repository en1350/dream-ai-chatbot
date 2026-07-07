import Icon from "@/components/ui/icon";

const kpis = [
  { label: "Активных ботов", value: "4", delta: "+1", icon: "Bot", up: true },
  { label: "Диалогов за 7 дней", value: "1 284", delta: "+18%", icon: "MessageCircle", up: true },
  { label: "Собрано лидов", value: "213", delta: "+12%", icon: "Inbox", up: true },
  { label: "Конверсия в заявку", value: "16.6%", delta: "−2%", icon: "Target", up: false },
];

const chart = [42, 55, 38, 61, 70, 48, 82, 65, 90, 74, 88, 96];

const limits = [
  { label: "Диалоги", cur: 640, max: 1000, color: "from-electric to-aqua" },
  { label: "AI-запросы", cur: 870, max: 1000, color: "from-amber-400 to-orange-500" },
  { label: "Боты", cur: 4, max: 5, color: "from-aqua to-electric" },
];

const bots = [
  { name: "Салон «Локон»", dialogs: 512, status: "online" },
  { name: "Автосервис RPM", dialogs: 388, status: "online" },
  { name: "Кофейня Bloom", dialogs: 241, status: "warn" },
  { name: "Фитнес Pulse", dialogs: 143, status: "online" },
];

const events = [
  { icon: "UserPlus", text: "Новый лид +7 (923) •••-45-12", time: "2 мин", color: "text-aqua" },
  { icon: "MessageCircle", text: "Бот «Локон» ответил 12 раз", time: "18 мин", color: "text-electric" },
  { icon: "TriangleAlert", text: "Токен ВК «Bloom» истекает через 3 дня", time: "1 ч", color: "text-amber-400" },
  { icon: "TrendingUp", text: "Конверсия выросла на 4%", time: "3 ч", color: "text-aqua" },
];

const checklist = [
  { text: "Создать первого бота", done: true },
  { text: "Подключить сообщество ВК", done: true },
  { text: "Собрать первый лид", done: true },
  { text: "Настроить уведомления", done: false },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-ink2/50 p-6 ${className}`}>{children}</div>
  );
}

export default function Overview() {
  const doneCount = checklist.filter((c) => c.done).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white">Обзор аккаунта</h1>
          <p className="text-white/50 text-sm mt-1">Добро пожаловать, Алексей 👋</p>
        </div>
        <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-electric to-aqua text-ink font-semibold text-sm hover:shadow-[0_0_30px_rgba(43,127,255,0.4)] transition-all">
          <Icon name="Plus" size={18} /> Новый бот
        </button>
      </div>

      {/* KPI */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Icon name={k.icon} size={18} className="text-aqua" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${k.up ? "text-aqua bg-aqua/10" : "text-amber-400 bg-amber-400/10"}`}>
                {k.delta}
              </span>
            </div>
            <div className="font-display text-3xl text-white">{k.value}</div>
            <div className="text-xs text-white/50 mt-1">{k.label}</div>
          </Card>
        ))}
      </div>

      {/* Bento */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Activity chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-semibold">Активность диалогов</h3>
              <p className="text-xs text-white/40">За последние 12 дней</p>
            </div>
            <div className="flex gap-1 p-1 rounded-full bg-white/5 text-xs">
              {["День", "Неделя", "Месяц"].map((t, i) => (
                <button key={t} className={`px-3 py-1 rounded-full transition-colors ${i === 1 ? "bg-white text-ink" : "text-white/50 hover:text-white"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2 h-44">
            {chart.map((v, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-electric/40 to-aqua group-hover:from-electric group-hover:to-aqua transition-all"
                  style={{ height: `${v}%` }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Limits */}
        <Card>
          <h3 className="text-white font-semibold mb-1">Лимиты тарифа</h3>
          <p className="text-xs text-white/40 mb-5">План «Бизнес»</p>
          <div className="space-y-5">
            {limits.map((l) => {
              const pct = Math.round((l.cur / l.max) * 100);
              return (
                <div key={l.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/70">{l.label}</span>
                    <span className={pct > 85 ? "text-amber-400" : "text-white/50"}>{l.cur}/{l.max}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${l.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="w-full mt-6 py-2.5 rounded-xl border border-electric/40 text-white text-sm hover:bg-electric/10 transition-colors">
            Повысить тариф
          </button>
        </Card>

        {/* Top bots */}
        <Card className="lg:col-span-2">
          <h3 className="text-white font-semibold mb-5">Топ ботов</h3>
          <div className="space-y-3">
            {bots.map((b) => (
              <div key={b.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-electric/30 to-aqua/30 flex items-center justify-center">
                  <Icon name="Bot" size={16} className="text-aqua" />
                </div>
                <span className="text-white text-sm flex-1">{b.name}</span>
                <span className="text-white/50 text-sm">{b.dialogs} диалогов</span>
                <span className={`flex items-center gap-1.5 text-xs ${b.status === "online" ? "text-aqua" : "text-amber-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${b.status === "online" ? "bg-aqua" : "bg-amber-400"}`} />
                  {b.status === "online" ? "онлайн" : "ошибка"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Onboarding */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Быстрый старт</h3>
            <span className="text-xs text-aqua">{doneCount}/{checklist.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-electric to-aqua rounded-full transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
          </div>
          <div className="space-y-3">
            {checklist.map((c) => (
              <div key={c.text} className="flex items-center gap-3 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.done ? "bg-aqua" : "border border-white/20"}`}>
                  {c.done && <Icon name="Check" size={12} className="text-ink" />}
                </div>
                <span className={c.done ? "text-white/40 line-through" : "text-white/80"}>{c.text}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Events feed */}
        <Card className="lg:col-span-3">
          <h3 className="text-white font-semibold mb-5">Последние события</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Icon name={e.icon} size={16} className={e.color} />
                </div>
                <span className="text-white/80 text-sm flex-1">{e.text}</span>
                <span className="text-white/30 text-xs shrink-0">{e.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
