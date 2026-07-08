import { NodeDef, NodeCategory } from "./types";

export const CATEGORY_META: Record<NodeCategory, { label: string; color: string; icon: string }> = {
  trigger: { label: "Триггеры", color: "#18E0C8", icon: "Zap" },
  message: { label: "Сообщения", color: "#2B7FFF", icon: "MessageSquare" },
  logic: { label: "Логика", color: "#F5A623", icon: "GitBranch" },
  data: { label: "Данные", color: "#B84FF0", icon: "Database" },
  ai: { label: "AI", color: "#FF5C8A", icon: "Sparkles" },
  integration: { label: "Интеграции", color: "#5CE1A8", icon: "Plug" },
};

export const NODE_DEFS: NodeDef[] = [
  { subtype: "start", category: "trigger", label: "Старт диалога", icon: "Play", defaultTitle: "Старт диалога", defaultText: "Пользователь впервые написал боту" },
  { subtype: "keyword", category: "trigger", label: "Ключевое слово", icon: "Hash", defaultTitle: "Ключевое слово", defaultText: "привет, начать" },
  { subtype: "button-trigger", category: "trigger", label: "Нажатие кнопки", icon: "MousePointerClick", defaultTitle: "Нажатие кнопки", defaultText: "Записаться" },
  { subtype: "webhook-in", category: "trigger", label: "Вебхук извне", icon: "Webhook", defaultTitle: "Вебхук извне", defaultText: "POST /trigger/lead" },

  { subtype: "text", category: "message", label: "Текст", icon: "Type", defaultTitle: "Сообщение", defaultText: "Здравствуйте! Чем можем помочь?" },
  { subtype: "image", category: "message", label: "Картинка", icon: "Image", defaultTitle: "Картинка", defaultText: "photo.jpg" },
  { subtype: "buttons", category: "message", label: "Кнопки ответа", icon: "ListChecks", defaultTitle: "Кнопки", defaultText: "Выберите вариант" },
  { subtype: "list", category: "message", label: "Список", icon: "List", defaultTitle: "Список", defaultText: "Выберите один из пунктов" },
  { subtype: "typing", category: "message", label: "Задержка «печатает»", icon: "Ellipsis", defaultTitle: "Печатает…", defaultText: "1.5 сек" },

  { subtype: "condition", category: "logic", label: "Условие", icon: "SplitSquareVertical", defaultTitle: "Условие", defaultText: "если текст содержит «цена»" },
  { subtype: "random", category: "logic", label: "Рандом A/B", icon: "Shuffle", defaultTitle: "A/B ветка", defaultText: "50 / 50" },
  { subtype: "delay", category: "logic", label: "Задержка", icon: "Clock", defaultTitle: "Задержка", defaultText: "через 10 минут" },

  { subtype: "save-var", category: "data", label: "Сохранить в переменную", icon: "Save", defaultTitle: "Спросить телефон", defaultText: "Оставьте номер телефона", fieldLabel: "Переменная", fieldPlaceholder: "$phone" },
  { subtype: "validate", category: "data", label: "Валидация", icon: "ShieldCheck", defaultTitle: "Проверка формата", defaultText: "email должен содержать @" },
  { subtype: "email-collect", category: "data", label: "Собрать email", icon: "Mail", defaultTitle: "Оставьте email", defaultText: "Укажите вашу почту, чтобы мы могли с вами связаться" },

  { subtype: "gpt", category: "ai", label: "GPT-ответ", icon: "Sparkles", defaultTitle: "AI-ответ", defaultText: "Отвечай дружелюбно, как консультант салона" },
  { subtype: "intent", category: "ai", label: "AI-классификатор", icon: "Brain", defaultTitle: "Определить намерение", defaultText: "запись / цена / жалоба" },

  { subtype: "crm", category: "integration", label: "Отправить в CRM", icon: "Building2", defaultTitle: "CRM", defaultText: "amoCRM: новая сделка" },
  { subtype: "webhook-out", category: "integration", label: "Webhook POST", icon: "Send", defaultTitle: "Webhook", defaultText: "https://api.example.com/lead" },
  { subtype: "telegram", category: "integration", label: "Уведомление в Telegram", icon: "Send", defaultTitle: "Telegram", defaultText: "Новый лид пришёл!" },
  { subtype: "operator", category: "integration", label: "Передать оператору", icon: "Headset", defaultTitle: "Оператор", defaultText: "Подключить живого менеджера" },
];

export const NODE_DEF_MAP = Object.fromEntries(NODE_DEFS.map((d) => [d.subtype, d]));