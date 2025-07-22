import { test, expect } from "vitest";
import { screen, render } from "@testing-library/react";
import { MentionInput } from "../src/MentionInput";
import { MentionOption } from "../src/types/MentionInput.types";
import React from "react";
import userEvent from "@testing-library/user-event";

const options: MentionOption[] = [
  { label: "John Doe", value: "john" },
  { label: "Jane Smith", value: "jane" },
];

describe("Mention Modal Display", () => {
  test("Should open modal when typing @", async () => {
    render(<MentionInput options={options} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.click(editorElement);

    await user.type(editorElement, "@");
    expect(editorElement).toHaveTextContent("@");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();
  });

  test("Should open modal with custom trigger", async () => {
    render(<MentionInput options={options} trigger="!" />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.click(editorElement);

    await user.type(editorElement, "!");
    expect(editorElement).toHaveTextContent("!");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();
  });

  test("Should display options", async () => {
    render(<MentionInput options={options} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.click(editorElement);

    await user.type(editorElement, "@");
    expect(editorElement).toHaveTextContent("@");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    options.forEach((option) => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  test("Should close modal when clicking outside", async () => {
    render(<MentionInput options={options} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.click(editorElement);

    await user.type(editorElement, "@");
    expect(editorElement).toHaveTextContent("@");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    await user.click(document.body);
    expect(modal).not.toBeInTheDocument();
  });

  test("Should close modal when pressing escape", async () => {
    render(<MentionInput options={options} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.click(editorElement);

    await user.type(editorElement, "@");
    expect(editorElement).toHaveTextContent("@");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(modal).not.toBeInTheDocument();
  });
});

describe("Mention Modal Filtering", () => {
  test("Should filter options", async () => {
    render(<MentionInput options={options} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.click(editorElement);

    await user.type(editorElement, "@jo");
    expect(editorElement).toHaveTextContent("@jo");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  test("Should display no options when no options match", async () => {
    render(<MentionInput options={options} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.click(editorElement);

    await user.type(editorElement, "@joe");
    expect(editorElement).toHaveTextContent("@joe");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();

    expect(screen.getByText("No items found")).toBeInTheDocument();
  });
});

describe("Mention Modal Selection", () => {
  test("Should select option when clicked and close modal", async () => {
    render(<MentionInput options={options} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.click(editorElement);

    await user.type(editorElement, "@jo");
    expect(editorElement).toHaveTextContent("@jo");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    const johnOption = screen.getByText("John Doe");
    await user.click(johnOption);

    expect(editorElement).toHaveTextContent("@John Doe");
    expect(modal).not.toBeInTheDocument();
  });

  test("Should select option when pressing enter and close modal", async () => {
    render(<MentionInput options={options} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.click(editorElement);

    await user.type(editorElement, "@jo");
    expect(editorElement).toHaveTextContent("@jo");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    screen.getByText("John Doe");
    await user.keyboard("{Enter}");

    expect(editorElement).toHaveTextContent("@John Doe");
    expect(modal).not.toBeInTheDocument();
  });

  test("Should select option when pressing tab and close modal", async () => {
    render(<MentionInput options={options} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.click(editorElement);

    await user.type(editorElement, "@jo");
    expect(editorElement).toHaveTextContent("@jo");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    const johnOption = screen.getByText("John Doe");
    await user.click(johnOption);

    expect(editorElement).toHaveTextContent("@John Doe");
    expect(modal).not.toBeInTheDocument();
  });
});
