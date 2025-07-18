export type ContentEditableInputCustomProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  | "ref"
  | "contentEditable"
  | "suppressContentEditableWarning"
  | "onInput"
  | "onKeyDown"
  | "onFocus"
  | "onBlur"
  | "onPaste"
>;

export type ModalProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "id" | "role" | "style"
>;

export type OptionProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "id" | "key" | "role" | "style" | "aria-selected" | "onMouseDown"
>;

export type SlotProps = Partial<{
  container: React.HTMLAttributes<HTMLDivElement>;
  contentEditable: ContentEditableInputCustomProps;
  modal: ModalProps;
  option: OptionProps;
  noOptions: React.HTMLAttributes<HTMLDivElement>;
  highlightedClassName: string;
}>;
