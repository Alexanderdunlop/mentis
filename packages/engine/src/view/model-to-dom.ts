import { resolvePosition } from "../model/resolve-position";
import type { Doc } from "../model/types";
import { domTextNodes } from "./dom-text-nodes";

export interface DomPoint {
  node: Node;
  offset: number;
}

/**
 * Model position → DOM boundary.
 *
 * Relies on `render` keeping DOM text nodes in one-to-one order with model nodes. An
 * empty document has no text node to land in, so the caret goes to `(root, 0)` — the
 * element boundary case that every contentEditable bug report eventually involves.
 */
export const modelToDom = (
  root: HTMLElement,
  doc: Doc,
  position: number
): DomPoint => {
  const { index, offset } = resolvePosition(doc, position);
  const target = domTextNodes(root)[index];

  if (!target) return { node: root, offset: 0 };

  return { node: target, offset: Math.min(offset, target.data.length) };
};
