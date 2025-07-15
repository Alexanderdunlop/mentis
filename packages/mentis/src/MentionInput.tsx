import React, { useState, useRef, type ChangeEvent, useMemo } from "react";
import "./MentionInput.css";

export type MentionOption = {
  label: string;
  value: string;
};

type MentionInputProps = {
  defaultValue?: string;
  options: MentionOption[];
  onChange?: (value: string) => void;
};

export const MentionInput: React.FC<MentionInputProps> = ({
  defaultValue = "",
  options,
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
    <div className="mention-input-container">
      <input
        ref={inputRef}
        className="mention-input"
        value={value}
        placeholder="Type @ to mention someone"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-controls={showModal ? "mention-listbox" : undefined}
        aria-activedescendant={
          showModal && filteredOptions.length > 0
            ? `mention-option-${filteredOptions[highlightedIndex].value}`
            : undefined
        }
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={showModal}
      />
      {showModal && (
        <div
          id="mention-listbox"
          role="listbox"
          className="mention-listbox"
          style={{
            top:
              modalPosition.top -
              (inputRef.current?.getBoundingClientRect().top || 0),
          }}
        >
          {filteredOptions.length === 0 && (
            <div style={{ padding: 8 }}>No items found</div>
          )}
          {filteredOptions.length > 0 &&
            filteredOptions.map((option, idx) => (
              <div
                key={option.value}
                id={`mention-option-${option.value}`}
                role="option"
                aria-selected={idx === highlightedIndex}
                className="mention-option"
                style={{
                  background: idx === highlightedIndex ? "#f0f0f0" : undefined,
                }}
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
