import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../../backend/func2url.json";

interface Tx {
  id: number;
  amountKopecks: number;
  kind: string;
  status: string;
  description: string;
  createdAt: string | null;
}

interface WalletData {
  balanceKopecks: number;
  transactions: Tx[];
  quickAmounts: number[];
  minKopecks: number;
}

const rub = (kopecks: number) => (kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 0 });

const statusMeta: Record<string, { label: string; className: string }> = {
  succeeded: { label: "Зачислено", className: "text-aqua" },
  pending: { label: "Ожидает оплаты", className: "text-amber-400" },
  canceled: { label: "Отменено", className: "text-white/40" },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function WalletPanel() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch(func2url["wallet"])
      .then((res) => res.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const topup = (amountKopecks: number) => {
    if (paying) return;
    setError("");
    if (!data || amountKopecks < data.minKopecks) {
      setError(`Минимальная сумма пополнения — ${rub(data?.minKopecks ?? 10000)} ₽`);
      return;
    }
    setPaying(true);
    fetch(func2url["wallet"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "topup", amountKopecks, returnUrl: window.location.href }),
    })
      .then((res) => res.json())
      .then((d) => {
        if (d.confirmationUrl) {
          window.location.href = d.confirmationUrl;
        } else {
          setError(d.error || "Не удалось создать платёж");
        }
      })
      .catch(() => setError("Не удалось создать платёж"))
      .finally(() => setPaying(false));
  };

  const submitCustom = () => {
    const value = Math.round(parseFloat(custom.replace(",", ".")) * 100);
    if (!value || Number.isNaN(value)) {
      setError("Введите корректную сумму");
      return;
    }
    topup(value);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white">Кошелёк</h1>
        <p className="text-white/50 text-sm mt-1">Баланс для оплаты тарифов и услуг</p>
      </div>

      {/* Баланс */}
      <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-electric/15 to-ink2 p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
            <Icon name="Wallet" size={22} className="text-aqua" />
          </div>
          <div>
            <p className="text-xs text-white/50">Текущий баланс</p>
            <p className="font-display text-4xl text-white leading-tight">
              {loading ? "…" : `${rub(data?.balanceKopecks ?? 0)} ₽`}
            </p>
          </div>
        </div>
      </div>

      {/* Пополнение */}
      <div className="rounded-2xl border border-white/8 bg-ink2/50 p-6 mb-6">
        <h3 className="text-white font-semibold mb-1">Пополнить кошелёк</h3>
        <p className="text-xs text-white/40 mb-5">Оплата картой через ЮKassa — быстро и безопасно</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {(data?.quickAmounts ?? [50000, 100000, 200000, 500000]).map((a) => (
            <button
              key={a}
              disabled={paying}
              onClick={() => topup(a)}
              className="py-3 rounded-xl border border-white/10 bg-white/5 text-white font-medium hover:border-electric/50 hover:bg-electric/10 transition-all disabled:opacity-50"
            >
              {rub(a)} ₽
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/[^\d.,]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && submitCustom()}
              placeholder="Своя сумма"
              inputMode="decimal"
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 pl-4 pr-8 text-white focus:border-electric focus:outline-none transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">₽</span>
          </div>
          <button
            disabled={paying || !custom}
            onClick={submitCustom}
            className="px-5 h-11 rounded-xl bg-gradient-to-r from-electric to-aqua text-ink font-semibold hover:shadow-[0_0_25px_rgba(43,127,255,0.4)] transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center gap-2"
          >
            {paying ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="ArrowRight" size={16} />}
            Пополнить
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
            <Icon name="TriangleAlert" size={15} /> {error}
          </div>
        )}
      </div>

      {/* История */}
      <div className="rounded-2xl border border-white/8 bg-ink2/50 p-6">
        <h3 className="text-white font-semibold mb-5">История операций</h3>
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}
        {!loading && (data?.transactions.length ?? 0) === 0 && (
          <p className="text-white/40 text-sm text-center py-6">Операций пока нет</p>
        )}
        {!loading && (data?.transactions.length ?? 0) > 0 && (
          <div className="divide-y divide-white/5">
            {data!.transactions.map((t) => {
              const positive = t.amountKopecks > 0;
              const meta = statusMeta[t.status] ?? { label: t.status, className: "text-white/40" };
              return (
                <div key={t.id} className="flex items-center gap-4 py-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${positive ? "bg-aqua/15" : "bg-white/5"}`}>
                    <Icon name={positive ? "ArrowDownLeft" : "ArrowUpRight"} size={16} className={positive ? "text-aqua" : "text-white/50"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{t.description}</p>
                    <p className="text-[11px] text-white/40">{timeAgo(t.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-medium ${positive ? "text-aqua" : "text-white/70"}`}>
                      {positive ? "+" : ""}{rub(t.amountKopecks)} ₽
                    </p>
                    <p className={`text-[11px] ${meta.className}`}>{meta.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
