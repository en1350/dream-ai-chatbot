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
  const [history, setHistory] = useState<{ nodes: BotNode[]; edges: BotEdge[] }[]>([]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);
  const editTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAddedId = useRef<string | null>(null);

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-19), { nodes, edges }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // Для текстовых правок копим один снимок истории на "пачку" быстрых изменений (debounce),
  // чтобы отмена не откатывала посимвольно, а возвращала к состоянию до правки блока.
  const pushHistoryDebounced = useCallback(() => {
    if (editTimer.current) {
      clearTimeout(editTimer.current);
    } else {
      pushHistory();
    }
    editTimer.current = setTimeout(() => {
      editTimer.current = null;
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushHistory]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setSelectedId(null);
      return h.slice(0, -1);
    });
  }, []);

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
            linkUrl: n.linkUrl || "",
            imageUrl: n.imageUrl || "",
            videoUrl: n.videoUrl || "",
            x: n.x,
            y: n.y,
            successText: n.successText || "",
          }))
        );
        setEdges(data.edges.map((e: any) => ({ id: e.id, source: e.source, target: e.target, label: e.label })));
        lastAddedId.current = null;
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo]);

  const clearScenario = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    pushHistory();
    setNodes([]);
    setEdges([]);
    setSelectedId(null);
    lastAddedId.current = null;
  }, [pushHistory]);

  const addNode = useCallback((subtype: string, x?: number, y?: number) => {
    const def = NODE_DEF_MAP[subtype];
    if (!def) return;
    pushHistory();
    const id = uid();
    // Блок добавлен вручную кликом (без явных координат) — продолжаем цепочку от последнего
    // добавленного блока (2→3→4…), а не привязываемся к первому блоку на холсте.
    const isChained = x === undefined && y === undefined;
    const prevId = isChained ? lastAddedId.current : null;

    setNodes((ns) => {
      const prevNode = prevId ? ns.find((n) => n.id === prevId) : undefined;
      const defaultX = prevNode ? prevNode.x : 420 + Math.random() * 120;
      const defaultY = prevNode ? prevNode.y + 160 : 100 + ns.length * 40;
      return [
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
          x: x ?? defaultX,
          y: y ?? defaultY,
        },
      ];
    });

    if (prevId) {
      setEdges((es) => {
        if (es.some((e) => e.source === prevId && e.target === id)) return es;
        return [...es, { id: `e${Date.now()}`, source: prevId, target: id }];
      });
    }

    lastAddedId.current = id;
    setSelectedId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushHistory]);

  const updateNode = (id: string, patch: Partial<BotNode>) => {
    pushHistoryDebounced();
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const moveNode = (id: string, x: number, y: number) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  const deleteNode = (id: string) => {
    pushHistory();
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
    setSelectedId((s) => (s === id ? null : s));
    if (lastAddedId.current === id) lastAddedId.current = null;
  };

  const connectNodes = (source: string, target: string, label?: string) => {
    pushHistory();
    setEdges((es) => {
      if (es.some((e) => e.source === source && e.target === target && (e.label || "") === (label || ""))) return es;
      return [...es, { id: `e${Date.now()}`, source, target, label }];
    });
  };

  const deleteEdge = (id: string) => {
    pushHistory();
    setEdges((es) => es.filter((e) => e.id !== id));
  };

  const applyAiScenario = (data: {
    nodes: { id: string; subtype: string; category: string; title: string; text: string }[];
    edges: { source: string; target: string }[];
  }) => {
    pushHistory();
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
    lastAddedId.current = newNodes.length > 0 ? newNodes[newNodes.length - 1].id : null;
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
        onUndo={undo}
        canUndo={history.length > 0}
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
          onDeleteEdge={deleteEdge}
          onDrop={(subtype, x, y) => addNode(subtype, x, y)}
          onDragStart={pushHistory}
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