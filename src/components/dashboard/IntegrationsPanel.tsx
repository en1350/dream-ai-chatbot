import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import func2url from "../../../backend/func2url.json";

interface Integration {
  botId: number;
  botName: string;
  connected: boolean;
  groupId: number | null;
  groupName: string;
  active: boolean;
  confirmCode: string;
  secretKey: string;
}

export default function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalBot, setModalBot] = useState<Integration | null>(null);
  const [groupId, setGroupId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [togglingBotId, setTogglingBotId] = useState<number | null>(null);
  const [copied, setCopied] = useState("");

  const webhookUrl = func2url["vk-callback"];

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  const load = () => {
    setLoading(true);
    fetch(func2url["vk-integration"])
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setIntegrations(data.integrations || []);
      })
      .catch(() => setError("Не удалось загрузить интеграции"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openModal = (item: Integration) => {
    setModalBot(item);
    setGroupId(item.groupId ? String(item.groupId) : "");
    setAccessToken("");
    setConfirmCode(item.confirmCode || "");
    setConnectError("");
  };

  const submitConnect = () => {
    if (!modalBot) return;
    if (!groupId.trim() || !accessToken.trim()) {
      setConnectError("Заполните ID сообщества и ключ доступа");
      return;
    }
    if (!/^\d+$/.test(groupId.trim())) {
      setConnectError("ID сообщества — это число (например, 215644977), а не адрес или ссылка");
      return;
    }
    setConnecting(true);
    setConnectError("");
    fetch(func2url["vk-integration"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId: modalBot.botId, groupId: groupId.trim(), accessToken: accessToken.trim(), confirmCode: confirmCode.trim() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setConnectError(data.error);
          return;
        }
        setModalBot(null);
        load();
      })
      .catch(() => setConnectError("Не удалось подключиться к VK API"))
      .finally(() => setConnecting(false));
  };

  const toggleActive = (item: Integration) => {
    setTogglingBotId(item.botId);
    fetch(func2url["vk-integration"], {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId: item.botId, active: !item.active }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIntegrations((list) => list.map((i) => (i.botId === item.botId ? { ...i, active: !i.active } : i)));
        }
      })
      .finally(() => setTogglingBotId(null));
  };

  const disconnect = (item: Integration) => {
    fetch(`${func2url["vk-integration"]}?bot_id=${item.botId}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) load();
      });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white">Интеграции</h1>
        <p className="text-white/50 text-sm mt-1">Подключите сообщество ВКонтакте к боту, чтобы он отвечал на сообщения</p>
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

      {!loading && !error && integrations.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <Icon name="Plug" size={28} className="text-aqua" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">Пока нет ни одного бота</h3>
          <p className="text-white/50 max-w-sm">Создайте бота в разделе «Мои боты», чтобы подключить его к ВКонтакте</p>
        </div>
      )}

      {!loading && !error && integrations.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((item) => (
            <div key={item.botId} className="rounded-2xl border border-white/8 bg-ink2/50 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-electric/25 to-aqua/25 flex items-center justify-center">
                  <Icon name="MessageCircle" size={20} className="text-aqua" />
                </div>
                {item.connected && (
                  <span className={`flex items-center gap-1.5 text-xs ${item.active ? "text-aqua" : "text-white/40"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-aqua" : "bg-white/30"}`} />
                    {item.active ? "подключено" : "приостановлено"}
                  </span>
                )}
              </div>
              <h3 className="text-white font-semibold mb-1">{item.botName}</h3>
              <p className="text-white/50 text-sm truncate mb-4">
                {item.connected ? item.groupName || `Сообщество #${item.groupId}` : "ВКонтакте не подключено"}
              </p>

              {item.connected ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(item)}
                    disabled={togglingBotId === item.botId}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors disabled:opacity-50"
                  >
                    <Icon name={item.active ? "Pause" : "Play"} size={14} />
                    {item.active ? "Пауза" : "Включить"}
                  </button>
                  <button
                    onClick={() => disconnect(item)}
                    className="flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-colors"
                  >
                    <Icon name="Unplug" size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openModal(item)}
                  className="flex items-center justify-center gap-2 w-full px-3 h-9 rounded-lg bg-gradient-to-r from-electric to-aqua text-ink text-sm font-semibold hover:shadow-[0_0_20px_rgba(43,127,255,0.35)] transition-all"
                >
                  <Icon name="Link" size={14} />
                  Подключить ВК
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!modalBot} onOpenChange={(open) => !open && setModalBot(null)}>
        <DialogContent className="bg-ink2 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Подключить ВКонтакте</DialogTitle>
            <DialogDescription className="text-white/50">
              Бот «{modalBot?.botName}» будет отвечать на сообщения сообщества
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-electric/25 bg-electric/[0.06] p-3.5">
              <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                <span className="w-5 h-5 rounded-full bg-electric text-ink text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                Адрес для Callback API
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] text-aqua bg-black/30 rounded-lg px-2.5 py-2 truncate">{webhookUrl}</code>
                <button
                  onClick={() => copy(webhookUrl, "url")}
                  className="shrink-0 h-8 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs flex items-center gap-1 transition-colors"
                >
                  <Icon name={copied === "url" ? "Check" : "Copy"} size={13} />
                  {copied === "url" ? "Скопировано" : "Копировать"}
                </button>
              </div>
              <p className="text-[11px] text-white/45 leading-relaxed mt-2">
                ВК → Управление → Работа с API → Callback API → вставьте адрес. ВК покажет «строку, которую должен вернуть сервер» — впишите её ниже в поле «Код подтверждения» и нажмите «Подключить». После этого вернитесь в ВК и нажмите «Подтвердить».
              </p>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">ID сообщества</label>
              <input
                value={groupId}
                onChange={(e) => setGroupId(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="215644977"
                className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-white/40 mt-1.5">
                Только цифры. Найти можно в адресе сообщества: ВК → Управление → Настройки → внизу «id: …»
              </p>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Ключ доступа сообщества</label>
              <input
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                type="password"
                placeholder="Токен из настроек сообщества → Работа с API"
                className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Код подтверждения (из Callback API)</label>
              <input
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.trim())}
                placeholder="Например, a1b2c3d4"
                className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-white/40 mt-1.5">
                Строка, которую ВК показывает при настройке Callback API как «сервер должен вернуть».
              </p>
            </div>

            {connectError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
                <Icon name="TriangleAlert" size={13} />
                {connectError}
              </div>
            )}

            {modalBot?.secretKey && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                  Секретный ключ (Callback API → Секретный ключ)
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] text-aqua bg-black/30 rounded-lg px-2.5 py-2 truncate">{modalBot.secretKey}</code>
                  <button
                    onClick={() => copy(modalBot.secretKey, "secret")}
                    className="shrink-0 h-8 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs flex items-center gap-1 transition-colors"
                  >
                    <Icon name={copied === "secret" ? "Check" : "Copy"} size={13} />
                    {copied === "secret" ? "Скопировано" : "Копировать"}
                  </button>
                </div>
                <p className="text-[11px] text-white/45 leading-relaxed mt-2">
                  Вставьте в ВК → Callback API → Секретный ключ. И в разделе «Типы событий» включите «Входящее сообщение».
                </p>
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                <Icon name="Info" size={13} className="text-aqua" />
                Где взять ключ
              </div>
              <p className="text-xs text-white/45 leading-relaxed">
                Сообщество ВК → Управление → Работа с API → Ключи доступа → создать ключ с правами «Сообщения сообщества».
              </p>
            </div>

            <button
              onClick={submitConnect}
              disabled={connecting}
              className="flex items-center justify-center gap-2 w-full px-4 h-10 rounded-lg bg-gradient-to-r from-electric to-aqua text-ink text-sm font-semibold hover:shadow-[0_0_20px_rgba(43,127,255,0.35)] transition-all disabled:opacity-60"
            >
              {connecting ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Link" size={15} />}
              {connecting ? "Подключаю…" : "Подключить"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}