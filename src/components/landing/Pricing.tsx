import Icon from "@/components/ui/icon";

const plans = [
  {
    name: "Старт",
    price: "0 ₽",
    period: "навсегда",
    features: ["1 бот", "100 диалогов в месяц", "Сбор лидов", "Базовый конструктор"],
    accent: false,
  },
  {
    name: "Бизнес",
    price: "990 ₽",
    period: "в месяц",
    features: ["5 ботов", "Безлимит диалогов", "AI-ответы GPT", "Лендинги", "Выгрузка лидов", "Аналитика"],
    accent: true,
  },
  {
    name: "Агентство",
    price: "3 490 ₽",
    period: "в месяц",
    features: ["Безлимит ботов", "Все функции Бизнес", "White-label", "Приоритетная поддержка", "API-доступ"],
    accent: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <div className="text-aqua text-sm font-medium tracking-widest uppercase mb-3">Тарифы</div>
          <h2 className="font-display text-4xl md:text-5xl text-white leading-tight">
            Начните бесплатно, растите вместе с нами
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-8 border transition-all ${
                p.accent
                  ? "border-electric/50 bg-gradient-to-b from-electric/15 to-ink2 shadow-[0_0_60px_rgba(43,127,255,0.2)]"
                  : "border-white/8 bg-ink2/50 hover:border-white/20"
              }`}
            >
              {p.accent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-electric to-aqua text-ink text-xs font-semibold">
                  Популярный
                </div>
              )}
              <div className="text-white/70 font-medium mb-4">{p.name}</div>
              <div className="flex items-end gap-2 mb-6">
                <span className="font-display text-4xl text-white">{p.price}</span>
                <span className="text-white/40 text-sm mb-1">{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                    <Icon name="Check" size={16} className="text-aqua shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#auth"
                className={`block text-center py-3 rounded-full font-medium transition-all ${
                  p.accent
                    ? "bg-gradient-to-r from-electric to-aqua text-ink hover:shadow-[0_0_30px_rgba(43,127,255,0.5)]"
                    : "border border-white/15 text-white hover:bg-white/5"
                }`}
              >
                Выбрать тариф
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
