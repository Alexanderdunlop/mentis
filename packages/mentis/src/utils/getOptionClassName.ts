import type { SlotProps } from "../types/MentionInput.types";

export function getOptionClassName(
  idx: number,
  highlightedIndex: number,
  slotsProps?: SlotProps
): string {
  const optionClassName = [
    slotsProps?.option?.className ?? "mention-option",
    idx === highlightedIndex
      ? (slotsProps?.highlightedClassName ?? "mention-option-highlighted")
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  return optionClassName;
}
