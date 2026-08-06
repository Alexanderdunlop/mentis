/**
 * A flat, inline-only document. No blocks, no nesting — see docs/plan.md non-goals.
 *
 * M1 has exactly one node kind. M2 adds an atom (a mention chip) which is one
 * character wide, which is why positions are defined over node *lengths* rather than
 * over string indices directly.
 */
export interface TextNode {
  type: "text";
  text: string;
}

export type InlineNode = TextNode;

export interface Doc {
  nodes: InlineNode[];
}

/**
 * A selection in model coordinates. `anchor` is where the selection started and `head`
 * is where it ends, so direction survives a round trip — collapsing to `{from, to}`
 * would silently reverse a backwards drag.
 */
export interface ModelSelection {
  anchor: number;
  head: number;
}

export interface ModelRange {
  from: number;
  to: number;
}
