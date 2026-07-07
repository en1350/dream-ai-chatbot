export interface LandingBlock {
  type: "hero" | "features" | "cta" | "vk" | "email-form";
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  image?: string;
  features?: { icon: string; title: string; text: string }[];
  vkGroupUrl?: string;
  formFields?: ("name" | "phone")[];
  successText?: string;
}

export interface LandingTheme {
  primaryColor: string;
  accentColor: string;
}

export interface Landing {
  id: number;
  name: string;
  slug: string;
  blocks: LandingBlock[];
  theme: LandingTheme;
  published: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  botId: number | null;
  bots?: { id: number; name: string }[];
}

export const DEFAULT_THEME: LandingTheme = {
  primaryColor: "#2B7FFF",
  accentColor: "#18E0C8",
};

export const emptyBlocks = (): LandingBlock[] => [
  {
    type: "hero",
    title: "Заголовок вашего предложения",
    subtitle: "Короткое пояснение, почему стоит оставить заявку прямо сейчас",
    ctaText: "Оставить заявку",
    ctaLink: "#cta",
    image: "",
  },
  {
    type: "features",
    features: [
      { icon: "Zap", title: "Быстро", text: "Заявка обрабатывается мгновенно" },
      { icon: "ShieldCheck", title: "Надёжно", text: "Все данные под защитой" },
      { icon: "Heart", title: "Удобно", text: "Общайтесь прямо в мессенджере" },
    ],
  },
  {
    type: "cta",
    title: "Готовы начать?",
    subtitle: "Оставьте заявку — и мы свяжемся с вами в течение 15 минут",
    ctaText: "Оставить заявку",
    ctaLink: "#cta",
  },
];