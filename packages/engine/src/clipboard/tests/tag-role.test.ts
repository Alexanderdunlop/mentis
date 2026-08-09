import { describe, expect, it } from "vitest";
import { tagRole } from "../tag-role";

describe("tagRole", () => {
  it("drops elements whose content was never visible", () => {
    for (const tag of ["script", "style", "noscript", "head", "title"]) {
      expect(tagRole(tag)).toBe("skip");
    }
  });

  it("treats anything the reader sees on its own line as a break", () => {
    for (const tag of ["p", "div", "li", "h1", "blockquote", "tr", "td", "pre"]) {
      expect(tagRole(tag)).toBe("break");
    }
  });

  it("is transparent for inline formatting", () => {
    for (const tag of ["span", "b", "em", "a", "code", "img", "font"]) {
      expect(tagRole(tag)).toBe("transparent");
    }
  });

  it("defaults an unknown element to transparent, keeping its text", () => {
    // Far more likely to be a wrapper some editor invented than something whose absence
    // changes the text — and dropping it would lose content the user watched themselves
    // copy.
    expect(tagRole("mjx-container")).toBe("transparent");
    expect(tagRole("o:p")).toBe("transparent");
  });

  it("does not care about case", () => {
    expect(tagRole("DIV")).toBe("break");
    expect(tagRole("Script")).toBe("skip");
  });
});
