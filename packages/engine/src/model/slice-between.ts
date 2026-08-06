import { nodeLength } from "./node-length";
import { isAtom, nodeText } from "./nodes";
import { normalise } from "./normalise";
import { clampPosition } from "./resolve-position";
import type { Doc, Slice } from "./types";

/**
 * The nodes in a range.
 *
 * An atom is included only when the range covers it whole. Since an atom is one position
 * wide, "partially covered" cannot happen — but stating the rule as a containment check
 * keeps it correct if that ever changes.
 */
export const sliceBetween = (doc: Doc, from: number, to: number): Slice => {
  const start = clampPosition(doc, Math.min(from, to));
  const end = clampPosition(doc, Math.max(from, to));

  const slice: Slice = [];
  let position = 0;

  for (const node of doc.nodes) {
    const nodeEnd = position + nodeLength(node);

    if (nodeEnd > start && position < end) {
      if (isAtom(node)) {
        if (position >= start && nodeEnd <= end) slice.push(node);
      } else {
        slice.push({
          type: "text",
          text: node.text.slice(
            Math.max(0, start - position),
            Math.max(0, end - position)
          ),
        });
      }
    }

    position = nodeEnd;
  }

  return normalise({ nodes: slice }).nodes;
};

/** Visible text of a slice — labels for atoms. Not a position measurement. */
export const sliceText = (slice: Slice): string =>
  slice.map(nodeText).join("");

/** Positions a slice occupies. Differs from `sliceText(slice).length` once atoms exist. */
export const sliceLength = (slice: Slice): number =>
  slice.reduce((total, node) => total + nodeLength(node), 0);
