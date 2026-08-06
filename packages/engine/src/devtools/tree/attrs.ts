/** Only the attributes that change editing behaviour or identify a node. */
export const renderableAttrs = (element: Element): string => {
  const shown = Array.from(element.attributes).filter(
    (attr) =>
      attr.name === "class" ||
      attr.name === "contenteditable" ||
      attr.name.startsWith("data-")
  );
  return shown.map((attr) => ` ${attr.name}="${attr.value}"`).join("");
};

export const isAtomic = (element: Element): boolean =>
  element.getAttribute("contenteditable") === "false";
