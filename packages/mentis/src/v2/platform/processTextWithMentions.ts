import { replaceMentionItem } from "./replaceMentionItem";

export type MentionItem = {
  label: string;
  value: string;
};

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
