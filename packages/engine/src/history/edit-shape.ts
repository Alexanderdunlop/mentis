import { isSingleGrapheme } from "../model/grapheme-boundary";
import { isText } from "../model/nodes";
import { sliceLength } from "../model/slice-between";
import type { Transaction } from "../model/transaction";
import type { EditShape } from "./types";

/**
 * Classify a transaction for coalescing.
 *
 * Derived from the steps rather than declared on the `Transaction`, so the model layer
 * stays free of history concerns and any future command gets classified for free.
 */
export const editShapeOf = (transaction: Transaction): EditShape => {
  const caret = transaction.selection?.head ?? 0;
  const other: EditShape = {
    kind: "other",
    startedAt: caret,
    endedAt: caret,
    size: 0,
  };

  // Only a user edit may coalesce. A mention insertion or a preset is deliberately its
  // own undo step, however small.
  if (transaction.origin !== "user") return other;
  if (transaction.steps.length !== 1) return other;

  const step = transaction.steps[0]!;

  if (step.type === "insert") {
    const [node, ...rest] = step.slice;
    if (!node || rest.length > 0 || !isText(node)) return other;
    // A newline ends a typing run outright: undo should stop at the start of a line,
    // which is where a user expects it to stop.
    //
    // One *grapheme*, not one code unit — `👍` is two units and `👨‍👩‍👧` is eight, and
    // measuring in units would classify every typed emoji as "not typing" and give it its
    // own undo step. `hi 👍` would then undo in three pieces rather than as one run.
    if (!isSingleGrapheme(node.text) || node.text === "\n") return other;

    const size = sliceLength(step.slice);
    return {
      kind: "type",
      startedAt: step.at,
      endedAt: step.at + size,
      size,
      char: node.text,
    };
  }

  // A backward delete runs right-to-left: it begins at the caret and ends before it.
  return {
    kind: "delete",
    startedAt: step.to,
    endedAt: step.from,
    size: step.to - step.from,
  };
};
