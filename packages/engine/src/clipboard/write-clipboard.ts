import type { Slice } from "../model/types";
import { serialiseSlice } from "./serialise-slice";

/**
 * Put a slice on the clipboard. Returns false when there was nothing to write, which is
 * the caller's signal to leave the event alone.
 *
 * `setData` only takes effect on a `copy`/`cut` event that is subsequently cancelled —
 * an uncancelled event has the browser write its own serialisation of the selection and
 * discard whatever was set here. So a true return means the caller **must**
 * `preventDefault()`, and for `cut` it also means the deletion is now the caller's to
 * perform. See docs/adr/0012-the-engine-listens-for-copy-and-cut.md.
 */
export const writeClipboard = (
  transfer: DataTransfer | null,
  slice: Slice
): boolean => {
  if (!transfer || slice.length === 0) return false;

  const { html, text } = serialiseSlice(slice);
  transfer.setData("text/html", html);
  transfer.setData("text/plain", text);

  return true;
};
