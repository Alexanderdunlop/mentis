import type { MentionOptionWithoutFunction } from "../filterOutOptionFunctions";

export const findMentionsInTextWithoutTrigger = (
  text: string,
  options: MentionOptionWithoutFunction[]
): Array<{ match: RegExpExecArray }> => {
  // Pattern 2: Without trigger - match option labels/values as standalone words
  const mentionWithoutTriggerRegex = new RegExp(
    `\\b(${options
      .map((opt) =>
        [opt.label, opt.value]
          .map((val) => val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|")
      )
      .join("|")})\\b`,
    "gi"
  );

  const matches: Array<{ match: RegExpExecArray }> = [];

  let match: RegExpExecArray | null;
  while ((match = mentionWithoutTriggerRegex.exec(text)) !== null) {
    matches.push({ match });
  }

  return matches;
};
