import { canCoalesce, mergeEntries } from "./coalesce";
import type { EditShape, HistoryEntry, HistoryState } from "./types";

/** Bounded so a long session cannot grow memory without limit. */
export const DEFAULT_MAX_DEPTH = 200;

interface RecordOptions {
  maxDepth?: number;
  maxGapMs?: number;
}

/**
 * Add an edit to the history.
 *
 * Recording **clears the redo branch**. Editing after an undo abandons the future that
 * was undone — keeping it would let redo replay steps whose positions no longer refer to
 * anything in the current document.
 */
export const record = (
  state: HistoryState,
  entry: HistoryEntry,
  shape: EditShape,
  { maxDepth = DEFAULT_MAX_DEPTH, maxGapMs }: RecordOptions = {}
): HistoryState => {
  const previous = state.done[state.done.length - 1];

  const done = canCoalesce(previous, shape, entry.at, { maxGapMs })
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
