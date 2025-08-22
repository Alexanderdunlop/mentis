import type { ContentEditableElement } from "../platform/types";
import type { MentionCoreAPI } from "../core/types";
import { processInput } from "./input-processor";

type HandleInputProps = {
  e: Event;
  contentEditable: ContentEditableElement;
  core: MentionCoreAPI;
};

export const handleInput = async ({
  e,
  contentEditable,
  core,
}: HandleInputProps): Promise<void> => {
  e.preventDefault();

  const inputEvent = e as InputEvent;
  const currentText = contentEditable.api.getText();
  const currentPosition = contentEditable.api.getCursorPosition();
  const selectionRange = contentEditable.api.getSelectionRange();

  const { newText, startIndex, endIndex, type } = await processInput({
    inputType: inputEvent.inputType,
    text: inputEvent.data || "",
    currentText,
    currentPosition,
    selectionRange,
  });

  switch (type) {
    case "INSERT":
      core.insertText(newText, startIndex);
      break;
    case "DELETE":
      core.deleteText(startIndex, endIndex);
      break;
    case "REPLACE":
      core.deleteText(startIndex, endIndex);
      core.insertText(newText, startIndex);
      break;
    default:
      // Fallback: sync everything
      core.setState({ text: newText, cursorPosition: endIndex });
      break;
  }

  const updatedState = core.getState();

  contentEditable.api.setText(updatedState.text);
  contentEditable.api.setCursorPosition(updatedState.cursorPosition);

  //   TODO: Add mention triggers
  //     // Check for mention triggers after the change
  //     const query = core.detectMentionQuery(position, triggers);
  //     if (query) {
  //       // Emit trigger detected event for UI layer to handle
  //       core.emit('mentionTriggerDetected', query);
  //     }
};

// const handleInput = useCallback((e: Event) => {
//   }, [triggers]);
