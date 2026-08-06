import { isText } from "./nodes";
import type { Doc, InlineNode } from "./types";

/**
 * Canonical form: no empty text nodes, no two adjacent text nodes.
 *
 * Atoms are never dropped and never merged — an atom is meaningful even with an empty
 * label, because its `value` is its identity.
 *
 * Every operation returns a normalised doc so two docs with the same content are always
 * structurally equal. Without it, insert-then-delete leaves debris that makes doc
 * comparison — the core assertion of M1 — unreliable.
 */
export const normalise = (doc: Doc): Doc => {
  const nodes: InlineNode[] = [];

  for (const node of doc.nodes) {
    if (isText(node) && node.text === "") continue;

    const previous = nodes[nodes.length - 1];
    if (previous && isText(previous) && isText(node)) {
      nodes[nodes.length - 1] = { type: "text", text: previous.text + node.text };
      continue;
    }
    nodes.push(node);
  }

  return { nodes };
};
