import { sliceBetween } from "../model/slice-between";
import type { Transaction } from "../model/transaction";
import type { Doc, ModelRange } from "../model/types";
import { readSelection } from "../view/dom-selection";
import { writeClipboard } from "./write-clipboard";

interface Options {
  element: HTMLElement;
  getDoc: () => Doc;
  /** The engine is not in charge of the DOM mid-composition; see ADR 0009. */
  isComposing: () => boolean;
  dispatch: (transaction: Transaction) => void;
}

export interface CopyHandlers {
  onCopy: (event: ClipboardEvent) => void;
  onCut: (event: ClipboardEvent) => void;
}

const rangeOf = (element: HTMLElement, doc: Doc): ModelRange => {
  const selection = readSelection(element, doc);
  if (!selection) return { from: 0, to: 0 };
  return {
    from: Math.min(selection.anchor, selection.head),
    to: Math.max(selection.anchor, selection.head),
  };
};

/**
 * The `copy` and `cut` listeners.
 *
 * Neither is a `beforeinput`, so ADR 0003's "intercept `beforeinput` and nothing else"
 * cannot reach them — copy is editing-adjacent and cut is an edit outright, and neither
 * is caret movement, which is what that rule exists to leave alone. See
 * docs/adr/0012-the-engine-listens-for-copy-and-cut.md.
 *
 * Separated from `create-editor.ts` for the same reason `log/describe-event.ts` is
 * separate from `log/create-event-log.ts`: the interesting part is the rules, and they
 * should be readable without the rest of the wiring around them.
 */
export const copyHandlers = ({
  element,
  getDoc,
  isComposing,
  dispatch,
}: Options): CopyHandlers => {
  /**
   * Put the selection on the clipboard, returning the range written or null if there was
   * nothing to write.
   *
   * Written from the **model**, not from the DOM: the slice carries each mention's
   * `value` and the rendered text does not. That is the whole reason a copied chip can
   * come back as a chip.
   */
  const write = (event: ClipboardEvent): ModelRange | null => {
    const doc = getDoc();
    const range = rangeOf(element, doc);
    if (range.from === range.to) return null;

    const written = writeClipboard(
      event.clipboardData,
      sliceBetween(doc, range.from, range.to)
    );
    return written ? range : null;
  };

  const onCopy = (event: ClipboardEvent): void => {
    if (isComposing()) return;
    if (!write(event)) return;
    // Only a cancelled copy uses what we set; otherwise the browser writes its own
    // serialisation and discards ours.
    event.preventDefault();
  };

  const onCut = (event: ClipboardEvent): void => {
    if (isComposing()) return;

    // Written before anything is deleted, and from the pre-cut document — afterwards the
    // slice no longer exists to serialise. This is the step that is easy to get backwards.
    const range = write(event);
    if (!range) return;
    event.preventDefault();

    // Cancelling the event cancels the deletion with it, so no `deleteByCut` reaches
    // `beforeinput` and the edit is ours. One transaction, so one undo step — and because
    // a delete step carries a slice, undo restores a cut mention as a mention.
    dispatch({
      steps: [{ type: "delete", from: range.from, to: range.to }],
      selection: { anchor: range.from, head: range.from },
      origin: "program",
    });
  };

  return { onCopy, onCut };
};
