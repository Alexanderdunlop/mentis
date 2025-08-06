import type { MentionOption } from "../types/MentionInput.types";

export type ReconstructOptions = {
  dataValue: string;
  options: MentionOption[];
  trigger: string;
  keepTriggerOnSelect: boolean;
  chipClassName: string;
};

export const reconstructFromDataValue = ({
  dataValue,
  options,
  trigger,
  keepTriggerOnSelect,
  chipClassName,
}: ReconstructOptions): string => {
  if (!dataValue) return "";

  // Create a map of option values to their current labels for fast lookup
  const optionMap = new Map<string, string>();
  for (const option of options) {
    if (typeof option.value === "string") {
      optionMap.set(option.value, option.label);
    }
  }

  let result = "";
  let currentIndex = 0;
  
  // Find all mention values in the dataValue string
  // Allow consecutive matches but prevent partial matches within words with separators
  const mentionMatches: Array<{ value: string; index: number; length: number }> = [];
  
  for (const option of options) {
    if (typeof option.value === "string") {
      let searchIndex = 0;
      while (true) {
        const index = dataValue.indexOf(option.value, searchIndex);
        if (index === -1) break;
        
        // Check if this match should be excluded due to being part of a larger word with separators
        const beforeChar = index > 0 ? dataValue[index - 1] : '';
        const afterChar = index + option.value.length < dataValue.length ? dataValue[index + option.value.length] : '';
        
        // Exclude matches that are clearly part of a larger identifier with separators
        // Allow alphanumeric boundaries (for consecutive mentions like "johnjane")
        // But prevent matches within words with underscores, hyphens, etc.
        const hasWordSeparatorBefore = /[_\-.]/.test(beforeChar);
        const hasWordSeparatorAfter = /[_\-.]/.test(afterChar);
        
        // If there are word separators, this is likely part of a larger identifier, so skip
        if (!hasWordSeparatorBefore && !hasWordSeparatorAfter) {
          mentionMatches.push({
            value: option.value,
            index,
            length: option.value.length,
          });
        }
        
        searchIndex = index + 1;
      }
    }
  }

  // Sort matches by their position in the string
  mentionMatches.sort((a, b) => a.index - b.index);

  // Remove overlapping matches, keeping the first occurrence
  const filteredMatches: typeof mentionMatches = [];
  let lastEndIndex = -1;
  
  for (const match of mentionMatches) {
    if (match.index >= lastEndIndex) {
      filteredMatches.push(match);
      lastEndIndex = match.index + match.length;
    }
  }

  // Build the HTML content
  for (const match of filteredMatches) {
    // Add any text before this mention
    if (match.index > currentIndex) {
      result += dataValue.slice(currentIndex, match.index);
    }

    // Add the mention chip
    const currentLabel = optionMap.get(match.value);
    if (currentLabel) {
      const chipContent = keepTriggerOnSelect ? `${trigger}${currentLabel}` : currentLabel;
      result += `<span class="${chipClassName}" data-value="${match.value}" data-label="${currentLabel}" contenteditable="false">${chipContent}</span>`;
    } else {
      // If we can't find the option, just add the value as plain text
      result += match.value;
    }

    currentIndex = match.index + match.length;
  }

  // Add any remaining text after the last mention
  if (currentIndex < dataValue.length) {
    result += dataValue.slice(currentIndex);
  }

  return result;
};