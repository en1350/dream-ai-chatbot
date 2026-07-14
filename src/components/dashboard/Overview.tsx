import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import func2url from "../../../backend/func2url.json";

interface RealBot {
  id: number;
  name: string;
  dialogsCount: number;
  status: string;
}

interface RealEvent {
  id: number;
  type: string;
  text: string;
  icon: string;
  color: string;
  createdAt: string | null;
}

interface Billing {
  planId: string;
  planName: string;
  usage: {
    bots: { current: number; max: number | null };
    dialogs: { current: number; max: number | null };
  };
}

const checklist = [
  { text: "Создать первого бота", done: false },
  { text: "Подключить сообщество ВК", done: false },
  { text: "Собрать первый лид", done: false },
  { text: "Настроить уведомления", done: false },
];

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} ч`;
  return `${Math.floor(hrs / 24)} дн`;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-ink2/50 p-6 ${className}`}>{children}</div>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const [bots, setBots] = useState<RealBot[]>([]);
  const [botsLoading, setBotsLoading] = useState(true);
  const [events, setEvents] = useState<RealEvent[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [billing, setBilling] = useState<Billing | null>(null);

  useEffect(() => {
    fetch(func2url["bots"])
      .then((res) => res.json())
      .then((data) => setBots(data.bots || []))
      .finally(() => setBotsLoading(false));

    fetch(`${func2url["events"]}?limit=8`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setEventsTotal(data.total || 0);
      })
      .finally(() => setEventsLoading(false));

    fetch(func2url["billing"])
      .then((res) => res.json())
      .then((data) => setBilling(data));
  }, []);

  const doneCount = checklist.filter((c) => c.done).length;

  const kpis = [
    { label: "Активных ботов", value: String(bots.filter((b) => b.status === "active").length), icon: "Bot" },
    { label: "Диалогов за 7 дней", value: "0", icon: "MessageCircle" },
    { label: "Собрано лидов", value: "0", icon: "Inbox" },
    { label: "Конверсия в заявку", value: "0%", icon: "Target" },
  ];

  const limits = billing
    ? [
        { label: "Диалоги", cur: billing.usage.dialogs.current, max: billing.usage.dialogs.max, color: "from-electric to-aqua" },
        { label: "Боты", cur: billing.usage.bots.current, max: billing.usage.bots.max, color: "from-aqua to-electric" },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white">Обзор аккаунта</h1>
          <p className="text-white/50 text-sm mt-1">Добро пожаловать 👋</p>
        </div>
        <button
          onClick={() => navigate("/builder/new")}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-electric to-aqua text-ink font-semibold text-sm hover:shadow-[0_0_30px_rgba(43,127,255,0.4)] transition-all"
        >
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
          <div className="flex items-center justify-center h-44 text-white/25 text-sm">
            Пока нет данных об активности
          </div>
        </Card>

        {/* Limits */}
        <Card>
          <h3 className="text-white font-semibold mb-1">Лимиты тарифа</h3>
          <p className="text-xs text-white/40 mb-5">План «{billing?.planName || "…"}»</p>
          <div className="space-y-5">
            {limits.map((l) => {
              const unlimited = l.max === null;
              const pct = !unlimited && l.max > 0 ? Math.round((l.cur / l.max) * 100) : 0;
              return (
                <div key={l.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/70">{l.label}</span>
                    <span className={pct > 85 ? "text-amber-400" : "text-white/50"}>
                      {l.cur}/{unlimited ? "∞" : l.max}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${l.color}`} style={{ width: `${unlimited ? 100 : pct}%` }} />
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
          {botsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[52px] rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}
          {!botsLoading && bots.length === 0 && (
            <div className="text-center py-6">
              <p className="text-white/40 text-sm mb-4">У вас пока нет ботов</p>
              <button
                onClick={() => navigate("/builder/new")}
                className="text-sm text-electric hover:text-aqua transition-colors"
              >
                Создать первого бота →
              </button>
            </div>
          )}
          {!botsLoading && bots.length > 0 && (
            <div className="space-y-3">
              {bots.slice(0, 5).map((b) => (
                <button
                  key={b.id}
                  onClick={() => navigate(`/builder/${b.id}`)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-electric/30 to-aqua/30 flex items-center justify-center">
                    <Icon name="Bot" size={16} className="text-aqua" />
                  </div>
                  <span className="text-white text-sm flex-1 truncate">{b.name}</span>
                  <span className="text-white/50 text-sm shrink-0">{b.dialogsCount} диалогов</span>
                  <span className={`flex items-center gap-1.5 text-xs shrink-0 ${b.status === "active" ? "text-aqua" : "text-white/40"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${b.status === "active" ? "bg-aqua" : "bg-white/30"}`} />
                    {b.status === "active" ? "онлайн" : "черновик"}
                  </span>
                </button>
              ))}
            </div>
          )}
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
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Последние события</h3>
            <span className="flex items-center gap-1.5 text-xs text-aqua bg-aqua/10 px-2.5 py-1 rounded-full">
              <Icon name="Bell" size={12} /> {eventsTotal}
            </span>
          </div>

          {eventsLoading && (
            <div className="grid sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[52px] rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {!eventsLoading && events.length === 0 && (
            <div className="text-center py-6 text-white/40 text-sm">Пока нет событий</div>
          )}

          {!eventsLoading && events.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {events.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Icon name={e.icon} size={16} className={e.color} />
                  </div>
                  <span className="text-white/80 text-sm flex-1">{e.text}</span>
                  <span className="text-white/30 text-xs shrink-0">{timeAgo(e.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}