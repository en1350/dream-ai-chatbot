import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import func2url from "../../backend/func2url.json";

interface Bot {
  id: number;
  name: string;
  status: string;
  dialogsCount: number;
  createdAt: string | null;
}

const NAV = [
  { id: "bots", label: "Мои боты", icon: "Bot", to: "/cabinet" },
  { id: "templates", label: "Шаблоны", icon: "LayoutTemplate", to: "/cabinet" },
  { id: "analytics", label: "Аналитика", icon: "BarChart3", to: "/dashboard" },
  { id: "api", label: "API-ключи", icon: "KeyRound", to: "/cabinet" },
  { id: "billing", label: "Тарифы", icon: "CreditCard", to: "/account" },
  { id: "settings", label: "Настройки", icon: "Settings", to: "/cabinet" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

export default function Cabinet() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [bots, setBots] = useState<Bot[]>([]);
  const [botsLoading, setBotsLoading] = useState(true);
  const [leadsCount, setLeadsCount] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("bots");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [loading, user, navigate]);

  const loadBots = () => {
    setBotsLoading(true);
    fetch(func2url["bots"])
      .then((res) => res.json())
      .then((data) => setBots(data.bots || []))
      .finally(() => setBotsLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    loadBots();
    fetch(func2url["leads"])
      .then((res) => res.json())
      .then((data) => setLeadsCount(data.total ?? (data.leads?.length || 0)))
      .catch(() => setLeadsCount(0));
  }, [user]);

  const messagesThisMonth = useMemo(
    () => bots.reduce((sum, b) => sum + (b.dialogsCount || 0), 0),
    [bots],
  );

  const filteredBots = useMemo(
    () => bots.filter((b) => b.name.toLowerCase().includes(search.toLowerCase().trim())),
    [bots, search],
  );

  const removeBot = (id: number) => {
    if (!confirm("Удалить бота? Действие необратимо.")) return;
    setDeletingId(id);
    fetch(`${func2url["bots"]}?id=${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBots((list) => list.filter((b) => b.id !== id));
      })
      .finally(() => setDeletingId(null));
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-ink text-white flex items-center justify-center">
        <Icon name="LoaderCircle" size={32} className="animate-spin text-electric" />
      </div>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();
  const stats = [
    { label: "Ботов создано", value: bots.length, icon: "Bot", color: "text-aqua" },
    { label: "Заявок собрано", value: leadsCount ?? "…", icon: "Users", color: "text-electric" },
    { label: "Сообщений за месяц", value: messagesThisMonth, icon: "MessageSquare", color: "text-aqua" },
  ];

  return (
    <div className="min-h-screen bg-ink text-white grain-bg flex">
      {/* Левый сайдбар */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-ink2/80 backdrop-blur-xl border-r border-white/8 fixed left-0 top-0 h-screen py-6 px-4">
        <Link to="/" className="flex items-center gap-2.5 mb-8 px-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric to-aqua flex items-center justify-center shrink-0">
            <Icon name="Bot" size={20} className="text-ink" />
          </div>
          <span className="font-display text-lg tracking-wide text-white">БотВПотоке</span>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                if (item.to !== "/cabinet") navigate(item.to);
              }}
              className={`flex items-center gap-3 w-full h-11 px-3.5 rounded-xl transition-colors text-sm ${
                activeNav === item.id
                  ? "bg-electric/15 text-white"
                  : "text-white/55 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon name={item.icon} size={19} className={activeNav === item.id ? "text-aqua" : ""} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-1">
            <Icon name="Sparkles" size={13} className="text-aqua" /> Тариф «{user.plan}»
          </div>
          <Link to="/account" className="text-xs text-aqua hover:underline">
            Управлять тарифом
          </Link>
        </div>
      </aside>

      {/* Правая часть */}
      <div className="flex-1 md:pl-60 min-w-0">
        {/* Верхняя панель */}
        <header className="sticky top-0 z-30 h-16 border-b border-white/8 bg-ink/70 backdrop-blur-xl flex items-center gap-4 px-6">
          <Link to="/" className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric to-aqua flex items-center justify-center">
              <Icon name="Bot" size={17} className="text-ink" />
            </div>
          </Link>

          <div className="relative flex-1 max-w-md">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по ботам…"
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="relative w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">
              <Icon name="Bell" size={19} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-electric border-2 border-ink" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl hover:bg-white/5 pl-1 pr-2 h-10 transition-colors outline-none">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aqua to-electric flex items-center justify-center text-ink text-sm font-semibold">
                  {initial}
                </div>
                <span className="hidden sm:block text-sm text-white/80 max-w-[120px] truncate">{user.name}</span>
                <Icon name="ChevronDown" size={15} className="text-white/40" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-ink2 border-white/10 text-white">
                <DropdownMenuLabel className="text-white/50 font-normal">
                  <div className="text-white font-medium truncate">{user.name}</div>
                  <div className="text-xs text-white/50 truncate">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => navigate("/account")} className="cursor-pointer focus:bg-white/10 focus:text-white">
                  <Icon name="User" size={15} className="mr-2" /> Профиль
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                >
                  <Icon name="LogOut" size={15} className="mr-2" /> Выход
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Основная область */}
        <main className="p-6 md:p-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="font-display text-3xl text-white">Добро пожаловать, {user.name}!</h1>
            <p className="text-white/50 text-sm mt-1">
              {user.email} · с нами с {formatDate(user.createdAt)}
            </p>
          </div>

          {/* Статистика */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-ink2/50 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center">
                    <Icon name={s.icon} size={21} className={s.color} />
                  </div>
                  <div>
                    <div className="font-display text-2xl text-white leading-none">{s.value}</div>
                    <div className="text-xs text-white/45 mt-1">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Боты */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl text-white">Мои боты</h2>
            <button
              onClick={() => navigate("/builder/new")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-electric to-aqua text-ink font-semibold text-sm hover:shadow-[0_0_30px_rgba(43,127,255,0.4)] transition-all"
            >
              <Icon name="Plus" size={18} /> Создать нового бота
            </button>
          </div>

          {botsLoading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-white/8 bg-ink2/50 h-[190px] animate-pulse" />
              ))}
            </div>
          )}

          {!botsLoading && filteredBots.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-20 rounded-2xl border border-dashed border-white/10 bg-ink2/30">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                <Icon name="Bot" size={28} className="text-aqua" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">
                {search ? "Ничего не найдено" : "Пока нет ни одного бота"}
              </h3>
              <p className="text-white/50 max-w-sm mb-6">
                {search ? "Попробуйте изменить запрос" : "Создайте первого бота, чтобы начать собирать заявки"}
              </p>
              {!search && (
                <button
                  onClick={() => navigate("/builder/new")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-electric to-aqua text-ink font-semibold text-sm hover:shadow-[0_0_30px_rgba(43,127,255,0.4)] transition-all"
                >
                  <Icon name="Plus" size={18} /> Создать нового бота
                </button>
              )}
            </div>
          )}

          {!botsLoading && filteredBots.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBots.map((b) => {
                const active = b.status === "active";
                return (
                  <div key={b.id} className="rounded-2xl border border-white/8 bg-ink2/50 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-electric/25 to-aqua/25 flex items-center justify-center">
                        <Icon name="Bot" size={20} className="text-aqua" />
                      </div>
                      <span
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                          active
                            ? "text-aqua bg-aqua/10 border-aqua/25"
                            : "text-white/45 bg-white/5 border-white/10"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-aqua" : "bg-white/30"}`} />
                        {active ? "Активен" : "Неактивен"}
                      </span>
                    </div>

                    <h3 className="text-white font-semibold mb-1 truncate">{b.name}</h3>
                    <p className="text-white/40 text-xs mb-4">Создан {formatDate(b.createdAt)}</p>

                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/8">
                      <button
                        onClick={() => navigate(`/builder/${b.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
                      >
                        <Icon name="Pencil" size={14} /> Редактировать
                      </button>
                      <button
                        onClick={() => navigate("/dashboard")}
                        title="Статистика"
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                      >
                        <Icon name="BarChart3" size={15} />
                      </button>
                      <button
                        onClick={() => removeBot(b.id)}
                        disabled={deletingId === b.id}
                        title="Удалить"
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Icon name={deletingId === b.id ? "LoaderCircle" : "Trash2"} size={15} className={deletingId === b.id ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
