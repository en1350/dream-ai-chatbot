import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-ink2 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-electric/60 focus:ring-2 focus:ring-electric/20 transition disabled:opacity-60";

const btnCls =
  "px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric to-aqua text-white text-sm font-semibold hover:shadow-[0_6px_20px_rgba(43,127,255,0.4)] disabled:opacity-50 transition-all";

function Card({ icon, title, text, children }: { icon: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-ink2/60 p-6 md:p-7">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-electric/15 flex items-center justify-center shrink-0">
          <Icon name={icon} size={20} className="text-aqua" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <p className="text-white/50 text-sm">{text}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ErrorLine({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
      <Icon name="TriangleAlert" size={16} /> {text}
    </div>
  );
}

export default function Profile() {
  const { user, updateName, changePassword, resendVerification, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");

  const [resendBusy, setResendBusy] = useState(false);

  if (!user) return null;

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameError("Имя должно быть не короче 2 символов");
      return;
    }
    setNameBusy(true);
    try {
      await updateName(trimmed);
      toast.success("Имя сохранено");
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setNameBusy(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPassword.length < 6) {
      setPwError("Новый пароль должен быть не короче 6 символов");
      return;
    }
    if (newPassword !== confirm) {
      setPwError("Пароли не совпадают");
      return;
    }
    if (newPassword === currentPassword) {
      setPwError("Новый пароль совпадает с текущим");
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      toast.success("Пароль изменён. На других устройствах нужно будет войти заново.");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Не удалось сменить пароль");
    } finally {
      setPwBusy(false);
    }
  };

  const resend = async () => {
    setResendBusy(true);
    try {
      await resendVerification();
      toast.success("Письмо отправлено. Проверьте почту и папку «Спам».");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось отправить письмо");
    } finally {
      setResendBusy(false);
    }
  };

  const pwType = showPw ? "text" : "password";

  return (
    <div className="min-h-screen bg-ink text-white grain-bg">
      <header className="sticky top-0 z-30 h-16 border-b border-white/8 bg-ink/70 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto h-full flex items-center gap-4 px-6">
          <Link to="/cabinet" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={17} /> В кабинет
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {user.isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
              >
                <Icon name="ShieldCheck" size={15} className="text-aqua" /> Админка
              </Link>
            )}
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Icon name="LogOut" size={15} /> Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-aqua to-electric flex items-center justify-center text-ink text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-3xl text-white">Мой профиль</h1>
            <p className="text-white/50 text-sm truncate">{user.email}</p>
          </div>
        </div>

        <Card icon="User" title="Личные данные" text="Так к вам будем обращаться в кабинете и в письмах">
          <form onSubmit={saveName} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Имя</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} maxLength={100} />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Email</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input value={user.email} disabled className={inputCls} />
                {user.emailVerified === false ? (
                  <span className="shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-amber-400/15 text-amber-300">
                    <Icon name="MailWarning" size={14} /> Не подтверждён
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-aqua/15 text-aqua">
                    <Icon name="CircleCheck" size={14} /> Подтверждён
                  </span>
                )}
              </div>
              {user.emailVerified === false && (
                <button
                  type="button"
                  onClick={resend}
                  disabled={resendBusy}
                  className="mt-2 text-xs text-aqua hover:underline disabled:opacity-50"
                >
                  {resendBusy ? "Отправляем..." : "Отправить письмо для подтверждения ещё раз"}
                </button>
              )}
            </div>
            <ErrorLine text={nameError} />
            <button type="submit" disabled={nameBusy || name.trim() === user.name} className={btnCls}>
              {nameBusy ? "Сохраняем..." : "Сохранить"}
            </button>
          </form>
        </Card>

        <Card icon="KeyRound" title="Смена пароля" text="После смены пароля выйдем со всех других устройств">
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Текущий пароль</label>
              <input
                type={pwType}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputCls}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1.5">Новый пароль</label>
                <input
                  type={pwType}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputCls}
                  placeholder="Минимум 6 символов"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1.5">Повторите новый пароль</label>
                <input
                  type={pwType}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputCls}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer select-none w-fit">
              <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} className="accent-electric" />
              Показать пароли
            </label>
            <ErrorLine text={pwError} />
            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" disabled={pwBusy} className={btnCls}>
                {pwBusy ? "Сохраняем..." : "Сменить пароль"}
              </button>
              <Link to="/forgot-password" className="text-xs text-white/50 hover:text-aqua transition-colors">
                Не помню текущий пароль
              </Link>
            </div>
          </form>
        </Card>

        <Card icon="CreditCard" title="Тариф и аккаунт" text="Оплата, баланс и удаление аккаунта">
          <Link to="/account" className="inline-flex items-center gap-2 text-sm text-aqua hover:underline">
            Перейти к тарифу и настройкам аккаунта <Icon name="ArrowRight" size={15} />
          </Link>
        </Card>
      </main>
    </div>
  );
}
