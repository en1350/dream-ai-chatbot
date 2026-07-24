import { useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ContentModal({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 sm:p-8 animate-fade-up"
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl my-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute -top-2 right-0 sm:-top-3 sm:-right-3 z-10 w-10 h-10 rounded-full bg-white text-ink flex items-center justify-center shadow-lg hover:bg-aqua transition-colors"
        >
          <Icon name="X" size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
