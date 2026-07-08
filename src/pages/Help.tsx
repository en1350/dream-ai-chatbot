import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const nodeGroups = [
  {
    label: "Триггеры",
    color: "#18E0C8",
    icon: "Zap",
    items: [
      { title: "Старт диалога", text: "Срабатывает, когда пользователь впервые написал боту" },
      { title: "Ключевое слово", text: "Запускает ветку по словам в сообщении, например «привет, начать»" },
      { title: "Нажатие кнопки", text: "Срабатывает при клике на кнопку из предыдущего шага" },
      { title: "Вебхук извне", text: "Запускает сценарий по внешнему запросу к вашему боту" },
    ],
  },
  {
    label: "Сообщения",
    color: "#2B7FFF",
    icon: "MessageSquare",
    items: [
      { title: "Текст", text: "Обычное текстовое сообщение от бота" },
      { title: "Картинка", text: "Отправляет изображение" },
      { title: "Кнопки ответа", text: "Показывает варианты, на которые пользователь может нажать" },
      { title: "Список", text: "Нумерованный список пунктов — у каждого пункта своя точка соединения снизу, диалог ведёт по выбранной ветке" },
      { title: "Задержка «печатает»", text: "Имитирует набор текста перед ответом" },
    ],
  },
  {
    label: "Логика",
    color: "#F5A623",
    icon: "GitBranch",
    items: [
      { title: "Условие", text: "Разветвляет диалог в зависимости от текста или переменной" },
      { title: "Рандом A/B", text: "Случайно выбирает одну из веток, например для A/B-теста" },
      { title: "Задержка", text: "Ставит паузу перед следующим шагом сценария" },
    ],
  },
  {
    label: "Данные",
    color: "#B84FF0",
    icon: "Database",
    items: [
      { title: "Сохранить в переменную", text: "Спрашивает у пользователя данные (например телефон) и сохраняет их в переменную вида $phone" },
      { title: "Валидация", text: "Проверяет формат введённых данных, например наличие «@» в email" },
      { title: "Собрать email", text: "Бот попросит email прямо в диалоге, проверит формат и сохранит заявку в раздел «Заявки»" },
    ],
  },
  {
    label: "AI",
    color: "#FF5C8A",
    icon: "Sparkles",
    items: [
      { title: "GPT-ответ", text: "Отвечает пользователю через AI с заданным характером общения" },
      { title: "AI-классификатор", text: "Определяет намерение пользователя (например запись / цена / жалоба)" },
    ],
  },
  {
    label: "Интеграции",
    color: "#5CE1A8",
    icon: "Plug",
    items: [
      { title: "Отправить в CRM", text: "Передаёт заявку в подключённую CRM-систему" },
      { title: "Webhook POST", text: "Отправляет данные на внешний адрес по HTTP" },
      { title: "Уведомление в Telegram", text: "Присылает уведомление о новом лиде вам в Telegram" },
      { title: "Передать оператору", text: "Переключает диалог на живого менеджера" },
    ],
  },
];

const landingBlocks = [
  { icon: "Heading", title: "Заголовок и визуал", text: "Первый экран страницы: крупный заголовок, пояснение и кнопка призыва к действию" },
  { icon: "LayoutGrid", title: "Преимущества", text: "Сетка из карточек с иконкой, названием и описанием — для перечисления выгод" },
  { icon: "MousePointerClick", title: "Призыв к действию", text: "Акцентный блок с заголовком и кнопкой, обычно в конце страницы" },
  { icon: "MessageCircle", title: "ВКонтакте", text: "Кнопка, которая ведёт в сообщения подключённого сообщества ВКонтакте" },
  { icon: "Mail", title: "Форма — email", text: "Форма для сбора заявок: email обязателен, можно добавить поля «Имя» и «Телефон». Заявки попадают в раздел «Заявки» личного кабинета" },
];

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} className="pt-2">{children}</section>;
}

