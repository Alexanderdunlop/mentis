import { removeCurrentlySelectedText } from "./removeCurrentlySelectedText";
import { moveCursorToDiv } from "../selection/moveCursorToDiv";
import { parseMentionsInText } from "../parseMentionsInText";
import { type MentionOption } from "../../types/MentionInput.types";
import { filterOutOptionFunctions } from "../filterOutOptionFunctions";

type ProcessPasteProps = {
  editorRef: HTMLDivElement | null;
  clipboardData: DataTransfer;
  options: MentionOption[];
  trigger: string;
  keepTriggerOnSelect: boolean;
  chipClassName: string;
};

export const processPaste = ({
  editorRef,
  clipboardData,
  options,
  trigger,
  keepTriggerOnSelect,
  chipClassName,
}: ProcessPasteProps): void => {
  if (!editorRef) return;

  const text = clipboardData.getData("text/plain");

  console.log("processPaste", text);

  removeCurrentlySelectedText();

  const lines = text.split("\n");

  console.log("lines", lines);

  for (const line of lines) {
    const div = document.createElement("div");
    if (line.trim() === "") {
      const br = document.createElement("br");
      div.appendChild(br);
    } else {
      div.textContent = line;
      const optionsWithoutFunctions = filterOutOptionFunctions(options);
      parseMentionsInText({
        text: line,
        options: optionsWithoutFunctions,
        trigger,
        keepTriggerOnSelect,
        chipClassName,
      });
      // console.log("fragment", fragment);
      // div.appendChild(fragment);
    }
    editorRef.appendChild(div);
    moveCursorToDiv(div);
  }

  console.log(editorRef);
};
