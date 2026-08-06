import { replaceRange, type Transaction } from "../model/transaction";
import type { InputIntent } from "./types";

/**
 * Translate one input event into a transaction. Pure: no DOM, no engine state.
 *
 * This is the entire vocabulary of edits the engine understands. An `inputType` absent
 * from these sets returns null, which the caller logs rather than guesses at — silently
 * mishandling an unknown inputType is how editors corrupt documents on platforms the
 * author never tested.
 */

const INSERT_TEXT = new Set([
  "insertText",
  "insertReplacementText",
  "insertFromPaste",
  "insertFromPasteAsQuotation",
  "insertFromDrop",
  "insertFromYank",
  "insertTranspose",
  "insertCompositionText",
]);

const INSERT_NEWLINE = new Set(["insertParagraph", "insertLineBreak"]);

const DELETE_BACKWARD = new Set([
  "deleteContentBackward",
  "deleteWordBackward",
  "deleteSoftLineBackward",
  "deleteHardLineBackward",
]);

const DELETE_FORWARD = new Set([
  "deleteContentForward",
  "deleteWordForward",
  "deleteSoftLineForward",
  "deleteHardLineForward",
]);

/** Ranges the browser hands us wholesale; never widened. */
const DELETE_EXACT = new Set([
  "deleteContent",
  "deleteByCut",
  "deleteByDrag",
  "deleteEntireSoftLine",
]);

const collapsedAt = (position: number): Transaction["selection"] => ({
  anchor: position,
  head: position,
});

const replacement = (
  { range }: InputIntent,
  text: string
): Transaction => ({
  steps: replaceRange(range.from, range.to, text),
  selection: collapsedAt(range.from + text.length),
  origin: "user",
});

const deletion = (from: number, to: number): Transaction => ({
  steps: from === to ? [] : [{ type: "delete", from, to }],
  selection: collapsedAt(from),
  origin: "user",
});

export const transactionFor = (intent: InputIntent): Transaction | null => {
  const { inputType, text, range, rangeFromBrowser, docLength } = intent;

  if (INSERT_TEXT.has(inputType)) return replacement(intent, text ?? "");
  if (INSERT_NEWLINE.has(inputType)) return replacement(intent, "\n");
  if (DELETE_EXACT.has(inputType)) return deletion(range.from, range.to);

  if (DELETE_BACKWARD.has(inputType)) {
    if (range.from !== range.to) return deletion(range.from, range.to);
    // Collapsed and the browser told us nothing: guess one code unit. Wrong for
    // grapheme clusters and word deletes alike, which is precisely why
    // getTargetRanges() is preferred — see ADR 0004. M6 owns the real fix.
    if (rangeFromBrowser) return deletion(range.from, range.to);
    return deletion(Math.max(0, range.from - 1), range.from);
  }

  if (DELETE_FORWARD.has(inputType)) {
    if (range.from !== range.to) return deletion(range.from, range.to);
    if (rangeFromBrowser) return deletion(range.from, range.to);
    return deletion(range.from, Math.min(docLength, range.from + 1));
  }

  return null;
};
