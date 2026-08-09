/**
 * What the engine puts on the clipboard.
 *
 * Two flavours of the same selection, not two different payloads. `html` is the one that
 * round-trips a mention, because it carries `data-mention-value`; `text` is what every
 * other application will actually read, and shows a mention as its label.
 *
 * See docs/adr/0010-the-clipboard-carries-html.md.
 */
export interface ClipboardPayload {
  html: string;
  text: string;
}
