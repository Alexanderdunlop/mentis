import { textLength } from "../dom/text-length";

/**
 * Map a DOM boundary to a character offset into `root`.
 *
 * Handles text boundaries and element boundaries (where `offset` is a child index)
 * uniformly by cloning the range and measuring it, rather than special-casing the two
 * boundary flavours. Measuring uses `textLength`, not `Range.toString()` — see
 * docs/adr/0001-line-breaks-as-newline-characters.md.
 */
export const charOffsetOf = (
  root: Element,
  node: Node,
  offset: number
): number => {
  if (!root.contains(node) && node !== root) return -1;

  const range = document.createRange();
  try {
    range.setStart(root, 0);
    range.setEnd(node, offset);
  } catch {
    return -1;
  }
  return textLength(range.cloneContents());
};

/** Char offsets for a `StaticRange`, as handed over by `InputEvent.getTargetRanges()`. */
export const charRangeOf = (
  root: Element,
  range: StaticRange
): { start: number; end: number } => ({
  start: charOffsetOf(root, range.startContainer, range.startOffset),
  end: charOffsetOf(root, range.endContainer, range.endOffset),
});
