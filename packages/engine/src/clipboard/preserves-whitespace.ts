/** Elements whose contents are whitespace-significant without saying so in a style. */
const PRESERVING_TAGS = new Set(["PRE", "TEXTAREA"]);

/**
 * `pre-line` is deliberately excluded: it keeps newlines but still collapses spaces, so
 * it is a collapsing context for our purposes. The negative lookahead is what stops the
 * `pre` alternative from matching the `pre` in `pre-line`.
 */
const PRESERVING_STYLE = /white-space\s*:\s*(?:pre-wrap|break-spaces|pre)(?!-)/i;

/**
 * Does this element declare its whitespace significant?
 *
 * Worth honouring for two reasons. Pasted code arrives in a `<pre>`, and collapsing its
 * indentation would be the single most annoying thing this pipeline could do. And it is
 * how the engine's own copy survives a round trip: `serialiseSlice` wraps its output in
 * `white-space:pre-wrap`, which is also what Chrome does, so a selection with deliberate
 * double spaces comes back with them.
 */
export const preservesWhitespace = (
  tagName: string,
  style: string | null
): boolean =>
  PRESERVING_TAGS.has(tagName.toUpperCase()) ||
  (style !== null && PRESERVING_STYLE.test(style));
