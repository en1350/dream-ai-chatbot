export type NodeCategory = "trigger" | "message" | "logic" | "data" | "ai" | "integration";

export interface NodeDef {
  subtype: string;
  category: NodeCategory;
  label: string;
  icon: string;
  defaultTitle: string;
  defaultText?: string;
  fieldLabel?: string;
  fieldPlaceholder?: string;
}

export interface BotNode {
  id: string;
  subtype: string;
  category: NodeCategory;
  title: string;
  text: string;
  buttons: string[];
  responseType?: "buttons" | "list";
  collectEmail?: boolean;
  x: number;
  y: number;
  successText?: string;
}

export interface BotEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}