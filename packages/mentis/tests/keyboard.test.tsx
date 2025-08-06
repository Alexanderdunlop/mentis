import React from "react";
import { screen, render } from "@testing-library/react";
import { expect, test } from "vitest";
import { MentionInput } from "../src/components/MentionInput";
import { MentionOption } from "../src/types/MentionInput.types";
import userEvent from "@testing-library/user-event";

const options: MentionOption[] = [
  { label: "John Doe", value: "john" },
  { label: "Jane Smith", value: "jane" },
  { label: "Bob Wilson", value: "bob" },
];

describe("Keyboard functionality", () => {
  test("should call onKeyDown when typing regular characters", async () => {
    const mockOnKeyDown = vi.fn();
    render(<MentionInput options={options} onKeyDown={mockOnKeyDown} />);

    const user = userEvent.setup();
    const editorElement = screen.getByRole("combobox");

    // Type a regular character
    await user.type(editorElement, "a");

    expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
    expect(mockOnKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "a",
        preventDefault: expect.any(Function),
      })
    );
  });

  test("should not call onKeyDown when using arrow keys for navigation with modal open", async () => {
    const mockOnKeyDown = vi.fn();
    render(<MentionInput options={options} onKeyDown={mockOnKeyDown} />);

    const user = userEvent.setup();
    const editorElement = screen.getByRole("combobox");

    // Open modal by typing trigger
    await user.type(editorElement, "@");

    // Verify modal is open
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Clear the mock to only check arrow key calls
    mockOnKeyDown.mockClear();

    // Use arrow keys for navigation
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");

    // onKeyDown should not be called for navigation keys when modal is open
    expect(mockOnKeyDown).not.toHaveBeenCalled();
  });

  test("should call onKeyDown when using arrow keys without modal open", async () => {
    const mockOnKeyDown = vi.fn();
    render(<MentionInput options={options} onKeyDown={mockOnKeyDown} />);

    const user = userEvent.setup();
    const editorElement = screen.getByRole("combobox");

    // Focus the editor without opening modal
    await user.click(editorElement);

    // Use arrow keys when no modal is open
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");

    // onKeyDown should be called for arrow keys when modal is not open
    expect(mockOnKeyDown).toHaveBeenCalledTimes(2);
    expect(mockOnKeyDown).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        key: "ArrowDown",
        preventDefault: expect.any(Function),
      })
    );
    expect(mockOnKeyDown).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        key: "ArrowUp",
        preventDefault: expect.any(Function),
      })
    );
  });

  test("should not prevent Enter, Tab, and Escape when modal is open", async () => {
    const mockOnKeyDown = vi.fn();
    render(<MentionInput options={options} onKeyDown={mockOnKeyDown} />);

    const user = userEvent.setup();
    const editorElement = screen.getByRole("combobox");

    // Open modal by typing trigger
    await user.type(editorElement, "@");

    // Verify modal is open
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Clear the mock to only check specific key calls
    mockOnKeyDown.mockClear();

    // Test Enter key
    await user.keyboard("{Enter}");
    expect(mockOnKeyDown).not.toHaveBeenCalled();

    // Reopen modal
    await user.type(editorElement, "@");
    mockOnKeyDown.mockClear();

    // Test Tab key
    await user.keyboard("{Tab}");
    expect(mockOnKeyDown).not.toHaveBeenCalled();

    // Reopen modal
    await user.type(editorElement, "@");
    mockOnKeyDown.mockClear();

    // Test Escape key
    await user.keyboard("{Escape}");
    expect(mockOnKeyDown).not.toHaveBeenCalled();
  });

  test("Should navigate with arrow keys", async () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
      { label: "Bob Johnson", value: "bob" },
    ];

    render(<MentionInput options={options} />);

    const user = userEvent.setup();
    const editorElement = screen.getByRole("combobox");

    // Open modal by typing trigger
    await user.type(editorElement, "@");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    expect(editorElement).toHaveAttribute(
      "aria-activedescendant",
      "mention-option-john"
    );

    await user.keyboard("{ArrowDown}");
    expect(editorElement).toHaveAttribute(
      "aria-activedescendant",
      "mention-option-jane"
    );

    await user.keyboard("{ArrowDown}");
    expect(editorElement).toHaveAttribute(
      "aria-activedescendant",
      "mention-option-bob"
    );

    await user.keyboard("{ArrowUp}");
    expect(editorElement).toHaveAttribute(
      "aria-activedescendant",
      "mention-option-jane"
    );

    await user.keyboard("{ArrowUp}");
    expect(editorElement).toHaveAttribute(
      "aria-activedescendant",
      "mention-option-john"
    );
  });

  test("Should select option with Tab", async () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
    ];

    const mockOnChange = vi.fn();
    render(<MentionInput options={options} onChange={mockOnChange} />);

    const user = userEvent.setup();
    const editorElement = screen.getByRole("combobox");

    // Open modal by typing trigger
    await user.type(editorElement, "@");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    await user.keyboard("{Tab}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(editorElement).toHaveTextContent("@John Doe");
    expect(mockOnChange).toHaveBeenLastCalledWith({
      displayValue: "@John Doe ",
      dataValue: "john ",
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

  test("Should select option with Enter", async () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
    ];

    const mockOnChange = vi.fn();
    render(<MentionInput options={options} onChange={mockOnChange} />);

    const user = userEvent.setup();
    const editorElement = screen.getByRole("combobox");

    // Open modal by typing trigger
    await user.type(editorElement, "@");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(editorElement).toHaveTextContent("@Jane Smith");
    expect(mockOnChange).toHaveBeenLastCalledWith({
      displayValue: "@Jane Smith ",
      dataValue: "jane ",
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

  test("Should close modal with Escape", async () => {
    const options = [
      { label: "John Doe", value: "john" },
      { label: "Jane Smith", value: "jane" },
    ];

    const mockOnChange = vi.fn();
    render(<MentionInput options={options} onChange={mockOnChange} />);

    const user = userEvent.setup();
    const editorElement = screen.getByRole("combobox");

    // Open modal by typing trigger
    await user.type(editorElement, "@");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(editorElement).toHaveTextContent("@");
    expect(mockOnChange).toHaveBeenCalledWith({
      displayValue: "@",
      dataValue: "@",
      mentions: [],
    });
  });
});
