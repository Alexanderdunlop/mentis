import { replaceMentionItem } from "./replaceMentionItem";
import type { MentionItem } from "./types";

type ProcessTextWithMentionsProps = {
  trigger: string;
  text: string;
  options: MentionItem[];
};

export const processTextWithMentions = ({
  trigger,
  text,
  options,
}: ProcessTextWithMentionsProps): string => {
  let newText = text;
  for (const option of options) {
    newText = replaceMentionItem({
      trigger,
      text: newText,
      mentionItem: option,
    });
  }
  return newText;
};
