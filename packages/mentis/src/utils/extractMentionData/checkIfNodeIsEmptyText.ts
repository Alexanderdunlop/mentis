export const checkIfNodeIsEmptyText = (node: Node): boolean => {
  const children = Array.from(node.childNodes);

  if (children.length !== 0) {
    return false;
  }

  if (node.nodeType === Node.TEXT_NODE && node.textContent === "") {
    return true;
  }

  if (
    node.nodeType === Node.ELEMENT_NODE &&
    node instanceof HTMLElement &&
    node.tagName.toLowerCase() === "div" &&
    node.textContent === ""
  ) {
    return true;
  }

  return false;
};
