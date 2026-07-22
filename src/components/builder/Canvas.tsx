import { useRef, useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import NodeCard from "./NodeCard";
import { BotNode, BotEdge } from "./types";
import { NODE_WIDTH, portOffsetX } from "./portUtils";

interface Props {
  nodes: BotNode[];
  edges: BotEdge[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onConnect: (source: string, target: string, label?: string) => void;
  onDelete: (id: string) => void;
  onDeleteEdge?: (id: string) => void;
  onDrop: (subtype: string, x: number, y: number) => void;
  onDragStart?: () => void;
}

export default function Canvas({ nodes, edges, selectedId, onSelect, onMove, onConnect, onDelete, onDeleteEdge, onDrop, onDragStart }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number; moved: boolean } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<{ id: string; label?: string } | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedEdgeId) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        onDeleteEdge?.(selectedEdgeId);
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedEdgeId, onDeleteEdge]);

  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = ref.current!.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / scale,
        y: (clientY - rect.top - pan.y) / scale,
      };
    },
    [pan, scale]
  );

  const handlePointerMove = (e: React.PointerEvent) => {
    const p = toWorld(e.clientX, e.clientY);
    setMouse(p);
    if (panning) {
      setPan({ x: panning.panX + (e.clientX - panning.startX), y: panning.panY + (e.clientY - panning.startY) });
    }
  };

  const handlePointerUp = () => {
    setPanning(null);
  };

  // Перетаскивание блока отслеживаем на уровне окна (в фазе перехвата — capture), а не только
  // холста: если отпустить кнопку мыши над другим блоком или его точкой соединения, событие
  // может быть остановлено там (stopPropagation) и не дойти до холста в обычной фазе всплытия —
  // тогда блок "прилипал" бы к курсору навсегда. Фаза перехвата срабатывает раньше и не зависит
  // от stopPropagation дочерних элементов.
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => {
      const p = toWorld(e.clientX, e.clientY);
      setMouse(p);
      if (!dragging.moved) {
        onDragStart?.();
        setDragging({ ...dragging, moved: true });
      }
      onMove(dragging.id, p.x - dragging.offX, p.y - dragging.offY);
    };
    const handleUp = () => setDragging(null);
    window.addEventListener("pointermove", handleMove, true);
    window.addEventListener("pointerup", handleUp, true);
    return () => {
      window.removeEventListener("pointermove", handleMove, true);
      window.removeEventListener("pointerup", handleUp, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, toWorld, onMove, onDragStart]);

  // Аналогично для протягивания стрелки: если отпустить кнопку не точно на верхней точке
  // блока-получателя, соединение должно корректно отмениться, а не "зависнуть".
  useEffect(() => {
    if (!connectFrom) return;
    const handleUp = () => setConnectFrom(null);
    window.addEventListener("pointerup", handleUp, true);
    return () => window.removeEventListener("pointerup", handleUp, true);
  }, [connectFrom]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target !== ref.current && !(e.target as HTMLElement).classList.contains("canvas-bg")) return;
    setPanning({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y });
    onSelect(null);
    setConnectFrom(null);
    setSelectedEdgeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setScale((s) => Math.min(1.6, Math.max(0.4, s + delta)));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const subtype = e.dataTransfer.getData("subtype");
    if (!subtype) return;
    const p = toWorld(e.clientX, e.clientY);
    onDrop(subtype, p.x - 116, p.y - 20);
  };

  const edgePath = (sx: number, sy: number, tx: number, ty: number) => {
    const dy = Math.max(60, Math.abs(ty - sy) / 2);
    return `M ${sx} ${sy} C ${sx} ${sy + dy}, ${tx} ${ty - dy}, ${tx} ${ty}`;
  };

  return (
    <div
      ref={ref}
      className="canvas-bg relative flex-1 h-full overflow-hidden bg-ink cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
        backgroundSize: `${24 * scale}px ${24 * scale}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
      >
        {/* SVG со связями: некоторые браузеры (особенно Safari/WebKit) некорректно рисуют
            содержимое SVG размером 1x1px с overflow:visible, если рядом есть абсолютно
            позиционированные элементы (карточки блоков) — стрелки могут пропадать.
            Поэтому задаём SVG заведомо большую область, покрывающую холст, вместо расчёта
            на overflow. */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width={20000}
          height={20000}
          style={{ overflow: "visible" }}
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#2B7FFF" />
            </marker>
            <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#18E0C8" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const s = nodes.find((n) => n.id === edge.source);
            const t = nodes.find((n) => n.id === edge.target);
            if (!s || !t) return null;
            const sx = s.x + portOffsetX(s, edge.label), sy = s.y + 88;
            const tx = t.x + NODE_WIDTH / 2, ty = t.y;
            const midX = (sx + tx) / 2, midY = (sy + ty) / 2;
            const isSelected = selectedEdgeId === edge.id;
            const isHovered = hoveredEdgeId === edge.id;
            const active = isSelected || isHovered;
            return (
              <g key={edge.id}>
                {/* широкая невидимая область для удобного клика/наведения */}
                <path
                  d={edgePath(sx, sy, tx, ty)}
                  stroke="transparent"
                  strokeWidth={18}
                  fill="none"
                  style={{ pointerEvents: "stroke", cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); setSelectedEdgeId(edge.id); }}
                  onMouseEnter={() => setHoveredEdgeId(edge.id)}
                  onMouseLeave={() => setHoveredEdgeId((h) => (h === edge.id ? null : h))}
                />
                <path
                  d={edgePath(sx, sy, tx, ty)}
                  stroke={active ? "#18E0C8" : "#2B7FFF"}
                  strokeWidth={active ? 3 : 2}
                  fill="none"
                  markerEnd={active ? "url(#arrow-active)" : "url(#arrow)"}
                  opacity={active ? 1 : 0.7}
                  style={{ pointerEvents: "none", transition: "stroke 0.15s, stroke-width 0.15s" }}
                />
                {edge.label && !active && (
                  <foreignObject x={midX - 50} y={midY - 11} width={100} height={22} style={{ overflow: "visible" }}>
                    <div className="flex justify-center pointer-events-none">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink2 border border-electric/30 text-electric/90 whitespace-nowrap">
                        {edge.label}
                      </span>
                    </div>
                  </foreignObject>
                )}
                {active && onDeleteEdge && (
                  <foreignObject x={midX - 11} y={midY - 11} width={22} height={22} style={{ overflow: "visible" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEdge(edge.id);
                        setSelectedEdgeId((sid) => (sid === edge.id ? null : sid));
                      }}
                      title="Удалить связь"
                      style={{ pointerEvents: "auto" }}
                      className="w-[22px] h-[22px] rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-colors"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </foreignObject>
                )}
              </g>
            );
          })}
          {connectFrom && (() => {
            const s = nodes.find((n) => n.id === connectFrom.id);
            if (!s) return null;
            return (
              <path
                d={edgePath(s.x + portOffsetX(s, connectFrom.label), s.y + 88, mouse.x, mouse.y)}
                stroke="#18E0C8"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
              />
            );
          })()}
        </svg>

        {nodes.map((n) => (
          <NodeCard
            key={n.id}
            node={n}
            selected={selectedId === n.id}
            connecting={!!connectFrom && connectFrom.id !== n.id}
            onSelect={() => onSelect(n.id)}
            onPointerDown={(e) => {
              e.stopPropagation();
              const p = toWorld(e.clientX, e.clientY);
              setDragging({ id: n.id, offX: p.x - n.x, offY: p.y - n.y, moved: false });
            }}
            onStartConnect={(label) => setConnectFrom({ id: n.id, label })}
            onFinishConnect={() => {
              if (connectFrom && connectFrom.id !== n.id) {
                onConnect(connectFrom.id, n.id, connectFrom.label);
              }
              setConnectFrom(null);
            }}
            onDelete={() => onDelete(n.id)}
          />
        ))}
      </div>

      {/* zoom controls */}
      <div className="absolute bottom-5 right-5 flex flex-col gap-1 bg-ink2/90 backdrop-blur border border-white/10 rounded-xl p-1">
        <button onClick={() => setScale((s) => Math.min(1.6, s + 0.1))} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 rounded-lg transition-colors">
          <Icon name="Plus" size={15} />
        </button>
        <div className="text-center text-[10px] text-white/40 py-0.5">{Math.round(scale * 100)}%</div>
        <button onClick={() => setScale((s) => Math.max(0.4, s - 0.1))} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 rounded-lg transition-colors">
          <Icon name="Minus" size={15} />
        </button>
        <div className="h-px bg-white/10 my-0.5" />
        <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 rounded-lg transition-colors">
          <Icon name="Maximize" size={14} />
        </button>
      </div>

      {connectFrom && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-aqua/15 border border-aqua/40 text-aqua text-xs backdrop-blur">
          Кликните на верхнюю точку блока-получателя, чтобы соединить
        </div>
      )}

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <Icon name="Workflow" size={40} className="text-white/15 mb-3" />
          <p className="text-white/30 text-sm">Перетащите блок из левой панели, чтобы начать сценарий</p>
        </div>
      )}
    </div>
  );
}