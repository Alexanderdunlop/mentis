import type { Step } from "../model/steps/types";
import type { ModelSelection } from "../model/types";

/**
 * What kind of edit an entry holds. Only `type` and `delete` ever coalesce; everything
 * else — paste, a mention insertion, a multi-step replacement — is its own undo step.
 */
export type EditKind = "type" | "delete" | "other";

/**
 * Where an edit began and ended, in position space.
 *
 * Both are needed because a backward delete runs the other way: it *starts* at the caret
 * and *ends* before it, so adjacency for a backspace run is "this edit began where the
 * last one ended" only if start and end are tracked separately.
 */
export interface EditShape {
  kind: EditKind;
  startedAt: number;
  endedAt: number;
  /** Positions this edit changed, so a very long run still breaks into steps. */
  size: number;
  /** The single character typed, when there is one. Drives word-boundary grouping. */
  char?: string;
}

export interface HistoryEntry {
  undoSteps: Step[];
  redoSteps: Step[];
  /** Restored on undo, so the caret returns to where the user was. */
  selectionBefore: ModelSelection | null;
  /** Restored on redo. */
  selectionAfter: ModelSelection | null;
  kind: EditKind;
  endedAt: number;
  /** Positions changed across the whole group, after coalescing. */
  size: number;
  /** Last character this group typed, for word-boundary grouping. */
  char?: string;
  /** Caller-supplied timestamp; the history layer never reads a clock itself. */
  at: number;
}

export interface HistoryState {
  done: HistoryEntry[];
  undone: HistoryEntry[];
}

export const emptyHistory = (): HistoryState => ({ done: [], undone: [] });
