import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import func2url from "../../../backend/func2url.json";

const nav = [
  { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
  { id: "bots", label: "Мои боты", icon: "Bot" },
  { id: "leads", label: "Заявки", icon: "Inbox" },
  { id: "landings", label: "Лендинги", icon: "LayoutTemplate" },
  { id: "integrations", label: "Интеграции", icon: "Plug" },
  { id: "analytics", label: "Аналитика", icon: "BarChart3" },
];

const bottom = [
  { id: "team", label: "Команда", icon: "Users" },
  { id: "billing", label: "Тарифы", icon: "CreditCard" },
  { id: "settings", label: "Настройки", icon: "Settings" },
];

interface Props {
  active: string;
  onSelect: (id: string) => void;
}

export default function Sidebar({ active, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [planName, setPlanName] = useState("…");
  const nav2 = useNavigate();

  useEffect(() => {
    fetch(func2url["billing"])
      .then((res) => res.json())
      .then((data) => setPlanName(data.planName || "Старт"));
  }, []);

  const Item = ({ item }: { item: { id: string; label: string; icon: string } }) => (
    <button
      onClick={() => onSelect(item.id)}
      className={`flex items-center gap-3 w-full h-11 px-3.5 rounded-xl transition-colors ${
        active === item.id ? "bg-electric/15 text-white" : "text-white/55 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon name={item.icon} size={20} className={active === item.id ? "text-aqua" : ""} />
      <span className={`text-sm whitespace-nowrap transition-all ${open ? "opacity-100" : "opacity-0 w-0"}`}>
        {item.label}
      </span>
    </button>
  );

  return (
    <aside
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col bg-ink2/80 backdrop-blur-xl border-r border-white/8 py-5 px-2.5 transition-all duration-300 ${
        open ? "w-60" : "w-[68px]"
      }`}
    >
      <button onClick={() => nav2("/")} className="flex items-center gap-3 h-11 px-2 mb-6 shrink-0">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-electric to-aqua flex items-center justify-center">
          <Icon name="Bot" size={22} className="text-ink" />
        </div>
        <span className={`font-display text-xl tracking-wide text-white transition-all ${open ? "opacity-100" : "opacity-0 w-0"}`}>
          Каскад
        </span>
      </button>

      <nav className="flex flex-col gap-1">
        {nav.map((i) => <Item key={i.id} item={i} />)}
      </nav>

      <div className="my-4 h-px bg-white/8" />
      <nav className="flex flex-col gap-1">
        {bottom.map((i) => <Item key={i.id} item={i} />)}
        <button
          onClick={() => nav2("/help")}
          className="flex items-center gap-3 w-full h-11 px-3.5 rounded-xl text-white/55 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Icon name="HelpCircle" size={20} />
          <span className={`text-sm whitespace-nowrap transition-all ${open ? "opacity-100" : "opacity-0 w-0"}`}>
            Справка
          </span>
        </button>
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <button className="flex items-center gap-3 w-full h-11 px-3.5 rounded-xl bg-gradient-to-r from-electric/20 to-aqua/20 border border-white/10 text-white hover:border-electric/40 transition-colors">
          <Icon name="Sparkles" size={20} className="text-aqua shrink-0" />
          <span className={`text-sm whitespace-nowrap ${open ? "opacity-100" : "opacity-0 w-0"}`}>AI-ассистент</span>
        </button>
        <div className="flex items-center gap-3 h-11 px-2">
          <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-aqua to-electric flex items-center justify-center text-ink text-sm font-semibold">
            А
          </div>
          <div className={`transition-all ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
            <div className="text-sm text-white leading-tight whitespace-nowrap">Алексей</div>
            <div className="text-[11px] text-aqua whitespace-nowrap">{planName}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}