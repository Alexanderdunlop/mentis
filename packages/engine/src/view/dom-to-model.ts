import { docLength } from "../model/doc-length";
import { nodeLength } from "../model/node-length";
import type { Doc } from "../model/types";
import { domTextNodes } from "./dom-text-nodes";

const lengthOfNodesBefore = (doc: Doc, index: number): number =>
  doc.nodes
    .slice(0, index)
    .reduce((total, node) => total + nodeLength(node), 0);

/**
 * DOM boundary → model position. Returns null when the boundary isn't inside the
 * editor at all, which the caller must treat as "no selection" rather than as zero.
 *
 * Three cases, and the awkward one is the middle:
 *   - inside a text node the renderer owns → offset within its model node
 *   - on the root element → `offset` is a *child index*, not a character offset
 *   - anywhere else (the trailing `<br>`, a stray node) → clamp to the document end
 */
export const domToModel = (
  root: HTMLElement,
  doc: Doc,
  node: Node,
  offset: number
): number | null => {
  if (node !== root && !root.contains(node)) return null;

  if (node.nodeType === Node.TEXT_NODE) {
    const index = domTextNodes(root).indexOf(node as Text);
    if (index === -1) return docLength(doc);
    return lengthOfNodesBefore(doc, index) + offset;
  }

  if (node === root) {
    // Child index, so count whole nodes rather than characters.
    return lengthOfNodesBefore(doc, Math.min(offset, doc.nodes.length));
  }

  return docLength(doc);
};
