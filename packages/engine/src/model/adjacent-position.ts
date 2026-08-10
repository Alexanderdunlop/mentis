import { stepBack, stepForward } from "./grapheme-boundary";
import { docLength } from "./doc-length";
import { nodeLength } from "./node-length";
import { isAtom } from "./nodes";
import { resolvePosition } from "./resolve-position";
import type { Doc } from "./types";

/**
 * One *user-perceived character* away, in position space.
 *
 * "One character" means two different things in this document and both are handled here,
 * which is the reason this is a doc-level function rather than a string one:
 *
 *   - **an atom is one position wide** however long its label reads (ADR 0005), so
 *     stepping over a mention is always a step of exactly 1
 *   - **a grapheme is however many code units it takes** — 2 for `👍`, 8 for `👨‍👩‍👧` —
 *     so stepping over one is a step of that many positions
 *
 * This is what [ADR 0004](../../docs/adr/0004-take-edit-ranges-from-the-browser.md) owed.
 * It recorded that our own fallback "guess one position" was *"correct for an atom, which
 * is one position wide, but wrong for a grapheme cluster"*, and left the real fix to M6.
 * Deleting one position back through `👍` leaves a lone surrogate: a `�` the user cannot
 * select, cannot delete, and did not type.
 *
 * The browser's own `getTargetRanges()` is still preferred over all of this, because it
 * resolves word and line boundaries too. These are only for the fallback path.
 */

/*
 * `resolvePosition` puts a position that falls exactly between two nodes at the **end of
 * the earlier one**. That convention is free for `positionBefore`, which wants to look
 * backwards anyway, and is the one thing `positionAfter` has to undo: sitting at a node's
 * end *is* sitting at the start of the next, and the character ahead belongs to that one.
 */

/** The position one character before `at`, or `at` itself at the start of the document. */
export const positionBefore = (doc: Doc, at: number): number => {
  if (at <= 0) return 0;

  const { index, offset } = resolvePosition(doc, at);
  const node = doc.nodes[index];
  if (!node) return Math.max(0, at - 1);

  if (isAtom(node)) return at - 1;
  return at - (offset - stepBack(node.text, offset));
};

/** The position one character after `at`, or `at` itself at the end of the document. */
export const positionAfter = (doc: Doc, at: number): number => {
  const end = docLength(doc);
  if (at >= end) return end;

  const { index, offset } = resolvePosition(doc, at);
  const node = doc.nodes[index];
  if (!node) return end;

  // See above: at a node's trailing edge the next character is the following node's.
  const atTrailingEdge = offset >= nodeLength(node);
  const target = atTrailingEdge ? doc.nodes[index + 1] : node;
  const within = atTrailingEdge ? 0 : offset;
  if (!target) return end;

  if (isAtom(target)) return at + 1;
  return at + (stepForward(target.text, within) - within);
};
