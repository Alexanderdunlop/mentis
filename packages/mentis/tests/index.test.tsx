import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { MentionInput } from "../src/MentionInput";
import { setupTriggerState } from "./utils/setupTriggerState";

test("DefaultValue should work", () => {
  const defaultValue = "Hello @john, how are you?";
  render(<MentionInput options={[]} defaultValue={defaultValue} />);

  const editorElement = screen.getByRole("combobox");
  expect(editorElement).toBeInTheDocument();
  expect(editorElement).toHaveTextContent(defaultValue);
});

test("onChange should work", () => {
  const mockOnChange = vi.fn();
  render(<MentionInput options={[]} onChange={mockOnChange} />);

  const editorElement = screen.getByRole("combobox");
  fireEvent.input(editorElement, { target: { textContent: "Hello world" } });

  expect(mockOnChange).toHaveBeenCalledWith("Hello world");
});

test("Entering text should update the value", async () => {
  render(<MentionInput options={[]} />);

  const editorElement = screen.getByRole("combobox");
  fireEvent.input(editorElement, { target: { textContent: "@" } });

  expect(editorElement).toHaveTextContent("@");
});

test("Options should show", () => {
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

  options.forEach((option) => {
    expect(screen.getByText(option.label)).toBeInTheDocument();
  });
});

test("Options should be filtered", () => {
  const options = [
    { label: "John Doe", value: "john" },
    { label: "Jane Smith", value: "jane" },
    { label: "Bob Johnson", value: "bob" },
  ];

  render(<MentionInput options={options} />);

  const editorElement = screen.getByRole("combobox");

  fireEvent.focus(editorElement);
  setupTriggerState(editorElement, "@jo");

  fireEvent.input(editorElement, { target: { textContent: "@jo" } });

  const modal = screen.getByRole("listbox");
  expect(modal).toBeInTheDocument();

  expect(screen.getByText("John Doe")).toBeInTheDocument();
  expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
  expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
});

test("No items should show", () => {
  const options = [
    { label: "John Doe", value: "john" },
    { label: "Jane Smith", value: "jane" },
    { label: "Bob Johnson", value: "bob" },
  ];

  render(<MentionInput options={options} />);

  const editorElement = screen.getByRole("combobox");

  fireEvent.focus(editorElement);
  setupTriggerState(editorElement, "@xyz");

  fireEvent.input(editorElement, { target: { textContent: "@xyz" } });

  const modal = screen.queryByRole("listbox");
  expect(modal).toBeInTheDocument();

  for (const option of options) {
    expect(screen.queryByText(option.label)).not.toBeInTheDocument();
  }

  expect(screen.getByText("No items found")).toBeInTheDocument();
});

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

test("Should select option when clicked", () => {
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

  const janeOption = screen.getByText("Jane Smith");
  fireEvent.mouseDown(janeOption);

  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(editorElement).toHaveTextContent("@Jane Smith");
  expect(mockOnChange).toHaveBeenCalledWith("@Jane Smith ");
});

test("Should select option with keyboard", () => {
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
  expect(mockOnChange).toHaveBeenCalledWith("@Jane Smith ");
});
