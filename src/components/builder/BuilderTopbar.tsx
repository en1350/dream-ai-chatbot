import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

interface Props {
  botName: string;
  onRename: (name: string) => void;
  previewOpen: boolean;
  onTogglePreview: () => void;
}

export default function BuilderTopbar({ botName, onRename, previewOpen, onTogglePreview }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(botName);
  const navigate = useNavigate();

  const commit = () => {
    setEditing(false);
    if (draft.trim()) onRename(draft.trim());
    else setDraft(botName);
  };

  return (
    <header className="h-14 shrink-0 border-b border-white/8 bg-ink2/70 backdrop-blur-xl flex items-center px-4 gap-3">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors shrink-0"
      >
        <Icon name="ChevronLeft" size={16} />
        Мои боты
      </button>
      <div className="w-px h-5 bg-white/10 shrink-0" />

      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-electric to-aqua flex items-center justify-center shrink-0">
          <Icon name="Bot" size={13} className="text-ink" />
        </div>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="bg-white/5 border border-electric/40 rounded-md px-2 h-7 text-sm text-white focus:outline-none"
          />
        ) : (
          <button onClick={() => { setEditing(true); setDraft(botName); }} className="text-sm text-white font-medium truncate hover:text-aqua transition-colors">
            {botName}
          </button>
        )}
      </div>

      <span className="flex items-center gap-1.5 text-xs text-aqua/80 bg-aqua/10 px-2.5 py-1 rounded-full shrink-0">
        <Icon name="Check" size={11} /> Сохранено
      </span>

      <div className="flex-1" />

      <button className="hidden sm:flex items-center gap-2 px-3.5 h-9 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
        <Icon name="Undo2" size={15} />
      </button>
      <button className="hidden sm:flex items-center gap-2 px-3.5 h-9 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
        <Icon name="Redo2" size={15} />
      </button>
      <div className="w-px h-5 bg-white/10 shrink-0" />

      <button
        onClick={onTogglePreview}
        className={`flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium transition-colors ${
          previewOpen ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
      >
        <Icon name="MessageCircle" size={15} />
        Тест
      </button>
      <button className="flex items-center gap-2 px-4 h-9 rounded-lg bg-gradient-to-r from-electric to-aqua text-ink text-sm font-semibold hover:shadow-[0_0_25px_rgba(43,127,255,0.4)] transition-all">
        <Icon name="Rocket" size={15} />
        Опубликовать
      </button>
    </header>
  );
}
