import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const Terms = () => {
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

        <h1 className="font-display text-3xl text-white mb-2">Условия использования</h1>
        <p className="text-white/40 text-sm mb-10">Последнее обновление: 7 июля 2026 г.</p>

        <div className="space-y-6 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold mb-2">1. Общие положения</h2>
            <p>Используя сервис BotVK, вы соглашаетесь с настоящими условиями. Если вы не согласны с каким-либо пунктом — пожалуйста, не используйте сервис.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">2. Учётная запись</h2>
            <p>Вы несёте ответственность за сохранность данных для входа и за все действия, совершённые под вашим аккаунтом.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">3. Использование сервиса</h2>
            <p>Сервис предназначен для создания и настройки чат-ботов для бизнеса. Запрещено использовать платформу для рассылки спама, незаконного контента или нарушения прав третьих лиц.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">4. Оплата и тарифы</h2>
            <p>Стоимость тарифных планов указана в разделе «Тарифы». Оплата производится на условиях выбранного плана, средства за неиспользованный период не возвращаются, если иное не указано отдельно.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">5. Ограничение ответственности</h2>
            <p>Сервис предоставляется «как есть». Мы не гарантируем бесперебойную работу и не несём ответственности за косвенные убытки, возникшие в результате использования платформы.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">6. Изменения условий</h2>
            <p>Мы можем обновлять условия использования. Продолжая пользоваться сервисом после изменений, вы принимаете новую редакцию.</p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">7. Контакты</h2>
            <p>По всем вопросам обращайтесь в центр поддержки сервиса или пишите на почту <a href="mailto:bot-flow@bot-flow.ru" className="text-aqua hover:underline">bot-flow@bot-flow.ru</a>.</p>
            <p className="mt-2 text-white/50">ИНН 110105729752</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;