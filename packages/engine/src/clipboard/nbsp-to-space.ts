/**
 * The last step of every path into the model: a non-breaking space becomes a space.
 *
 * Separate from `normaliseText`, and applied after it, because **order is the whole
 * point**. U+00A0 is precisely the space HTML does not collapse — it is what an author
 * writes when they mean two spaces and want to keep both. Convert it early and every
 * later whitespace rule, from `collapseWhitespace` to `tidySlice`, sees an ordinary space
 * and eats one of the pair.
 *
 * Doing it here rather than at each call site is the "normalise once, at the model
 * boundary" decision `CLAUDE.md` records against
 * docs/notes/contenteditable-traps.md. Nothing downstream ever has to ask whether a space
 * is really a space.
 */
export const nbspToSpace = (text: string): string => text.replace(/\u00A0/g, " ");
