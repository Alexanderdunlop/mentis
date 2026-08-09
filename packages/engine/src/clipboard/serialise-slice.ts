import { isAtom } from "../model/nodes";
import { sliceText } from "../model/slice-between";
import type { InlineNode, Slice } from "../model/types";
import { escapeHtml } from "../text/escape-html";
import { ATOM_CLASS, VALUE_ATTR } from "../view/atom-element";
import type { ClipboardPayload } from "./types";

/**
 * A newline goes out as `<br>`, not as the literal `\n` the renderer uses.
 *
 * This looks like it contradicts ADR 0002, and doesn't: that ADR governs how the engine
 * renders *its own* DOM, where `pre-wrap` is guaranteed because `createEditor` sets it.
 * The clipboard is read by applications that guarantee nothing, and `<br>` is the one
 * break every one of them understands.
 */
const nodeHtml = (node: InlineNode): string =>
  isAtom(node)
    ? `<span class="${ATOM_CLASS}" ${VALUE_ATTR}="${escapeHtml(node.value)}">` +
      `${escapeHtml(node.label)}</span>`
    : escapeHtml(node.text).replace(/\n/g, "<br>");

/**
 * A slice, in the two forms the clipboard understands.
 *
 * The `white-space:pre-wrap` wrapper is not decoration. It tells the receiving
 * application that runs of spaces are meant, and it is the marker our own paste path
 * reads to know it must not collapse them — which is what makes copying and pasting the
 * same selection an identity rather than an approximation. Chrome writes the same
 * declaration when it copies, so the convention is borrowed rather than invented.
 *
 * `text` shows a mention as its label, which is the only honest thing to show an
 * application that has no idea what a mention is. The `value` rides on the HTML.
 * See docs/adr/0010-the-clipboard-carries-html.md.
 */
export const serialiseSlice = (slice: Slice): ClipboardPayload => ({
  html:
    `<span style="white-space:pre-wrap;">` +
    slice.map(nodeHtml).join("") +
    `</span>`,
  text: sliceText(slice),
});
