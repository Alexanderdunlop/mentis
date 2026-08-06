import type { Doc, Slice } from "../types";

/**
 * The only two ways a document may change. Everything else — typing, paste, Enter,
 * word delete, inserting a mention — is a sequence of these.
 *
 * `insert` carries a **slice**, not a string, so that the inverse of a delete can restore
 * atoms. A string-based inverse brings a mention back as plain text: silently, and only
 * on undo, which is the worst possible place to find that bug.
 */
export type Step =
  | { type: "insert"; at: number; slice: Slice }
  | { type: "delete"; from: number; to: number };

export interface AppliedStep {
  doc: Doc;
  /** The step that undoes this one, against the resulting doc. */
  inverse: Step;
}
