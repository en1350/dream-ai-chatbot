import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../../backend/func2url.json";

interface Lead {
  id: number;
  botId: number | null;
  botName: string;
  landingId: number | null;
  landingName: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export default function LeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch(func2url["leads"])
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setLeads(data.leads || []);
      })
      .catch(() => setError("Не удалось загрузить заявки"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = (id: number) => {
    setDeletingId(id);
    fetch(`${func2url["leads"]}?id=${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLeads((ls) => ls.filter((l) => l.id !== id));
      })
      .finally(() => setDeletingId(null));
  };

  const exportCsv = () => {
    const header = "Email,Имя,Телефон,Источник,Дата\n";
    const rows = leads
      .map((l) => {
        const source = l.landingName || l.botName || "";
        return [l.email, l.name, l.phone, source, formatDate(l.createdAt)]
          .map((v) => `"${(v || "").replace(/"/g, '""')}"`)
          .join(",");
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white">Заявки</h1>
          <p className="text-white/50 text-sm mt-1">База email-адресов, собранных ботами и лендингами</p>
        </div>
        {leads.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-colors"
          >
            <Icon name="Download" size={16} /> Экспорт CSV
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[56px] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          <Icon name="TriangleAlert" size={15} />
          {error}
        </div>
      )}

      {!loading && !error && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <Icon name="Inbox" size={28} className="text-aqua" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">Заявок пока нет</h3>
          <p className="text-white/50 max-w-sm">
            Добавьте блок «Форма — email» на лендинг или используйте бота — заявки будут появляться здесь
          </p>
        </div>
      )}

      {!loading && !error && leads.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-ink2/50 overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/8 text-xs text-white/40 uppercase tracking-wider">
            <span>Email</span>
            <span>Имя</span>
            <span>Телефон</span>
            <span>Источник</span>
            <span></span>
          </div>
          <div className="divide-y divide-white/8">
            {leads.map((l) => (
              <div key={l.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-white/[0.03] transition-colors">
                <span className="text-white text-sm truncate flex items-center gap-2">
                  <Icon name="Mail" size={14} className="text-aqua shrink-0" />
                  {l.email}
                </span>
                <span className="text-white/60 text-sm truncate">{l.name || "—"}</span>
                <span className="text-white/60 text-sm truncate">{l.phone || "—"}</span>
                <span className="text-white/40 text-xs truncate">
                  {l.landingName || l.botName || "—"}
                  <span className="block text-white/25">{formatDate(l.createdAt)}</span>
                </span>
                <button
                  onClick={() => remove(l.id)}
                  disabled={deletingId === l.id}
                  className="text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <Icon name="Trash2" size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
