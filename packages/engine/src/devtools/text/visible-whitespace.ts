/**
 * A non-breaking space MUST NOT render as a space. They look identical but
 * `char === " "` is false for nbsp, so a shared glyph would hide the bug.
 * See docs/notes/contenteditable-traps.md.
 *
 * Every substitution is single-char → single-char. That is load-bearing: it keeps a
 * character offset into the raw string valid in the rendered string, so selection
 * markers can be spliced in by offset.
 *
 * Sources are named by code point rather than typed literally: an invisible character
 * in source is unreviewable, easily mangled by editors, and — when two of them collide
 * — a silently duplicated object key.
 */
export const WHITESPACE = {
  space: String.fromCodePoint(0x0020),
  noBreakSpace: String.fromCodePoint(0x00a0),
  newline: String.fromCodePoint(0x000a),
  tab: String.fromCodePoint(0x0009),
  zeroWidthSpace: String.fromCodePoint(0x200b),
  zeroWidthNoBreakSpace: String.fromCodePoint(0xfeff),
} as const;

const GLYPHS = new Map<string, string>([
  [WHITESPACE.space, "·"],
  [WHITESPACE.noBreakSpace, "⍽"],
  [WHITESPACE.newline, "⏎"],
  [WHITESPACE.tab, "⇥"],
  [WHITESPACE.zeroWidthSpace, "⌀"],
  [WHITESPACE.zeroWidthNoBreakSpace, "⌀"],
]);

// None of the sources are regex-special, so a bare character class is safe.
const MATCH = new RegExp(`[${[...GLYPHS.keys()].join("")}]`, "g");

export const visibleWhitespace = (text: string): string =>
  text.replace(MATCH, (char) => GLYPHS.get(char) ?? char);
