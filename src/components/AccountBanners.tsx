import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import func2url from "../../backend/func2url.json";

interface BillingInfo {
  planId: string;
  demoDaysLeft: number | null;
  blocked?: boolean;
}

export default function AccountBanners() {
  const { user, resendVerification } = useAuth();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    apiFetch(func2url["billing"])
      .then((r) => r.json())
      .then((d) => setBilling(d))
      .catch(() => null);
  }, [user]);

  if (!user) return null;

  const resend = async () => {
    setSending(true);
    setMsg("");
    try {
      await resendVerification();
      setMsg("Письмо отправлено. Проверьте почту и папку «Спам».");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Не удалось отправить письмо");
    } finally {
      setSending(false);
    }
  };

  const blocked = !!billing?.blocked;
  const daysLeft = billing?.planId === "demo" ? billing?.demoDaysLeft : null;

  return (
    <div className="space-y-3 mb-6">
      {user.emailVerified === false && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4">
          <Icon name="MailWarning" size={22} className="text-amber-300 shrink-0" />
          <div className="flex-1 text-sm">
            <div className="text-white font-medium">Подтвердите email</div>
            <div className="text-white/60">
              Мы отправили ссылку на {user.email}. {msg}
            </div>
          </div>
          <button
            onClick={resend}
            disabled={sending}
            className="px-4 py-2 rounded-xl bg-amber-300 text-ink text-sm font-semibold hover:bg-amber-200 disabled:opacity-50 transition-colors"
          >
            {sending ? "Отправляем..." : "Отправить ещё раз"}
          </button>
        </div>
      )}

      {blocked ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
          <Icon name="Lock" size={22} className="text-red-400 shrink-0" />
          <div className="flex-1 text-sm">
            <div className="text-white font-medium">Бесплатный период закончился</div>
            <div className="text-white/60">Оплатите тариф, чтобы боты продолжили работать и можно было создавать новые.</div>
          </div>
          <Link
            to="/dashboard?tab=billing"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-electric to-aqua text-white text-sm font-semibold text-center"
          >
            Оплатить тариф
          </Link>
        </div>
      ) : daysLeft !== null && daysLeft !== undefined ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-aqua/30 bg-aqua/10 px-5 py-4">
          <Icon name="Gift" size={22} className="text-aqua shrink-0" />
          <div className="flex-1 text-sm">
            <div className="text-white font-medium">
              Бесплатный период: осталось {daysLeft} {daysLeft === 1 ? "день" : daysLeft >= 2 && daysLeft <= 4 ? "дня" : "дней"}
            </div>
            <div className="text-white/60">После окончания нужно будет выбрать платный тариф.</div>
          </div>
          <Link
            to="/dashboard?tab=billing"
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-semibold text-center hover:bg-white/15"
          >
            Тарифы
          </Link>
        </div>
      ) : null}
    </div>
  );
}
