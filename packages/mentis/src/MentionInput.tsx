import React, { useState, useRef, type ChangeEvent, useMemo } from "react";
import "./MentionInput.css";

export type MentionOption = {
  label: string;
  value: string;
};

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | "ref"
  | "value"
  | "onChange"
  | "onKeyDown"
  | "aria-controls"
  | "aria-activedescendant"
  | "aria-haspopup"
>;

type ListboxProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "id" | "role" | "style"
>;

type OptionProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "id" | "key" | "role" | "style" | "aria-selected" | "onMouseDown"
>;

type SlotProps = Partial<{
  container: React.HTMLAttributes<HTMLDivElement>;
  input: InputProps;
  listbox: ListboxProps;
  option: OptionProps;
  noOptions: React.HTMLAttributes<HTMLDivElement>;
  highlightedClassName: string;
}>;

type MentionInputProps = {
  defaultValue?: string;
  options: MentionOption[];
  slotsProps?: SlotProps;
  onChange?: (value: string) => void;
};

export const MentionInput: React.FC<MentionInputProps> = ({
  defaultValue = "",
  options,
  slotsProps,
  onChange,
}) => {
  const [value, setValue] = useState<string>(defaultValue);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [search, setSearch] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.currentTarget.value;
    setValue(val);
    onChange?.(val);
    const atIndex = val.lastIndexOf("@");
    if (atIndex !== -1) {
      setShowModal(true);
      setSearch(val.slice(atIndex + 1));
      setHighlightedIndex(0); // Reset highlight on new search
      const rect = event.currentTarget.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    } else {
      setShowModal(false);
      setSearch("");
      setHighlightedIndex(0);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showModal || filteredOptions.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev === 0 ? filteredOptions.length - 1 : prev - 1
        );
        break;
      case "Tab":
      case "Enter":
        event.preventDefault();
        handleSelect(filteredOptions[highlightedIndex]);
        break;
      case "Escape":
        setShowModal(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (option: MentionOption) => {
    const input = inputRef.current as HTMLInputElement;
    const start = input.selectionStart ?? 0;
    const atIndex = value.lastIndexOf("@", start - 1);
    if (atIndex !== -1) {
      const before = value.slice(0, atIndex);
      const after = value.slice(start);
      const newValue = `${before}@${option.label} ${after}`;
      setValue(newValue);
      onChange?.(newValue);
      setShowModal(false);
      setSearch("");
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(
          before.length + option.label.length + 2,
          before.length + option.label.length + 2
        );
      }, 0);
    }
  };

  const filteredOptions = useMemo(
    () =>
      options.filter((option) =>
        option.label.toLowerCase().startsWith(search.toLowerCase())
      ),
    [options, search]
  );

  return (
    <div className="mention-input-container" {...slotsProps?.container}>
      <input
        className="mention-input"
        placeholder="Type @ to mention someone"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showModal}
        {...slotsProps?.input}
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-controls={showModal ? "mention-listbox" : undefined}
        aria-activedescendant={
          showModal && filteredOptions.length > 0
            ? `mention-option-${filteredOptions[highlightedIndex].value}`
            : undefined
        }
      />
      {showModal && (
        <div
          className="mention-listbox"
          {...slotsProps?.listbox}
          id="mention-listbox"
          role="listbox"
          style={{
            top:
              modalPosition.top -
              (inputRef.current?.getBoundingClientRect().top || 0),
          }}
        >
          {filteredOptions.length === 0 && (
            <div className="mention-no-options" {...slotsProps?.noOptions}>
              No items found
            </div>
          )}
          {filteredOptions.length > 0 &&
            filteredOptions.map((option, idx) => (
              <div
                className={`${
                  slotsProps?.option?.className ?? "mention-option"
                } ${
                  idx === highlightedIndex
                    ? slotsProps?.highlightedClassName ??
                      "mention-option-highlighted"
                    : ""
                }`}
                {...slotsProps?.option}
                key={option.value}
                id={`mention-option-${option.value}`}
                role="option"
                aria-selected={idx === highlightedIndex}
                onMouseDown={() => handleSelect(option)}
              >
                {option.label}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
