import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-ink text-white grain-bg">
      <div className="container mx-auto px-6 py-16 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-8"
        >
          <Icon name="ChevronLeft" size={16} /> Назад
        </button>

        <h1 className="font-display text-3xl text-white mb-2">Политика конфиденциальности</h1>
        <p className="text-white/40 text-sm mb-10">Последнее обновление: 7 июля 2026 г.</p>

        <div className="space-y-6 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold mb-2">1. Какие данные мы собираем</h2>
            <p>Имя, email и данные о ботах, которые вы создаёте: сценарии, сообщения и заявки, полученные от ваших клиентов.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">2. Как мы используем данные</h2>
            <p>Данные используются для предоставления функций сервиса: работы чат-ботов, аналитики, уведомлений и поддержки пользователей. Мы не продаём ваши данные третьим лицам.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">3. Хранение и защита</h2>
            <p>Данные хранятся на защищённых серверах. Доступ к ним имеют только уполномоченные сотрудники в рамках выполнения своих обязанностей.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">4. Передача третьим лицам</h2>
            <p>Данные могут передаваться интеграциям, которые вы сами подключаете (CRM, мессенджеры, вебхуки) — исключительно по вашему явному указанию.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">5. Ваши права</h2>
            <p>Вы можете запросить экспорт или удаление своих данных в любой момент через настройки аккаунта или обратившись в поддержку.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">6. Cookie</h2>
            <p>Мы используем cookie для авторизации и улучшения работы сервиса.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">7. Изменения политики</h2>
            <p>При существенных изменениях политики мы уведомим вас через интерфейс сервиса или по email.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">8. Контакты</h2>
            <p>По вопросам обработки персональных данных пишите на <a href="mailto:bot-flow@bot-flow.ru" className="text-aqua hover:underline">bot-flow@bot-flow.ru</a>.</p>
            <p className="mt-2 text-white/50">ИНН 110105729752</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;