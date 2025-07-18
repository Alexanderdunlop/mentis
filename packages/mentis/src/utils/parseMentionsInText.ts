import type { MentionOption } from "../types/MentionInput.types";

export const parseMentionsInText = (
  text: string,
  options: MentionOption[],
  trigger: string,
  keepTriggerOnSelect: boolean
): DocumentFragment => {
  const fragment = document.createDocumentFragment();
  
  // Create a regex to match mentions (e.g., @Alice, @Bob)
  const mentionRegex = new RegExp(`\\${trigger}([a-zA-Z0-9_]+)`, 'g');
  
  let lastIndex = 0;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionText = match[1]; // The text after the trigger
    const startIndex = match.index;
    
    // Add text before the mention
    if (startIndex > lastIndex) {
      const beforeText = text.substring(lastIndex, startIndex);
      fragment.appendChild(document.createTextNode(beforeText));
    }
    
    // Find matching option
    const matchingOption = options.find(
      option => option.label.toLowerCase() === mentionText.toLowerCase() ||
                option.value.toLowerCase() === mentionText.toLowerCase()
    );
    
    if (matchingOption) {
      // Create mention chip
      const mentionElement = document.createElement("span");
      mentionElement.className = "mention-chip";
      mentionElement.contentEditable = "false";
      mentionElement.dataset.value = matchingOption.value;
      mentionElement.dataset.label = matchingOption.label;
      mentionElement.textContent = keepTriggerOnSelect
        ? `${trigger}${matchingOption.label}`
        : matchingOption.label;
      
      fragment.appendChild(mentionElement);
    } else {
      // If no matching option, keep as plain text
      fragment.appendChild(document.createTextNode(match[0]));
    }
    
    lastIndex = mentionRegex.lastIndex;
  }
  
  // Add remaining text after the last mention
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    fragment.appendChild(document.createTextNode(remainingText));
  }
  
  return fragment;
};