function StepCard({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric to-aqua flex items-center justify-center text-ink font-semibold text-sm shrink-0">
        {n}
      </div>
      <div>
        <h4 className="text-white font-medium mb-1">{title}</h4>
        <p className="text-white/55 text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

const Help = () => {
  const navigate = useNavigate();

  const toc = [
    { id: "bots", label: "Конструктор ботов" },
    { id: "nodes", label: "Виды блоков бота" },
    { id: "landings", label: "Конструктор лендингов" },
    { id: "leads", label: "Заявки" },
    { id: "vk", label: "Интеграция с ВКонтакте" },
  ];

  return (
    <div className="min-h-screen bg-ink text-white grain-bg">
      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-8"
        >
          <Icon name="ChevronLeft" size={16} /> В кабинет
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-electric to-aqua flex items-center justify-center">
            <Icon name="BookOpen" size={20} className="text-ink" />
          </div>
          <h1 className="font-display text-3xl text-white">Инструкция по конструкторам</h1>
        </div>
        <p className="text-white/50 mb-10 max-w-xl">
          Как собрать сценарий чат-бота и посадочную страницу, подключить ВКонтакте и получать заявки — без кода, за несколько минут.
        </p>

        {/* TOC */}
        <div className="flex flex-wrap gap-2 mb-14">
          {toc.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:border-electric/40 transition-colors"
            >
              {t.label}
            </a>
          ))}
        </div>

        {/* Конструктор ботов */}
        <Section id="bots">
          <div className="flex items-center gap-2.5 mb-6">
            <Icon name="Bot" size={20} className="text-aqua" />
            <h2 className="font-display text-2xl text-white">Конструктор ботов</h2>
          </div>
          <div className="space-y-6 mb-6">
            <StepCard n={1} title="Создайте бота" text="В разделе «Мои боты» нажмите «Новый бот» — откроется пустой холст конструктора." />
            <StepCard n={2} title="Добавьте блоки" text="Слева — палитра блоков. Нажмите на нужный блок, чтобы он появился на холсте, или перетащите его." />
            <StepCard n={3} title="Соедините блоки стрелками" text="Потяните от нижней точки блока к следующему. Если у блока есть кнопки — у каждой кнопки своя точка снизу: соедините её с нужной веткой, и бот поведёт диалог по разным сценариям в зависимости от выбора пользователя." />
            <StepCard n={4} title="Настройте содержимое" text="Кликните на блок — справа откроется панель настройки: текст, кнопки, переменные." />
            <StepCard n={5} title="Проверьте в тестовом чате" text="Кнопка «Тест» в верхней панели открывает окно предпросмотра — проверьте, как бот отвечает." />
            <StepCard n={6} title="Опубликуйте" text="Когда сценарий готов, нажмите «Опубликовать» — бот начнёт отвечать реальным пользователям." />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3">
            <Icon name="Sparkles" size={18} className="text-aqua shrink-0 mt-0.5" />
            <p className="text-sm text-white/60 leading-relaxed">
              Не хочется собирать сценарий вручную? Нажмите кнопку с ИИ в конструкторе, опишите задачу в одном предложении
              («Бот для записи в барбершоп: спроси услугу, дату и телефон») — сценарий соберётся автоматически.
            </p>
          </div>
        </Section>

        <div className="border-t border-white/8 my-14" />

        {/* Виды блоков */}
        <Section id="nodes">
          <div className="flex items-center gap-2.5 mb-6">
            <Icon name="Blocks" size={20} className="text-aqua" />
            <h2 className="font-display text-2xl text-white">Виды блоков бота</h2>
          </div>
          <div className="space-y-8">
            {nodeGroups.map((g) => (
              <div key={g.label}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${g.color}22` }}>
                    <Icon name={g.icon} size={13} style={{ color: g.color }} />
                  </div>
                  <h3 className="text-white font-semibold text-sm">{g.label}</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {g.items.map((it) => (
                    <div key={it.title} className="rounded-xl border border-white/8 bg-ink2/40 p-3.5">
                      <div className="text-white text-sm font-medium mb-1">{it.title}</div>
                      <p className="text-white/50 text-xs leading-relaxed">{it.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="border-t border-white/8 my-14" />

        {/* Конструктор лендингов */}
        <Section id="landings">
          <div className="flex items-center gap-2.5 mb-6">
            <Icon name="LayoutTemplate" size={20} className="text-aqua" />
            <h2 className="font-display text-2xl text-white">Конструктор лендингов</h2>
          </div>
          <div className="space-y-6 mb-8">
            <StepCard n={1} title="Создайте лендинг" text="В разделе «Лендинги» нажмите «Новый лендинг»." />
            <StepCard n={2} title="Собирайте страницу из блоков" text="Слева палитра блоков — нажмите на нужный, чтобы добавить его в конец страницы." />
            <StepCard n={3} title="Настройте каждый блок" text="Кликните по блоку на странице — справа откроется панель с заголовком, текстом и кнопкой." />
            <StepCard n={4} title="Задайте адрес и оформление" text="Если справа нет выбранного блока — там настройки страницы: ссылка (slug) и цвета." />
            <StepCard n={5} title="Опубликуйте" text="Нажмите «Опубликовать» — страница станет доступна по ссылке вида /l/ваш-адрес." />
          </div>

          <h3 className="text-white font-semibold text-sm mb-3">Доступные блоки</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {landingBlocks.map((b) => (
              <div key={b.title} className="rounded-xl border border-white/8 bg-ink2/40 p-3.5 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-electric/15 flex items-center justify-center shrink-0">
                  <Icon name={b.icon} size={15} className="text-aqua" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium mb-1">{b.title}</div>
                  <p className="text-white/50 text-xs leading-relaxed">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="border-t border-white/8 my-14" />

        {/* Заявки */}
        <Section id="leads">
          <div className="flex items-center gap-2.5 mb-6">
            <Icon name="Inbox" size={20} className="text-aqua" />
            <h2 className="font-display text-2xl text-white">Заявки</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-4 max-w-xl">
            Все email-адреса, собранные через блок «Форма — email» на лендингах, автоматически попадают в раздел
            «Заявки» личного кабинета. Там их можно посмотреть, удалить или выгрузить все сразу в CSV-файл
            для дальнейшей работы (например, для рассылки или переноса в CRM).
          </p>
        </Section>

        <div className="border-t border-white/8 my-14" />

        {/* VK */}
        <Section id="vk">
          <div className="flex items-center gap-2.5 mb-6">
            <Icon name="MessageCircle" size={20} className="text-aqua" />
            <h2 className="font-display text-2xl text-white">Интеграция с ВКонтакте</h2>
          </div>
          <div className="space-y-6">
            <StepCard n={1} title="Откройте раздел «Интеграции»" text="В личном кабинете найдите карточку вашего бота." />
            <StepCard n={2} title="Нажмите «Подключить ВК»" text="Укажите ID сообщества и ключ доступа (токен) — их можно найти в настройках сообщества: Управление → Работа с API → Ключи доступа." />
            <StepCard n={3} title="Готово" text="После подключения бот начнёт отвечать на сообщения сообщества, а кнопка «ВКонтакте» на лендинге заработает." />
          </div>
        </Section>

        <div className="border-t border-white/8 mt-14 pt-8 text-center">
          <p className="text-white/40 text-sm mb-3">Остались вопросы?</p>
          <a
            href="mailto:bot-flow@bot-flow.ru"
            className="inline-flex items-center gap-2 text-aqua hover:underline text-sm"
          >
            <Icon name="Mail" size={15} /> bot-flow@bot-flow.ru
          </a>
        </div>
      </div>
    </div>
  );
};

export default Help;