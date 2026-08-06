import type { AtomNode, InlineNode, TextNode } from "./types";

export const textNode = (text: string): TextNode => ({ type: "text", text });

export const atomNode = (label: string, value: string): AtomNode => ({
  type: "atom",
  label,
  value,
});

export const isAtom = (node: InlineNode): node is AtomNode =>
  node.type === "atom";

export const isText = (node: InlineNode): node is TextNode =>
  node.type === "text";

/** The visible text of a node. For an atom this is its label, not its value. */
export const nodeText = (node: InlineNode): string =>
  isAtom(node) ? node.label : node.text;
