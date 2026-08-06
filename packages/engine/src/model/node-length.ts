import type { InlineNode } from "./types";

/**
 * How many positions a node occupies.
 *
 * A newline inside text counts as one, per
 * docs/adr/0001-line-breaks-as-newline-characters.md. When M2 adds atoms they will
 * return 1 regardless of their label length — which is the whole reason this is a
 * function rather than `node.text.length` inline at each call site.
 */
export const nodeLength = (node: InlineNode): number => node.text.length;
