import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PersonalData = () => {
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

        <h1 className="font-display text-3xl text-white mb-2">Политика обработки персональных данных</h1>
        <p className="text-white/40 text-sm mb-10">Последнее обновление: 25 июля 2026 г.</p>

        <div className="space-y-6 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold mb-2">1. Общие положения</h2>
            <p>
              Настоящая Политика определяет порядок обработки и защиты персональных данных пользователей сервиса
              «БотВПотоке» и разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных
              данных».
            </p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">2. Какие данные мы обрабатываем</h2>
            <p>
              При регистрации и использовании сервиса мы обрабатываем: имя, адрес электронной почты, пароль (в
              зашифрованном виде), а также данные о созданных вами ботах и заявках ваших клиентов.
            </p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">3. Цели обработки</h2>
            <p>
              Данные обрабатываются для регистрации и авторизации, предоставления функций сервиса, технической
              поддержки, а также информирования об изменениях и обновлениях.
            </p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">4. Правовые основания</h2>
            <p>
              Обработка персональных данных осуществляется на основании вашего согласия, которое вы предоставляете при
              регистрации, отмечая соответствующую галочку.
            </p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">5. Хранение и защита</h2>
            <p>
              Данные хранятся на защищённых серверах. Мы применяем организационные и технические меры для защиты
              персональных данных от неправомерного доступа, изменения, раскрытия или уничтожения.
            </p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">6. Передача третьим лицам</h2>
            <p>
              Мы не передаём и не продаём ваши персональные данные третьим лицам, за исключением интеграций, которые вы
              подключаете самостоятельно, и случаев, предусмотренных законодательством РФ.
            </p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">7. Ваши права</h2>
            <p>
              Вы вправе в любой момент отозвать согласие на обработку персональных данных, запросить их изменение,
              экспорт или удаление, обратившись в поддержку сервиса.
            </p>
          </section>
          <section>
            <h2 className="text-white font-semibold mb-2">8. Контакты</h2>
            <p>
              По вопросам обработки персональных данных пишите на{" "}
              <a href="mailto:bot-flow@bot-flow.ru" className="text-aqua hover:underline">
                bot-flow@bot-flow.ru
              </a>
              .
            </p>
            <p className="mt-2 text-white/50">ИНН 110105729752</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PersonalData;