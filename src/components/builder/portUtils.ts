import { BotNode } from "./types";

export const NODE_WIDTH = 232;

/** X-смещение (в системе координат узла) точки-порта для конкретной кнопки, либо центр узла по умолчанию. */
export function portOffsetX(node: BotNode, label?: string): number {
  if (node.buttons && node.buttons.length > 0) {
    const idx = label ? node.buttons.indexOf(label) : -1;
    if (idx >= 0) return ((idx + 1) / (node.buttons.length + 1)) * NODE_WIDTH;
  }
  return NODE_WIDTH / 2;
}
