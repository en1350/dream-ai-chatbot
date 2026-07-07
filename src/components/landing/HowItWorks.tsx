import Icon from "@/components/ui/icon";

const steps = [
  { n: "01", icon: "UserPlus", title: "Зарегистрируйтесь", text: "Создайте аккаунт и войдите в личный кабинет за 30 секунд." },
  { n: "02", icon: "Workflow", title: "Соберите сценарий", text: "Добавьте блоки в конструкторе: приветствие, вопросы, кнопки, AI-ответы." },
  { n: "03", icon: "Link", title: "Подключите ВК", text: "Вставьте токен сообщества — бот сразу начнёт отвечать пользователям." },
  { n: "04", icon: "TrendingUp", title: "Собирайте заявки", text: "Лиды падают в базу кабинета, а вы масштабируете продажи." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-28 relative grain-bg">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <div className="text-aqua text-sm font-medium tracking-widest uppercase mb-3">Как работает</div>
          <h2 className="font-display text-4xl md:text-5xl text-white leading-tight">
            От идеи до бота — четыре шага
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="rounded-2xl border border-white/8 bg-ink2/50 p-7 h-full">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-display text-4xl text-white/10">{s.n}</span>
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon name={s.icon} size={20} className="text-aqua" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{s.text}</p>
              </div>
              {i < steps.length - 1 && (
                <Icon
                  name="ChevronRight"
                  size={22}
                  className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 text-white/20"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
