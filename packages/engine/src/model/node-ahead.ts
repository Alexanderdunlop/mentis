import { docLength } from "./doc-length";
import { nodeLength } from "./node-length";
import { isAtom } from "./nodes";
import { resolvePosition } from "./resolve-position";
import type { AtomNode, Doc, InlineNode } from "./types";

export interface NodeAhead {
  /** The node the next character belongs to. */
  node: InlineNode;
  /** Offset into that node, so a caller stepping forward knows where it starts. */
  offset: number;
}

/**
 * What lies **forward** of a position: the node the next character belongs to.
 *
 * Exists because `resolvePosition` puts a position that falls exactly between two nodes
 * at the *end of the earlier one* (its documented boundary rule). That convention is free
 * for anything looking backwards and is the one thing a forward-looking caller has to
 * undo: sitting at a node's trailing edge **is** sitting at the start of the next, and the
 * character ahead belongs to that one.
 *
 * Getting that wrong stalls a forward walk at every node boundary, which is exactly what
 * happened while M6's `positionAfter` was being written. Both callers that need to look
 * forward now share this rather than each re-deriving it.
 *
 * Returns null at the end of the document, where there is no node ahead.
 *
 * Note that an atom is one position wide (ADR 0005), so an atom returned here always has
 * `offset: 0` — a non-zero offset into an atom is its trailing edge, which resolves to the
 * *following* node instead. `atomAhead` leans on that.
 */
export const nodeAhead = (doc: Doc, at: number): NodeAhead | null => {
  if (at >= docLength(doc)) return null;

  const { index, offset } = resolvePosition(doc, at);
  const node = doc.nodes[index];
  if (!node) return null;

  if (offset < nodeLength(node)) return { node, offset };

  const next = doc.nodes[index + 1];
  return next ? { node: next, offset: 0 } : null;
};

/**
 * The atom that starts exactly at `at`, or null.
 *
 * "Starts exactly at" comes free from the note above: an atom is one position wide, so
 * the only offset at which `nodeAhead` can return one is 0.
 */
export const atomAhead = (doc: Doc, at: number): AtomNode | null => {
  const ahead = nodeAhead(doc, at);
  return ahead && isAtom(ahead.node) ? ahead.node : null;
};
