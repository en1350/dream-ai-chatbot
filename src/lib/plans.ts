export type PlanId = "demo" | "standard" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  priceKopecks: number;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "demo",
    name: "Демо",
    price: "0 ₽",
    period: "7 дней бесплатно",
    priceKopecks: 0,
    tagline: "Чтобы попробовать и запустить первого бота",
    features: ["1 бот", "100 диалогов", "Сбор лидов", "Интеграция ВК", "Без карты"],
  },
  {
    id: "standard",
    name: "Стандарт",
    price: "390 ₽",
    period: "в месяц",
    priceKopecks: 39000,
    tagline: "Для стабильных продаж и AI-ответов",
    features: ["5 ботов", "500 диалогов", "AI-ответы", "Лендинги", "Интеграция ВК"],
    highlighted: true,
  },
  {
    id: "pro",
    name: "Профи",
    price: "990 ₽",
    period: "в месяц",
    priceKopecks: 99000,
    tagline: "Для активных продаж и полной автоматизации",
    features: ["Безлимит ботов", "Приоритетная поддержка", "Лендинги", "Интеграция ВК"],
  },
];