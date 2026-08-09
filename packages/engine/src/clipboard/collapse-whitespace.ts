/**
 * Collapse whitespace the way HTML rendering does: a run becomes one space.
 *
 * Source HTML is full of indentation that was never meant to be read — `<p>\n    hi\n</p>`
 * is one word, not one word wrapped in whitespace. Keeping it verbatim is how a paste from
 * a real web page arrives with newlines in the middle of a sentence.
 *
 * A non-breaking space is deliberately not in the character class: it is the one space
 * HTML does not collapse, which is why authors use it. `normaliseText` converts it to a
 * plain space afterwards, once its run-preserving job is done.
 */
export const collapseWhitespace = (text: string): string =>
  text.replace(/[ \t\n\r\f]+/g, " ");
