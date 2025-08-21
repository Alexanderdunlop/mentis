import { cleanupEmptyNodes } from "./cleanupEmptyNodes";

export const removeCurrentlySelectedText = (): void => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  // Get the common ancestor to limit our cleanup scope
  const commonAncestor = range.commonAncestorContainer;

  // Delete the contents first
  range.deleteContents();

  // Clean up empty nodes
  cleanupEmptyNodes(commonAncestor);
};
