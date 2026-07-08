import { BotNode } from "./types";

export type ResponseType = "none" | "buttons" | "list";

/** Тип ответа блока: явно заданный responseType, либо угадан по subtype/старым данным (обратная совместимость). */
export function getResponseType(node: BotNode): ResponseType {
  if (node.responseType) return node.responseType;
  if (node.subtype === "list") return "list";
  if (node.buttons && node.buttons.length > 0) return "buttons";
  return "none";
}

/** Собирает ли блок email — явный флаг либо старый подтип email-collect. */
export function getCollectEmail(node: BotNode): boolean {
  if (typeof node.collectEmail === "boolean") return node.collectEmail;
  return node.subtype === "email-collect";
}
