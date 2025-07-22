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

describe("Chip deletion", () => {
  test.todo("Should delete chip when pressing backspace after it", async () => {
    render(<MentionInput options={options} />);

    const user = userEvent.setup();

    const editorElement = screen.getByRole("combobox");
    await user.click(editorElement);

    await user.type(editorElement, "@");
    expect(editorElement).toHaveTextContent("@");

    const modal = screen.getByRole("listbox");
    expect(modal).toBeInTheDocument();

    const johnOption = screen.getByText("John Doe");
    await user.click(johnOption);

    expect(editorElement).toHaveTextContent("@John Doe");
    expect(modal).not.toBeInTheDocument();

    await user.click(editorElement);
    await user.keyboard("{Backspace}");
    await user.keyboard("{Backspace}");
    expect(editorElement).toBeEmptyDOMElement();

    // TODO: Finish this test
    // NOTE: This doesn't work as the cursor is not working properly
  });

  test.todo("Should delete chip when typing inside it");

  test.todo("Should not delete chip when typing after the space");

  test.todo("Should not delete chip when deleting space after it");

  test.todo("Adding styles to the chip should not affect the deletion");
});
