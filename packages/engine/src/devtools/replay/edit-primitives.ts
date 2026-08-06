/**
 * The two browser APIs that can move a caret or edit text on our behalf.
 *
 * `execCommand` is deprecated, and used anyway: it is the only in-page way to produce a
 * *genuine* `beforeinput`/`input` pair that respects the selection and participates in
 * the native undo stack. See docs/notes/contenteditable-traps.md.
 *
 * `Selection.modify` is non-standard but supported in all three engines — it originated
 * in WebKit.
 */

export const exec = (command: string, value?: string): boolean => {
  try {
    return document.execCommand(command, false, value);
  } catch {
    return false;
  }
};

type SelectionWithModify = Selection & {
  modify?: (alter: string, direction: string, granularity: string) => void;
};

export const modifySelection = (
  alter: "move" | "extend",
  direction: "forward" | "backward",
  granularity: string
): void => {
  const selection = window.getSelection() as SelectionWithModify | null;
  selection?.modify?.(alter, direction, granularity);
};
