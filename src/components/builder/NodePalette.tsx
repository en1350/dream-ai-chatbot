import { useState } from "react";
import Icon from "@/components/ui/icon";
import { NODE_DEFS, CATEGORY_META } from "./nodeDefs";
import { NodeCategory } from "./types";

interface Props {
  onAddNode: (subtype: string) => void;
}

const ORDER: NodeCategory[] = ["trigger", "message", "logic", "data", "ai", "integration"];

export default function NodePalette({ onAddNode }: Props) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const q = query.trim().toLowerCase();

  return (
    <aside className="w-72 shrink-0 h-full border-r border-white/8 bg-ink2/60 backdrop-blur-xl flex flex-col">
      <div className="p-4 border-b border-white/8">
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти блок…"
            className="w-full h-9 rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-electric focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {ORDER.map((cat) => {
          const meta = CATEGORY_META[cat];
          const items = NODE_DEFS.filter(
            (d) => d.category === cat && (q === "" || d.label.toLowerCase().includes(q))
          );
          if (items.length === 0) return null;
          const isCollapsed = collapsed[cat];

          return (
            <div key={cat} className="mb-1">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}
                className="flex items-center gap-2 w-full px-2 py-2 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors"
              >
                <Icon
                  name="ChevronRight"
                  size={13}
                  className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                />
                <span style={{ color: meta.color }}>{meta.label}</span>
                <span className="ml-auto text-white/25">{items.length}</span>
              </button>

              {!isCollapsed && (
                <div className="space-y-1 pl-1">
                  {items.map((d) => (
                    <button
                      key={d.subtype}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("subtype", d.subtype)}
                      onClick={() => onAddNode(d.subtype)}
                      className="group flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left hover:bg-white/6 transition-colors cursor-grab active:cursor-grabbing"
                    >
                      <div
                        className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center border border-white/10"
                        style={{ background: `${meta.color}1a` }}
                      >
                        <Icon name={d.icon} size={14} style={{ color: meta.color }} />
                      </div>
                      <span className="text-sm text-white/75 group-hover:text-white transition-colors truncate">
                        {d.label}
                      </span>
                      <Icon
                        name="Plus"
                        size={13}
                        className="ml-auto text-white/0 group-hover:text-white/40 transition-colors shrink-0"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-white/8">
        <button className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-electric/20 to-aqua/20 border border-white/10 text-white text-sm hover:border-electric/40 transition-colors">
          <Icon name="Sparkles" size={16} className="text-aqua shrink-0" />
          Собрать сценарий с AI
        </button>
      </div>
    </aside>
  );
}
