export const findMentionsInTextWithTrigger = (
  text: string,
  trigger: string
): Array<{ match: RegExpExecArray }> => {
  // Create regex patterns to match mentions
  // Pattern 1: With trigger (e.g., @Alice, @Bob)
  const mentionWithTriggerRegex = new RegExp(
    `\\${trigger}([a-zA-Z0-9_]+)`,
    "g"
  );

  const matches: Array<{ match: RegExpExecArray }> = [];

  // Collect all matches with trigger
  let match: RegExpExecArray | null;
  while ((match = mentionWithTriggerRegex.exec(text)) !== null) {
    matches.push({ match });
  }

  return matches;
};
