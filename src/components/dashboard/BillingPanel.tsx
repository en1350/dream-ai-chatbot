import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../../backend/func2url.json";

interface Billing {
  planId: string;
  planName: string;
  usage: {
    bots: { current: number; max: number | null };
    dialogs: { current: number; max: number | null };
  };
}

const PLAN_CARDS = [
  {
    id: "start",
    name: "Старт",
    price: "0 ₽",
    period: "навсегда",
    features: ["1 бот", "100 диалогов в месяц", "Сбор лидов", "Интеграция ВК"],
  },
  {
    id: "business",
    name: "Бизнес",
    price: "390 ₽",
    period: "в месяц",
    features: ["5 ботов", "Безлимит диалогов", "AI-ответы", "Лендинги", "Интеграция ВК"],
    accent: true,
  },
  {
    id: "agency",
    name: "Агентство",
    price: "990 ₽",
    period: "в месяц",
    features: ["Безлимит ботов", "Приоритетная поддержка", "Лендинги", "Интеграция ВК"],
  },
];

export default function BillingPanel() {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  const load = () => {
    fetch(func2url["billing"])
      .then((res) => res.json())
      .then((data) => setBilling(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const choosePlan = (planId: string) => {
    setSwitching(planId);
    fetch(func2url["billing"], {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    })
      .then((res) => res.json())
      .then(() => load())
      .finally(() => setSwitching(null));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white">Тарифы и биллинг</h1>
        <p className="text-white/50 text-sm mt-1">Ваш план и лимиты использования</p>
      </div>

      {!loading && billing && (
        <div className="rounded-2xl border border-white/8 bg-ink2/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-white/40 mb-1">Текущий тариф</p>
              <h3 className="text-white font-semibold text-lg">{billing.planName}</h3>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { label: "Боты", cur: billing.usage.bots.current, max: billing.usage.bots.max },
              { label: "Диалоги", cur: billing.usage.dialogs.current, max: billing.usage.dialogs.max },
            ].map((l) => {
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
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-electric to-aqua"
                      style={{ width: `${unlimited ? 100 : pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {PLAN_CARDS.map((p) => {
          const isCurrent = billing?.planId === p.id;
          return (
            <div
              key={p.id}
              className={`relative rounded-3xl p-8 border transition-all ${
                p.accent
                  ? "border-electric/50 bg-gradient-to-b from-electric/15 to-ink2 shadow-[0_0_60px_rgba(43,127,255,0.2)]"
                  : "border-white/8 bg-ink2/50"
              }`}
            >
              {p.accent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-electric to-aqua text-ink text-xs font-semibold">
                  Популярный
                </div>
              )}
              <div className="text-white/70 font-medium mb-4">{p.name}</div>
              <div className="flex items-end gap-2 mb-6">
                <span className="font-display text-4xl text-white">{p.price}</span>
                <span className="text-white/40 text-sm mb-1">{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                    <Icon name="Check" size={16} className="text-aqua shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent || switching === p.id}
                onClick={() => choosePlan(p.id)}
                className={`w-full text-center py-3 rounded-full font-medium transition-all disabled:cursor-default ${
                  isCurrent
                    ? "border border-aqua/40 text-aqua"
                    : p.accent
                    ? "bg-gradient-to-r from-electric to-aqua text-ink hover:shadow-[0_0_30px_rgba(43,127,255,0.5)]"
                    : "border border-white/15 text-white hover:bg-white/5"
                }`}
              >
                {isCurrent ? "Текущий тариф" : switching === p.id ? "Переключаем…" : "Выбрать тариф"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
