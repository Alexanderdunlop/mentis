import { canCoalesce, mergeEntries } from "./coalesce";
import type { EditShape, HistoryEntry, HistoryState } from "./types";

/** Bounded so a long session cannot grow memory without limit. */
export const DEFAULT_MAX_DEPTH = 200;

interface RecordOptions {
  maxDepth?: number;
  maxIdleMs?: number;
  maxGroupSize?: number;
}

/**
 * Add an edit to the history.
 *
 * Recording **clears the redo branch**. Editing after an undo abandons the future that
 * was undone — keeping it would let redo replay steps whose positions no longer refer to
 * anything in the current document.
 *
 * A transaction that changed **nothing** is not an edit and is not recorded. That is not a
 * defensive check; it is reachable from the keyboard. [ADR
 * 0004](../../docs/adr/0004-take-edit-ranges-from-the-browser.md) reads a collapsed range
 * from the browser as "delete nothing — that is information, not an omission", and
 * Chromium and Firefox *do* fire `deleteContentForward` with one when there is nothing
 * ahead of the caret. So pressing Delete at the end of a document produced a zero-step
 * transaction, and recording it cost the user two things:
 *
 *   - **a dead undo press** — ⌘Z that visibly does nothing, once per keystroke
 *   - **their redo branch**, because recording clears it. Type, undo, press Delete at the
 *     end, press redo: the text was gone for good
 *
 * The second is data loss, which is why this guard is here rather than in the caller.
 */
export const record = (
  state: HistoryState,
  entry: HistoryEntry,
  shape: EditShape,
  { maxDepth = DEFAULT_MAX_DEPTH, maxIdleMs, maxGroupSize }: RecordOptions = {}
): HistoryState => {
  if (entry.undoSteps.length === 0 && entry.redoSteps.length === 0) return state;

  const previous = state.done[state.done.length - 1];

  const done = canCoalesce(previous, shape, entry.at, { maxIdleMs, maxGroupSize })
    ? [...state.done.slice(0, -1), mergeEntries(previous!, entry)]
    : [...state.done, entry];

  return {
    done: done.length > maxDepth ? done.slice(done.length - maxDepth) : done,
    undone: [],
  };
};

export interface HistoryStep {
  state: HistoryState;
  entry: HistoryEntry;
}

export const undo = (state: HistoryState): HistoryStep | null => {
  const entry = state.done[state.done.length - 1];
  if (!entry) return null;

  return {
    entry,
    state: { done: state.done.slice(0, -1), undone: [...state.undone, entry] },
  };
};

export const redo = (state: HistoryState): HistoryStep | null => {
  const entry = state.undone[state.undone.length - 1];
  if (!entry) return null;

  return {
    entry,
    state: { done: [...state.done, entry], undone: state.undone.slice(0, -1) },
  };
};

export const canUndo = (state: HistoryState): boolean => state.done.length > 0;
export const canRedo = (state: HistoryState): boolean => state.undone.length > 0;
