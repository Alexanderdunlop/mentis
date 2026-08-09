import type { Slice } from "../model/types";
import { htmlToSlice } from "./html-to-slice";
import { textToSlice } from "./text-to-slice";

/**
 * What is being pasted or dropped, as a slice — or null if the transfer holds nothing
 * this engine can use.
 *
 * Read **synchronously off the event**. `navigator.clipboard.readText()` is async and
 * needs a permission the user has to grant, and reaching for it is the mistake the
 * archived v2 branch made in `v2/input/input-processor.ts`.
 *
 * HTML first, because it is the only flavour that can carry a mention's `value`. Plain
 * text is not a degraded fallback for a flat inline document — it is a complete
 * representation of everything except an atom's identity.
 *
 * A transfer whose HTML parses to nothing falls through to the plain text rather than
 * pasting emptiness: `<style>…</style>` alone is a real thing to find on a clipboard, and
 * treating it as an empty paste would silently delete whatever was selected.
 */
export const readClipboard = (
  transfer: DataTransfer | null | undefined
): Slice | null => {
  if (!transfer) return null;

  const html = transfer.getData("text/html");
  if (html) {
    const slice = htmlToSlice(html);
    if (slice.length > 0) return slice;
  }

  const text = transfer.getData("text/plain");
  if (text) return textToSlice(text);

  return null;
};
