/**
 * What an element contributes to a flat, inline-only document.
 *
 * There are only three answers, because there is nowhere for a fourth to go — the
 * document has no blocks and no nesting (docs/plan.md non-goals). Everything structural
 * either becomes a line break or becomes nothing at all.
 */
export type TagRole =
  /** Dropped whole, text included — its content was never visible to the reader. */
  | "skip"
  /** Its edges are line breaks; its content still comes through. */
  | "break"
  /** Invisible to us: keep the text, discard the element. */
  | "transparent";

const SKIPPED = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "HEAD",
  "TITLE",
  "META",
  "LINK",
  "TEMPLATE",
  "IFRAME",
  "OBJECT",
  "SVG",
  "CANVAS",
  "VIDEO",
  "AUDIO",
]);

/**
 * Block-level in the sense that matters here: something the reader sees on its own line.
 *
 * Table cells are included, so a copied row arrives as one item per line rather than as
 * `abc` run together. A tab would arguably be closer to what a spreadsheet means, but a
 * tab is not a line break and this document has no columns to put it in.
 */
const BLOCKS = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "DD",
  "DETAILS",
  "DIV",
  "DL",
  "DT",
  "FIELDSET",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "FORM",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HR",
  "LI",
  "MAIN",
  "NAV",
  "OL",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "TBODY",
  "TD",
  "TFOOT",
  "TH",
  "THEAD",
  "TR",
  "UL",
]);

/**
 * `transparent` is the default on purpose. An unknown element is far more likely to be a
 * wrapper some editor invented — every `<span data-slate-*>` and `<font>` in the world —
 * than something whose absence changes the text, and dropping the text with it would lose
 * content the user watched themselves copy.
 */
export const tagRole = (tagName: string): TagRole => {
  const upper = tagName.toUpperCase();
  if (SKIPPED.has(upper)) return "skip";
  if (BLOCKS.has(upper)) return "break";
  return "transparent";
};
