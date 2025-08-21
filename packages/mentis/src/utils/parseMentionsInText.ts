import { addSpaceIfNeeded } from "./addSpaceIfNeeded";
import { type MentionOptionWithoutFunction } from "./filterOutOptionFunctions";
import { findMentionsInTextWithTrigger } from "./mention/findMentionsInTextWithTrigger";
import { findMentionsInTextWithoutTrigger } from "./mention/findMentionsInTextWithoutTrigger";
import { findPositionsOfMatchingString } from "./paste/findPositionsOfMatchingString";

type ParseMentionsInTextProps = {
  text: string;
  options: MentionOptionWithoutFunction[];
  trigger: string;
  keepTriggerOnSelect: boolean;
  chipClassName: string;
};

export const parseMentionsInText = ({
  text,
  options,
  trigger,
  keepTriggerOnSelect,
  chipClassName,
}: ParseMentionsInTextProps): DocumentFragment => {
  const fragment = document.createDocumentFragment();

  const matches = keepTriggerOnSelect
    ? findMentionsInTextWithTrigger(text, trigger)
    : findMentionsInTextWithoutTrigger(text, options);

  matches.forEach((match) => {
    const positions = findPositionsOfMatchingString(text, match.match[0]);
    console.log("positions", positions);
  });
  // Create regex patterns to match mentions
  // Pattern 1: With trigger (e.g., @Alice, @Bob)
  // const mentionWithTriggerRegex = new RegExp(
  //   `\\${trigger}([a-zA-Z0-9_]+)`,
  //   "g"
  // );
  // // Pattern 2: Without trigger - match option labels/values as standalone words
  // const mentionWithoutTriggerRegex = new RegExp(
  //   `\\b(${options
  //     .map((opt) =>
  //       [opt.label, opt.value]
  //         .map((val) => val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  //         .join("|")
  //     )
  //     .join("|")})\\b`,
  //   "gi"
  // );

  // let lastIndex = 0;
  // let matches: Array<{ match: RegExpExecArray; hasTrigger: boolean }> = [];

  // // Collect all matches with trigger
  // let match: RegExpExecArray | null;
  // while ((match = mentionWithTriggerRegex.exec(text)) !== null) {
  //   matches.push({ match, hasTrigger: true });
  // }

  // console.log("matches", matches);

  // // Collect all matches without trigger (only if keepTriggerOnSelect is false)
  // if (!keepTriggerOnSelect) {
  //   mentionWithoutTriggerRegex.lastIndex = 0;
  //   while ((match = mentionWithoutTriggerRegex.exec(text)) !== null) {
  //     // Check if this match overlaps with any trigger-based match
  //     const overlaps = matches.some(
  //       (m) =>
  //         match!.index < m.match.index + m.match[0].length &&
  //         match!.index + match![0].length > m.match.index
  //     );
  //     if (!overlaps) {
  //       matches.push({ match, hasTrigger: false });
  //     }
  //   }
  // }

  console.log("matches", matches);

  // Sort matches by position
  matches.sort((a, b) => a.match.index - b.match.index);

  // for (const { match } of matches) {
  //   const mentionText = keepTriggerOnSelect ? match[1] : match[0];
  //   const startIndex = match.index;

  //   // Add text before the mention
  //   if (startIndex > lastIndex) {
  //     const beforeText = text.substring(lastIndex, startIndex);
  //     fragment.appendChild(document.createTextNode(beforeText));
  //   } else {
  //     // Find matching option
  //     const matchingOption = options.find(
  //       (option) =>
  //         option.label.toLowerCase() === mentionText.toLowerCase() ||
  //         option.value.toLowerCase() === mentionText.toLowerCase()
  //     );

  //     if (matchingOption) {
  //       // Create mention chip
  //       const mentionElement = document.createElement("span");
  //       mentionElement.className = chipClassName;
  //       mentionElement.contentEditable = "true";
  //       mentionElement.dataset.value = matchingOption.value;
  //       mentionElement.dataset.label = matchingOption.label;
  //       mentionElement.textContent = keepTriggerOnSelect
  //         ? `${trigger}${matchingOption.label}`
  //         : matchingOption.label;

  //       fragment.appendChild(mentionElement);

  //       const spaceNeeded = addSpaceIfNeeded({
  //         text,
  //         startIndex,
  //         matchLength: match[0].length,
  //       });

  //       if (spaceNeeded) {
  //         fragment.appendChild(document.createTextNode(" "));
  //       }
  //     } else {
  //       // If no matching option, keep as plain text
  //       fragment.appendChild(document.createTextNode(match[0]));
  //     }

  //     lastIndex = startIndex + match[0].length;
  //   }
  // }

  // // Add remaining text after the last mention
  // if (lastIndex < text.length) {
  //   const remainingText = text.substring(lastIndex);
  //   const div = document.createElement("div");
  //   div.textContent = remainingText;
  //   fragment.appendChild(div);
  // }

  return fragment;
};
