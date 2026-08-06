import { exec, modifySelection } from "./edit-primitives";
import type { Modifiers } from "./types";

/**
 * What the browser would have done by default, had the keydown not been prevented.
 *
 * Keys absent from this switch — Escape, Tab — are ones the browser does nothing with
 * inside a contenteditable. The engine's own keydown listener is their only consumer.
 */
export const performNativeAction = (key: string, mods: Modifiers): void => {
  const granularity = mods.alt || mods.ctrl ? "word" : "character";
  const alter = mods.shift ? "extend" : "move";

  switch (key) {
    case "Enter":
      exec(mods.shift ? "insertLineBreak" : "insertParagraph");
      return;
    case "Backspace":
      if (mods.alt || mods.ctrl) modifySelection("extend", "backward", "word");
      exec("delete");
      return;
    case "Delete":
      if (mods.alt || mods.ctrl) modifySelection("extend", "forward", "word");
      exec("forwardDelete");
      return;
    case "ArrowLeft":
      modifySelection(alter, "backward", granularity);
      return;
    case "ArrowRight":
      modifySelection(alter, "forward", granularity);
      return;
    case "ArrowUp":
      modifySelection(alter, "backward", "line");
      return;
    case "ArrowDown":
      modifySelection(alter, "forward", "line");
      return;
    case "Home":
      modifySelection(alter, "backward", "lineboundary");
      return;
    case "End":
      modifySelection(alter, "forward", "lineboundary");
      return;
    case "a":
      if (mods.ctrl || mods.meta) exec("selectAll");
      return;
    case "z":
      if (mods.ctrl || mods.meta) exec(mods.shift ? "redo" : "undo");
      return;
    case "y":
      if (mods.ctrl) exec("redo");
      return;
    default:
      return;
  }
};
