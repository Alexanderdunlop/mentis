import { isWhitespace } from "../model/is-whitespace";
import type { EditShape, HistoryEntry } from "./types";

/**
 * A genuine "you stopped and did something else" signal, not a typing-speed threshold.
 *
 * An earlier version used 600ms between keystrokes as the primary rule, which made undo
 * depend on how fast you type: `Alex` collapsed to one step typed quickly and split into
 * `Al` + `ex` if you hesitated before the `e`. Same keystrokes, different undo — and
 * untestable, because a Playwright assertion about undo would depend on machine timing.
 */
export const DEFAULT_MAX_IDLE_MS = 3_000;

/** Long runs still break, so one undo cannot swallow a whole paragraph. */
export const DEFAULT_MAX_GROUP_SIZE = 80;

interface CoalesceOptions {
  maxIdleMs?: number;
  maxGroupSize?: number;
}

/**
 * Should this edit join the previous undo entry?
 *
 * The primary rule is **word boundaries**, not timing: whitespace ends a group, attaching
 * to the word it follows, so the next word starts a fresh undo step. That makes undo a
 * function of what was typed rather than of how fast — the same keystrokes always produce
 * the same steps.
 *
 * The remaining conditions each map to something a user would notice if it were missing:
 *
 *   - **same kind** — typing then deleting is two undo steps, not one
 *   - **adjacent** — this edit began exactly where the last one ended, so moving the caret
 *     and typing elsewhere starts a new step
 *   - **not idle** — walking away and coming back should not extend the old group
 *   - **not oversized** — a very long word still breaks up
 */
export const canCoalesce = (
  previous: HistoryEntry | undefined,
  incoming: EditShape,
  at: number,
  { maxIdleMs = DEFAULT_MAX_IDLE_MS, maxGroupSize = DEFAULT_MAX_GROUP_SIZE }: CoalesceOptions = {}
): boolean => {
  if (!previous) return false;
  if (incoming.kind === "other") return false;
  if (previous.kind !== incoming.kind) return false;
  if (previous.endedAt !== incoming.startedAt) return false;
  if (previous.size + incoming.size > maxGroupSize) return false;
  if (at - previous.at > maxIdleMs) return false;

  // Whitespace closes a typing group. Deletion runs group whole, matching what a
  // backspace-and-hold does natively.
  if (previous.char !== undefined && isWhitespace(previous.char)) return false;

  return true;
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
  size: previous.size + incoming.size,
  char: incoming.char,
  at: incoming.at,
});
