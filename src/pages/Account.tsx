import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS, type PlanId } from "@/lib/plans";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

export default function Account() {
  const { user, loading, logout, changePlan } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-ink text-white flex items-center justify-center">
        <Icon name="LoaderCircle" size={32} className="animate-spin text-electric" />
      </div>
    );
  }

  const currentPlan = PLANS.find((p) => p.id === user.plan);

  const handleChangePlan = async (planId: PlanId) => {
    if (planId === user.plan) return;
    setSwitching(planId);
    try {
      await changePlan(planId);
      toast.success("Тариф обновлён");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сменить тариф");
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-white grain-bg">
      <header className="border-b border-white/5 backdrop-blur-xl bg-ink/70">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric to-aqua flex items-center justify-center">
              <Icon name="Bot" size={20} className="text-ink" />
            </div>
            <span className="font-display text-xl tracking-wide text-white">БотВПотоке</span>
          </Link>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <Icon name="LogOut" size={16} /> Выйти
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="font-display text-3xl text-white mb-1">Личный кабинет</h1>
        <p className="text-white/50 text-sm mb-8">Управляйте профилем и тарифом</p>

        {/* Профиль */}
        <div className="rounded-2xl border border-white/10 bg-ink2/50 p-6 mb-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-electric to-aqua flex items-center justify-center text-2xl font-bold text-ink shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold text-white truncate">{user.name}</div>
            <div className="text-white/50 text-sm truncate">{user.email}</div>
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-electric/15 text-aqua border border-electric/30">
              <Icon name="Crown" size={13} /> Тариф «{currentPlan?.name || user.plan}»
            </div>
          </div>
        </div>

        {/* Тарифы */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl text-white">Ваш тариф</h2>
          <Link to="/dashboard" className="text-sm text-aqua hover:underline flex items-center gap-1">
            Перейти к ботам <Icon name="ArrowRight" size={14} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const active = plan.id === user.plan;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 transition-all ${
                  active
                    ? "border-electric bg-gradient-to-br from-electric/15 to-aqua/5 shadow-[0_8px_30px_rgba(43,127,255,0.15)]"
                    : "border-white/10 bg-ink2/50 hover:border-electric/40"
                }`}
              >
                {plan.highlighted && !active && (
                  <div className="absolute -top-3 left-6 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-aqua text-ink">
                    Популярный
                  </div>
                )}
                {active && (
                  <div className="absolute -top-3 left-6 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-electric text-white">
                    Текущий
                  </div>
                )}
                <div className="text-white font-semibold text-lg">{plan.name}</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl text-white">{plan.price}</span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>
                <p className="text-white/50 text-sm mt-2 mb-4">{plan.tagline}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <Icon name="Check" size={15} className="text-aqua shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={active || switching !== null}
                  onClick={() => handleChangePlan(plan.id)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-white/5 text-white/40 cursor-default"
                      : "bg-gradient-to-r from-electric to-aqua text-white hover:shadow-[0_6px_20px_rgba(43,127,255,0.4)] disabled:opacity-50"
                  }`}
                >
                  {active ? "Подключён" : switching === plan.id ? "Переключаем..." : "Выбрать тариф"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}