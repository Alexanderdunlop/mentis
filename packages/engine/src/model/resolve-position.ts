import { docLength } from "./doc-length";
import { nodeLength } from "./node-length";
import type { Doc } from "./types";

export interface ResolvedPosition {
  /** Index into `doc.nodes`. Equal to `nodes.length` only for an empty doc. */
  index: number;
  /** Offset within that node. */
  offset: number;
}

export const clampPosition = (doc: Doc, position: number): number =>
  Math.max(0, Math.min(position, docLength(doc)));

/**
 * Locate a position within the node list.
 *
 * Boundary rule: a position that falls exactly between two nodes resolves to the **end
 * of the earlier node**, not the start of the later one. Both are the same place in the
 * text, so the rule is arbitrary — but it has to be *stated*, because inserting at a
 * boundary appends to the earlier node, and an unstated convention here means insertion
 * lands in a different node depending on how the position was arrived at.
 */
export const resolvePosition = (
  doc: Doc,
  position: number
): ResolvedPosition => {
  const target = clampPosition(doc, position);

  let consumed = 0;
  for (let index = 0; index < doc.nodes.length; index += 1) {
    const length = nodeLength(doc.nodes[index]!);
    if (target <= consumed + length) {
      return { index, offset: target - consumed };
    }
    consumed += length;
  }

  // Only reachable for an empty doc: there is no node to land in.
  return { index: doc.nodes.length, offset: 0 };
};
