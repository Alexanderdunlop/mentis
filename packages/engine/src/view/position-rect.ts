import type { Doc } from "../model/types";
import { modelToDom } from "./model-to-dom";

/**
 * Where a model position is on screen, for placing a dropdown.
 *
 * Returns null only when the position cannot be mapped at all, which callers should treat
 * as "don't move the menu" rather than "put it at 0,0".
 */

/** A collapsed range's own rect, or null where the engine reports none. */
const caretRect = (node: Node, offset: number): DOMRect | null => {
  const range = document.createRange();
  try {
    range.setStart(node, offset);
    range.collapse(true);
  } catch {
    return null;
  }
  const rects = range.getClientRects();
  return rects.length > 0 ? rects[0]! : null;
};

/**
 * The caret's position derived from the character *before* it.
 *
 * WebKit reports no client rects for a collapsed range at the end of a text node, and the
 * container's rect is a bad substitute: its `left` is the far left edge, which in an RTL
 * line is the wrong end by the whole width of the editor.
 *
 * Which edge of that character the caret sits on depends on the direction of the text
 * *there* — and that is **measured rather than read off `getComputedStyle`**, because the
 * relevant direction is the bidi run's, not the container's. An RTL word inside an
 * `ltr` container resolves to `direction: ltr` while being laid out right-to-left, so the
 * computed value would pick the wrong edge for exactly the mixed content this is for.
 *
 * The measurement: the caret one character back is at that character's *leading* edge. If
 * that lands on the character's left, text there flows rightward and the caret we want is
 * on the right. Otherwise it flows leftward and we want the left.
 */
const fromPrecedingCharacter = (node: Node, offset: number): DOMRect | null => {
  if (node.nodeType !== Node.TEXT_NODE || offset < 1) return null;

  const leading = caretRect(node, offset - 1);
  if (!leading) return null;

  const span = document.createRange();
  try {
    span.setStart(node, offset - 1);
    span.setEnd(node, offset);
  } catch {
    return null;
  }
  const character = span.getBoundingClientRect();
  if (character.width === 0 && character.height === 0) return null;

  const flowsRightward =
    Math.abs(leading.left - character.left) <=
    Math.abs(leading.left - character.right);
  const x = flowsRightward ? character.right : character.left;

  return new DOMRect(x, character.top, 0, character.height);
};

export const positionRect = (
  root: HTMLElement,
  doc: Doc,
  position: number
): DOMRect | null => {
  const point = modelToDom(root, doc, position);

  const direct = caretRect(point.node, point.offset);
  if (direct) return direct;

  const derived = fromPrecedingCharacter(point.node, point.offset);
  if (derived) return derived;

  // Nothing measurable — an empty editor, or a position with no character behind it. The
  // containing node's rect is the right line; callers get its leading edge.
  const fallback =
    point.node.nodeType === Node.TEXT_NODE
      ? point.node.parentElement
      : (point.node as Element);

  return fallback?.getBoundingClientRect() ?? null;
};
