import { createEditor } from "../src/editor/create-editor";
import type { Editor } from "../src/editor/types";
import { docText } from "../src/model/doc-text";
import { need } from "./need";

/**
 * Attach and detach the engine at will, so the same editor can be compared against a
 * bare contentEditable without a reload. Detached, the browser handles editing exactly
 * as it did at M0 — which is the fastest way to tell "the engine is wrong" apart from
 * "the browser does that too".
 */
export const bindEngineToggle = (
  element: HTMLElement,
  onChange: (editor: Editor | null) => void
): void => {
  const toggle = need<HTMLInputElement>("#engine");
  let editor: Editor | null = null;

  const attach = (): void => {
    if (editor) return;
    // Carry the current content across, so toggling doesn't wipe what you were testing.
    editor = createEditor({
      element,
      initialText: element.textContent ?? "",
      onUnhandledInput: (inputType) =>
        console.warn("[engine] unhandled inputType:", inputType),
    });
    onChange(editor);
  };

  const detach = (): void => {
    if (!editor) return;
    const text = docText(editor.getState().doc);
    editor.destroy();
    editor = null;
    element.textContent = text;
    onChange(null);
  };

  const sync = (): void => (toggle.checked ? attach() : detach());

  toggle.addEventListener("change", sync);
  sync();
};
