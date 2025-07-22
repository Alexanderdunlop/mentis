import type { SlotProps } from "./SlotProps.types";

export type MentionOption = {
  label: string;
  value: string | Function;
};

export type MentionData = {
  displayText: string;
  rawText: string;
  mentions: Array<{
    label: string;
    value: string;
    startIndex: number;
    endIndex: number;
  }>;
};

export type MentionInputProps = {
  defaultValue?: string;
  options: MentionOption[];
  slotsProps?: SlotProps;
  keepTriggerOnSelect?: boolean;
  trigger?: string;
  autoConvertMentions?: boolean;
  onChange?: (value: MentionData) => void;
};
