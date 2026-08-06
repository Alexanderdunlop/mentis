import { nodeLength } from "./node-length";
import { isAtom } from "./nodes";
import type { Doc } from "./types";

export interface MentionEntry {
  label: string;
  value: string;
  /** Position of the atom in the document. */
  at: number;
}

/**
 * Every mention in the document, in order.
 *
 * This is the query mentis v1 cannot answer correctly: it re-derives mentions from the
 * rendered DOM, so two chips with the same label are indistinguishable and the wrong
 * value gets reported. Here the value is stored, not inferred, so duplicate labels are a
 * non-event.
 */
export const mentions = (doc: Doc): MentionEntry[] => {
  const found: MentionEntry[] = [];
  let position = 0;

  for (const node of doc.nodes) {
    if (isAtom(node)) {
      found.push({ label: node.label, value: node.value, at: position });
    }
    position += nodeLength(node);
  }

  return found;
};
