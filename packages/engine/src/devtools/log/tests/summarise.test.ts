import { describe, expect, it } from "vitest";
import { modifierGlyphs, quoted } from "../summarise";

/**
 * These stayed pure through the split, so they run with no DOM. `modifierGlyphs` only
 * reads four booleans off the event, hence the cast rather than a real KeyboardEvent.
 */
const keyEvent = (mods: Partial<KeyboardEvent>): KeyboardEvent =>
  ({
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...mods,
  }) as KeyboardEvent;

describe("quoted", () => {
  it("distinguishes null from an empty string", () => {
    expect(quoted(null)).toBe("null");
    expect(quoted("")).toBe('""');
  });

  it("makes whitespace visible, so a space is not mistaken for nothing", () => {
    expect(quoted(" ")).toBe('"·"');
    expect(quoted("\n")).toBe('"⏎"');
  });

  it("quotes ordinary text", () => {
    expect(quoted("hi")).toBe('"hi"');
  });
});

describe("modifierGlyphs", () => {
  it("is empty with no modifiers", () => {
    expect(modifierGlyphs(keyEvent({}))).toBe("");
  });

  it("renders single modifiers", () => {
    expect(modifierGlyphs(keyEvent({ metaKey: true }))).toBe("⌘");
    expect(modifierGlyphs(keyEvent({ ctrlKey: true }))).toBe("⌃");
    expect(modifierGlyphs(keyEvent({ altKey: true }))).toBe("⌥");
    expect(modifierGlyphs(keyEvent({ shiftKey: true }))).toBe("⇧");
  });

  it("orders combinations the way keyboard shortcuts are written", () => {
    expect(modifierGlyphs(keyEvent({ metaKey: true, shiftKey: true }))).toBe("⌘⇧");
    expect(modifierGlyphs(keyEvent({ ctrlKey: true, altKey: true }))).toBe("⌃⌥");
  });
});
