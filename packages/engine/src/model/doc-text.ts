import type { Doc } from "./types";

/**
 * The document as a plain string, newlines included.
 *
 * This is the value compared against the DOM to answer "have the model and the DOM
 * diverged?" — the assertion M1 exists to keep true.
 */
export const docText = (doc: Doc): string =>
  doc.nodes.map((node) => node.text).join("");
