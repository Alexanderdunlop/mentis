import type { SlotProps } from "./SlotProps.types";

export type MentionOption = {
  label: string;
  value: string;
};

export type MentionInputProps = {
  defaultValue?: string;
  options: MentionOption[];
  slotsProps?: SlotProps;
  keepTriggerOnSelect?: boolean;
  trigger?: string;
  autoConvertMentions?: boolean;
  onChange?: (value: string) => void;
};
