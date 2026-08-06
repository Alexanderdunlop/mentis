import { describe, expect, it } from "vitest";
import { escapeHtml, truncate, visibleWhitespace } from "../format";

describe("visibleWhitespace", () => {
  it("marks spaces, newlines and tabs", () => {
    expect(visibleWhitespace("a b\nc\td")).toBe("a·b⏎c⇥d");
  });

  it("distinguishes a non-breaking space from a normal one", () => {
    expect(visibleWhitespace("a b")).toBe("a·b");
    expect(visibleWhitespace("a b")).toBe("a⍽b");
  });

  it("marks zero-width characters", () => {
    expect(visibleWhitespace("a​b")).toBe("a⌀b");
    expect(visibleWhitespace("a﻿b")).toBe("a⌀b");
  });

  it("leaves other characters alone", () => {
    expect(visibleWhitespace("héllo👋")).toBe("héllo👋");
  });

  it("is length-preserving, so selection offsets stay valid", () => {
    const samples = ["a b", "a b", "x\ty\nz", "plain", "​"];
    for (const sample of samples) {
      expect(visibleWhitespace(sample)).toHaveLength(sample.length);
    }
  });
});

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml('<br class="x">&')).toBe(
      "&lt;br class=&quot;x&quot;&gt;&amp;"
    );
  });

  it("escapes the ampersand first, so entities are not double-escaped", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("appends the full length when truncating", () => {
    expect(truncate("abcdef", 3)).toBe("abc…(6)");
  });

  it("does not truncate at exactly the limit", () => {
    expect(truncate("abc", 3)).toBe("abc");
  });
});
