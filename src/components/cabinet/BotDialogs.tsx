import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const dialogCls = "bg-ink2 border-white/10 text-white max-w-md";

export function CreateBotDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (name: string) => Promise<{ error?: string; needUpgrade?: boolean } | void>;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needUpgrade, setNeedUpgrade] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
      setNeedUpgrade(false);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await onCreate(name.trim() || "Новый бот");
    setBusy(false);
    if (res && res.error) {
      setError(res.error);
      setNeedUpgrade(!!res.needUpgrade);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogCls}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Bot" size={20} className="text-aqua" /> Новый бот
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Придумайте название — его увидите только вы. Поменять можно в любой момент.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            placeholder="Например: Бот для записи на маникюр"
            className="w-full px-4 py-3 rounded-xl bg-ink border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-electric/60 focus:ring-2 focus:ring-electric/20"
          />
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <div className="flex items-start gap-2">
                <Icon name="TriangleAlert" size={16} className="mt-0.5 shrink-0" /> {error}
              </div>
              {needUpgrade && (
                <Link to="/account" className="inline-flex items-center gap-1 mt-2 text-aqua hover:underline">
                  Выбрать тариф <Icon name="ArrowRight" size={14} />
                </Link>
              )}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/5"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric to-aqua text-ink font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {busy ? <Icon name="LoaderCircle" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
              Создать и открыть
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteBotDialog({
  bot,
  onOpenChange,
  onConfirm,
}: {
  bot: { id: number; name: string } | null;
  onOpenChange: (o: boolean) => void;
  onConfirm: (id: number) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!bot) return;
    setBusy(true);
    await onConfirm(bot.id);
    setBusy(false);
  };

  return (
    <Dialog open={!!bot} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className={dialogCls}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Trash2" size={20} className="text-red-400" /> Удалить бота?
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Бот «{bot?.name}» будет удалён без возможности восстановления.
          </DialogDescription>
        </DialogHeader>
        <ul className="text-sm text-white/60 space-y-1.5 bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <li className="flex gap-2"><Icon name="X" size={15} className="text-red-400 mt-0.5" /> сценарий и все блоки</li>
          <li className="flex gap-2"><Icon name="X" size={15} className="text-red-400 mt-0.5" /> собранные этим ботом заявки</li>
          <li className="flex gap-2"><Icon name="X" size={15} className="text-red-400 mt-0.5" /> подключение к ВКонтакте</li>
          <li className="flex gap-2"><Icon name="Check" size={15} className="text-aqua mt-0.5" /> лендинги останутся, просто отвяжутся от бота</li>
        </ul>
        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/5"
          >
            Отмена
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {busy ? <Icon name="LoaderCircle" size={16} className="animate-spin" /> : <Icon name="Trash2" size={16} />}
            Удалить навсегда
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
