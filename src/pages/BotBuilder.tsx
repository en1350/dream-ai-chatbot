import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BuilderTopbar from "@/components/builder/BuilderTopbar";
import NodePalette from "@/components/builder/NodePalette";
import Canvas from "@/components/builder/Canvas";
import NodeInspector from "@/components/builder/NodeInspector";
import LivePreview from "@/components/builder/LivePreview";
import AiScenarioModal from "@/components/builder/AiScenarioModal";
import Icon from "@/components/ui/icon";
import { BotNode, BotEdge, NodeCategory } from "@/components/builder/types";
import { NODE_DEF_MAP } from "@/components/builder/nodeDefs";
import func2url from "../../backend/func2url.json";

let idCounter = 100;
const uid = () => `n${idCounter++}`;

type SaveStatus = "saved" | "saving" | "error";

const BotBuilder = () => {
  const { botId } = useParams();
  const navigate = useNavigate();
  const isNew = botId === "new";

  const [realBotId, setRealBotId] = useState<number | null>(null);
  const [botName, setBotName] = useState("Новый бот");
  const [nodes, setNodes] = useState<BotNode[]>([]);
  const [edges, setEdges] = useState<BotEdge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);

  // Создание нового бота в БД или загрузка существующего сценария
  useEffect(() => {
    if (isNew) {
      fetch(func2url["bots"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Новый бот", description: "" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.bot) {
            setRealBotId(data.bot.id);
            navigate(`/builder/${data.bot.id}`, { replace: true });
          }
        })
        .catch(() => setLoadError("Не удалось создать бота"));
      return;
    }

    if (!botId || !/^\d+$/.test(botId)) {
      setLoadError("Бот не найден");
      setLoading(false);
      return;
    }

    fetch(`${func2url["bot-scenario"]}?bot_id=${botId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setLoadError(data.error);
          return;
        }
        setRealBotId(data.bot.id);
        setBotName(data.bot.name);
        setNodes(
          data.nodes.map((n: any) => ({
            id: n.id,
            subtype: n.subtype,
            category: n.category,
            title: n.title,
            text: n.text,
            buttons: n.buttons || [],
            responseType: n.responseType,
            collectEmail: n.collectEmail,
            x: n.x,
            y: n.y,
            successText: n.successText || "",
          }))
        );
        setEdges(data.edges.map((e: any) => ({ id: e.id, source: e.source, target: e.target, label: e.label })));
      })
      .catch(() => setLoadError("Не удалось загрузить сценарий"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId]);

  const saveNow = useCallback(() => {
    if (!realBotId) return;
    setSaveStatus("saving");
    fetch(func2url["bot-scenario"], {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId: realBotId, name: botName, nodes, edges }),
    })
      .then((res) => res.json())
      .then((data) => setSaveStatus(data.success ? "saved" : "error"))
      .catch(() => setSaveStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realBotId, botName, nodes, edges]);

  // Автосохранение с debounce при изменении сценария
  useEffect(() => {
    if (loading || !realBotId) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(func2url["bot-scenario"], {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: realBotId, name: botName, nodes, edges }),
      })
        .then((res) => res.json())
        .then((data) => setSaveStatus(data.success ? "saved" : "error"))
        .catch(() => setSaveStatus("error"));
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, botName, realBotId, loading]);

  const clearScenario = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setNodes([]);
    setEdges([]);
    setSelectedId(null);
  }, []);

  const addNode = useCallback((subtype: string, x?: number, y?: number) => {
    const def = NODE_DEF_MAP[subtype];
    if (!def) return;
    const id = uid();
    setNodes((ns) => [
      ...ns,
      {
        id,
        subtype,
        category: def.category,
        title: def.defaultTitle,
        text: def.defaultText || "",
        buttons: [],
        responseType: subtype === "list" ? "list" : subtype === "buttons" ? "buttons" : "none",
        collectEmail: subtype === "email-collect",
        x: x ?? 420 + Math.random() * 120,
        y: y ?? 100 + ns.length * 40,
      },
    ]);
    setSelectedId(id);
  }, []);

  const updateNode = (id: string, patch: Partial<BotNode>) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const moveNode = (id: string, x: number, y: number) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  const deleteNode = (id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
    setSelectedId((s) => (s === id ? null : s));
  };

  const connectNodes = (source: string, target: string, label?: string) => {
    setEdges((es) => {
      if (es.some((e) => e.source === source && e.target === target && (e.label || "") === (label || ""))) return es;
      return [...es, { id: `e${Date.now()}`, source, target, label }];
    });
  };

  const applyAiScenario = (data: {
    nodes: { id: string; subtype: string; category: string; title: string; text: string }[];
    edges: { source: string; target: string }[];
  }) => {
    const idMap: Record<string, string> = {};
    const newNodes: BotNode[] = data.nodes.map((n, i) => {
      const id = uid();
      idMap[n.id] = id;
      return {
        id,
        subtype: n.subtype,
        category: n.category as NodeCategory,
        title: n.title,
        text: n.text,
        buttons: [],
        x: 80,
        y: 60 + i * 220,
      };
    });
    const newEdges: BotEdge[] = data.edges
      .filter((e) => idMap[e.source] && idMap[e.target])
      .map((e) => ({ id: `e${Date.now()}${Math.random()}`, source: idMap[e.source], target: idMap[e.target] }));

    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedId(null);
  };

  const selected = nodes.find((n) => n.id === selectedId) || null;

  if (loadError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-ink text-white gap-4">
        <Icon name="TriangleAlert" size={32} className="text-amber-400" />
        <p className="text-white/60">{loadError}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-sm transition-colors"
        >
          Вернуться к списку ботов
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-ink text-white gap-3">
        <Icon name="Loader2" size={20} className="animate-spin text-aqua" />
        <span className="text-white/60 text-sm">Загружаю сценарий…</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-ink text-white overflow-hidden">
      <BuilderTopbar
        botName={botName}
        onRename={setBotName}
        previewOpen={previewOpen}
        onTogglePreview={() => setPreviewOpen((v) => !v)}
        saveStatus={saveStatus}
        onClear={clearScenario}
        onSaveNow={saveNow}
      />
      <div className="flex flex-1 min-h-0">
        <NodePalette onAddNode={(subtype) => addNode(subtype)} onOpenAiModal={() => setAiModalOpen(true)} />
        <Canvas
          nodes={nodes}
          edges={edges}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={moveNode}
          onConnect={connectNodes}
          onDelete={deleteNode}
          onDrop={(subtype, x, y) => addNode(subtype, x, y)}
        />
        {selected && (
          <NodeInspector
            node={selected}
            onUpdate={(patch) => updateNode(selected.id, patch)}
            onDelete={() => deleteNode(selected.id)}
            onClose={() => setSelectedId(null)}
          />
        )}
        {previewOpen && !selected && (
          <LivePreview
            nodes={nodes}
            edges={edges}
            botId={realBotId}
            activeNodeId={null}
            onClose={() => setPreviewOpen(false)}
            onReset={() => {}}
          />
        )}
      </div>
      {aiModalOpen && (
        <AiScenarioModal onClose={() => setAiModalOpen(false)} onGenerated={applyAiScenario} />
      )}
    </div>
  );
};

export default BotBuilder;