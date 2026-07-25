export interface Plan {
  id: "start" | "pro";
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "start",
    name: "Старт",
    price: "0 ₽",
    period: "навсегда",
    tagline: "Чтобы попробовать и запустить первого бота",
    features: [
      "1 чат-бот",
      "До 100 диалогов в месяц",
      "Конструктор сценариев",
      "Сбор заявок",
      "Базовая поддержка",
    ],
  },
  {
    id: "pro",
    name: "Профи",
    price: "990 ₽",
    period: "в месяц",
    tagline: "Для активных продаж и полной автоматизации",
    features: [
      "Неограниченно ботов",
      "Безлимит диалогов",
      "AI-ответы и сценарии",
      "Лендинги и интеграции",
      "Приоритетная поддержка",
    ],
    highlighted: true,
  },
];
