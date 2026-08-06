import type { EditShape, HistoryEntry } from "./types";

/** Long enough to cover a pause for thought, short enough that undo feels granular. */
export const DEFAULT_MAX_GAP_MS = 600;

interface CoalesceOptions {
  maxGapMs?: number;
}

/**
 * Should this edit join the previous undo entry?
 *
 * Three conditions, and each maps to something a user would notice if it were missing:
 *
 *   - **same kind** — typing then deleting is two undo steps, not one
 *   - **adjacent** — this edit began exactly where the last one ended, so moving the caret
 *     and typing elsewhere starts a new step
 *   - **recent** — a pause means a new thought, and undo should land on it
 */
export const canCoalesce = (
  previous: HistoryEntry | undefined,
  incoming: EditShape,
  at: number,
  { maxGapMs = DEFAULT_MAX_GAP_MS }: CoalesceOptions = {}
): boolean => {
  if (!previous) return false;
  if (incoming.kind === "other") return false;
  if (previous.kind !== incoming.kind) return false;
  if (previous.endedAt !== incoming.startedAt) return false;
  return at - previous.at <= maxGapMs;
};

/**
 * Fold an entry into its predecessor.
 *
 * Undo steps go **incoming first**: to unwind two edits you reverse the later one before
 * the earlier, or the earlier one's positions no longer refer to anything.
 */
export const mergeEntries = (
  previous: HistoryEntry,
  incoming: HistoryEntry
): HistoryEntry => ({
  undoSteps: [...incoming.undoSteps, ...previous.undoSteps],
  redoSteps: [...previous.redoSteps, ...incoming.redoSteps],
  selectionBefore: previous.selectionBefore,
  selectionAfter: incoming.selectionAfter,
  kind: previous.kind,
  endedAt: incoming.endedAt,
  at: incoming.at,
});
