/**
 * Fold the characters that are *never* wanted out of incoming text.
 *
 * The clipboard is where foreign text enters the document, so this is the model boundary.
 * Everything here is unconditional: a CRLF is a line break however it arrived, and a
 * zero-width space is junk wherever it sits.
 *
 * A non-breaking space is deliberately **not** handled here — it is conditional on when
 * it runs, so it lives in `nbspToSpace` and goes last. See that file.
 *
 * Every character below is written as an escape rather than typed. Two look-alike
 * invisibles in a character class are indistinguishable to a reviewer.
 */
export const normaliseText = (text: string): string =>
  text
    // CRLF and lone CR — Windows sources and very old Mac ones. ADR 0001 commits the
    // model to exactly one `\n` per break.
    .replace(/\r\n?/g, "\n")
    // U+2028 line separator, U+2029 paragraph separator: real breaks, and invisible in
    // every editor that would show you the text.
    .replace(/[\u2028\u2029]/g, "\n")
    // U+200B zero-width space, U+FEFF byte order mark. `\s` matches neither, so they
    // survive every whitespace check downstream and then quietly break trigger detection
    // by sitting between a space and an `@`.
    .replace(/[\u200B\uFEFF]/g, "");
