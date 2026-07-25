import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Icon from "@/components/ui/icon";

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-ink2 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-electric/60 focus:ring-2 focus:ring-electric/20 transition";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await forgotPassword(email);
      setSent(true);
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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-aqua/15 border border-aqua/30 flex items-center justify-center mx-auto mb-4">
                <Icon name="MailCheck" size={26} className="text-aqua" />
              </div>
              <h1 className="font-display text-2xl text-white mb-2">Проверьте почту</h1>
              <p className="text-white/60 text-sm leading-relaxed">
                Если аккаунт с адресом <span className="text-white">{email}</span> существует, мы отправили на него ссылку
                для сброса пароля. Ссылка действует 1 час.
              </p>
              <Link
                to="/login"
                className="inline-block mt-6 text-sm text-aqua hover:underline"
              >
                ← Вернуться ко входу
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl text-white mb-1">Забыли пароль?</h1>
              <p className="text-white/50 text-sm mb-6">
                Укажите email — пришлём ссылку для восстановления доступа.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder="you@example.com"
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
                  {busy ? "Отправляем..." : "Отправить ссылку"}
                </button>
              </form>
              <p className="text-center mt-6">
                <Link to="/login" className="text-sm text-white/50 hover:text-white transition-colors">
                  ← Вернуться ко входу
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
