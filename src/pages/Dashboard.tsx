import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Overview from "@/components/dashboard/Overview";
import BotsList from "@/components/dashboard/BotsList";
import Icon from "@/components/ui/icon";

const stubs: Record<string, { title: string; icon: string; text: string }> = {
  leads: { title: "Заявки", icon: "Inbox", text: "База собранных телефонов и email" },
  landings: { title: "Лендинги", icon: "LayoutTemplate", text: "Конструктор посадочных страниц" },
  integrations: { title: "Интеграции", icon: "Plug", text: "ВКонтакте, CRM и вебхуки" },
  analytics: { title: "Аналитика", icon: "BarChart3", text: "Воронки и статистика диалогов" },
  team: { title: "Команда", icon: "Users", text: "Участники и права доступа" },
  billing: { title: "Тарифы и биллинг", icon: "CreditCard", text: "Ваш план и история платежей" },
  settings: { title: "Настройки", icon: "Settings", text: "Профиль, API-ключи и безопасность" },
};

const Dashboard = () => {
  const [active, setActive] = useState("overview");
  const stub = stubs[active];

  return (
    <div className="min-h-screen bg-ink text-white grain-bg">
      <Sidebar active={active} onSelect={setActive} />
      <main className="pl-[68px]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          {active === "overview" ? (
            <Overview />
          ) : active === "bots" ? (
            <BotsList />
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-32">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                <Icon name={stub.icon} size={28} className="text-aqua" />
              </div>
              <h2 className="font-display text-3xl text-white mb-2">{stub.title}</h2>
              <p className="text-white/50 max-w-sm">{stub.text}</p>
              <span className="mt-6 text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                Раздел в разработке
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;