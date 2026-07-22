import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import func2url from "../../../backend/func2url.json";

interface Bot {
  id: number;
  name: string;
  description: string;
  status: string;
  dialogsCount: number;
}

interface Landing {
  id: number;
  name: string;
  botId: number | null;
}

export default function BotsList() {
  const navigate = useNavigate();
  const [bots, setBots] = useState<Bot[]>([]);
  const [landings, setLandings] = useState<Landing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    fetch(func2url["bots"])
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setBots(data.bots || []);
        }
      })
      .catch(() => setError("Не удалось загрузить список ботов"))
      .finally(() => setLoading(false));

    fetch(func2url["landings"])
      .then((res) => res.json())
      .then((data) => setLandings(data.landings || []));
  }, []);

  const landingForBot = (botId: number) => landings.find((l) => l.botId === botId);

  const attachLanding = (botId: number, landingId: number | null) => {
    const prevLanding = landingForBot(botId);
    setSavingId(botId);

    const requests: Promise<unknown>[] = [];
    if (prevLanding && prevLanding.id !== landingId) {
      requests.push(
        fetch(func2url["landings"], {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: prevLanding.id, botId: null }),
        })
      );
    }
    if (landingId) {
      requests.push(
        fetch(func2url["landings"], {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: landingId, botId }),
        })
      );
    }

    Promise.all(requests)
      .then(() =>
        setLandings((ls) =>
          ls.map((l) => {
            if (l.id === landingId) return { ...l, botId };
            if (l.id === prevLanding?.id) return { ...l, botId: null };
            return l;
          })
        )
      )
      .finally(() => setSavingId(null));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white">Мои боты</h1>
          <p className="text-white/50 text-sm mt-1">Выберите бота, чтобы открыть конструктор</p>
        </div>
        <button
          onClick={() => navigate("/builder/new")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-electric to-aqua text-ink font-semibold text-sm hover:shadow-[0_0_30px_rgba(43,127,255,0.4)] transition-all"
        >
          <Icon name="Plus" size={18} /> Новый бот
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

      {!loading && !error && bots.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <Icon name="Bot" size={28} className="text-aqua" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">Пока нет ни одного бота</h3>
          <p className="text-white/50 max-w-sm mb-6">Создайте первого бота, чтобы начать собирать заявки в мессенджере</p>
          <button
            onClick={() => navigate("/builder/new")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-electric to-aqua text-ink font-semibold text-sm hover:shadow-[0_0_30px_rgba(43,127,255,0.4)] transition-all"
          >
            <Icon name="Plus" size={18} /> Создать бота
          </button>
        </div>
      )}

      {!loading && !error && bots.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((b) => {
            const linked = landingForBot(b.id);
            return (
              <div
                key={b.id}
                className="rounded-2xl border border-white/8 bg-ink2/50 p-6 hover:border-electric/40 transition-all group"
              >
                <button onClick={() => navigate(`/builder/${b.id}`)} className="text-left w-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-electric/25 to-aqua/25 flex items-center justify-center">
                      <Icon name="Bot" size={20} className="text-aqua" />
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs ${b.status === "active" ? "text-aqua" : "text-white/40"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.status === "active" ? "bg-aqua" : "bg-white/30"}`} />
                      {b.status === "active" ? "онлайн" : "не опубликован"}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-1 group-hover:text-aqua transition-colors">{b.name}</h3>
                  <p className="text-white/50 text-sm">{b.dialogsCount} диалогов за 7 дней</p>
                  <div className="flex items-center gap-1.5 text-sm text-electric mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Открыть конструктор <Icon name="ArrowRight" size={14} />
                  </div>
                </button>

                <div className="pt-3 mt-3 border-t border-white/8" onClick={(e) => e.stopPropagation()}>
                  <label className="text-[11px] text-white/40 mb-1 block">Лендинг</label>
                  <select
                    value={linked?.id ?? ""}
                    disabled={savingId === b.id}
                    onChange={(e) => attachLanding(b.id, e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-9 rounded-lg bg-white/5 border border-white/10 px-2.5 text-xs text-white focus:border-electric focus:outline-none transition-colors disabled:opacity-50"
                  >
                    <option value="" className="bg-ink2">Не привязан</option>
                    {landings.map((l) => (
                      <option key={l.id} value={l.id} className="bg-ink2" disabled={!!l.botId && l.botId !== b.id}>
                        {l.name}{l.botId && l.botId !== b.id ? " (занят)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}