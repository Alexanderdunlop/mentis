import { snapBack } from "./grapheme-boundary";
import { nodeLength } from "./node-length";
import { isText } from "./nodes";
import { textNode } from "./nodes";
import type { Doc, InlineNode, Slice } from "./types";

export interface DocDiff {
  from: number;
  to: number;
  slice: Slice;
}

const sameNode = (a: InlineNode, b: InlineNode): boolean => {
  if (a.type !== b.type) return false;
  if (isText(a) && isText(b)) return a.text === b.text;
  return a.type === "atom" && b.type === "atom"
    ? a.label === b.label && a.value === b.value
    : false;
};

const positionOfIndex = (doc: Doc, index: number): number =>
  doc.nodes.slice(0, index).reduce((total, node) => total + nodeLength(node), 0);

const totalLength = (nodes: InlineNode[]): number =>
  nodes.reduce((total, node) => total + nodeLength(node), 0);

/** Narrow a single changed text node to just the characters that actually differ. */
const narrowToText = (diff: DocDiff, before: InlineNode[]): DocDiff => {
  const [oldNode] = before;
  const [newNode] = diff.slice;
  if (
    before.length !== 1 ||
    diff.slice.length !== 1 ||
    !oldNode ||
    !newNode ||
    !isText(oldNode) ||
    !isText(newNode)
  ) {
    return diff;
  }

  const old = oldNode.text;
  const next = newNode.text;

  let prefix = 0;
  while (prefix < old.length && prefix < next.length && old[prefix] === next[prefix]) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < old.length - prefix &&
    suffix < next.length - prefix &&
    old[old.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  /*
   * The scans above compare **code units**, so they happily stop halfway through a
   * character: `👍` → `👎` share their leading surrogate, giving a prefix of 1 and a diff
   * that inserts a lone `\uDC4E`. That renders as `�`, and the user can neither select it
   * nor delete it — they did not type it and cannot type it away.
   *
   * So both ends widen outwards to a boundary. Outwards is the only safe direction:
   * narrowing cuts a character in half, which is the bug. Taking the smaller prefix and
   * the larger suffix of the two strings keeps the region valid in both at once, since
   * they agree on everything outside it.
   */
  prefix = Math.min(snapBack(old, prefix), snapBack(next, prefix));

  const grownSuffix = Math.max(
    old.length - snapBack(old, old.length - suffix),
    next.length - snapBack(next, next.length - suffix)
  );
  suffix = Math.min(grownSuffix, old.length - prefix, next.length - prefix);

  const middle = next.slice(prefix, next.length - suffix);

  return {
    from: diff.from + prefix,
    to: diff.to - suffix,
    slice: middle === "" ? [] : [textNode(middle)],
  };
};

/**
 * The smallest replacement that turns `before` into `after`, or null if they match.
 *
 * Used to recover from a window where the browser owned the DOM — composition (ADR 0009).
 * A whole-document replacement would also be correct, but it would make one typed
 * character undo as "replace everything", and its inverse would carry the entire old
 * document.
 *
 * Node-level first, then narrowed to characters when exactly one text node changed, which
 * is the overwhelmingly common shape.
 */
export const diffDocs = (before: Doc, after: Doc): DocDiff | null => {
  const maxPrefix = Math.min(before.nodes.length, after.nodes.length);

  let prefix = 0;
  while (prefix < maxPrefix && sameNode(before.nodes[prefix]!, after.nodes[prefix]!)) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < maxPrefix - prefix &&
    sameNode(
      before.nodes[before.nodes.length - 1 - suffix]!,
      after.nodes[after.nodes.length - 1 - suffix]!
    )
  ) {
    suffix += 1;
  }

  const changedBefore = before.nodes.slice(prefix, before.nodes.length - suffix);
  const changedAfter = after.nodes.slice(prefix, after.nodes.length - suffix);

  if (changedBefore.length === 0 && changedAfter.length === 0) return null;

  const from = positionOfIndex(before, prefix);

  return narrowToText(
    { from, to: from + totalLength(changedBefore), slice: changedAfter },
    changedBefore
  );
};
