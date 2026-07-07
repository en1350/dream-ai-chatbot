import Icon from "@/components/ui/icon";

const features = [
  {
    icon: "MousePointerClick",
    title: "Визуальный конструктор",
    text: "Собирайте сценарии из блоков перетаскиванием. Кнопки, условия, ветвления — без единой строки кода.",
  },
  {
    icon: "MessageCircle",
    title: "Интеграция с ВКонтакте",
    text: "Подключение сообщества за 2 минуты. Callback API настраивается автоматически.",
  },
  {
    icon: "Users",
    title: "Сбор лидов",
    text: "Бот собирает телефоны и email в базу. Выгружайте заявки и подключайте уведомления.",
  },
  {
    icon: "LayoutTemplate",
    title: "Конструктор лендингов",
    text: "Собирайте посадочные страницы из готовых блоков и связывайте их с ботом.",
  },
  {
    icon: "Sparkles",
    title: "AI-ответы на GPT",
    text: "Добавьте узел AI — и бот будет отвечать живым языком по вашему промпту.",
  },
  {
    icon: "BarChart3",
    title: "Аналитика диалогов",
    text: "Смотрите, где пользователи уходят, и улучшайте сценарий на данных.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-28 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <div className="text-aqua text-sm font-medium tracking-widest uppercase mb-3">Возможности</div>
          <h2 className="font-display text-4xl md:text-5xl text-white leading-tight">
            Всё для автоматизации продаж в ВК
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-white/8 bg-ink2/50 p-7 hover:border-electric/40 hover:bg-ink2 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric/20 to-aqua/20 border border-white/10 flex items-center justify-center mb-5 group-hover:from-electric group-hover:to-aqua transition-all">
                <Icon name={f.icon} size={22} className="text-aqua group-hover:text-ink transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
