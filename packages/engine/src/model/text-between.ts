import { clampPosition } from "./resolve-position";
import { docText } from "./doc-text";
import type { Doc } from "./types";

/** The text in a range, used to build the inverse of a delete step. */
export const textBetween = (doc: Doc, from: number, to: number): string => {
  const start = clampPosition(doc, Math.min(from, to));
  const end = clampPosition(doc, Math.max(from, to));
  return docText(doc).slice(start, end);
};
