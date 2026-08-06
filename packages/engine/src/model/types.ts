/**
 * A flat, inline-only document. No blocks, no nesting — see docs/plan.md non-goals.
 */
export interface TextNode {
  type: "text";
  text: string;
}

/**
 * An indivisible node — a mention chip. Occupies exactly **one** position regardless of
 * how long its label is, which is what makes a position inside it unrepresentable.
 * See docs/adr/0005-an-atom-is-one-position-wide.md.
 *
 * `label` is what the reader sees; `value` is the identity the consumer cares about.
 * Keeping them separate is why two mentions with the same label but different values
 * work here and cannot in mentis v1, which re-derives everything from the rendered text.
 */
export interface AtomNode {
  type: "atom";
  label: string;
  value: string;
}

export type InlineNode = TextNode | AtomNode;

export interface Doc {
  nodes: InlineNode[];
}

/**
 * A detached run of nodes: what a delete removes and an insert adds.
 *
 * Steps carry slices rather than strings so that undoing a delete restores the atoms
 * that were in it. A string-based inverse would bring a mention back as plain text —
 * silently, and only on undo.
 */
export type Slice = InlineNode[];

/**
 * `anchor` is where the selection started, `head` where it ends, so direction survives
 * a round trip — collapsing to `{from, to}` would silently reverse a backwards drag.
 */
export interface ModelSelection {
  anchor: number;
  head: number;
}

export interface ModelRange {
  from: number;
  to: number;
}
