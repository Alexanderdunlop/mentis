import { atomNode, textNode } from "../model/nodes";
import { normalise } from "../model/normalise";
import type { Doc, InlineNode } from "../model/types";
import { isAtomElement, VALUE_ATTR } from "./atom-element";

export interface DomState {
  doc: Doc;
  /** Model position of the caret, or null if it could not be located. */
  caret: number | null;
}

/**
 * Rebuild the model from the DOM.
 *
 * **This is recovery code, and it is the one place the DOM is treated as a source.** It
 * exists solely because composition requires the engine to hand the DOM to the browser for
 * a while (ADR 0009); reading it back is how the model catches up afterwards.
 *
 * That is exactly what mentis v1 does on every keystroke, and the difference is scope: v1
 * has no model to be authoritative, so a DOM quirk is a permanent correctness bug. Here
 * the window is one composition, the browser is the only thing that wrote to it, and the
 * result is immediately re-rendered into canonical form.
 *
 * Structure the browser invented is discarded and only its text kept — a composition
 * wrapper span contributes characters, not nodes. Atoms survive because their value is on
 * the element, which is why `data-mention-value` exists.
 */
export const readDomState = (root: HTMLElement): DomState => {
  const nodes: InlineNode[] = [];
  let position = 0;
  let caret: number | null = null;

  const selection = window.getSelection();
  const anchorNode =
    selection?.anchorNode && root.contains(selection.anchorNode)
      ? selection.anchorNode
      : null;
  const anchorOffset = selection?.anchorOffset ?? 0;

  const pushText = (text: string): void => {
    if (text === "") return;
    nodes.push(textNode(text));
    position += text.length;
  };

  const visit = (node: Node, isTrailingChildOfRoot: boolean): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const { data } = node as Text;
      if (node === anchorNode) {
        caret = position + Math.min(anchorOffset, data.length);
      }
      pushText(data);
      return;
    }

    if (node.nodeName === "BR") {
      // The renderer only ever emits a trailing <br>, which carries no model content.
      if (isTrailingChildOfRoot) return;
      if (node === anchorNode) caret = position;
      pushText("\n");
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE && isAtomElement(node)) {
      const element = node as HTMLElement;
      // An atom is never descended into, so a caret anywhere inside it snaps to an edge.
      if (node === anchorNode || element.contains(anchorNode)) {
        caret = position + (anchorOffset > 0 ? 1 : 0);
      }
      nodes.push(
        atomNode(element.textContent ?? "", element.getAttribute(VALUE_ATTR) ?? "")
      );
      position += 1;
      return;
    }

    // Something the browser inserted. Keep the text, drop the structure.
    visitChildren(node);
  };

  const visitChildren = (parent: Node): void => {
    const children = Array.from(parent.childNodes);

    children.forEach((child, index) => {
      // On an element anchor, `anchorOffset` counts children rather than characters.
      if (parent === anchorNode && anchorOffset === index) caret = position;
      visit(child, parent === root && index === children.length - 1);
    });

    if (parent === anchorNode && anchorOffset >= children.length) caret = position;
  };

  visitChildren(root);

  return { doc: normalise({ nodes }), caret };
};
