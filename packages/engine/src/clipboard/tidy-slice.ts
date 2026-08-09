import { isText, textNode } from "../model/nodes";
import { normalise } from "../model/normalise";
import type { Slice } from "../model/types";

/**
 * Remove the whitespace that HTML layout would have hidden.
 *
 * Collapsing each text node individually is not enough, because the artefacts span node
 * boundaries: `<b>a </b><i> b</i>` collapses to `"a "` and `" b"` and only becomes a
 * double space once they are joined. Likewise the newline a block boundary emits usually
 * has a leftover space on one side of it, and the whole fragment normally opens and
 * closes with indentation nobody meant to copy.
 *
 * Only runs when nothing in the parse declared its whitespace significant — see
 * `htmlToSlice`. Atoms are opaque here: an atom between two text nodes keeps them apart,
 * so there is no cross-node case this misses.
 */
export const tidySlice = (slice: Slice): Slice => {
  const nodes = slice.map((node) =>
    isText(node)
      ? textNode(node.text.replace(/ {2,}/g, " ").replace(/ *\n */g, "\n"))
      : node
  );

  const first = nodes[0];
  if (first && isText(first)) nodes[0] = textNode(first.text.replace(/^\s+/, ""));

  const last = nodes[nodes.length - 1];
  if (last && isText(last)) {
    nodes[nodes.length - 1] = textNode(last.text.replace(/\s+$/, ""));
  }

  return normalise({ nodes }).nodes;
};
