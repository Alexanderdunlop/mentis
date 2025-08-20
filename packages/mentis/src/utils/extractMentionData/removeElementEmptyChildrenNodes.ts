import { checkIfNodeIsEmptyText } from "./checkIfNodeIsEmptyText";

const removeEmptyChildNodes = (
  parent: HTMLElement | Node,
  nodes: Node[]
): void => {
  nodes.forEach((node) => {
    // If the node is empty, remove it
    const isEmpty = checkIfNodeIsEmptyText(node);
    if (isEmpty) {
      parent.removeChild(node);
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const childNodes = Array.from(node.childNodes);
      removeEmptyChildNodes(node, childNodes);
    }

    const isEmptyAfterDeleting = checkIfNodeIsEmptyText(node);
    if (isEmptyAfterDeleting) {
      parent.removeChild(node);
    }
  });
};

export const removeElementEmptyChildrenNodes = (parent: HTMLElement): void => {
  const childNodes = Array.from(parent.childNodes);
  removeEmptyChildNodes(parent, childNodes);
};
