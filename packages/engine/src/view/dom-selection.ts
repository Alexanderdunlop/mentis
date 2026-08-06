import type { Doc, ModelSelection } from "../model/types";
import { domToModel } from "./dom-to-model";
import { modelToDom } from "./model-to-dom";

/**
 * Read the browser's selection into model coordinates.
 *
 * The engine does not intercept caret *movement* — arrows, Home/End, mouse drags and
 * caret browsing are all left to the browser, and this is how their result is collected
 * when an edit needs to know where it lands. See ADR 0003.
 */
export const readSelection = (
  root: HTMLElement,
  doc: Doc
): ModelSelection | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  if (!anchorNode || !focusNode) return null;

  const anchor = domToModel(root, doc, anchorNode, anchorOffset);
  const head = domToModel(root, doc, focusNode, focusOffset);
  if (anchor === null || head === null) return null;

  return { anchor, head };
};

export const writeSelection = (
  root: HTMLElement,
  doc: Doc,
  { anchor, head }: ModelSelection
): void => {
  const selection = window.getSelection();
  if (!selection) return;

  const start = modelToDom(root, doc, anchor);
  const end = modelToDom(root, doc, head);

  const range = document.createRange();
  try {
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
  } catch {
    return;
  }

  selection.removeAllRanges();
  selection.addRange(range);
};
