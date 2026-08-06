import { describe, expect, it } from "vitest";
import { escapeHtml } from "../escape-html";

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml('<br class="x">&')).toBe(
      "&lt;br class=&quot;x&quot;&gt;&amp;"
    );
  });

  it("escapes the ampersand first, so entities are not double-escaped", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("leaves plain text untouched", () => {
    expect(escapeHtml("hello")).toBe("hello");
  });
});
