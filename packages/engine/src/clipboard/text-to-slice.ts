import { textNode } from "../model/nodes";
import type { Slice } from "../model/types";
import { nbspToSpace } from "./nbsp-to-space";
import { normaliseText } from "./normalise-text";

/**
 * The plain-text fallback: everything the clipboard offers when it has no HTML.
 *
 * There is no structure to recover, which for a flat inline document means nothing is
 * lost — plain text is a complete representation of every document that contains no
 * mention. Only an atom's `value` needs more, and only HTML carries it.
 */
export const textToSlice = (text: string): Slice => {
  // Nothing here collapses whitespace — plain text has no layout to blame a run of
  // spaces on — so nbsp can be folded in immediately rather than held back.
  const normalised = nbspToSpace(normaliseText(text));
  return normalised === "" ? [] : [textNode(normalised)];
};
