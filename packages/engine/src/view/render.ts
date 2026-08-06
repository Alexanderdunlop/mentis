import { docText } from "../model/doc-text";
import { isAtom } from "../model/nodes";
import type { Doc, InlineNode } from "../model/types";
import {
  createAtomElement,
  isAtomElement,
  updateAtomElement,
} from "./atom-element";

/**
 * Reconcile the DOM to the document. Never assigns `innerHTML`.
 *
 * Invariant the rest of the view depends on: **`doc.nodes[i]` renders as
 * `root.childNodes[i]`**, one for one, in order. Position mapping is index arithmetic
 * because of it.
 *
 * Nodes are patched in place where the kind already matches, so the node identity a live
 * `Range` points at survives an update. Replacing the subtree instead — as mentis v1 and
 * the abandoned v2 branch both did — destroys the selection on every keystroke and makes
 * caret restoration a permanent tax.
 *
 * Line breaks render as `\n` inside a text node under `white-space: pre-wrap`, never as
 * `<br>`; see ADR 0002.
 */
const renderNode = (
  root: HTMLElement,
  node: InlineNode,
  index: number
): void => {
  const existing = root.childNodes[index] ?? null;

  if (isAtom(node)) {
    if (existing && isAtomElement(existing)) {
      updateAtomElement(existing, node);
      return;
    }
    root.insertBefore(createAtomElement(node), existing);
    if (existing) existing.remove();
    return;
  }

  if (existing && existing.nodeType === Node.TEXT_NODE) {
    const text = existing as Text;
    if (text.data !== node.text) text.data = node.text;
    return;
  }

  root.insertBefore(document.createTextNode(node.text), existing);
  if (existing) existing.remove();
};

export const render = (root: HTMLElement, doc: Doc): void => {
  doc.nodes.forEach((node, index) => renderNode(root, node, index));

  let expected = doc.nodes.length;

  // A document ending in a newline needs a trailing <br>, or the browser gives the caret
  // nowhere to sit on the final empty line. It carries no model content and must never be
  // counted by position mapping — see ADR 0002.
  if (docText(doc).endsWith("\n")) {
    const existing = root.childNodes[expected] ?? null;
    if (!existing || existing.nodeName !== "BR") {
      root.insertBefore(document.createElement("br"), existing);
    }
    expected += 1;
  }

  while (root.childNodes.length > expected) {
    root.lastChild?.remove();
  }
};
