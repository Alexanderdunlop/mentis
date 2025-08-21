import { getTextContent } from "../getTextContent";
import { processInput } from "./processInput";

export const handlePropDataValueChange = (
  editorRef: HTMLDivElement | null,
  dataValue: string
) => {
  if (!editorRef) return;

  const currentText = getTextContent(editorRef);

  if (currentText === dataValue) {
    return;
  }

  if (dataValue === "") {
    // Clear all content including mention chips and ensure truly empty for CSS :empty
    editorRef.innerHTML = "";
    editorRef.textContent = "";
    return;
  }

  editorRef.innerHTML = "";
  editorRef.textContent = dataValue;

  // TODO: Handle chips and mentions
  processInput(editorRef);
};

// const currentData = extractMentionData(editorRef.current);
// if (currentData.dataValue !== dataValue) {
//   if (dataValue === "") {
//     // Clear all content including mention chips and ensure truly empty for CSS :empty
//     editorRef.current.innerHTML = "";
//     editorRef.current.textContent = "";
//   } else {
//     // Reconstruct content from dataValue
//     const reconstructedHTML = reconstructFromDataValue({
//       dataValue,
//       options,
//       trigger,
//       keepTriggerOnSelect,
//       chipClassName,
//     });
//     editorRef.current.innerHTML = reconstructedHTML;
//   }
// }
