import type { SlotProps } from "./SlotProps.types";
import type { KeyboardEvent } from "react";

export type MentionOption = {
  label: string;
  value: string | Function;
};

export type MentionData = {
  value: string;
  dataValue: string;
  mentions: Array<{
    label: string;
    value: string;
    startIndex: number;
    endIndex: number;
  }>;
};

export type MentionInputProps = {
  value?: string;
  options: MentionOption[];
  slotsProps?: SlotProps;
  keepTriggerOnSelect?: boolean;
  trigger?: string;
  autoConvertMentions?: boolean;
  onChange?: (value: MentionData) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
};
