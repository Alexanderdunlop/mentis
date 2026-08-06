/**
 * The DOM Text nodes the renderer owns, in order — one per model node.
 *
 * Excludes the trailing `<br>` the renderer may append, which is a rendering artifact
 * with no model counterpart. Position mapping must never count it; see ADR 0002.
 */
export const domTextNodes = (root: Element): Text[] =>
  Array.from(root.childNodes).filter(
    (node): node is Text => node.nodeType === Node.TEXT_NODE
  );
