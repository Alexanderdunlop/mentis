import type React from "react";

export type MentionOption = {
  label: string;
  value: string;
};

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | "ref"
  | "value"
  | "onChange"
  | "onKeyDown"
  | "aria-controls"
  | "aria-activedescendant"
  | "aria-haspopup"
>;

export type ListboxProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "id" | "role" | "style"
>;

export type OptionProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "id" | "key" | "role" | "style" | "aria-selected" | "onMouseDown"
>;

export type SlotProps = Partial<{
  container: React.HTMLAttributes<HTMLDivElement>;
  input: InputProps;
  listbox: ListboxProps;
  option: OptionProps;
  noOptions: React.HTMLAttributes<HTMLDivElement>;
  highlightedClassName: string;
}>;

export type MentionInputProps = {
  defaultValue?: string;
  options: MentionOption[];
  slotsProps?: SlotProps;
  onChange?: (value: string) => void;
};
