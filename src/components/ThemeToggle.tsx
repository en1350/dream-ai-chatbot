import Icon from "@/components/ui/icon";
import { useTheme } from "@/contexts/ThemeContext";

interface Props {
  className?: string;
}

export default function ThemeToggle({ className = "" }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
      aria-label="Переключить тему"
      className={`flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors ${className}`}
    >
      <Icon name={isDark ? "Sun" : "Moon"} size={17} />
    </button>
  );
}
