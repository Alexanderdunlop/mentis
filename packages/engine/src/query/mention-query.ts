import { nodeLength } from "../model/node-length";
import { isText } from "../model/nodes";
import { resolvePosition } from "../model/resolve-position";
import type { Doc, ModelSelection } from "../model/types";
import { isWhitespace } from "./is-whitespace";
import type { MentionQuery, MentionQueryOptions } from "./types";

interface Options extends MentionQueryOptions {
  doc: Doc;
  selection: ModelSelection | null;
}

const positionOfNode = (doc: Doc, index: number): number =>
  doc.nodes.slice(0, index).reduce((total, node) => total + nodeLength(node), 0);

/**
 * The active mention query, or null.
 *
 * **Derived, never stored.** Given a document and a selection there is exactly one right
 * answer, so keeping it in state only creates the possibility of it being stale. The
 * archived v2 branch stored it and emitted `mentionQueryDetected`/`Cleared` events; that
 * is a cache plus an invalidation problem in place of a function. See ADR 0006.
 *
 * The search never leaves the caret's own text node, which is sufficient because
 * `normalise` merges adjacent text nodes — so a text node is always maximal, and the only
 * thing on the other side of its edge is an atom or the document start. Either is a hard
 * boundary: a query cannot span a mention.
 */
export const mentionQuery = ({
  doc,
  selection,
  triggers = ["@"],
  maxQueryLength = 64,
}: Options): MentionQuery | null => {
  // A range selection is not a query — the user is selecting, not typing one.
  if (!selection || selection.anchor !== selection.head) return null;

  const caret = selection.head;
  const { index, offset } = resolvePosition(doc, caret);
  const node = doc.nodes[index];

  // Beside an atom, or in an empty document: nothing to scan.
  if (!node || !isText(node)) return null;

  for (let at = offset - 1; at >= 0; at -= 1) {
    const char = node.text[at]!;

    // Whitespace closes the word, so any trigger further back is not this query's.
    if (isWhitespace(char)) return null;

    if (!triggers.includes(char)) continue;

    // A trigger only opens a query at a word start. Without this, `name@example.com`
    // pops a menu mid-address.
    const preceding = at > 0 ? node.text[at - 1]! : null;
    const atWordStart = preceding === null || isWhitespace(preceding);
    if (!atWordStart) return null;

    const query = node.text.slice(at + 1, offset);
    if (query.length > maxQueryLength) return null;

    const from = positionOfNode(doc, index) + at;
    return { trigger: char, query, from, to: caret };
  }

  return null;
};
