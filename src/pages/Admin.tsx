import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import func2url from "../../backend/func2url.json";

const ADMIN_URL = (func2url as Record<string, string>)["admin"];

interface AdminUser {
  id: number;
  email: string;
  name: string;
  plan: string;
  createdAt: string | null;
  planExpiresAt: string | null;
  expired: boolean;
  balanceKopecks: number;
  emailVerified: boolean;
  isAdmin: boolean;
  botsCount: number;
  leadsCount: number;
  lastLoginAt: string | null;
}

interface Stats {
  usersTotal: number;
  usersWeek: number;
  paying: number;
  onTrial: number;
  expired: number;
  revenueKopecks: number;
  botsTotal: number;
  leadsTotal: number;
}

type Filter = "all" | "trial" | "paying" | "expired" | "unverified";

const PLAN_NAMES: Record<string, string> = { demo: "Демо", standard: "Стандарт", pro: "Профи" };

const rub = (k: number) => (k / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

function statusOf(u: AdminUser): { label: string; cls: string } {
  if (u.expired) return { label: "Срок истёк", cls: "bg-red-500/15 text-red-400" };
  if (u.plan === "demo") return { label: "Пробный", cls: "bg-amber-400/15 text-amber-300" };
  return { label: "Оплачен", cls: "bg-aqua/15 text-aqua" };
}

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [daysInput, setDaysInput] = useState("30");

  const load = () => {
    setLoading(true);
    apiFetch(ADMIN_URL)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) {
          setError(d.error || "Не удалось загрузить данные");
          return;
        }
        setStats(d.stats);
        setUsers(d.users || []);
        setError("");
      })
      .catch(() => setError("Не удалось загрузить данные"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.isAdmin) load();
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    const fresh = users.find((u) => u.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !u.email.toLowerCase().includes(q) && !u.name.toLowerCase().includes(q)) return false;
      if (filter === "trial") return u.plan === "demo" && !u.expired;
      if (filter === "paying") return u.plan !== "demo" && !u.expired;
      if (filter === "expired") return u.expired;
      if (filter === "unverified") return !u.emailVerified;
      return true;
    });
  }, [users, search, filter]);

  const update = async (payload: Record<string, unknown>, okText: string) => {
    if (!selected) return;
    setBusy(true);
    try {
      const r = await apiFetch(ADMIN_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, ...payload }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка");
      toast.success(okText);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!confirm(`Удалить клиента ${selected.email} со всеми ботами, заявками и лендингами? Действие необратимо.`)) return;
    setBusy(true);
    try {
      const r = await apiFetch(`${ADMIN_URL}?id=${selected.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка");
      toast.success("Клиент удалён");
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const changeBalance = (sign: 1 | -1) => {
    const value = parseFloat(balanceInput.replace(",", "."));
    if (!value || value <= 0) {
      toast.error("Введите сумму в рублях");
      return;
    }
    update({ balanceDeltaKopecks: sign * Math.round(value * 100) }, sign > 0 ? "Баланс пополнен" : "Сумма списана").then(() =>
      setBalanceInput(""),
    );
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-ink text-white flex items-center justify-center px-6">
        <div className="text-center">
          <Icon name="ShieldX" size={40} className="text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl mb-2">Нет доступа</h1>
          <p className="text-white/50 text-sm mb-6">Эта страница доступна только администраторам.</p>
          <Link to="/cabinet" className="text-aqua hover:underline text-sm">Вернуться в кабинет</Link>
        </div>
      </div>
    );
  }

  const kpis = stats
    ? [
        { label: "Всего клиентов", value: stats.usersTotal, sub: `+${stats.usersWeek} за 7 дней`, icon: "Users" },
        { label: "Платящие", value: stats.paying, sub: "активный платный тариф", icon: "BadgeCheck" },
        { label: "На пробном", value: stats.onTrial, sub: "7 бесплатных дней", icon: "Gift" },
        { label: "Срок истёк", value: stats.expired, sub: "ждут оплаты", icon: "Clock" },
        { label: "Пополнения", value: `${rub(stats.revenueKopecks)} ₽`, sub: "всего через ЮKassa", icon: "Wallet" },
        { label: "Боты / заявки", value: `${stats.botsTotal} / ${stats.leadsTotal}`, sub: "по всему сервису", icon: "Bot" },
      ]
    : [];

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Все" },
    { id: "trial", label: "Пробные" },
    { id: "paying", label: "Платящие" },
    { id: "expired", label: "Срок истёк" },
    { id: "unverified", label: "Email не подтверждён" },
  ];

  return (
    <div className="min-h-screen bg-ink text-white grain-bg">
      <header className="sticky top-0 z-30 h-16 border-b border-white/8 bg-ink/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto h-full flex items-center gap-4 px-6">
          <Link to="/cabinet" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={17} /> В кабинет
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <Icon name="ShieldCheck" size={20} className="text-aqua" />
            <span className="font-display text-lg">Админка</span>
          </div>
          <button
            onClick={load}
            className="ml-auto flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Icon name="RefreshCw" size={15} className={loading ? "animate-spin" : ""} /> Обновить
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            <Icon name="TriangleAlert" size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-white/10 bg-ink2/60 p-4">
              <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                <Icon name={k.icon} size={15} className="text-aqua" /> {k.label}
              </div>
              <div className="text-2xl font-semibold text-white">{k.value}</div>
              <div className="text-xs text-white/40 mt-1">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink2/60">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-white/8">
            <div className="relative flex-1 max-w-md">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по имени или email"
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    filter === f.id ? "bg-electric text-white" : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 text-xs">
                  <th className="px-4 py-3 font-normal">Клиент</th>
                  <th className="px-4 py-3 font-normal">Тариф</th>
                  <th className="px-4 py-3 font-normal">Статус</th>
                  <th className="px-4 py-3 font-normal">Действует до</th>
                  <th className="px-4 py-3 font-normal text-right">Баланс</th>
                  <th className="px-4 py-3 font-normal text-right">Боты</th>
                  <th className="px-4 py-3 font-normal text-right">Заявки</th>
                  <th className="px-4 py-3 font-normal">Регистрация</th>
                </tr>
              </thead>
              <tbody>
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-white/40">
                      <Icon name="Loader2" size={24} className="animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-white/40">Клиентов не найдено</td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const st = statusOf(u);
                    return (
                      <tr
                        key={u.id}
                        onClick={() => setSelected(u)}
                        className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{u.name}</span>
                            {u.isAdmin && <Icon name="ShieldCheck" size={14} className="text-aqua" />}
                          </div>
                          <div className="text-white/45 text-xs flex items-center gap-1">
                            {u.email}
                            {!u.emailVerified && <Icon name="MailWarning" size={12} className="text-amber-300" />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/80">{PLAN_NAMES[u.plan] || u.plan}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-md ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3 text-white/70">{fmtDate(u.planExpiresAt)}</td>
                        <td className="px-4 py-3 text-right text-white/80">{rub(u.balanceKopecks)} ₽</td>
                        <td className="px-4 py-3 text-right text-white/80">{u.botsCount}</td>
                        <td className="px-4 py-3 text-right text-white/80">{u.leadsCount}</td>
                        <td className="px-4 py-3 text-white/50">{fmtDate(u.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="bg-ink2 border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.name}
                  {selected.isAdmin && <Icon name="ShieldCheck" size={16} className="text-aqua" />}
                </DialogTitle>
                <DialogDescription className="text-white/50">
                  {selected.email} · ID {selected.id} · последний вход {fmtDate(selected.lastLoginAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                <div>
                  <div className="text-xs text-white/50 mb-2">Тариф</div>
                  <div className="flex gap-2">
                    {Object.entries(PLAN_NAMES).map(([id, label]) => (
                      <button
                        key={id}
                        disabled={busy || selected.plan === id}
                        onClick={() => update({ plan: id }, `Тариф «${label}» установлен`)}
                        className={`flex-1 text-sm py-2 rounded-lg transition-colors disabled:cursor-default ${
                          selected.plan === id ? "bg-electric text-white" : "bg-white/5 hover:bg-white/10 text-white/70"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-white/50 mb-2">
                    Срок доступа: до {fmtDate(selected.planExpiresAt)}
                    {selected.expired && <span className="text-red-400"> (истёк)</span>}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={daysInput}
                      onChange={(e) => setDaysInput(e.target.value)}
                      className="w-24 h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm focus:border-electric focus:outline-none"
                    />
                    <button
                      disabled={busy}
                      onClick={() => {
                        const d = parseInt(daysInput, 10);
                        if (!d || d <= 0) return toast.error("Укажите число дней");
                        update({ extendDays: d }, `Доступ продлён на ${d} дн.`);
                      }}
                      className="flex-1 text-sm rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50"
                    >
                      Продлить на дни
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => update({ extendDays: 0 }, "Доступ завершён")}
                      className="text-sm px-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Завершить
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-white/50 mb-2">Баланс: {rub(selected.balanceKopecks)} ₽</div>
                  <div className="flex gap-2">
                    <input
                      value={balanceInput}
                      onChange={(e) => setBalanceInput(e.target.value)}
                      placeholder="Сумма, ₽"
                      inputMode="decimal"
                      className="w-28 h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm focus:border-electric focus:outline-none"
                    />
                    <button
                      disabled={busy}
                      onClick={() => changeBalance(1)}
                      className="flex-1 text-sm rounded-lg bg-aqua/15 text-aqua hover:bg-aqua/25 disabled:opacity-50"
                    >
                      Начислить
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => changeBalance(-1)}
                      className="flex-1 text-sm rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50"
                    >
                      Списать
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={busy}
                    onClick={() =>
                      update(
                        { emailVerified: !selected.emailVerified },
                        selected.emailVerified ? "Подтверждение снято" : "Email отмечен как подтверждённый",
                      )
                    }
                    className="text-sm py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50"
                  >
                    {selected.emailVerified ? "Снять подтверждение email" : "Подтвердить email вручную"}
                  </button>
                  <button
                    disabled={busy || selected.id === user.id}
                    onClick={() =>
                      update(
                        { isAdmin: !selected.isAdmin },
                        selected.isAdmin ? "Права администратора сняты" : "Назначен администратором",
                      )
                    }
                    className="text-sm py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40"
                  >
                    {selected.isAdmin ? "Снять права админа" : "Сделать админом"}
                  </button>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <button
                    disabled={busy || selected.id === user.id}
                    onClick={remove}
                    className="w-full text-sm py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Icon name="Trash2" size={15} /> Удалить клиента
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
