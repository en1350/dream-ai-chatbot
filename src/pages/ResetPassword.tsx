import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Icon from "@/components/ui/icon";

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-ink2 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-electric/60 focus:ring-2 focus:ring-electric/20 transition";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-white grain-bg flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric to-aqua flex items-center justify-center">
            <Icon name="Bot" size={20} className="text-ink" />
          </div>
          <span className="font-display text-xl tracking-wide text-white">БотВПотоке</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-ink2/60 backdrop-blur-xl p-7 shadow-2xl">
          {!token ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <Icon name="TriangleAlert" size={26} className="text-red-400" />
              </div>
              <h1 className="font-display text-2xl text-white mb-2">Ссылка недействительна</h1>
              <p className="text-white/60 text-sm">Похоже, ссылка неполная. Запросите восстановление пароля заново.</p>
              <Link to="/forgot-password" className="inline-block mt-6 text-sm text-aqua hover:underline">
                Запросить новую ссылку
              </Link>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-aqua/15 border border-aqua/30 flex items-center justify-center mx-auto mb-4">
                <Icon name="CircleCheck" size={26} className="text-aqua" />
              </div>
              <h1 className="font-display text-2xl text-white mb-2">Пароль обновлён</h1>
              <p className="text-white/60 text-sm">Сейчас перенаправим вас на страницу входа...</p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl text-white mb-1">Новый пароль</h1>
              <p className="text-white/50 text-sm mb-6">Придумайте новый пароль для входа в аккаунт.</p>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Новый пароль</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                    placeholder="Минимум 6 символов"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Повторите пароль</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputCls}
                    placeholder="Ещё раз"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <Icon name="TriangleAlert" size={16} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-electric to-aqua text-white font-semibold hover:shadow-[0_6px_20px_rgba(43,127,255,0.4)] disabled:opacity-50 transition-all"
                >
                  {busy ? "Сохраняем..." : "Сохранить пароль"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
