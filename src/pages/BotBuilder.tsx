import { useState, useCallback } from "react";
import BuilderTopbar from "@/components/builder/BuilderTopbar";
import NodePalette from "@/components/builder/NodePalette";
import Canvas from "@/components/builder/Canvas";
import NodeInspector from "@/components/builder/NodeInspector";
import LivePreview from "@/components/builder/LivePreview";
import { BotNode, BotEdge } from "@/components/builder/types";
import { NODE_DEF_MAP } from "@/components/builder/nodeDefs";

let idCounter = 100;
const uid = () => `n${idCounter++}`;

const initialNodes: BotNode[] = [
  { id: "n1", subtype: "start", category: "trigger", title: "Старт диалога", text: "Здравствуйте! 👋 Я бот салона «Локон». На какую услугу записать?", buttons: ["Стрижка", "Окрашивание", "Маникюр"], x: 80, y: 60 },
  { id: "n2", subtype: "save-var", category: "data", title: "Спросить телефон", text: "Отлично! Оставьте номер телефона, и мы закрепим время", buttons: [], x: 80, y: 300 },
  { id: "n3", subtype: "crm", category: "integration", title: "Отправить в CRM", text: "amoCRM: новая заявка на запись", buttons: [], x: 80, y: 500 },
];
const initialEdges: BotEdge[] = [
  { id: "e1", source: "n1", target: "n2" },
  { id: "e2", source: "n2", target: "n3" },
];

const BotBuilder = () => {
  const [botName, setBotName] = useState("Салон «Локон»");
  const [nodes, setNodes] = useState<BotNode[]>(initialNodes);
  const [edges, setEdges] = useState<BotEdge[]>(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);

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

  const connectNodes = (source: string, target: string) => {
    setEdges((es) => {
      if (es.some((e) => e.source === source && e.target === target)) return es;
      return [...es, { id: `e${Date.now()}`, source, target }];
    });
  };

  const selected = nodes.find((n) => n.id === selectedId) || null;

  return (
    <div className="h-screen flex flex-col bg-ink text-white overflow-hidden">
      <BuilderTopbar
        botName={botName}
        onRename={setBotName}
        previewOpen={previewOpen}
        onTogglePreview={() => setPreviewOpen((v) => !v)}
      />
      <div className="flex flex-1 min-h-0">
        <NodePalette onAddNode={(subtype) => addNode(subtype)} />
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
            activeNodeId={null}
            onClose={() => setPreviewOpen(false)}
            onReset={() => {}}
          />
        )}
      </div>
    </div>
  );
};

export default BotBuilder;
