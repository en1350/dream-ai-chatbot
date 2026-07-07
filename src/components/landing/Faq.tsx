import { useState } from "react";
import Icon from "@/components/ui/icon";

const items = [
  {
    q: "Нужны ли навыки программирования?",
    a: "Нет. Весь конструктор визуальный — добавляйте блоки, соединяйте их стрелками и настраивайте тексты. Код не нужен.",
  },
  {
    q: "Как подключить сообщество ВКонтакте?",
    a: "В личном кабинете вставьте Access Token группы и её ID. Callback API и Webhook настраиваются автоматически — бот сразу начнёт отвечать.",
  },
  {
    q: "Где хранятся собранные заявки?",
    a: "Все лиды падают в раздел «Заявки» вашего кабинета: телефон, имя, дата. Можно выгрузить в таблицу или подключить уведомления.",
  },
  {
    q: "Можно ли протестировать бота до запуска?",
    a: "Да. В конструкторе есть встроенный тест-чат — пишите боту как обычный пользователь и сразу проверяйте сценарий.",
  },
  {
    q: "Что входит в бесплатный тариф?",
    a: "1 бот, до 100 диалогов в месяц, сбор лидов и базовый конструктор. Этого достаточно, чтобы запуститься и оценить платформу.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-28 relative grain-bg">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <div className="text-aqua text-sm font-medium tracking-widest uppercase mb-3">Вопросы</div>
          <h2 className="font-display text-4xl md:text-5xl text-white leading-tight">Частые вопросы</h2>
        </div>
        <div className="max-w-3xl space-y-3">
          {items.map((item, i) => (
            <div
              key={item.q}
              className="rounded-2xl border border-white/8 bg-ink2/50 overflow-hidden cursor-pointer hover:border-white/20 transition-colors"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="flex items-center justify-between p-6">
                <span className="text-white font-medium pr-4">{item.q}</span>
                <div
                  className={`w-8 h-8 shrink-0 rounded-full bg-white/5 flex items-center justify-center transition-transform ${
                    open === i ? "rotate-45 bg-electric" : ""
                  }`}
                >
                  <Icon name="Plus" size={16} className="text-white" />
                </div>
              </div>
              <div
                className="grid transition-all duration-300 px-6"
                style={{ gridTemplateRows: open === i ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="text-sm text-white/55 leading-relaxed pb-6">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
