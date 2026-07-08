import Icon from "@/components/ui/icon";
import { BotNode } from "./types";
import { NODE_DEF_MAP, CATEGORY_META } from "./nodeDefs";
import { NODE_WIDTH, portOffsetX } from "./portUtils";
import { getResponseType, getCollectEmail } from "./nodeHelpers";

interface Props {
  node: BotNode;
  selected: boolean;
  connecting: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onSelect: () => void;
  onStartConnect: (label: string | undefined, e: React.MouseEvent) => void;
  onFinishConnect: () => void;
  onDelete: () => void;
}

export default function NodeCard({
  node,
  selected,
  connecting,
  onPointerDown,
  onSelect,
  onStartConnect,
  onFinishConnect,
  onDelete,
}: Props) {
  const def = NODE_DEF_MAP[node.subtype];
  const meta = CATEGORY_META[node.category];
  const isList = getResponseType(node) === "list";
  const collectEmail = getCollectEmail(node);
  const ports: (string | undefined)[] = node.buttons.length > 0 ? node.buttons : [undefined];

  return (
    <div
      className="absolute select-none"
      style={{ left: node.x, top: node.y, width: NODE_WIDTH }}
      onPointerDown={onPointerDown}
      onClick={onSelect}
    >
      <div
        className={`relative rounded-2xl border bg-ink2 shadow-xl transition-all ${
          selected ? "border-electric shadow-[0_0_0_3px_rgba(43,127,255,0.25)]" : "border-white/10 hover:border-white/25"
        }`}
      >
        {/* top port */}
        <div
          onClick={(e) => { e.stopPropagation(); onFinishConnect(); }}
          className={`absolute -top-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-ink2 z-10 transition-colors ${
            connecting ? "bg-electric cursor-cell scale-125" : "bg-white/25 cursor-default"
          }`}
        />

        <div className="flex items-center gap-2 px-3.5 pt-3 pb-2.5 border-b border-white/8">
          <div
            className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center"
            style={{ background: `${meta.color}22` }}
          >
            <Icon name={def?.icon || "Box"} size={14} style={{ color: meta.color }} />
          </div>
          <span className="text-sm font-medium text-white truncate flex-1">{node.title}</span>
          {collectEmail && (
            <div title="Собирает email" className="w-5 h-5 shrink-0 rounded-md bg-aqua/15 flex items-center justify-center">
              <Icon name="Mail" size={11} className="text-aqua" />
            </div>
          )}
          {selected && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-white/30 hover:text-red-400 transition-colors shrink-0"
            >
              <Icon name="Trash2" size={13} />
            </button>
          )}
        </div>

        <div className="px-3.5 py-2.5">
          <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{node.text || "—"}</p>
          {node.buttons.length > 0 && isList && (
            <div className="flex flex-col gap-1 mt-2">
              {node.buttons.map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md bg-electric/10 border border-electric/25 text-electric/90">
                  <span className="text-electric/60 shrink-0">{i + 1}.</span>
                  <span className="truncate">{b}</span>
                </div>
              ))}
            </div>
          )}
          {node.buttons.length > 0 && !isList && (
            <div className="flex flex-wrap gap-1 mt-2">
              {node.buttons.map((b, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-electric/10 border border-electric/25 text-electric/90">
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* bottom port(s) — один на каждую кнопку, или один общий */}
        {ports.map((label, i) => (
          <div
            key={i}
            onMouseDown={(e) => { e.stopPropagation(); onStartConnect(label, e); }}
            title={label ? `Тяните, чтобы соединить ветку «${label}»` : "Тяните, чтобы соединить с другим блоком"}
            className="absolute -bottom-[7px] w-3.5 h-3.5 rounded-full border-2 border-ink2 cursor-crosshair hover:scale-125 transition-transform z-10"
            style={{ background: meta.color, left: portOffsetX(node, label), transform: "translateX(-50%)" }}
          />
        ))}
      </div>
    </div>
  );
}