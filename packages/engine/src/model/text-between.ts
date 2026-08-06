import { sliceBetween, sliceText } from "./slice-between";
import type { Doc } from "./types";

/**
 * Visible text in a range.
 *
 * Goes through `sliceBetween` rather than slicing `docText`, because `from`/`to` are
 * positions and `docText` is characters — the two coordinate spaces diverge as soon as
 * the document contains an atom.
 */
export const textBetween = (doc: Doc, from: number, to: number): string =>
  sliceText(sliceBetween(doc, from, to));
