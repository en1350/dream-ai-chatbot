import Icon from "@/components/ui/icon";
import { LandingBlock } from "./types";

interface Props {
  onAddBlock: (block: LandingBlock) => void;
}

const PRESETS: { icon: string; label: string; block: LandingBlock }[] = [
  {
    icon: "Heading",
    label: "Заголовок и визуал",
    block: {
      type: "hero",
      title: "Заголовок вашего предложения",
      subtitle: "Короткое пояснение выгоды для клиента",
      ctaText: "Оставить заявку",
      ctaLink: "#cta",
      image: "",
    },
  },
  {
    icon: "LayoutGrid",
    label: "Преимущества",
    block: {
      type: "features",
      features: [
        { icon: "Zap", title: "Быстро", text: "Заявка обрабатывается мгновенно" },
        { icon: "ShieldCheck", title: "Надёжно", text: "Все данные под защитой" },
        { icon: "Heart", title: "Удобно", text: "Общайтесь прямо в мессенджере" },
      ],
    },
  },
  {
    icon: "MousePointerClick",
    label: "Призыв к действию",
    block: {
      type: "cta",
      title: "Готовы начать?",
      subtitle: "Оставьте заявку — и мы свяжемся с вами в течение 15 минут",
      ctaText: "Оставить заявку",
      ctaLink: "#cta",
    },
  },
  {
    icon: "MessageCircle",
    label: "ВКонтакте",
    block: {
      type: "vk",
      title: "Напишите нам ВКонтакте",
      subtitle: "Ответит бот, а по сложным вопросам подключится менеджер",
    },
  },
  {
    icon: "Mail",
    label: "Форма — email",
    block: {
      type: "email-form",
      title: "Оставьте заявку",
      subtitle: "Укажите email — мы свяжемся с вами в ближайшее время",
      ctaText: "Отправить",
      formFields: [],
      successText: "Спасибо! Заявка отправлена.",
    },
  },
];

export default function BlockPalette({ onAddBlock }: Props) {
  return (
    <aside className="w-72 shrink-0 h-full border-r border-white/8 bg-ink2/60 backdrop-blur-xl flex flex-col">
      <div className="p-4 border-b border-white/8">
        <h3 className="text-sm text-white font-medium">Блоки лендинга</h3>
        <p className="text-xs text-white/40 mt-1">Нажмите, чтобы добавить блок</p>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onAddBlock(p.block)}
            className="group flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-lg text-left hover:bg-white/6 transition-colors"
          >
            <div className="w-8 h-8 shrink-0 rounded-md bg-electric/15 flex items-center justify-center border border-white/10">
              <Icon name={p.icon} size={15} className="text-aqua" />
            </div>
            <span className="text-sm text-white/75 group-hover:text-white transition-colors">{p.label}</span>
            <Icon name="Plus" size={13} className="ml-auto text-white/0 group-hover:text-white/40 transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </aside>
  );
}