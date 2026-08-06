const describe = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return "#text";
  if (node.nodeType === Node.COMMENT_NODE) return "#comment";
  return node.nodeName.toLowerCase();
};

/** A readable path from an editor root to `node`, e.g. `root > span[1] > #text[0]`. */
export const nodePath = (root: Node, node: Node | null): string => {
  if (!node) return "—";
  if (node === root) return "root";

  const parts: string[] = [];
  let current: Node | null = node;

  while (current && current !== root) {
    const parent: Node | null = current.parentNode;
    if (!parent) {
      parts.unshift(`${describe(current)}[detached]`);
      break;
    }
    const index = Array.prototype.indexOf.call(parent.childNodes, current);
    parts.unshift(`${describe(current)}[${index}]`);
    current = parent;
  }

  return ["root", ...parts].join(" > ");
};
