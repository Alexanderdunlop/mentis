import { isAtom } from "./nodes";
import type { InlineNode } from "./types";

/**
 * How many **positions** a node occupies — not how many characters it displays.
 *
 * An atom is 1 wide however long its label is, so there is no position inside it to
 * land in. The consequence is that document length and visible text length diverge as
 * soon as a document contains an atom: `docLength(doc) !== docText(doc).length`. Those
 * are two different coordinate spaces and must never be mixed.
 *
 * See docs/adr/0005-an-atom-is-one-position-wide.md.
 */
export const nodeLength = (node: InlineNode): number =>
  isAtom(node) ? 1 : node.text.length;
