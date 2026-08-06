/**
 * Rendering helpers for the inspector.
 *
 * The whitespace substitutions below are all single-char → single-char, which is
 * load-bearing: it means a character offset into the raw string is still valid in
 * the rendered string, so selection markers can be spliced in by offset.
 */

const WHITESPACE_MAP: Record<string, string> = {
  " ": "·",
  " ": "⍽", // non-breaking space — browsers insert these unprompted, so they
  //                 must be visually distinct from a normal space
  "\n": "⏎",
  "\t": "⇥",
  "​": "⌀", // zero-width space
  "﻿": "⌀", // zero-width no-break space
};

export const visibleWhitespace = (text: string): string =>
  text.replace(
    /[  \n\t​﻿]/g,
    (char) => WHITESPACE_MAP[char] ?? char
  );

export const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const describeNode = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return "#text";
  if (node.nodeType === Node.COMMENT_NODE) return "#comment";
  return node.nodeName.toLowerCase();
};

/** A readable path from the editor root to `node`, e.g. `root > span[1] > #text[0]`. */
export const nodePath = (root: Node, node: Node | null): string => {
  if (!node) return "—";
  if (node === root) return "root";

  const parts: string[] = [];
  let current: Node | null = node;

  while (current && current !== root) {
    const parent: Node | null = current.parentNode;
    if (!parent) {
      parts.unshift(`${describeNode(current)}[detached]`);
      break;
    }
    const index = Array.prototype.indexOf.call(parent.childNodes, current);
    parts.unshift(`${describeNode(current)}[${index}]`);
    current = parent;
  }

  return ["root", ...parts].join(" > ");
};

export const truncate = (text: string, max = 80): string =>
  text.length <= max ? text : `${text.slice(0, max)}…(${text.length})`;

/**
 * Character length of a subtree, counting a `<br>` as one newline.
 *
 * Deliberately not `Range.toString()`, which silently ignores `<br>` — an
 * inconsistency that would make every offset near a line break wrong.
 */
export const textLength = (node: Node): number => {
  if (node.nodeType === Node.TEXT_NODE) return (node as Text).data.length;

  let total = 0;
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) total += (child as Text).data.length;
    else if (child.nodeName === "BR") total += 1;
    else total += textLength(child);
  }
  return total;
};
