import { describe, it, expect, vi, beforeEach } from "vitest";
import { processInput } from "../input-processor";

describe("processInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle insertText input type", async () => {
    const result = await processInput({
      inputType: "insertText",
      text: "hello",
      currentText: "world",
      currentPosition: 5,
      selectionRange: { startIndex: 5, endIndex: 5 },
    });

    expect(result).toEqual({
      newText: "hello",
      startIndex: 5,
      endIndex: 5,
      type: "INSERT",
    });
  });

  it("should handle insertText with empty data", async () => {
    const result = await processInput({
      inputType: "insertText",
      text: "",
      currentText: "world",
      currentPosition: 3,
      selectionRange: { startIndex: 3, endIndex: 3 },
    });

    expect(result).toEqual({
      newText: "",
      startIndex: 3,
      endIndex: 3,
      type: "INSERT",
    });
  });

  it("should handle deleteContentBackward input type", async () => {
    const result = await processInput({
      inputType: "deleteContentBackward",
      text: "",
      currentText: "hello world",
      currentPosition: 6,
      selectionRange: { startIndex: 5, endIndex: 6 },
    });

    expect(result).toEqual({
      newText: " ",
      startIndex: 5,
      endIndex: 6,
      type: "DELETE",
    });
  });

  it("should handle deleteContentBackward at beginning of text", async () => {
    const result = await processInput({
      inputType: "deleteContentBackward",
      text: "",
      currentText: "hello",
      currentPosition: 0,
      selectionRange: { startIndex: -1, endIndex: 0 },
    });

    expect(result).toEqual({
      newText: "",
      startIndex: -1,
      endIndex: 0,
      type: "DELETE",
    });
  });

  it("should handle deleteContentForward input type", async () => {
    const result = await processInput({
      inputType: "deleteContentForward",
      text: "",
      currentText: "hello world",
      currentPosition: 5,
      selectionRange: { startIndex: 5, endIndex: 6 },
    });

    expect(result).toEqual({
      newText: " ",
      startIndex: 5,
      endIndex: 6,
      type: "DELETE",
    });
  });

  it("should handle deleteContentForward at end of text", async () => {
    const result = await processInput({
      inputType: "deleteContentForward",
      text: "",
      currentText: "hello",
      currentPosition: 5,
      selectionRange: { startIndex: 5, endIndex: 6 },
    });

    expect(result).toEqual({
      newText: "",
      startIndex: 5,
      endIndex: 6,
      type: "DELETE",
    });
  });

  it("should handle insertFromPaste input type", async () => {
    const mockClipboardText = "pasted text";
    vi.spyOn(navigator.clipboard, "readText").mockResolvedValue(
      mockClipboardText
    );

    const result = await processInput({
      inputType: "insertFromPaste",
      text: "",
      currentText: "hello world",
      currentPosition: 6,
      selectionRange: { startIndex: 6, endIndex: 6 },
    });

    expect(result).toEqual({
      newText: "pasted text",
      startIndex: 6,
      endIndex: 6,
      type: "INSERT",
    });

    expect(navigator.clipboard.readText).toHaveBeenCalledOnce();
  });

  it("should handle insertFromPaste with empty clipboard", async () => {
    vi.spyOn(navigator.clipboard, "readText").mockResolvedValue("");

    const result = await processInput({
      inputType: "insertFromPaste",
      text: "",
      currentText: "hello world",
      currentPosition: 6,
      selectionRange: { startIndex: 6, endIndex: 6 },
    });

    expect(result).toEqual({
      newText: "",
      startIndex: 6,
      endIndex: 6,
      type: "INSERT",
    });
  });

  it("should handle unhandled input types with fallback", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await processInput({
      inputType: "insertFromDrop",
      text: "",
      currentText: "hello world",
      currentPosition: 6,
      selectionRange: { startIndex: 6, endIndex: 6 },
    });

    expect(result).toEqual({
      newText: "hello world",
      startIndex: 6,
      endIndex: 6,
      type: "FALLBACK",
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Unhandled input type:",
      "insertFromDrop"
    );
  });

  it("should handle insertText with null data", async () => {
    const result = await processInput({
      inputType: "insertText",
      text: "",
      currentText: "world",
      currentPosition: 5,
      selectionRange: { startIndex: 5, endIndex: 5 },
    });

    expect(result).toEqual({
      newText: "",
      startIndex: 5,
      endIndex: 5,
      type: "INSERT",
    });
  });

  it("should handle deleteContentBackward with single character", async () => {
    const result = await processInput({
      inputType: "deleteContentBackward",
      text: "",
      currentText: "hello",
      currentPosition: 5,
      selectionRange: { startIndex: 4, endIndex: 5 },
    });

    expect(result).toEqual({
      newText: "o",
      startIndex: 4,
      endIndex: 5,
      type: "DELETE",
    });
  });

  it("should handle deleteContentForward with single character", async () => {
    const result = await processInput({
      inputType: "deleteContentForward",
      text: "",
      currentText: "hello",
      currentPosition: 0,
      selectionRange: { startIndex: 0, endIndex: 1 },
    });

    expect(result).toEqual({
      newText: "h",
      startIndex: 0,
      endIndex: 1,
      type: "DELETE",
    });
  });

  it("should handle insertText with selection range", async () => {
    const result = await processInput({
      inputType: "insertText",
      text: "new",
      currentText: "hello world",
      currentPosition: 6,
      selectionRange: { startIndex: 0, endIndex: 5 },
    });

    expect(result).toEqual({
      newText: "new",
      startIndex: 0,
      endIndex: 5,
      type: "REPLACE",
    });
  });

  it("should handle insertFromPaste with selection range", async () => {
    const mockClipboardText = "replacement";
    vi.spyOn(navigator.clipboard, "readText").mockResolvedValue(
      mockClipboardText
    );

    const result = await processInput({
      inputType: "insertFromPaste",
      text: "",
      currentText: "hello world",
      currentPosition: 6,
      selectionRange: { startIndex: 6, endIndex: 11 },
    });

    expect(result).toEqual({
      newText: "replacement",
      startIndex: 6,
      endIndex: 11,
      type: "REPLACE",
    });
  });
});
