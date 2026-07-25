import { useState } from "react";
import Icon from "@/components/ui/icon";
import ContentModal from "./ContentModal";
import BotLogicInteractive from "./BotLogicInteractive";
import WisdomMinute from "./WisdomMinute";
import BotAcademy from "./BotAcademy";

export default function LearnBar() {
  const [modal, setModal] = useState<null | "learn" | "wisdom" | "academy">(null);

  return (
    <div className="border-b border-white/5 bg-ink/60 backdrop-blur-md">
      <div className="container mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setModal("learn")}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-electric/40 bg-electric/10 text-white text-sm font-medium hover:bg-electric/20 transition-colors"
        >
          <Icon name="GraduationCap" size={16} className="text-aqua" />
          Обучение «Логика ботов»
        </button>
        <button
          onClick={() => setModal("academy")}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-electric/40 bg-gradient-to-r from-electric/15 to-aqua/15 text-white text-sm font-medium hover:from-electric/25 hover:to-aqua/25 transition-colors"
        >
          <Icon name="Blocks" size={16} className="text-aqua" />
          Академия ботов
        </button>
        <button
          onClick={() => setModal("wisdom")}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-aqua/40 bg-aqua/10 text-white text-sm font-medium hover:bg-aqua/20 transition-colors"
        >
          <Icon name="Lightbulb" size={16} className="text-aqua" />
          Мудрая минутка
        </button>
      </div>

      <ContentModal open={modal === "learn"} onClose={() => setModal(null)}>
        <BotLogicInteractive embedded />
      </ContentModal>

      <ContentModal open={modal === "wisdom"} onClose={() => setModal(null)}>
        <WisdomMinute embedded />
      </ContentModal>

      <ContentModal open={modal === "academy"} onClose={() => setModal(null)} wide>
        <BotAcademy />
      </ContentModal>
    </div>
  );
}