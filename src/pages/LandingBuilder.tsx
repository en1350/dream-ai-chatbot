import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LandingTopbar from "@/components/landing-builder/LandingTopbar";
import BlockPalette from "@/components/landing-builder/BlockPalette";
import BlockInspector from "@/components/landing-builder/BlockInspector";
import LandingSettingsPanel from "@/components/landing-builder/LandingSettingsPanel";
import LandingRenderer from "@/components/landing-builder/LandingRenderer";
import Icon from "@/components/ui/icon";
import { LandingBlock, LandingTheme, DEFAULT_THEME } from "@/components/landing-builder/types";
import func2url from "../../backend/func2url.json";

type SaveStatus = "saved" | "saving" | "error";

const LandingBuilder = () => {
  const { landingId } = useParams();
  const navigate = useNavigate();
  const isNew = landingId === "new";

  const [realId, setRealId] = useState<number | null>(null);
  const [name, setName] = useState("Новый лендинг");
  const [slug, setSlug] = useState("");
  const [blocks, setBlocks] = useState<LandingBlock[]>([]);
  const [theme, setTheme] = useState<LandingTheme>(DEFAULT_THEME);
  const [published, setPublished] = useState(false);
  const [bots, setBots] = useState<{ id: number; name: string }[]>([]);
  const [botId, setBotId] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isNew) {
      fetch(func2url["landings"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Новый лендинг" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.landing) {
            navigate(`/landing-builder/${data.landing.id}`, { replace: true });
          }
        })
        .catch(() => setLoadError("Не удалось создать лендинг"));
      return;
    }

    if (!landingId || !/^\d+$/.test(landingId)) {
      setLoadError("Лендинг не найден");
      setLoading(false);
      return;
    }

    fetch(`${func2url["landings"]}?id=${landingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setLoadError(data.error);
          return;
        }
        const l = data.landing;
        setRealId(l.id);
        setName(l.name);
        setSlug(l.slug);
        setBlocks(l.blocks || []);
        setTheme({ ...DEFAULT_THEME, ...(l.theme || {}) });
        setPublished(l.published);
        setBotId(l.botId ?? null);
        setBots(l.bots || []);
      })
      .catch(() => setLoadError("Не удалось загрузить лендинг"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landingId]);

  const saveNow = useCallback(() => {
    if (!realId) return;
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    fetch(func2url["landings"], {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: realId, name, slug, blocks, theme, published, botId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.landing) {
          setSlug(data.landing.slug);
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
        }
      })
      .catch(() => setSaveStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realId, name, slug, blocks, theme, published, botId]);

  useEffect(() => {
    if (loading || !realId) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(func2url["landings"], {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: realId, name, slug, blocks, theme, published, botId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.landing) {
            setSlug(data.landing.slug);
            setSaveStatus("saved");
          } else {
            setSaveStatus("error");
          }
        })
        .catch(() => setSaveStatus("error"));
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, theme, name, slug, published, botId, realId, loading]);

  const clearLanding = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setBlocks([]);
    setSelectedIndex(null);
  }, []);

  const addBlock = (block: LandingBlock) => {
    setBlocks((bs) => [...bs, block]);
    setSelectedIndex(blocks.length);
  };

  const updateBlock = (i: number, patch: Partial<LandingBlock>) => {
    setBlocks((bs) => bs.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  };

  const deleteBlock = (i: number) => {
    setBlocks((bs) => bs.filter((_, idx) => idx !== i));
    setSelectedIndex(null);
  };

  const togglePublish = () => setPublished((p) => !p);

  const selected = selectedIndex !== null ? blocks[selectedIndex] : null;

  if (loadError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-ink text-white gap-4">
        <Icon name="TriangleAlert" size={32} className="text-amber-400" />
        <p className="text-white/60">{loadError}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-sm transition-colors"
        >
          Вернуться в кабинет
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-ink text-white gap-3">
        <Icon name="Loader2" size={20} className="animate-spin text-aqua" />
        <span className="text-white/60 text-sm">Загружаю лендинг…</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-ink text-white overflow-hidden">
      <LandingTopbar
        name={name}
        onRename={setName}
        slug={slug}
        published={published}
        onTogglePublish={togglePublish}
        saveStatus={saveStatus}
        onClear={clearLanding}
        onSaveNow={saveNow}
      />
      <div className="flex flex-1 min-h-0">
        <BlockPalette onAddBlock={addBlock} />

        <div className="flex-1 overflow-y-auto bg-ink2/20">
          {blocks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                <Icon name="LayoutTemplate" size={28} className="text-aqua" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">Пока нет ни одного блока</h3>
              <p className="text-white/50 max-w-sm">Добавьте блок из палитры слева, чтобы начать собирать лендинг</p>
            </div>
          ) : (
            <LandingRenderer
              blocks={blocks}
              theme={theme}
              editable
              selectedIndex={selectedIndex}
              onSelectBlock={setSelectedIndex}
            />
          )}
        </div>

        {selected ? (
          <BlockInspector
            block={selected}
            onUpdate={(patch) => updateBlock(selectedIndex as number, patch)}
            onDelete={() => deleteBlock(selectedIndex as number)}
            onClose={() => setSelectedIndex(null)}
            bots={bots}
            botId={botId}
            onBotChange={setBotId}
          />
        ) : (
          <LandingSettingsPanel slug={slug} onSlugChange={setSlug} theme={theme} onThemeChange={setTheme} />
        )}
      </div>
    </div>
  );
};

export default LandingBuilder;