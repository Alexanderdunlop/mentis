import { replaceWithText, type Transaction } from "../model/transaction";
import type { InputIntent } from "./types";

/**
 * Translate one input event into a transaction. Pure: no DOM, no engine state.
 *
 * This is the entire vocabulary of edits the engine understands. An `inputType` absent
 * from these sets returns null, which the caller reports rather than guesses at — silently
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

const insertion = ({ range }: InputIntent, text: string): Transaction => ({
  steps: replaceWithText(range.from, range.to, text),
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

  if (INSERT_TEXT.has(inputType)) return insertion(intent, text ?? "");
  if (INSERT_NEWLINE.has(inputType)) return insertion(intent, "\n");
  if (DELETE_EXACT.has(inputType)) return deletion(range.from, range.to);

  if (DELETE_BACKWARD.has(inputType)) {
    if (range.from !== range.to) return deletion(range.from, range.to);
    // A collapsed range from the browser means "delete nothing" — that is information,
    // not an omission, and widening it turns a word delete into a character delete.
    if (rangeFromBrowser) return deletion(range.from, range.to);
    // Our own fallback: guess one position. Correct for an atom, which is one position
    // wide, but wrong for a grapheme cluster — see ADR 0004. M6 owns the real fix.
    return deletion(Math.max(0, range.from - 1), range.from);
  }

  if (DELETE_FORWARD.has(inputType)) {
    if (range.from !== range.to) return deletion(range.from, range.to);
    if (rangeFromBrowser) return deletion(range.from, range.to);
    return deletion(range.from, Math.min(docLength, range.from + 1));
  }

  return null;
};
