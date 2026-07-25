import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import Icon from "@/components/ui/icon";

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-ink2 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-electric/60 focus:ring-2 focus:ring-electric/20 transition";

export default function Auth() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate("/account", { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && !consent) {
      setError("Отметьте согласие на обработку персональных данных");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        await register({ name, email, password, consent });
      } else {
        await login({ email, password });
      }
      navigate("/account", { replace: true });
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
          <div className="flex gap-1 p-1 rounded-xl bg-ink/60 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  mode === m ? "bg-electric text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          <h1 className="font-display text-2xl text-white mb-1">
            {mode === "login" ? "С возвращением!" : "Создайте аккаунт"}
          </h1>
          <p className="text-white/50 text-sm mb-6">
            {mode === "login" ? "Войдите в личный кабинет" : "Пара минут — и всё готово"}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm text-white/70 mb-1.5">Имя</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Как вас зовут" required />
              </div>
            )}
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Пароль</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Минимум 6 символов" required />
            </div>

            {mode === "register" && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className="mt-0.5 border-white/30 data-[state=checked]:bg-electric data-[state=checked]:border-electric"
                />
                <span className="text-xs text-white/60 leading-relaxed">
                  Я даю согласие на обработку персональных данных и принимаю{" "}
                  <Link to="/personal-data" className="text-aqua hover:underline" target="_blank">
                    политику обработки данных
                  </Link>
                </span>
              </label>
            )}

            {mode === "login" && (
              <div className="text-right -mt-1">
                <Link to="/forgot-password" className="text-xs text-white/50 hover:text-aqua transition-colors">
                  Забыли пароль?
                </Link>
              </div>
            )}

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
              {busy ? "Подождите..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          <Link to="/" className="hover:text-white transition-colors">
            ← На главную
          </Link>
        </p>
      </div>
    </div>
  );
}