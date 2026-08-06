import { describe, expect, it } from "vitest";
import { parseScript, ReplayParseError } from "../parse-script";
import type { ReplayStep } from "../types";

const text = (chars: string): ReplayStep[] =>
  [...chars].map((char) => ({ kind: "text", char }) as ReplayStep);

const key = (
  name: string,
  mods: Partial<Record<"ctrl" | "meta" | "shift" | "alt", boolean>> = {}
): ReplayStep => ({
  kind: "key",
  key: name,
  mods: { ctrl: false, meta: false, shift: false, alt: false, ...mods },
});

describe("parseScript", () => {
  it("types plain text one character at a time", () => {
    expect(parseScript("hi!")).toEqual(text("hi!"));
  });

  it("returns no steps for an empty script", () => {
    expect(parseScript("")).toEqual([]);
  });

  it("parses named keys", () => {
    expect(parseScript("{Enter}")).toEqual([key("Enter")]);
    expect(parseScript("{Backspace}")).toEqual([key("Backspace")]);
    expect(parseScript("{Escape}")).toEqual([key("Escape")]);
  });

  it("resolves key aliases case-insensitively", () => {
    expect(parseScript("{esc}")).toEqual([key("Escape")]);
    expect(parseScript("{RETURN}")).toEqual([key("Enter")]);
    expect(parseScript("{down}")).toEqual([key("ArrowDown")]);
    expect(parseScript("{arrowleft}")).toEqual([key("ArrowLeft")]);
    expect(parseScript("{del}")).toEqual([key("Delete")]);
  });

  it("parses modifiers, including aliases", () => {
    expect(parseScript("{Ctrl+z}")).toEqual([key("z", { ctrl: true })]);
    expect(parseScript("{cmd+z}")).toEqual([key("z", { meta: true })]);
    expect(parseScript("{Shift+Enter}")).toEqual([key("Enter", { shift: true })]);
    expect(parseScript("{opt+Backspace}")).toEqual([
      key("Backspace", { alt: true }),
    ]);
  });

  it("parses several modifiers at once", () => {
    expect(parseScript("{Ctrl+Shift+z}")).toEqual([
      key("z", { ctrl: true, shift: true }),
    ]);
  });

  it("expands repeats with x and *", () => {
    expect(parseScript("{Backspace x3}")).toEqual([
      key("Backspace"),
      key("Backspace"),
      key("Backspace"),
    ]);
    expect(parseScript("{ArrowLeft*2}")).toEqual([
      key("ArrowLeft"),
      key("ArrowLeft"),
    ]);
  });

  it("repeats a modified key without losing the modifiers", () => {
    expect(parseScript("{Alt+Backspace x2}")).toEqual([
      key("Backspace", { alt: true }),
      key("Backspace", { alt: true }),
    ]);
  });

  it("does not mistake a lone x key for a repeat suffix", () => {
    expect(parseScript("{Ctrl+x}")).toEqual([key("x", { ctrl: true })]);
  });

  it("treats a bare printable character as typing, not a key", () => {
    expect(parseScript("{a}")).toEqual(text("a"));
    expect(parseScript("{Space}")).toEqual(text(" "));
  });

  it("parses waits", () => {
    expect(parseScript("{wait 250}")).toEqual([{ kind: "wait", ms: 250 }]);
    expect(parseScript("{WAIT 0}")).toEqual([{ kind: "wait", ms: 0 }]);
  });

  it("unescapes doubled braces as literal text", () => {
    expect(parseScript("{{")).toEqual(text("{"));
    expect(parseScript("}}")).toEqual(text("}"));
    expect(parseScript("a{{b}}c")).toEqual(text("a{b}c"));
  });

  it("tolerates whitespace inside a token", () => {
    expect(parseScript("{ Enter }")).toEqual([key("Enter")]);
    expect(parseScript("{Backspace   x2}")).toEqual([
      key("Backspace"),
      key("Backspace"),
    ]);
  });

  it("parses a realistic mixed script", () => {
    expect(parseScript("Hi @al{ArrowDown}{Enter}!{Backspace x2}")).toEqual([
      ...text("Hi @al"),
      key("ArrowDown"),
      key("Enter"),
      ...text("!"),
      key("Backspace"),
      key("Backspace"),
    ]);
  });

  describe("errors", () => {
    it("rejects an unterminated token", () => {
      expect(() => parseScript("abc{Enter")).toThrow(ReplayParseError);
      expect(() => parseScript("abc{Enter")).toThrow(/index 3/);
    });

    it("rejects an empty token", () => {
      expect(() => parseScript("{}")).toThrow(ReplayParseError);
      expect(() => parseScript("{   }")).toThrow(ReplayParseError);
    });

    it("rejects an unknown modifier", () => {
      expect(() => parseScript("{Hyper+z}")).toThrow(/Unknown modifier "Hyper"/);
    });
  });
});
