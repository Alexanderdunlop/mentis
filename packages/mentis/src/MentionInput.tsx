import React, { useState, useRef, type ChangeEvent } from "react";

export type MentionOption = {
  label: string;
  value: string;
};

type MentionInputProps = {
  options: MentionOption[];
};

export const MentionInput: React.FC<MentionInputProps> = ({ options }) => {
  const [value, setValue] = useState<string>("");
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
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev === 0 ? filteredOptions.length - 1 : prev - 1
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleSelect(filteredOptions[highlightedIndex]);
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

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().startsWith(search.toLowerCase())
  );

  return (
    <div style={{ position: "relative", width: 300 }}>
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type @ to mention someone"
        style={{ width: "100%", padding: 8, fontSize: 16 }}
      />
      {showModal && (
        <div
          style={{
            position: "absolute",
            top:
              modalPosition.top -
              (inputRef.current?.getBoundingClientRect().top || 0),
            left: 0,
            background: "#fff",
            border: "1px solid #ccc",
            textAlign: "left",
            borderRadius: 4,
            zIndex: 100,
            width: "100%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {filteredOptions.length === 0 && (
            <div style={{ padding: 8 }}>No items found</div>
          )}
          {filteredOptions.length > 0 &&
            filteredOptions.map((option, idx) => (
              <div
                key={option.value}
                style={{
                  padding: 8,
                  cursor: "pointer",
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
