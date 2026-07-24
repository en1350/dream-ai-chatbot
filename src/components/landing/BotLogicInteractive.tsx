import { useState } from "react";

// Палитра из исходного макета — блок оформлен независимо от тем сайта.
const C = {
  primary: "#1E3A8A",
  secondary: "#0D9488",
  bg: "#F3F4F6",
  card: "#FFFFFF",
  text: "#1F2937",
  success: "#10B981",
  error: "#EF4444",
};

const TABS = ["1. Основы", "2. Архитектура", "3. Симулятор", "4. Тест"];

interface Scenario {
  msg: string;
  intents: string[];
  sources: string[];
  correctIntent: number;
  correctSource: number;
}

const SCENARIOS: Scenario[] = [
  {
    msg: "Здравствуйте! Подскажите, сколько стоит курс по Python?",
    intents: ["Приветствие", "Узнать цену", "Оставить заявку"],
    sources: ["Шаблоны ответов", "База товаров/услуг", "CRM система"],
    correctIntent: 1,
    correctSource: 1,
  },
  {
    msg: "Я хочу записаться на консультацию к методисту на завтра.",
    intents: ["Узнать расписание", "Оставить заявку", "Пожаловаться"],
    sources: ["База товаров", "Календарь / CRM", "База знаний FAQ"],
    correctIntent: 1,
    correctSource: 1,
  },
  {
    msg: "Ахахах, ты вообще кто?",
    intents: ["Заказать пиццу", "Узнать баланс", "Флуд / Нераспознано"],
    sources: ["API Банка", "Fallback сценарий (уточнение)", "База расписания"],
    correctIntent: 2,
    correctSource: 1,
  },
];

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
}

const QUIZ: QuizQuestion[] = [
  {
    q: "1. Что такое «Интент» (Intent) в логике бота?",
    options: [
      "Физический сервер, где хранится бот",
      "Намерение пользователя (чего он хочет добиться)",
      "Ошибка в коде программы",
    ],
    correct: 1,
  },
  {
    q: "2. Какой тип логики использует строгие условия «Если X, то Y»?",
    options: ["Правиловая (Rule-based)", "Генеративная (LLM)", "Визуальная"],
    correct: 0,
  },
  {
    q: "3. Если бот не распознал интент пользователя, что должна сделать его логика?",
    options: [
      "Зависнуть и перестать отвечать",
      "Случайно выбрать любой ответ из базы",
      "Сработать по сценарию Fallback (уточнить вопрос или позвать человека)",
    ],
    correct: 2,
  },
];

