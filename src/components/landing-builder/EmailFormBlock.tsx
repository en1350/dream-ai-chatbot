import { useState } from "react";
import Icon from "@/components/ui/icon";
import { LandingBlock, LandingTheme } from "./types";
import func2url from "../../../backend/func2url.json";

interface Props {
  block: LandingBlock;
  theme: LandingTheme;
  editable?: boolean;
  slug?: string;
}

export default function EmailFormBlock({ block, theme, editable, slug }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const fields = block.formFields || [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editable) return;
    if (!email.trim()) {
      setError("Введите email");
      return;
    }
    setStatus("sending");
    setError("");
    fetch(func2url["leads-public"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, email: email.trim(), name: name.trim(), phone: phone.trim() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus("error");
          setError(data.error);
          return;
        }
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
        setError("Не удалось отправить заявку");
      });
  };

  return (
    <section className="py-16 px-6">
      <div className="max-w-md mx-auto text-center rounded-3xl border border-white/10 bg-ink2/50 p-8">
        <div
          className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5"
          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}
        >
          <Icon name="Mail" size={26} className="text-ink" />
        </div>
        <h2 className="font-display text-2xl mb-2">{block.title || "Оставьте заявку"}</h2>
        {block.subtitle && <p className="text-white/50 mb-6">{block.subtitle}</p>}

        {status === "success" ? (
          <div className="flex items-center justify-center gap-2 text-aqua text-sm py-3">
            <Icon name="CheckCircle2" size={18} />
            {block.successText || "Спасибо! Заявка отправлена."}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 text-left">
            {fields.includes("name") && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
            />
            {fields.includes("phone") && (
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Телефон"
                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
              />
            )}

            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1.5">
                <Icon name="TriangleAlert" size={13} /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              onClick={(e) => editable && e.preventDefault()}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-ink transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})` }}
            >
              {status === "sending" ? (
                <Icon name="Loader2" size={17} className="animate-spin" />
              ) : (
                <Icon name="Send" size={17} />
              )}
              {block.ctaText || "Отправить"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
