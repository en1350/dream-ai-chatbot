import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Icon from "@/components/ui/icon";

type Status = "loading" | "success" | "error";

export default function VerifyEmail() {
  const { verifyEmail, user } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");
  const [error, setError] = useState(token ? "" : "Ссылка неполная или повреждена.");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Не удалось подтвердить email");
        setStatus("error");
      });
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen bg-ink text-white grain-bg flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric to-aqua flex items-center justify-center">
            <Icon name="Bot" size={20} className="text-ink" />
          </div>
          <span className="font-display text-xl tracking-wide text-white">БотВПотоке</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-ink2/60 backdrop-blur-xl p-7 shadow-2xl text-center">
          {status === "loading" && (
            <div className="py-4">
              <Icon name="Loader2" size={32} className="text-aqua animate-spin mx-auto mb-4" />
              <h1 className="font-display text-2xl text-white mb-2">Подтверждаем email...</h1>
            </div>
          )}

          {status === "success" && (
            <div className="py-4">
              <div className="w-14 h-14 rounded-full bg-aqua/15 border border-aqua/30 flex items-center justify-center mx-auto mb-4">
                <Icon name="CircleCheck" size={26} className="text-aqua" />
              </div>
              <h1 className="font-display text-2xl text-white mb-2">Email подтверждён</h1>
              <p className="text-white/60 text-sm">Спасибо! Ваши 7 бесплатных дней уже идут — создавайте первого бота.</p>
              <Link
                to={user ? "/cabinet" : "/login"}
                className="inline-block mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-electric to-aqua text-white font-semibold"
              >
                {user ? "Перейти в кабинет" : "Войти"}
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="py-4">
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <Icon name="TriangleAlert" size={26} className="text-red-400" />
              </div>
              <h1 className="font-display text-2xl text-white mb-2">Не получилось</h1>
              <p className="text-white/60 text-sm">{error}</p>
              <p className="text-white/40 text-xs mt-3">Войдите в кабинет и запросите новое письмо.</p>
              <Link to={user ? "/cabinet" : "/login"} className="inline-block mt-6 text-sm text-aqua hover:underline">
                {user ? "В кабинет" : "Войти"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
