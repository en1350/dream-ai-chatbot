import Icon from "@/components/ui/icon";

export default function Footer() {
  return (
    <footer className="border-t border-white/8 py-14">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric to-aqua flex items-center justify-center">
                <Icon name="Bot" size={20} className="text-ink" />
              </div>
              <span className="font-display text-xl tracking-wide text-white">BotVK</span>
            </div>
            <p className="text-sm text-white/50 max-w-xs">
              Платформа для создания чат-ботов ВКонтакте, сбора лидов и запуска лендингов без кода.
            </p>
          </div>
          <div>
            <div className="text-white font-medium mb-4 text-sm">Продукт</div>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="#features" className="hover:text-white transition-colors">Возможности</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Тарифы</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Вопросы</a></li>
            </ul>
          </div>
          <div>
            <div className="text-white font-medium mb-4 text-sm">Контакты</div>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li className="flex items-center gap-2"><Icon name="Mail" size={15} /> hello@botvk.ru</li>
              <li className="flex items-center gap-2"><Icon name="Send" size={15} /> Telegram</li>
              <li className="flex items-center gap-2"><Icon name="MessageCircle" size={15} /> Сообщество ВК</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/8 mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-4 text-xs text-white/40">
          <span>© 2026 BotVK. Все права защищены.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-white transition-colors">Оферта</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
