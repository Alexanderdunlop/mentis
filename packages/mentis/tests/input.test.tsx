import { test, expect } from "vitest";
import { screen, render } from "@testing-library/react";
import { MentionInput } from "../src/components/MentionInput";
import { MentionOption } from "../src/types/MentionInput.types";
import React from "react";
import userEvent from "@testing-library/user-event";

const options: MentionOption[] = [
  { label: "John Doe", value: "john" },
  { label: "Jane Smith", value: "jane" },
];

describe("Input props", () => {
  test("Default value should be displayed", () => {
    const defaultValue = "Hello @john, how are you?";
    render(<MentionInput options={options} defaultValue={defaultValue} />);

    const editorElement = screen.getByRole("combobox");
    expect(editorElement).toHaveTextContent(defaultValue);
  });

  test("onChange should work", async () => {
    const mockOnChange = vi.fn();
    render(<MentionInput options={[]} onChange={mockOnChange} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.type(editorElement, "Hello world");

    expect(mockOnChange).toHaveBeenCalledWith({
      value: "Hello world",
      dataValue: "Hello world",
      mentions: [],
    });
  });

  test("onChange should work with mentions", async () => {
    const mockOnChange = vi.fn();
    render(<MentionInput options={options} onChange={mockOnChange} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.type(editorElement, "@jo");
    expect(editorElement).toHaveTextContent("@jo");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    const johnOption = screen.getByText("John Doe");
    await user.click(johnOption);

    expect(editorElement).toHaveTextContent("@John Doe");
    expect(modal).not.toBeInTheDocument();

    expect(mockOnChange).toHaveBeenCalledTimes(4);
    expect(mockOnChange).toHaveBeenLastCalledWith({
      value: "@John Doe ",
      dataValue: "john ",
      mentions: [
        { label: "John Doe", value: "john", startIndex: 0, endIndex: 9 },
      ],
    });
  });

  test("Entering text should update the value", async () => {
    render(<MentionInput options={[]} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.type(editorElement, "Hello world");

    expect(editorElement).toHaveTextContent("Hello world");
  });

  test("Should update placeholder when trigger changes", () => {
    const { rerender } = render(<MentionInput options={[]} />);
    let editorElement = screen.getByRole("combobox");
    expect(editorElement).toHaveAttribute(
      "data-placeholder",
      "Type @ to mention someone"
    );

    rerender(<MentionInput options={[]} trigger="#" />);
    editorElement = screen.getByRole("combobox");
    expect(editorElement).toHaveAttribute(
      "data-placeholder",
      "Type # to mention someone"
    );

    rerender(<MentionInput options={[]} trigger="!" />);
    editorElement = screen.getByRole("combobox");
    expect(editorElement).toHaveAttribute(
      "data-placeholder",
      "Type ! to mention someone"
    );
  });

  test("Should support custom data-placeholder via slotsProps", () => {
    const customPlaceholder = "Say something...";
    render(
      <MentionInput
        options={[]}
        slotsProps={{
          contentEditable: {
            "data-placeholder": customPlaceholder,
          },
        }}
      />
    );

    const editorElement = screen.getByRole("combobox");
    expect(editorElement).toHaveAttribute(
      "data-placeholder",
      customPlaceholder
    );
  });
});
