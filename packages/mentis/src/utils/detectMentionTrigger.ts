import { detectMentionTriggerWithDOM } from "./detectMentionTriggerWithDOM";

type DetectMentionTriggerProps = {
  text: string;
  caretPosition: number;
  trigger: string;
  chipClassName: string;
  element?: HTMLElement;
};

type DetectMentionTriggerResult = {
  isActive: boolean;
  start: number;
  query: string;
};

export const detectMentionTrigger = ({
  text,
  caretPosition,
  trigger,
  chipClassName,
  element,
}: DetectMentionTriggerProps): DetectMentionTriggerResult => {
  // If element is provided, we need to be more careful about chip boundaries
  if (element) {
    return detectMentionTriggerWithDOM({
      text,
      caretPosition,
      trigger,
      element,
      chipClassName,
    });
  }

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
