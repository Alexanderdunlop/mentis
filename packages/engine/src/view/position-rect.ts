import type { Doc } from "../model/types";
import { modelToDom } from "./model-to-dom";

/**
 * Where a model position is on screen, for placing a dropdown.
 *
 * A collapsed `Range` reports no client rects in some engines, so this falls back to the
 * rect of the containing node. Returns null only when the position cannot be mapped at
 * all, which callers should treat as "don't move the menu" rather than "put it at 0,0".
 */
export const positionRect = (
  root: HTMLElement,
  doc: Doc,
  position: number
): DOMRect | null => {
  const point = modelToDom(root, doc, position);

  const range = document.createRange();
  try {
    range.setStart(point.node, point.offset);
    range.collapse(true);
  } catch {
    return null;
  }

  const rects = range.getClientRects();
  if (rects.length > 0) return rects[0]!;

  const fallback =
    point.node.nodeType === Node.TEXT_NODE
      ? point.node.parentElement
      : (point.node as Element);

  return fallback?.getBoundingClientRect() ?? null;
};
