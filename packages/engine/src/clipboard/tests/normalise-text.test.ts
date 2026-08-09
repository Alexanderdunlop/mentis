import { describe, expect, it } from "vitest";
import { collapseWhitespace } from "../collapse-whitespace";
import { nbspToSpace } from "../nbsp-to-space";
import { normaliseText } from "../normalise-text";

const NBSP = String.fromCodePoint(0x00a0);
const ZWSP = String.fromCodePoint(0x200b);
const BOM = String.fromCodePoint(0xfeff);
const LINE_SEPARATOR = String.fromCodePoint(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCodePoint(0x2029);

describe("normaliseText", () => {
  it("reduces every line ending to a single newline", () => {
    expect(normaliseText("a\r\nb\rc\nd")).toBe("a\nb\nc\nd");
  });

  it("treats the invisible separators as line breaks", () => {
    expect(normaliseText(`a${LINE_SEPARATOR}b${PARAGRAPH_SEPARATOR}c`)).toBe(
      "a\nb\nc"
    );
  });

  it("strips zero-width characters, which no whitespace check would catch", () => {
    // `\s` matches neither, so a zero-width space between a space and an `@` leaves
    // trigger detection looking at a non-whitespace character it cannot see.
    expect(/\s/.test(ZWSP)).toBe(false);
    expect(normaliseText(`hi ${ZWSP}@al${BOM}`)).toBe("hi @al");
  });

  it("leaves a non-breaking space to `nbspToSpace`, which runs later", () => {
    expect(normaliseText(`hi${NBSP}there`)).toBe(`hi${NBSP}there`);
  });

  it("leaves ordinary text alone", () => {
    expect(normaliseText("hello  world\n@alice")).toBe("hello  world\n@alice");
  });
});

describe("nbspToSpace", () => {
  it("converts a non-breaking space to a plain one", () => {
    expect(nbspToSpace(`hi${NBSP}there`)).toBe("hi there");
  });

  it("keeps a deliberate nbsp run as two spaces when it runs last", () => {
    // The ordering the pipeline is built around: nbsp is the character HTML does *not*
    // collapse, so converting it before the collapse would let the collapse eat one.
    expect(nbspToSpace(collapseWhitespace(`a${NBSP}${NBSP}b`))).toBe("a  b");
  });

  it("would lose one of that pair if it ran first", () => {
    // Stated as a test rather than a comment, because it is the entire reason these are
    // two functions instead of one.
    expect(collapseWhitespace(nbspToSpace(`a${NBSP}${NBSP}b`))).toBe("a b");
  });
});
