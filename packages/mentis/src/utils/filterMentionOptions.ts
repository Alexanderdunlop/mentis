import type { MentionOption } from "../types/MentionInput.types";

export const filterMentionOptions = (
  options: MentionOption[],
  query: string
): MentionOption[] => {
  if (!query) return options;
  return options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  );
};
