import { docLength } from "../model/doc-length";
import { nodeLength } from "../model/node-length";
import type { Doc } from "../model/types";

const positionOfNodeIndex = (doc: Doc, index: number): number =>
  doc.nodes
    .slice(0, Math.max(0, Math.min(index, doc.nodes.length)))
    .reduce((total, node) => total + nodeLength(node), 0);

/** Walk up until we reach a direct child of the editor, or fall off the top. */
const directChild = (root: HTMLElement, node: Node): Node | null => {
  let current: Node | null = node;
  while (current && current.parentNode !== root) current = current.parentNode;
  return current;
};

const indexOfChild = (root: HTMLElement, child: Node): number =>
  Array.prototype.indexOf.call(root.childNodes, child);

/**
 * DOM boundary → model position. Null when the boundary isn't in the editor at all,
 * which callers must treat as "no selection" rather than as zero.
 *
 * The awkward cases, in order of how often they bite:
 *   - on the root element, `offset` is a **child index**, not a character offset
 *   - inside an atom's text, there is no model position to return — an atom is one
 *     position wide (ADR 0005), so it resolves to whichever of its two edges is nearer.
 *     This is why no separate "push the selection out of an atom" pass is needed:
 *     interior positions are unrepresentable rather than corrected after the fact.
 *   - the trailing `<br>` has no model counterpart at all, so it clamps to the end
 */
export const domToModel = (
  root: HTMLElement,
  doc: Doc,
  node: Node,
  offset: number
): number | null => {
  if (node !== root && !root.contains(node)) return null;

  if (node === root) {
    return positionOfNodeIndex(doc, offset);
  }

  const child = directChild(root, node);
  if (!child) return docLength(doc);

  const index = indexOfChild(root, child);
  if (index === -1) return docLength(doc);

  const modelNode = doc.nodes[index];
  // Past the last model node: the trailing <br>.
  if (!modelNode) return docLength(doc);

  const start = positionOfNodeIndex(doc, index);

  if (modelNode.type === "text" && child === node) {
    return start + Math.min(offset, modelNode.text.length);
  }

  // On or inside an atom. Whether `offset` counts children or label characters, any
  // non-zero value means past the atom's leading edge, so snap forward.
  if (modelNode.type === "atom") return offset > 0 ? start + 1 : start;

  return start;
};
