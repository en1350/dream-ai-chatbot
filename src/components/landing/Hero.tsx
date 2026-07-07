import Icon from "@/components/ui/icon";

const chat = [
  { from: "user", text: "Привет! Хочу записаться" },
  { from: "bot", text: "Здравствуйте 👋 На какую услугу вас записать?" },
  { from: "user", text: "Стрижка на завтра" },
  { from: "bot", text: "Отлично! Оставьте телефон, и я закреплю время ✂️" },
];

export default function Hero() {
  return (
    <section className="relative pt-36 pb-24 overflow-hidden grain-bg">
      <div className="absolute inset-0 grid-overlay opacity-60" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full bg-electric/20 blur-[130px] animate-glow" />
      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/70 text-xs mb-6 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-aqua animate-blink" />
              Официальная интеграция с ВКонтакте
            </div>
            <h1
              className="font-display text-5xl md:text-6xl leading-[1.05] text-white mb-6 animate-fade-up"
              style={{ animationDelay: "0.05s" }}
            >
              ЧАТ-БОТЫ ДЛЯ ВК,<br />
              КОТОРЫЕ <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric to-aqua">ПРОДАЮТ</span>
            </h1>
            <p
              className="text-lg text-white/60 max-w-md mb-8 animate-fade-up"
              style={{ animationDelay: "0.12s" }}
            >
              Собирайте ботов без кода, автоматизируйте сбор заявок и запускайте лендинги — всё в одном личном кабинете.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <a
                href="#auth"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-electric to-aqua text-ink font-semibold hover:shadow-[0_0_40px_rgba(43,127,255,0.5)] transition-all"
              >
                Создать бота
                <Icon name="ArrowRight" size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#how"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/15 text-white hover:bg-white/5 transition-colors"
              >
                <Icon name="Play" size={16} />
                Как это работает
              </a>
            </div>
            <div className="flex gap-8 mt-12 animate-fade-up" style={{ animationDelay: "0.28s" }}>
              {[
                ["12 000+", "ботов создано"],
                ["3 млн", "заявок собрано"],
                ["5 мин", "до запуска"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-2xl text-white">{n}</div>
                  <div className="text-xs text-white/50">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "0.35s" }}>
            <div className="absolute -inset-6 bg-gradient-to-br from-electric/30 to-aqua/20 blur-3xl rounded-[40px]" />
            <div className="relative rounded-3xl border border-white/10 bg-ink2/80 backdrop-blur-xl p-5 shadow-2xl animate-float">
              <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric to-aqua flex items-center justify-center">
                  <Icon name="Bot" size={16} className="text-ink" />
                </div>
                <div>
                  <div className="text-sm text-white font-medium">Салон «Локон»</div>
                  <div className="text-[11px] text-aqua flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-aqua" /> онлайн
                  </div>
                </div>
              </div>
              <div className="space-y-3 py-4">
                {chat.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
                    style={{ animationDelay: `${0.5 + i * 0.15}s` }}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 text-sm rounded-2xl ${
                        m.from === "user"
                          ? "bg-electric text-white rounded-br-sm"
                          : "bg-white/8 text-white/90 rounded-bl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <div className="flex-1 h-10 rounded-full bg-white/5 border border-white/10 flex items-center px-4 text-sm text-white/40">
                  Сообщение...
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric to-aqua flex items-center justify-center">
                  <Icon name="Send" size={16} className="text-ink" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
