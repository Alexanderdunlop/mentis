import { positionAfter, positionBefore } from "../model/adjacent-position";
import { textNode } from "../model/nodes";
import { sliceLength } from "../model/slice-between";
import { replaceRange, type Transaction } from "../model/transaction";
import type { Slice } from "../model/types";
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
  "insertTranspose",
]);

/**
 * Insertions whose content arrives on a `dataTransfer` rather than in `event.data`, and
 * which therefore insert a **slice** — the only shape that keeps a pasted mention a
 * mention.
 *
 * They are dispatched as commands rather than as user edits, which is what makes
 * `history/types.ts`'s claim that "paste is its own undo step" true rather than
 * aspirational: `editShapeOf` only coalesces `origin: "user"`, so without this a
 * one-character paste would join whatever typing run it landed in.
 */
const CLIPBOARD_INSERT = new Set([
  "insertFromPaste",
  "insertFromPasteAsQuotation",
  "insertFromDrop",
  "insertFromYank",
]);

/*
 * `insertCompositionText` is deliberately absent. Composition is handled through the
 * composition events, which let the browser own the DOM and reconcile afterwards (ADR
 * 0009). Treating a stray one as an insertion would apply the composed text twice, so it
 * is reported as unhandled instead — the engine's standing rule for input it has no rule
 * for.
 */

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

const textSlice = (text: string): Slice => (text === "" ? [] : [textNode(text)]);

const insertion = (
  { range }: InputIntent,
  slice: Slice,
  origin: Transaction["origin"]
): Transaction => ({
  steps: replaceRange(range.from, range.to, slice),
  // Positions, not characters. `sliceText(slice).length` would put the caret past the end
  // of the document the moment a pasted mention was involved — see ADR 0005.
  selection: collapsedAt(range.from + sliceLength(slice)),
  origin,
});

const deletion = (from: number, to: number): Transaction => ({
  steps: from === to ? [] : [{ type: "delete", from, to }],
  selection: collapsedAt(from),
  origin: "user",
});

export const transactionFor = (intent: InputIntent): Transaction | null => {
  const { inputType, text, slice, range, rangeFromBrowser, doc } = intent;

  if (CLIPBOARD_INSERT.has(inputType)) {
    // A transfer we could not read leaves the plain text, which is what `inputText` took
    // off the same event — a paste with no usable payload inserts nothing rather than
    // guessing at one.
    return insertion(intent, slice ?? textSlice(text ?? ""), "program");
  }
  if (INSERT_TEXT.has(inputType)) return insertion(intent, textSlice(text ?? ""), "user");
  if (INSERT_NEWLINE.has(inputType)) return insertion(intent, textSlice("\n"), "user");
  if (DELETE_EXACT.has(inputType)) return deletion(range.from, range.to);

  if (DELETE_BACKWARD.has(inputType)) {
    if (range.from !== range.to) return deletion(range.from, range.to);
    // A collapsed range from the browser means "delete nothing" — that is information,
    // not an omission, and widening it turns a word delete into a character delete.
    if (rangeFromBrowser) return deletion(range.from, range.to);
    // Our own fallback: one *user-perceived character*, which is one position for an atom
    // and however many code units the grapheme takes. ADR 0004 recorded guessing a single
    // position as knowingly wrong here, and this is the fix it deferred to M6.
    return deletion(positionBefore(doc, range.from), range.from);
  }

  if (DELETE_FORWARD.has(inputType)) {
    if (range.from !== range.to) return deletion(range.from, range.to);
    if (rangeFromBrowser) return deletion(range.from, range.to);
    return deletion(range.from, positionAfter(doc, range.from));
  }

  return null;
};
