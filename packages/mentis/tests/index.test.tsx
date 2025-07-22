import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, vi, describe } from "vitest";
import { MentionInput } from "../src/MentionInput";
import { setupTriggerState } from "./utils/setupTriggerState";

describe("Accessibility", () => {
  test("Should have correct ARIA attributes and placeholder", () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
    ];

    render(<MentionInput options={options} />);

    const editorElement = screen.getByRole("combobox");

    expect(editorElement).toHaveAttribute(
      "data-placeholder",
      "Type @ to mention someone"
    );

    expect(editorElement).toHaveAttribute("aria-autocomplete", "list");
    expect(editorElement).toHaveAttribute("aria-expanded", "false");
    expect(editorElement).toHaveAttribute("aria-haspopup", "listbox");
    expect(editorElement).not.toHaveAttribute("aria-activedescendant");
    expect(editorElement).not.toHaveAttribute("aria-controls");

    fireEvent.focus(editorElement);
    setupTriggerState(editorElement, "@");
    fireEvent.input(editorElement, { target: { textContent: "@" } });

    expect(editorElement).toHaveAttribute("aria-expanded", "true");
    expect(editorElement).toHaveAttribute("aria-controls", "mention-modal");
    expect(editorElement).toHaveAttribute(
      "aria-activedescendant",
      "mention-option-john"
    );

    const modal = screen.getByRole("listbox");
    expect(modal).toHaveAttribute("id", "mention-modal");

    const johnOption = screen.getByText("John Doe");
    const janeOption = screen.getByText("Jane Smith");

    expect(johnOption).toHaveAttribute("role", "option");
    expect(johnOption).toHaveAttribute("id", "mention-option-john");
    expect(johnOption).toHaveAttribute("aria-selected", "true");

    expect(janeOption).toHaveAttribute("role", "option");
    expect(janeOption).toHaveAttribute("id", "mention-option-jane");
    expect(janeOption).toHaveAttribute("aria-selected", "false");
  });
});

describe("Keyboard Navigation", () => {
  test("Should navigate with arrow keys", () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
      { label: "Bob Johnson", value: "bob" },
    ];

    render(<MentionInput options={options} />);

    const editorElement = screen.getByRole("combobox");

    fireEvent.focus(editorElement);
    setupTriggerState(editorElement, "@");
    fireEvent.input(editorElement, { target: { textContent: "@" } });

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    expect(editorElement).toHaveAttribute(
      "aria-activedescendant",
      "mention-option-john"
    );

    fireEvent.keyDown(editorElement, { key: "ArrowDown" });
    expect(editorElement).toHaveAttribute(
      "aria-activedescendant",
      "mention-option-jane"
    );

    fireEvent.keyDown(editorElement, { key: "ArrowDown" });
    expect(editorElement).toHaveAttribute(
      "aria-activedescendant",
      "mention-option-bob"
    );

    fireEvent.keyDown(editorElement, { key: "ArrowUp" });
    expect(editorElement).toHaveAttribute(
      "aria-activedescendant",
      "mention-option-jane"
    );

    fireEvent.keyDown(editorElement, { key: "ArrowUp" });
    expect(editorElement).toHaveAttribute(
      "aria-activedescendant",
      "mention-option-john"
    );
  });

  test("Should select option with Tab", () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
    ];

    const mockOnChange = vi.fn();
    render(<MentionInput options={options} onChange={mockOnChange} />);

    const editorElement = screen.getByRole("combobox");

    fireEvent.focus(editorElement);
    setupTriggerState(editorElement, "@");
    fireEvent.input(editorElement, { target: { textContent: "@" } });

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    fireEvent.keyDown(editorElement, { key: "Tab" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(editorElement).toHaveTextContent("@John Doe");
    expect(mockOnChange).toHaveBeenLastCalledWith({
      displayText: "@John Doe ",
      rawText: "john ",
      mentions: [
        {
          label: "John Doe",
          value: "john",
          startIndex: 0,
          endIndex: 9,
        },
      ],
    });
  });

  test("Should select option with Enter", () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
    ];

    const mockOnChange = vi.fn();
    render(<MentionInput options={options} onChange={mockOnChange} />);

    const editorElement = screen.getByRole("combobox");

    fireEvent.focus(editorElement);
    setupTriggerState(editorElement, "@");
    fireEvent.input(editorElement, { target: { textContent: "@" } });

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    fireEvent.keyDown(editorElement, { key: "ArrowDown" });
    fireEvent.keyDown(editorElement, { key: "Enter" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(editorElement).toHaveTextContent("@Jane Smith");
    expect(mockOnChange).toHaveBeenLastCalledWith({
      displayText: "@Jane Smith ",
      rawText: "jane ",
      mentions: [
        {
          label: "Jane Smith",
          value: "jane",
          startIndex: 0,
          endIndex: 11,
        },
      ],
    });
  });

  test("Should close modal with Escape", () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
    ];

    const mockOnChange = vi.fn();
    render(<MentionInput options={options} onChange={mockOnChange} />);

    const editorElement = screen.getByRole("combobox");

    fireEvent.focus(editorElement);
    setupTriggerState(editorElement, "@");
    fireEvent.input(editorElement, { target: { textContent: "@" } });

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    fireEvent.keyDown(editorElement, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(editorElement).toHaveTextContent("@");
    expect(mockOnChange).toHaveBeenCalledWith({
      displayText: "@",
      rawText: "@",
      mentions: [],
    });
  });
});

