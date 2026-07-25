import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const links = [
  { label: "Возможности", href: "#features" },
  { label: "Как работает", href: "#how" },
  { label: "Тарифы", href: "#pricing" },
  { label: "Вопросы", href: "#faq" },
];

export default function Navbar() {
  const { user } = useAuth();
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-ink/70 border-b border-white/5">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <a href="#" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric to-aqua flex items-center justify-center">
            <Icon name="Bot" size={20} className="text-ink" />
          </div>
          <span className="font-display text-xl tracking-wide text-white">БотВПотоке</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link
              to="/account"
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-white text-ink hover:bg-aqua transition-colors"
            >
              <Icon name="User" size={16} />
              <span className="hidden sm:inline">{user.name}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block text-sm text-white/70 hover:text-white transition-colors">
                Войти
              </Link>
              <Link
                to="/login"
                className="text-sm font-medium px-5 py-2 rounded-full bg-white text-ink hover:bg-aqua transition-colors"
              >
                Начать бесплатно
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}