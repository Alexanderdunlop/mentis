export const flattenNodes = (
  element: HTMLElement,
  topLevel: boolean
): Node[] => {
  const nodes: Node[] = [];
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      nodes.push(child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childElement = child as HTMLElement;
      console.log("childElement", childElement);
      if (topLevel && childElement.tagName.toLowerCase() === "div") {
        nodes.push(document.createElement("br"));
      } else if (childElement.tagName.toLowerCase() === "span") {
        nodes.push(childElement);
      } else {
        nodes.push(...flattenNodes(childElement, false));
      }
    } else {
      console.log("child", child);
      nodes.push(child);
    }
  }
  return nodes;
};