describe("Chips", () => {
  test("Adding one chip should show the chip styles", () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
    ];

    const mockOnChange = vi.fn();
    render(<MentionInput options={options} onChange={mockOnChange} />);

    const editorElement = screen.getByRole("combobox");

    fireEvent.focus(editorElement);
    setupTriggerState(editorElement, "@");
    fireEvent.input(editorElement, { target: { textContent: "@" } });

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    const johnOption = screen.getByText("John Doe");
    fireEvent.mouseDown(johnOption);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    const chipElement = editorElement.querySelector(".mention-chip");
    expect(chipElement).toBeInTheDocument();
    expect(chipElement).toHaveAttribute("data-value", "john");
    expect(chipElement).toHaveAttribute("data-label", "John Doe");
    expect(chipElement).toHaveAttribute("contentEditable", "true");
    expect(chipElement).toHaveTextContent("@John Doe");
  });

  test("Should add a space after mention when selecting from dropdown", () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
    ];

    const mockOnChange = vi.fn();
    render(<MentionInput options={options} onChange={mockOnChange} />);

    const editorElement = screen.getByRole("combobox");

    fireEvent.focus(editorElement);
    setupTriggerState(editorElement, "@");
    fireEvent.input(editorElement, { target: { textContent: "@" } });

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    const johnOption = screen.getByText("John Doe");
    fireEvent.mouseDown(johnOption);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    // Check that the onChange was called with a space after the mention
    expect(mockOnChange).toHaveBeenLastCalledWith({
      displayText: "@John Doe ",
      rawText: "john ",
      mentions: [
        {
          label: "John Doe",
          value: "john",
          startIndex: 0,
          endIndex: 9,
        },
      ],
    });
  });

  test("Should delete chip when typing inside it", () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
    ];

    const mockOnChange = vi.fn();
    render(<MentionInput options={options} onChange={mockOnChange} />);

    const editorElement = screen.getByRole("combobox");

    // First, create a chip by selecting an option
    fireEvent.focus(editorElement);
    setupTriggerState(editorElement, "@");
    fireEvent.input(editorElement, { target: { textContent: "@" } });

    const modal = screen.getByRole("listbox");
    const johnOption = screen.getByText("John Doe");
    fireEvent.mouseDown(johnOption);

    // Verify chip was created
    const chipElement = editorElement.querySelector(".mention-chip");
    expect(chipElement).toBeInTheDocument();
    expect(chipElement).toHaveTextContent("@John Doe");

    // Clear the onChange mock to track the deletion
    mockOnChange.mockClear();

    // Simulate clicking inside the chip to focus it and set selection
    fireEvent.click(chipElement!);

    // Set the selection inside the chip to simulate cursor position
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(chipElement!);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Simulate typing inside the chip by firing input on the editor
    fireEvent.input(editorElement, { target: { textContent: "@John DoeX" } });

    // The chip should be deleted and onChange should be called with updated data
    expect(
      editorElement.querySelector(".mention-chip")
    ).not.toBeInTheDocument();
    expect(mockOnChange).toHaveBeenCalledWith({
      displayText: "@John DoeX",
      rawText: "@John DoeX",
      mentions: [],
    });
  });
});
