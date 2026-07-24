import { Link } from "react-router-dom";
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
              <span className="font-display text-xl tracking-wide text-white">БотВПотоке</span>
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
              <li>
                <a href="mailto:bot-flow@bot-flow.ru" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Icon name="Mail" size={15} /> bot-flow@bot-flow.ru
                </a>
              </li>
              <li className="flex items-center gap-2"><Icon name="Send" size={15} /> Telegram</li>
              <li className="flex items-center gap-2"><Icon name="MessageCircle" size={15} /> Сообщество ВК</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/8 mt-10 pt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 sm:flex-1">
            <Icon name="ShieldCheck" size={18} className="text-aqua shrink-0 mt-0.5" />
            <div>
              <div className="text-sm text-white font-medium">Соответствие № 152-ФЗ</div>
              <p className="text-xs text-white/50 mt-0.5">
                Обработка и защита персональных данных пользователей в соответствии с Федеральным законом «О персональных данных».
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 sm:flex-1">
            <Icon name="FileCheck" size={18} className="text-aqua shrink-0 mt-0.5" />
            <div>
              <div className="text-sm text-white font-medium">Соответствие № 149-ФЗ</div>
              <p className="text-xs text-white/50 mt-0.5">
                Работа с информацией и информационными технологиями согласно Федеральному закону «Об информации, информационных технологиях и о защите информации».
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/8 mt-6 pt-6 flex flex-col sm:flex-row justify-between gap-4 text-xs text-white/40">
          <span>© 2026 БотВПотоке. ИНН 110105729752. Все права защищены.</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Политика конфиденциальности</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Оферта</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}