import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import func2url from "../../../backend/func2url.json";

interface Landing {
  id: number;
  name: string;
  slug: string;
  published: boolean;
  botId: number | null;
}

interface Bot {
  id: number;
  name: string;
}

export default function LandingsList() {
  const navigate = useNavigate();
  const [landings, setLandings] = useState<Landing[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(func2url["landings"])
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setLandings(data.landings || []);
        }
      })
      .catch(() => setError("Не удалось загрузить список лендингов"))
      .finally(() => setLoading(false));

    fetch(func2url["bots"])
      .then((res) => res.json())
      .then((data) => setBots(data.bots || []));
  }, []);

  const botName = (botId: number | null) => bots.find((b) => b.id === botId)?.name;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white">Лендинги</h1>
          <p className="text-white/50 text-sm mt-1">Конструктор посадочных страниц</p>
        </div>
        <button
          onClick={() => navigate("/landing-builder/new")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-electric to-aqua text-ink font-semibold text-sm hover:shadow-[0_0_30px_rgba(43,127,255,0.4)] transition-all"
        >
          <Icon name="Plus" size={18} /> Новый лендинг
        </button>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/8 bg-ink2/50 p-6 h-[168px] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          <Icon name="TriangleAlert" size={15} />
          {error}
        </div>
      )}

      {!loading && !error && landings.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <Icon name="LayoutTemplate" size={28} className="text-aqua" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">Пока нет ни одного лендинга</h3>
          <p className="text-white/50 max-w-sm mb-6">Создайте первую посадочную страницу для сбора заявок</p>
          <button
            onClick={() => navigate("/landing-builder/new")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-electric to-aqua text-ink font-semibold text-sm hover:shadow-[0_0_30px_rgba(43,127,255,0.4)] transition-all"
          >
            <Icon name="Plus" size={18} /> Создать лендинг
          </button>
        </div>
      )}

      {!loading && !error && landings.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {landings.map((l) => (
            <button
              key={l.id}
              onClick={() => navigate(`/landing-builder/${l.id}`)}
              className="text-left rounded-2xl border border-white/8 bg-ink2/50 p-6 hover:border-electric/40 hover:bg-ink2 transition-all group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-electric/25 to-aqua/25 flex items-center justify-center">
                  <Icon name="LayoutTemplate" size={20} className="text-aqua" />
                </div>
                <span className={`flex items-center gap-1.5 text-xs ${l.published ? "text-aqua" : "text-white/40"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${l.published ? "bg-aqua" : "bg-white/30"}`} />
                  {l.published ? "опубликован" : "черновик"}
                </span>
              </div>
              <h3 className="text-white font-semibold mb-1 group-hover:text-aqua transition-colors">{l.name}</h3>
              <p className="text-white/50 text-sm truncate">/l/{l.slug}</p>
              {botName(l.botId) ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-aqua bg-aqua/10 px-2 py-1 rounded-full mt-2.5">
                  <Icon name="Bot" size={11} /> {botName(l.botId)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-white/35 bg-white/5 px-2 py-1 rounded-full mt-2.5">
                  <Icon name="Unplug" size={11} /> Бот не привязан
                </span>
              )}
              <div className="flex items-center gap-1.5 text-sm text-electric mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                Открыть конструктор <Icon name="ArrowRight" size={14} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}