import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SaveStatus = "saved" | "saving" | "error";

interface Props {
  name: string;
  onRename: (name: string) => void;
  slug: string;
  published: boolean;
  onTogglePublish: () => void;
  saveStatus: SaveStatus;
  onClear?: () => void;
  onSaveNow?: () => void;
}

export default function LandingTopbar({ name, onRename, slug, published, onTogglePublish, saveStatus, onClear, onSaveNow }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const navigate = useNavigate();

  const commit = () => {
    setEditing(false);
    if (draft.trim()) onRename(draft.trim());
    else setDraft(name);
  };

  const publicUrl = `${window.location.origin}/l/${slug}`;

  return (
    <header className="h-14 shrink-0 border-b border-white/8 bg-ink2/70 backdrop-blur-xl flex items-center px-4 gap-3">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors shrink-0"
      >
        <Icon name="ChevronLeft" size={16} />
        Лендинги
      </button>
      <div className="w-px h-5 bg-white/10 shrink-0" />

      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-electric to-aqua flex items-center justify-center shrink-0">
          <Icon name="LayoutTemplate" size={13} className="text-ink" />
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
          <button onClick={() => { setEditing(true); setDraft(name); }} className="text-sm text-white font-medium truncate hover:text-aqua transition-colors">
            {name}
          </button>
        )}
      </div>

      {saveStatus === "saving" && (
        <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-full shrink-0">
          <Icon name="Loader2" size={11} className="animate-spin" /> Сохраняю…
        </span>
      )}
      {saveStatus === "saved" && (
        <span className="flex items-center gap-1.5 text-xs text-aqua/80 bg-aqua/10 px-2.5 py-1 rounded-full shrink-0">
          <Icon name="Check" size={11} /> Сохранено
        </span>
      )}
      {saveStatus === "error" && (
        <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full shrink-0">
          <Icon name="TriangleAlert" size={11} /> Ошибка сохранения
        </span>
      )}

      <div className="flex-1" />

      {published && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors truncate max-w-[220px]"
        >
          <Icon name="ExternalLink" size={13} className="shrink-0" />
          <span className="truncate">/l/{slug}</span>
        </a>
      )}

      {onClear && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-2 px-3.5 h-9 rounded-lg text-sm text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Icon name="Eraser" size={15} />
              <span className="hidden sm:inline">Очистить поле</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-ink2 border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Очистить лендинг?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                Все блоки будут удалены со страницы. Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction onClick={onClear} className="bg-red-500 text-white hover:bg-red-600">
                Очистить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {onSaveNow && (
        <button
          onClick={onSaveNow}
          className="flex items-center gap-2 px-3.5 h-9 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Icon name="Save" size={15} />
          <span className="hidden sm:inline">Сохранить</span>
        </button>
      )}

      <div className="w-px h-5 bg-white/10 shrink-0" />

      <button
        onClick={onTogglePublish}
        className={`flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-semibold transition-all ${
          published
            ? "bg-white/10 text-white hover:bg-white/15"
            : "bg-gradient-to-r from-electric to-aqua text-ink hover:shadow-[0_0_25px_rgba(43,127,255,0.4)]"
        }`}
      >
        <Icon name={published ? "EyeOff" : "Rocket"} size={15} />
        {published ? "Снять с публикации" : "Опубликовать"}
      </button>
    </header>
  );
}
