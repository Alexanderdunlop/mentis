import type { Doc, ModelRange } from "../model/types";
import { domToModel } from "../view/dom-to-model";

/**
 * The range the browser says the edit applies to, mapped into model coordinates.
 *
 * Worth preferring over our own selection read wherever it exists: the browser has
 * already resolved grapheme clusters, word boundaries, and what an autocorrect
 * replacement is actually replacing. See ADR 0004.
 *
 * Returns null when unavailable — including for the empty array some engines emit for
 * insertion types — and the caller falls back to the current selection.
 */
export const targetRange = (
  root: HTMLElement,
  doc: Doc,
  event: InputEvent
): ModelRange | null => {
  if (typeof event.getTargetRanges !== "function") return null;

  const first = event.getTargetRanges()[0];
  if (!first) return null;

  const start = domToModel(root, doc, first.startContainer, first.startOffset);
  const end = domToModel(root, doc, first.endContainer, first.endOffset);
  if (start === null || end === null) return null;

  return { from: Math.min(start, end), to: Math.max(start, end) };
};
