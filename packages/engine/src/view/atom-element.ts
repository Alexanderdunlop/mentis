import type { AtomNode } from "../model/types";

export const ATOM_CLASS = "mention";
export const VALUE_ATTR = "data-mention-value";

/**
 * An atom renders as `contenteditable="false"`, which is what makes browsers treat it as
 * a single indivisible thing: one ArrowRight steps over the whole chip, and Backspace
 * targets all of it. That behaviour is inherited rather than implemented, which is the
 * payoff of ADR 0003 leaving navigation to the browser.
 *
 * The value lives in an attribute so it survives copy as `text/html` — the groundwork
 * for M5, where a mention pasted back must keep its identity rather than its label.
 */
export const createAtomElement = (atom: AtomNode): HTMLElement => {
  const element = document.createElement("span");
  element.className = ATOM_CLASS;
  element.contentEditable = "false";
  element.setAttribute(VALUE_ATTR, atom.value);
  element.textContent = atom.label;
  return element;
};

export const isAtomElement = (node: Node): node is HTMLElement =>
  node.nodeType === Node.ELEMENT_NODE &&
  (node as Element).hasAttribute(VALUE_ATTR);

/** Patch in place, so the element identity a Range may point at survives. */
export const updateAtomElement = (element: HTMLElement, atom: AtomNode): void => {
  if (element.getAttribute(VALUE_ATTR) !== atom.value) {
    element.setAttribute(VALUE_ATTR, atom.value);
  }
  if (element.textContent !== atom.label) element.textContent = atom.label;
};
