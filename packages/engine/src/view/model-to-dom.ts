import { isAtom } from "../model/nodes";
import { resolvePosition } from "../model/resolve-position";
import type { Doc } from "../model/types";

export interface DomPoint {
  node: Node;
  offset: number;
}

const textChild = (root: HTMLElement, index: number): Text | null => {
  const child = root.childNodes[index];
  return child && child.nodeType === Node.TEXT_NODE ? (child as Text) : null;
};

/**
 * Model position → DOM boundary. Relies on `render`'s one-node-per-child invariant.
 *
 * For a position beside an atom the boundary has two equivalent spellings: an element
 * boundary on the root, or offset 0 / end-of-data in the adjacent text node. The text
 * spelling is preferred wherever one exists, because browsers place and paint a caret in
 * a text node more reliably than between two elements.
 *
 * An empty document has no text node to land in, so the caret goes to `(root, 0)` — the
 * element boundary case every contentEditable bug report eventually involves.
 */
export const modelToDom = (
  root: HTMLElement,
  doc: Doc,
  position: number
): DomPoint => {
  const { index, offset } = resolvePosition(doc, position);
  const node = doc.nodes[index];

  if (!node) return { node: root, offset: 0 };

  if (!isAtom(node)) {
    const text = textChild(root, index);
    if (text) return { node: text, offset: Math.min(offset, text.data.length) };
    return { node: root, offset: index };
  }

  // Beside an atom: prefer a neighbouring text node over an element boundary.
  if (offset === 0) {
    const before = textChild(root, index - 1);
    if (before) return { node: before, offset: before.data.length };
    return { node: root, offset: index };
  }

  const after = textChild(root, index + 1);
  if (after) return { node: after, offset: 0 };
  return { node: root, offset: index + 1 };
};
