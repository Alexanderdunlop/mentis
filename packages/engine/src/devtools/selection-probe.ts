import { nodePath, textLength } from "./format";

export interface SelectionPoint {
  path: string;
  offset: number;
  /** `#text`, `br`, or a tag name — what kind of node the boundary sits in. */
  kind: string;
}

export interface SelectionSnapshot {
  exists: boolean;
  insideEditor: boolean;
  isCollapsed: boolean;
  anchor: SelectionPoint | null;
  focus: SelectionPoint | null;
  /** Character offsets into the editor, `<br>` counted as one newline. -1 if unmappable. */
  charStart: number;
  charEnd: number;
  editorLength: number;
}

export const EMPTY_SELECTION: SelectionSnapshot = {
  exists: false,
  insideEditor: false,
  isCollapsed: true,
  anchor: null,
  focus: null,
  charStart: -1,
  charEnd: -1,
  editorLength: 0,
};

/**
 * Map a DOM boundary (node, offset) to a character offset into `root`.
 *
 * Works for both text boundaries and element boundaries (where `offset` is a child
 * index) by cloning the range and measuring it — which sidesteps having to
 * special-case the two boundary flavours ourselves.
 */
export const charOffsetOf = (
  root: Element,
  node: Node,
  offset: number
): number => {
  if (!root.contains(node) && node !== root) return -1;

  const range = document.createRange();
  try {
    range.setStart(root, 0);
    range.setEnd(node, offset);
  } catch {
    return -1;
  }
  return textLength(range.cloneContents());
};

const pointOf = (
  root: Element,
  node: Node | null,
  offset: number
): SelectionPoint | null => {
  if (!node) return null;
  return {
    path: nodePath(root, node),
    offset,
    kind: node.nodeType === Node.TEXT_NODE ? "#text" : node.nodeName.toLowerCase(),
  };
};

export const readSelection = (root: Element): SelectionSnapshot => {
  const selection = window.getSelection();
  const editorLength = textLength(root);

  if (!selection || selection.rangeCount === 0) {
    return { ...EMPTY_SELECTION, editorLength };
  }

  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  const insideEditor = Boolean(
    anchorNode && (root.contains(anchorNode) || anchorNode === root)
  );

  if (!insideEditor || !anchorNode || !focusNode) {
    return { ...EMPTY_SELECTION, exists: true, editorLength };
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

/** Char offsets for a `StaticRange`, as handed to us by `InputEvent.getTargetRanges()`. */
export const charRangeOfStaticRange = (
  root: Element,
  range: StaticRange
): { start: number; end: number } => ({
  start: charOffsetOf(root, range.startContainer, range.startOffset),
  end: charOffsetOf(root, range.endContainer, range.endOffset),
});
