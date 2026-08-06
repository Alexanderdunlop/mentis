import type { Doc } from "../types";

/**
 * The only two ways a document may change. Everything else — typing, paste, Enter,
 * word delete, replacement — is expressed as a sequence of these.
 *
 * Deliberately minimal: two steps is the smallest set that can express any edit, and
 * every step must be invertible so M3 gets undo by inverting a transaction rather than
 * by snapshotting documents.
 */
export type Step =
  | { type: "insert"; at: number; text: string }
  | { type: "delete"; from: number; to: number };

export interface AppliedStep {
  doc: Doc;
  /** The step that undoes this one, against the resulting doc. */
  inverse: Step;
}
