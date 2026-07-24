import { useState } from "react";
import Icon from "@/components/ui/icon";

const QUOTES = [
  "Логика построит мост от проблемы к решению, но именно смелость заставляет по нему пройти.",
  "В бизнесе данные важнее мнений. Здравая логика не терпит догадок.",
  "Сложные проблемы решаются не силой, а правильной декомпозицией на простые шаги.",
  "Логика — это скелет любого проекта. Без неё даже самая красивая идея рухнет под собственным весом.",
  "Прежде чем искать виноватых, ищи ошибку в алгоритме своих действий.",
  "Эмоции заставляют человека принять решение, но именно логика помогает ему оправдать эту покупку перед самим собой.",
  "Лучший аргумент в любом споре — не громкий голос, а неопровержимая цепочка фактов.",
  "Автоматизируй хаос, прежде чем масштабировать порядок.",
  "Логика подсказывает, как сделать правильно. Интуиция подсказывает, что именно стоит сделать.",
  "Истинная логика продаж: мы продаём не продукт, а решение конкретной проблемы клиента.",
  "Продажа начинается не с презентации продукта, а с глубокого понимания «боли» клиента.",
  "Люди не покупают то, что ты делаешь. Они покупают то, почему ты это делаешь.",
  "Возражение клиента — это не отказ, а вежливый запрос на дополнительную информацию.",
  "Лучший продавец тот, кто выступает в роли эксперта и наставника, а не давит.",
  "Не продавайте сухие характеристики, продавайте выгоды и будущую трансформацию.",
  "Доверие — это валюта, которая в долгосрочной перспективе ценится дороже любого разового чека.",
  "Если вы не можете объяснить ценность своего продукта за 30 секунд, вы не понимаете её сами.",
  "Продажа — это не конец сделки, а самое начало долгосрочных отношений.",
  "Слушай в два раза больше, чем говоришь. Природа дала нам два уха и один рот не просто так.",
  "«Нет» от клиента — это просто часть статистики на неизбежном пути к твоему следующему «Да».",
  "Бизнес — это не спринт, а марафон с препятствиями. Выигрывает тот, кто умеет грамотно восстанавливать ресурсы.",
  "Инновации отличают лидера рынка от вечного последователя.",
  "Не бойся здоровой конкуренции, бойся равнодушия своих собственных клиентов.",
  "Прибыль — это не главная цель, а естественный результат правильно выстроенной системы и довольных людей.",
  "Ошибка в бизнесе стоит денег, но отсутствие действий стоит тебе будущего.",
  "Масштабируй то, что уже работает, и безжалостно отсекай то, что лишь создаёт видимость бурной деятельности.",
  "Сильный бизнес строится на сильной корпоративной культуре, а не только на сильных продуктах.",
  "Твой главный актив — это не технологии и не капитал, а люди, которые умеют ими управлять и развивать их.",
  "Адаптируйся или проиграй. Рынок не прощает ностальгии по вчерашнему дню.",
  "Успех в бизнесе — это момент, когда твои утренние амбиции встречаются с вечерней дисциплиной.",
];

// Индекс дня: одинаковый для всех в течение суток, назавтра — следующая цитата.
function dayIndex(): number {
  const now = new Date();
  const dayNumber = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000
  );
  return dayNumber % QUOTES.length;
}

interface Props {
  // embedded — компонент показывается внутри модалки: без внешней секции-отступа
  // и сразу с цитатой дня (без кнопки-раскрытия).
  embedded?: boolean;
}

export default function WisdomMinute({ embedded = false }: Props) {
  const [revealed, setRevealed] = useState(embedded);
  const quote = QUOTES[dayIndex()];

  const card = (
    <div className="relative max-w-4xl mx-auto rounded-3xl border border-electric/20 bg-gradient-to-b from-electric/10 to-ink2/60 p-10 md:p-14 overflow-hidden">
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-aqua/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-electric/10 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        <div className="flex items-center gap-2 text-aqua text-sm font-medium tracking-widest uppercase mb-6">
          <Icon name="Sparkles" size={16} />
          Мудрая минутка
        </div>

        {!revealed ? (
          <>
            <h2 className="font-display text-3xl md:text-4xl text-white leading-tight mb-4">
              Мысль дня для вашего бизнеса
            </h2>
            <p className="text-white/55 max-w-lg mb-8">
              Каждый день — одна короткая мысль о логике, продажах и росте. Нажмите, чтобы открыть сегодняшнюю.
            </p>
            <button
              onClick={() => setRevealed(true)}
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-electric to-aqua text-ink font-semibold hover:shadow-[0_0_35px_rgba(43,127,255,0.45)] transition-all"
            >
              <Icon name="Lightbulb" size={19} />
              Мудрая минутка
              <Icon name="ArrowRight" size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </>
        ) : (
          <div className="animate-fade-up flex flex-col items-center">
            <Icon name="Quote" size={34} className="text-electric mb-5" />
            <blockquote className="font-display text-2xl md:text-3xl text-white leading-snug max-w-3xl mb-8">
              {quote}
            </blockquote>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Icon name="CalendarDays" size={15} />
              Мысль на сегодня
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return card;

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">{card}</div>
    </section>
  );
}