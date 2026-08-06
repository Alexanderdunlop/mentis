import { describe, expect, it } from "vitest";
import { historyShortcut, type ShortcutEvent } from "../history-shortcut";

const press = (over: Partial<ShortcutEvent>): ShortcutEvent => ({
  key: "z",
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  ...over,
});

describe("historyShortcut", () => {
  it("matches undo on both platforms", () => {
    expect(historyShortcut(press({ metaKey: true }))).toBe("undo");
    expect(historyShortcut(press({ ctrlKey: true }))).toBe("undo");
  });

  it("matches redo with shift", () => {
    expect(historyShortcut(press({ metaKey: true, shiftKey: true }))).toBe("redo");
    expect(historyShortcut(press({ ctrlKey: true, shiftKey: true }))).toBe("redo");
  });

  it("matches Ctrl+Y as redo, the Windows convention", () => {
    expect(historyShortcut(press({ key: "y", ctrlKey: true }))).toBe("redo");
  });

  it("ignores Cmd+Y, which is not a redo binding on macOS", () => {
    expect(historyShortcut(press({ key: "y", metaKey: true }))).toBeNull();
  });

  it("is case-insensitive, since shift capitalises the key", () => {
    expect(historyShortcut(press({ key: "Z", metaKey: true, shiftKey: true }))).toBe(
      "redo"
    );
  });

  it("ignores the key without a modifier", () => {
    expect(historyShortcut(press({}))).toBeNull();
    expect(historyShortcut(press({ shiftKey: true }))).toBeNull();
  });

  it("ignores unrelated shortcuts", () => {
    expect(historyShortcut(press({ key: "a", metaKey: true }))).toBeNull();
    expect(historyShortcut(press({ key: "s", ctrlKey: true }))).toBeNull();
  });
});
