import { insertMention } from "../src/commands/insert-mention";
import type { Editor } from "../src/editor/types";
import { docLength } from "../src/model/doc-length";
import { need } from "./need";
import { PEOPLE } from "./people";


export interface MentionControls {
  setEnabled: (enabled: boolean) => void;
}

export const bindMentionControls = (
  getEditor: () => Editor | null
): MentionControls => {
  const list = need("#mentions");
  const buttons: HTMLButtonElement[] = [];

  for (const person of PEOPLE) {
    const button = document.createElement("button");
    button.textContent = `${person.label} (${person.value})`;

    button.addEventListener("click", () => {
      const editor = getEditor();
      if (!editor) return;

      const { doc, selection } = editor.getState();
      // No selection yet means the editor has never been focused; append instead.
      const end = docLength(doc);
      const range = selection
        ? {
            from: Math.min(selection.anchor, selection.head),
            to: Math.max(selection.anchor, selection.head),
          }
        : { from: end, to: end };

      editor.dispatch(insertMention({ ...person, range }));
      editor.element.focus();
    });

    list.appendChild(button);
    buttons.push(button);
  }

  return {
    setEnabled: (enabled) => {
      for (const button of buttons) button.disabled = !enabled;
    },
  };
};
