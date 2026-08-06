/**
 * Whitespace, including the ones that are easy to miss.
 *
 * `\s` is used deliberately over `char === " "`: it matches U+00A0, and a non-breaking
 * space in front of a trigger is common — browsers insert them, and pasting from a rich
 * source brings them in. The archived v2 branch tested `char === " " || "\n" || "\t"`
 * and so failed to see a word boundary before a trigger whenever an nbsp was there.
 *
 * See docs/notes/contenteditable-traps.md.
 */
export const isWhitespace = (char: string): boolean => /\s/.test(char);
