export const detectMentionTrigger = (
  text: string,
  caretPosition: number,
  trigger: string
): { isActive: boolean; start: number; query: string } => {
  const lastTriggerIndex = text.lastIndexOf(trigger, caretPosition - 1);

  if (lastTriggerIndex === -1) {
    return { isActive: false, start: -1, query: "" };
  }

  const textAfterTrigger = text.substring(lastTriggerIndex + 1, caretPosition);
  const hasSpace = textAfterTrigger.includes(" ");

  if (hasSpace) {
    return { isActive: false, start: -1, query: "" };
  }

  return {
    isActive: true,
    start: lastTriggerIndex,
    query: textAfterTrigger.toLowerCase(),
  };
};
