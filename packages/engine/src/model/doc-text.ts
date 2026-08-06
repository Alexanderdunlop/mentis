import { nodeText } from "./nodes";
import type { Doc } from "./types";

/**
 * The document's **visible** text — atom labels included.
 *
 * This is what should equal the DOM's `textContent`, and it is what the inspector
 * displays. It is **not** position space: `docText(doc).length` differs from
 * `docLength(doc)` for any document containing an atom, because an atom is one position
 * wide but its label can be any length. Never use this length as a position.
 *
 * See docs/adr/0005-an-atom-is-one-position-wide.md.
 */
export const docText = (doc: Doc): string => doc.nodes.map(nodeText).join("");
