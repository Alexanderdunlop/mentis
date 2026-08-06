import { docText } from "../model/doc-text";
import type { Doc } from "../model/types";

/**
 * Reconcile the DOM to the document. Never assigns `innerHTML`.
 *
 * Text nodes are patched in place by assigning `.data`, so the node identity a live
 * `Range` points at survives the update. Replacing the subtree instead — as mentis v1
 * and the abandoned v2 branch both did — destroys the selection on every keystroke and
 * makes caret restoration a permanent tax.
 *
 * The engine renders line breaks as `\n` inside a text node, relying on
 * `white-space: pre-wrap`, rather than emitting `<br>`. That is what keeps the DOM
 * consistent across browsers that disagree about Enter — see ADR 0002.
 */
export const render = (root: HTMLElement, doc: Doc): void => {
  let index = 0;

  for (const node of doc.nodes) {
    const existing = root.childNodes[index];

    if (existing && existing.nodeType === Node.TEXT_NODE) {
      const text = existing as Text;
      if (text.data !== node.text) text.data = node.text;
    } else {
      root.insertBefore(document.createTextNode(node.text), existing ?? null);
    }
    index += 1;
  }

  // A document ending in a newline needs a trailing <br>, or the browser gives the
  // caret nowhere to sit on the final empty line. It carries no model content.
  const needsTrailingBreak = docText(doc).endsWith("\n");
  if (needsTrailingBreak) {
    const existing = root.childNodes[index];
    if (!existing || existing.nodeName !== "BR") {
      root.insertBefore(document.createElement("br"), existing ?? null);
    }
    index += 1;
  }

  while (root.childNodes.length > index) {
    root.lastChild?.remove();
  }
};
