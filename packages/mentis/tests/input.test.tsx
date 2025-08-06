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
  test("Value should be displayed", () => {
    const value = "Hello @john, how are you?";
    render(<MentionInput options={options} displayValue={value} />);

    const editorElement = screen.getByRole("combobox");
    expect(editorElement).toHaveTextContent(value);
  });

  test("Component should update when value prop changes", () => {
    const { rerender } = render(
      <MentionInput options={options} displayValue="Initial text" />
    );

    let editorElement = screen.getByRole("combobox");
    expect(editorElement).toHaveTextContent("Initial text");

    // Update the value prop
    rerender(<MentionInput options={options} displayValue="Updated text" />);
    editorElement = screen.getByRole("combobox");
    expect(editorElement).toHaveTextContent("Updated text");

    // Update to a value with mentions
    rerender(
      <MentionInput options={options} displayValue="Hello @john, how are you?" />
    );
    editorElement = screen.getByRole("combobox");
    expect(editorElement).toHaveTextContent("Hello @john, how are you?");
  });

  test("Component should update when value prop changes to empty string", () => {
    const { rerender } = render(
      <MentionInput options={options} displayValue="Initial text" />
    );

    let editorElement = screen.getByRole("combobox");
    expect(editorElement).toHaveTextContent("Initial text");

    // Update to empty string
    rerender(<MentionInput options={options} displayValue="" />);
    editorElement = screen.getByRole("combobox");
    expect(editorElement).toHaveTextContent("");
  });

  test("onChange should work", async () => {
    const mockOnChange = vi.fn();
    render(<MentionInput options={[]} onChange={mockOnChange} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.type(editorElement, "Hello world");

    expect(mockOnChange).toHaveBeenCalledWith({
      displayValue: "Hello world",
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
      displayValue: "@John Doe ",
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
