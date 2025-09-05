import type { MentionItem } from "./processTextWithMentions";

type ReplaceMentionItemProps = {
  trigger: string;
  text: string;
  mentionItem: MentionItem;
};

export const replaceMentionItem = ({
  trigger,
  text,
  mentionItem,
}: ReplaceMentionItemProps): string => {
  return text.replaceAll(
    `${trigger}${mentionItem.label}`,
    `<span class="mention-chip" data-mention="${mentionItem.label}">${trigger}${mentionItem.label}</span>`
  );
};
