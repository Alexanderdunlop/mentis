import { flattenNodes } from "./flattenNodes";
import { removeAllChildNodes } from "./removeAllChildNodes";

export const checkAndRemoveSoloBreakpoint = (element: HTMLElement): void => {
  const nodes = flattenNodes(element, true);

  if (
    nodes.length === 1 &&
    nodes[0] instanceof HTMLElement &&
    nodes[0].tagName.toLowerCase() === "br"
  ) {
    removeAllChildNodes(element);
  }
};
