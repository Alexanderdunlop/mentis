import type { Doc, InlineNode } from "./types";

/**
 * Canonical form: no empty text nodes, no two adjacent text nodes.
 *
 * Every operation returns a normalised doc so that two docs with the same text are
 * always structurally equal. Without this, `insert` then `delete` leaves debris that
 * makes doc comparison — the core assertion of M1 — unreliable.
 */
export const normalise = (doc: Doc): Doc => {
  const nodes: InlineNode[] = [];

  for (const node of doc.nodes) {
    if (node.text === "") continue;

    const previous = nodes[nodes.length - 1];
    if (previous && previous.type === "text" && node.type === "text") {
      nodes[nodes.length - 1] = {
        type: "text",
        text: previous.text + node.text,
      };
      continue;
    }
    nodes.push(node);
  }

  return { nodes };
};