export default function BotLogicInteractive() {
  const [tab, setTab] = useState(0);

  // Симулятор
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selIntent, setSelIntent] = useState<number | null>(null);
  const [selSource, setSelSource] = useState<number | null>(null);
  const [simDone, setSimDone] = useState(false);

  // Тест
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const scenario = SCENARIOS[scenarioIdx];
  const canNext = selIntent !== null && selSource !== null;

  const nextScenario = () => {
    if (scenarioIdx + 1 < SCENARIOS.length) {
      setScenarioIdx((i) => i + 1);
      setSelIntent(null);
      setSelSource(null);
    } else {
      setSimDone(true);
    }
  };

  const score = QUIZ.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);

  const optBtnStyle = (state: "idle" | "correct" | "wrong"): React.CSSProperties => ({
    display: "inline-block",
    padding: "10px 15px",
    margin: 5,
    borderRadius: 8,
    cursor: "pointer",
    fontSize: "0.95em",
    transition: "all 0.2s",
    border: "2px solid " + (state === "correct" ? C.success : state === "wrong" ? C.error : "#D1D5DB"),
    background: state === "correct" ? C.success : state === "wrong" ? C.error : C.card,
    color: state === "idle" ? C.text : "#fff",
  });

  return (
    <section className="py-24 relative" style={{ background: "transparent" }}>
      <div className="container mx-auto px-6">
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: C.card,
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            overflow: "hidden",
            color: C.text,
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            lineHeight: 1.6,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
              color: "#fff",
              padding: "40px 30px",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: "2.2em", marginBottom: 10 }}>🤖 Логика чат-ботов</h1>
            <p style={{ fontSize: "1.1em", opacity: 0.9 }}>Как боты понимают нас и принимают решения</p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", background: "#E5E7EB", overflowX: "auto" }}>
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                style={{
                  flex: 1,
                  padding: "15px 10px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.95em",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  transition: "all 0.3s",
                  color: tab === i ? C.primary : "#6B7280",
                  background: tab === i ? "#fff" : "none",
                  borderBottom: "3px solid " + (tab === i ? C.secondary : "transparent"),
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ padding: 30 }}>
            {/* Tab 0: Основы */}
            {tab === 0 && (
              <div className="animate-fade-up">
                <SectionTitle>Как думает бот?</SectionTitle>
                <p style={{ marginBottom: 15 }}>
                  Чат-бот — это не волшебство, а строгий алгоритм. В основе любой ботовой логики лежит цикл{" "}
                  <strong>Input → Process → Output</strong> (Ввод → Обработка → Вывод).
                </p>
                <InfoBox>
                  <strong>💡 Главное правило:</strong> Бот не «понимает» слова так, как человек. Он ищет в них{" "}
                  <strong>паттерны (шаблоны)</strong>, <strong>ключевые слова</strong> или{" "}
                  <strong>намерения (интенты)</strong>, чтобы выбрать правильный сценарий ответа.
                </InfoBox>
                <SubTitle>Три уровня логики ботов:</SubTitle>
                <ul style={{ marginLeft: 20, marginBottom: 20 }}>
                  <li style={{ marginBottom: 8 }}>
                    <strong>1. Правиловая (If/Else):</strong> «Если написано "Привет" → ответь "Здравствуйте"».
                    Просто, но хрупко.
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <strong>2. NLP (Обработка языка):</strong> Бот ищет <em>Intent</em> (намерение) и{" "}
                    <em>Entities</em> (сущности). Например, в фразе «Хочу пиццу Маргариту» Intent = <em>Заказ еды</em>,
                    Entity = <em>Маргарита</em>.
                  </li>
                  <li>
                    <strong>3. LLM (Нейросети):</strong> Бот генерирует ответ на лету, анализируя контекст всего
                    диалога (как ChatGPT).
                  </li>
                </ul>
              </div>
            )}

            {/* Tab 1: Архитектура */}
            {tab === 1 && (
              <div className="animate-fade-up">
                <SectionTitle>Архитектура бота</SectionTitle>
                <p style={{ marginBottom: 15 }}>
                  Чтобы ответить пользователю, сообщение проходит через 4 ключевых узла:
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin: "30px 0",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <ArchStep title="👤 Пользователь" sub="Отправляет текст" />
                  <Arrow />
                  <ArchStep title="💬 Интерфейс" sub="Telegram / Сайт" />
                  <Arrow />
                  <ArchStep title="⚙️ Ядро (Логика)" sub="Анализ интента" />
                  <Arrow />
                  <ArchStep title="🗄️ Данные" sub="БД / API / AI" />
                </div>
                <InfoBox>
                  <strong>Разбор на примере:</strong>
                  <br />
                  Студент пишет: «Когда пара по ИКТ?»
                  <br />
                  1. <strong>Интерфейс</strong> (Telegram) передаёт текст на сервер.
                  <br />
                  2. <strong>Ядро</strong> распознаёт Intent: <em>get_schedule</em>, Entity: <em>ИКТ</em>.
                  <br />
                  3. <strong>Данные</strong>: Ядро делает запрос к базе расписания колледжа.
                  <br />
                  4. <strong>Ядро</strong> формирует текст и отправляет его обратно через Интерфейс.
                </InfoBox>
              </div>
            )}

            {/* Tab 2: Симулятор */}
            {tab === 2 && (
              <div className="animate-fade-up">
                <SectionTitle>Симулятор: Стань логикой бота!</SectionTitle>
                <p style={{ marginBottom: 15 }}>
                  Представьте, что вы — ядро чат-бота. Прочитайте сообщение пользователя и выберите правильный{" "}
                  <strong>Интент (Намерение)</strong> и <strong>Источник данных</strong>, чтобы бот ответил верно.
                </p>

                <div style={{ background: "#F9FAFB", border: "2px solid #E5E7EB", borderRadius: 12, padding: 25, margin: "20px 0" }}>
                  {!simDone ? (
                    <>
                      <div
                        style={{
                          background: "#fff",
                          border: "1px solid #D1D5DB",
                          borderRadius: 10,
                          padding: 15,
                          marginBottom: 20,
                          fontSize: "1.1em",
                          position: "relative",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: -10,
                            left: 15,
                            background: C.bg,
                            padding: "0 10px",
                            fontSize: "0.8em",
                            color: "#6B7280",
                            fontWeight: "bold",
                          }}
                        >
                          Пользователь
                        </span>
                        {scenario.msg}
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ marginBottom: 10, color: C.primary }}>1. Выбери Интент (Намерение):</h4>
                        {scenario.intents.map((opt, i) => {
                          const state =
                            selIntent === null
                              ? "idle"
                              : i === scenario.correctIntent
                              ? "correct"
                              : i === selIntent
                              ? "wrong"
                              : "idle";
                          return (
                            <button
                              key={opt}
                              disabled={selIntent !== null}
                              onClick={() => setSelIntent(i)}
                              style={optBtnStyle(state as "idle" | "correct" | "wrong")}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ marginBottom: 10, color: C.primary }}>2. Выбери Источник данных:</h4>
                        {scenario.sources.map((opt, i) => {
                          const state =
                            selSource === null
                              ? "idle"
                              : i === scenario.correctSource
                              ? "correct"
                              : i === selSource
                              ? "wrong"
                              : "idle";
                          return (
                            <button
                              key={opt}
                              disabled={selSource !== null}
                              onClick={() => setSelSource(i)}
                              style={optBtnStyle(state as "idle" | "correct" | "wrong")}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: 30 }}>
                      <h3 style={{ color: C.success }}>
                        🎉 Отлично! Вы успешно обработали все запросы и поняли логику бота!
                      </h3>
                    </div>
                  )}
                </div>

                {!simDone && (
                  <div style={{ textAlign: "center", marginTop: 20 }}>
                    <BigBtn disabled={!canNext} onClick={nextScenario}>
                      Следующий сценарий ➔
                    </BigBtn>
                  </div>
                )}
                <p style={{ textAlign: "center", marginTop: 15, color: "#6B7280" }}>
                  Прогресс: {simDone ? SCENARIOS.length : scenarioIdx} / {SCENARIOS.length}
                </p>
              </div>
            )}

            {/* Tab 3: Тест */}
            {tab === 3 && (
              <div className="animate-fade-up">
                <SectionTitle>Проверка знаний</SectionTitle>
                <p style={{ marginBottom: 15 }}>Ответьте на 3 вопроса, чтобы закрепить материал.</p>

                {QUIZ.map((q, qi) => (
                  <div key={qi} style={{ background: "#F9FAFB", padding: 20, borderRadius: 10, marginBottom: 20, border: "1px solid #E5E7EB" }}>
                    <h4 style={{ marginBottom: 15, color: C.primary }}>{q.q}</h4>
                    {q.options.map((opt, oi) => {
                      let bg = "#fff";
                      let border = "#E5E7EB";
                      if (checked) {
                        if (oi === q.correct) {
                          bg = "#D1FAE5";
                          border = C.success;
                        } else if (answers[qi] === oi) {
                          bg = "#FEE2E2";
                          border = C.error;
                        }
                      }
                      return (
                        <label
                          key={oi}
                          style={{
                            display: "block",
                            padding: "10px 15px",
                            margin: "8px 0",
                            background: bg,
                            border: `2px solid ${border}`,
                            borderRadius: 8,
                            cursor: checked ? "default" : "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name={`q${qi}`}
                            checked={answers[qi] === oi}
                            disabled={checked}
                            onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                            style={{ marginRight: 10 }}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                ))}

                {!checked ? (
                  <BigBtn onClick={() => setChecked(true)}>Проверить ответы</BigBtn>
                ) : (
                  <BigBtn
                    onClick={() => {
                      setChecked(false);
                      setAnswers({});
                    }}
                  >
                    Пройти заново
                  </BigBtn>
                )}

                {checked && (
                  <div
                    style={{
                      padding: 20,
                      borderRadius: 10,
                      textAlign: "center",
                      fontSize: "1.2em",
                      fontWeight: "bold",
                      marginTop: 20,
                      background: score === 3 ? "#D1FAE5" : score >= 1 ? "#FEF3C7" : "#FEE2E2",
                      color: score === 3 ? "#065F46" : score >= 1 ? "#92400E" : "#991B1B",
                    }}
                  >
                    {score === 3
                      ? `🏆 Превосходно! ${score} из 3. Вы отлично понимаете архитектуру ботов!`
                      : score >= 1
                      ? `Неплохо! ${score} из 3. Повторите раздел «Основы» и попробуйте снова.`
                      : `📚 ${score} из 3. Рекомендуем пройти интерактив с самого начала.`}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ color: C.primary, marginBottom: 20, fontSize: "1.6em", borderLeft: `5px solid ${C.secondary}`, paddingLeft: 15 }}>
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ color: C.secondary, margin: "20px 0 10px", fontSize: "1.2em" }}>{children}</h3>;
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#F0F9FF", borderLeft: `4px solid ${C.secondary}`, padding: "15px 20px", margin: "20px 0", borderRadius: 8 }}>
      {children}
    </div>
  );
}

function ArchStep({ title, sub }: { title: string; sub: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 140,
        background: C.primary,
        color: "#fff",
        padding: "20px 10px",
        borderRadius: 10,
        textAlign: "center",
        fontWeight: "bold",
      }}
    >
      {title}
      <span style={{ display: "block", fontSize: "0.85em", fontWeight: "normal", opacity: 0.9, marginTop: 5 }}>{sub}</span>
    </div>
  );
}

function Arrow() {
  return <div style={{ fontSize: "1.5em", color: C.secondary, fontWeight: "bold" }}>➔</div>;
}

function BigBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`,
        color: "#fff",
        border: "none",
        padding: "12px 25px",
        borderRadius: 8,
        fontSize: "1em",
        fontWeight: "bold",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "transform 0.2s",
      }}
    >
      {children}
    </button>
  );
}
