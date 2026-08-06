import type { Editor } from "../src/editor/types";
import { need } from "./need";

/**
 * Undo/redo buttons plus a live depth readout.
 *
 * The keyboard route (⌘Z / ⌘⇧Z / Ctrl+Y) is handled inside the engine, not here — unlike
 * the mention dropdown's keys. Undo is editing, so it belongs to the engine; see ADR 0007
 * for why it cannot wait for a `historyUndo` beforeinput that may never arrive.
 */
export const bindHistoryControls = (getEditor: () => Editor | null) => {
  const undoButton = need<HTMLButtonElement>("#undo");
  const redoButton = need<HTMLButtonElement>("#redo");
  const depth = need("#history-depth");

  undoButton.addEventListener("click", () => {
    const editor = getEditor();
    editor?.undo();
    editor?.element.focus();
  });

  redoButton.addEventListener("click", () => {
    const editor = getEditor();
    editor?.redo();
    editor?.element.focus();
  });

  const refresh = (): void => {
    const editor = getEditor();
    if (!editor) {
      undoButton.disabled = true;
      redoButton.disabled = true;
      depth.textContent = "engine detached";
      return;
    }

    const history = editor.getHistory();
    undoButton.disabled = !history.canUndo;
    redoButton.disabled = !history.canRedo;
    depth.textContent = `${history.depth} undo ${history.depth === 1 ? "step" : "steps"}`;
  };

  return { refresh };
};
