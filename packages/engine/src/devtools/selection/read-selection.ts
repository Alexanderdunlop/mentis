import { nodePath } from "../dom/node-path";
import { textLength } from "../dom/text-length";
import { charOffsetOf } from "./char-offset";
import type { SelectionPoint, SelectionSnapshot } from "./types";

const EMPTY: Omit<SelectionSnapshot, "editorLength"> = {
  exists: false,
  insideEditor: false,
  isCollapsed: true,
  anchor: null,
  focus: null,
  charStart: -1,
  charEnd: -1,
};

const pointOf = (
  root: Element,
  node: Node,
  offset: number
): SelectionPoint => ({
  path: nodePath(root, node),
  offset,
  kind: node.nodeType === Node.TEXT_NODE ? "#text" : node.nodeName.toLowerCase(),
});

export const readSelection = (root: Element): SelectionSnapshot => {
  const selection = window.getSelection();
  const editorLength = textLength(root);

  if (!selection || selection.rangeCount === 0) {
    return { ...EMPTY, editorLength };
  }

  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  const inside = Boolean(
    anchorNode && (root.contains(anchorNode) || anchorNode === root)
  );

  if (!inside || !anchorNode || !focusNode) {
    return { ...EMPTY, exists: true, editorLength };
  }

  const anchorChar = charOffsetOf(root, anchorNode, anchorOffset);
  const focusChar = charOffsetOf(root, focusNode, focusOffset);

  return {
    exists: true,
    insideEditor: true,
    isCollapsed: selection.isCollapsed,
    anchor: pointOf(root, anchorNode, anchorOffset),
    focus: pointOf(root, focusNode, focusOffset),
    charStart: Math.min(anchorChar, focusChar),
    charEnd: Math.max(anchorChar, focusChar),
    editorLength,
  };
};
