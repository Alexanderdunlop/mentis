export const cleanupEmptyNodes = (container: Node): void => {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node: Node) => {
      const element = node as Element;
      // Remove if empty and not a void element
      if (
        element.textContent?.trim() === "" &&
        !["BR", "IMG", "HR", "INPUT"].includes(element.tagName)
      ) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    },
  });

  const emptyNodes: Node[] = [];
  let node;
  while ((node = walker.nextNode())) {
    emptyNodes.push(node);
  }

  // Remove empty nodes
  emptyNodes.forEach((node) => node.parentNode?.removeChild(node));
};
