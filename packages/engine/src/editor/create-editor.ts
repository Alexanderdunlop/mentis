import { inputText } from "../input/input-text";
import { targetRange } from "../input/target-range";
import { transactionFor } from "../input/transaction-for";
import { createDoc } from "../model/create-doc";
import { docLength } from "../model/doc-length";
import { applyTransaction, type Transaction } from "../model/transaction";
import type { ModelRange, ModelSelection } from "../model/types";
import { readSelection, writeSelection } from "../view/dom-selection";
import { render } from "../view/render";
import type { Editor, EditorState } from "./types";

const rangeOf = (selection: ModelSelection | null): ModelRange => {
  if (!selection) return { from: 0, to: 0 };
  return {
    from: Math.min(selection.anchor, selection.head),
    to: Math.max(selection.anchor, selection.head),
  };
};

interface Options {
  element: HTMLElement;
  initialText?: string;
  /** Called for any inputType the engine has no rule for, instead of guessing. */
  onUnhandledInput?: (inputType: string) => void;
}

export const createEditor = ({
  element,
  initialText = "",
  onUnhandledInput,
}: Options): Editor => {
  let state: EditorState = {
    doc: createDoc(initialText),
    selection: null,
  };
  const listeners = new Set<(state: EditorState) => void>();

  element.contentEditable = "true";
  // Load-bearing, not styling: without pre-wrap a `\n` in a text node does not render
  // as a line break, and ADR 0002's whole premise fails silently. See ADR 0002.
  element.style.whiteSpace = "pre-wrap";

  const notify = (): void => {
    for (const listener of listeners) listener(state);
  };

  const dispatch = (transaction: Transaction): void => {
    const applied = applyTransaction(state.doc, transaction);
    state = {
      doc: applied.doc,
      selection: applied.selection ?? state.selection,
    };

    render(element, state.doc);
    if (state.selection) writeSelection(element, state.doc, state.selection);

    notify();
  };

  const onBeforeInput = (event: Event): void => {
    const input = event as InputEvent;
    // The engine owns editing outright. Nothing the browser would have done to the DOM
    // is allowed to happen — the DOM is a projection of the model, never a source.
    event.preventDefault();

    const fromBrowser = targetRange(element, state.doc, input);
    const range = fromBrowser ?? rangeOf(readSelection(element, state.doc));

    const transaction = transactionFor({
      inputType: input.inputType,
      text: inputText(input),
      range,
      rangeFromBrowser: fromBrowser !== null,
      docLength: docLength(state.doc),
    });

    if (!transaction) {
      onUnhandledInput?.(input.inputType);
      return;
    }

    dispatch(transaction);
  };

  // Caret movement is the browser's job (ADR 0003); this only collects the result so
  // the next edit knows where it lands.
  const onSelectionChange = (): void => {
    const selection = readSelection(element, state.doc);
    if (!selection) return;
    if (
      state.selection?.anchor === selection.anchor &&
      state.selection?.head === selection.head
    ) {
      return;
    }
    state = { ...state, selection };
    notify();
  };

  element.addEventListener("beforeinput", onBeforeInput);
  document.addEventListener("selectionchange", onSelectionChange);

  render(element, state.doc);

  return {
    element,
    getState: () => state,
    dispatch,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy: () => {
      element.removeEventListener("beforeinput", onBeforeInput);
      document.removeEventListener("selectionchange", onSelectionChange);
      listeners.clear();
    },
  };
};
