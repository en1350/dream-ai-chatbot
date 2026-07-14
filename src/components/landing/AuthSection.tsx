import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

export default function AuthSection() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const canSubmit = mode === "login" || agreed;
  return (
    <section id="auth" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 grain-bg" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-electric/20 blur-[130px]" />
      <div className="container mx-auto px-6 relative">
        <div className="max-w-md mx-auto rounded-3xl border border-white/10 bg-ink2/80 backdrop-blur-xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-electric to-aqua flex items-center justify-center mb-4">
              <Icon name="Bot" size={26} className="text-ink" />
            </div>
            <h3 className="font-display text-2xl text-white">
              {mode === "register" ? "Создать аккаунт" : "Вход в кабинет"}
            </h3>
            <p className="text-sm text-white/50 mt-1">Личный кабинет Каскад</p>
          </div>

          <div className="flex gap-1 p-1 rounded-full bg-white/5 mb-6">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === m ? "bg-white text-ink" : "text-white/60 hover:text-white"
                }`}
              >
                {m === "register" ? "Регистрация" : "Вход"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Имя</label>
                <input
                  type="text"
                  placeholder="Как вас зовут?"
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Email</label>
              <input
                type="email"
                placeholder="you@mail.ru"
                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Пароль</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
              />
            </div>
            {mode === "register" && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 shrink-0 rounded border-white/20 bg-white/5 accent-electric cursor-pointer"
                />
                <span className="text-xs text-white/50 leading-relaxed">
                  Я согласен с{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-electric hover:text-aqua transition-colors underline underline-offset-2">
                    условиями использования
                  </a>{" "}
                  и{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-electric hover:text-aqua transition-colors underline underline-offset-2">
                    политикой конфиденциальности
                  </a>
                </span>
              </label>
            )}

            <button
              onClick={() => canSubmit && navigate("/dashboard")}
              disabled={!canSubmit}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-electric to-aqua text-ink font-semibold hover:shadow-[0_0_30px_rgba(43,127,255,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {mode === "register" ? "Зарегистрироваться" : "Войти"}
              <Icon name="ArrowRight" size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}