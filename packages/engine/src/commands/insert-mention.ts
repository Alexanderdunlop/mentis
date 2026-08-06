import { atomNode } from "../model/nodes";
import { sliceLength } from "../model/slice-between";
import { replaceRange, type Transaction } from "../model/transaction";
import type { ModelRange, Slice } from "../model/types";

interface Options {
  label: string;
  /** Identity. Two mentions may share a label and differ here — that is the point. */
  value: string;
  /** What the mention replaces: the trigger and query, or just the caret. */
  range: ModelRange;
  /** Append a space after the chip, so typing continues outside it. */
  trailingSpace?: boolean;
}

/**
 * A mention as a transaction. Nothing about this touches the DOM.
 *
 * The trailing space is not cosmetic: without it the caret ends up immediately after an
 * atom with nothing to its right, which is the one position browsers are unreliable
 * about painting. Giving the caret a text node to sit in avoids the whole class of
 * "cursor vanished after inserting a chip" bug.
 */
export const insertMention = ({
  label,
  value,
  range,
  trailingSpace = true,
}: Options): Transaction => {
  const slice: Slice = [atomNode(label, value)];
  if (trailingSpace) slice.push({ type: "text", text: " " });

  // Positions, not node count — the two only coincide because an atom is one wide.
  const end = range.from + sliceLength(slice);

  return {
    steps: replaceRange(range.from, range.to, slice),
    selection: { anchor: end, head: end },
    origin: "program",
  };
};
