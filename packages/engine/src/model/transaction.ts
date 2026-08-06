import { textNode } from "./nodes";
import { sliceLength } from "./slice-between";
import { applyStep } from "./steps/apply-step";
import type { Step } from "./steps/types";
import type { Doc, ModelSelection, Slice } from "./types";

/**
 * A unit of change. Steps apply in order; the selection is where the caret ends up.
 *
 * `origin` exists so the view can tell a user edit from a programmatic one without a
 * mutable "is this programmatic" flag living outside the model — the pattern that made
 * `isProgrammaticUpdateRef` in the abandoned v2 branch untestable.
 */
export interface Transaction {
  steps: Step[];
  selection?: ModelSelection;
  origin?: "user" | "program" | "history";
}

export interface AppliedTransaction {
  doc: Doc;
  selection: ModelSelection | undefined;
  /** Undoes the whole transaction: inverse steps, reversed. */
  inverse: Transaction;
}

export const applyTransaction = (
  doc: Doc,
  transaction: Transaction
): AppliedTransaction => {
  let current = doc;
  const inverses: Step[] = [];

  for (const step of transaction.steps) {
    const applied = applyStep(current, step);
    current = applied.doc;
    // Unshift, so undoing runs the inverses in reverse order.
    inverses.unshift(applied.inverse);
  }

  return {
    doc: current,
    selection: transaction.selection,
    inverse: { steps: inverses, origin: "history" },
  };
};

/** Replace a range with a slice — the shape almost every edit reduces to. */
export const replaceRange = (
  from: number,
  to: number,
  slice: Slice
): Step[] => {
  const steps: Step[] = [];
  if (to > from) steps.push({ type: "delete", from, to });
  if (sliceLength(slice) > 0) steps.push({ type: "insert", at: from, slice });
  return steps;
};

/** Convenience for the overwhelmingly common case: replacing a range with plain text. */
export const replaceWithText = (
  from: number,
  to: number,
  text: string
): Step[] => replaceRange(from, to, text === "" ? [] : [textNode(text)]);
