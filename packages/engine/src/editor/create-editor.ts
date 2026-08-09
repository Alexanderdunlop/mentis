import { copyHandlers } from "../clipboard/copy-handlers";
import { readClipboard } from "../clipboard/read-clipboard";
import { editShapeOf } from "../history/edit-shape";
import {
  canRedo,
  canUndo,
  record,
  redo as redoHistory,
  undo as undoHistory,
} from "../history/history-state";
import { emptyHistory, type HistoryState } from "../history/types";
import { historyShortcut } from "../input/history-shortcut";
import { inputText } from "../input/input-text";
import { targetRange } from "../input/target-range";
import { transactionFor } from "../input/transaction-for";
import { createDoc } from "../model/create-doc";
import { diffDocs } from "../model/diff-docs";
import { docLength } from "../model/doc-length";
import {
  applyTransaction,
  replaceRange,
  type Transaction,
} from "../model/transaction";
import type { ModelRange, ModelSelection } from "../model/types";
import { readDomState } from "../view/read-dom-state";
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
  /** Injectable so history coalescing is testable without a real clock. */
  now?: () => number;
}

export const createEditor = ({
  element,
  initialText = "",
  onUnhandledInput,
  now = () => Date.now(),
}: Options): Editor => {
  let state: EditorState = { doc: createDoc(initialText), selection: null };
  let history: HistoryState = emptyHistory();
  /**
   * While true the engine has handed the DOM to the browser and the model is knowingly
   * stale. See ADR 0009 — this is the one window where the DOM leads.
   */
  let composing = false;
  const listeners = new Set<(state: EditorState) => void>();

  element.contentEditable = "true";
  // Load-bearing, not styling: without pre-wrap a `\n` in a text node does not render
  // as a line break, and ADR 0002's premise fails silently.
  element.style.whiteSpace = "pre-wrap";

  const notify = (): void => {
    for (const listener of listeners) listener(state);
  };

  const apply = (transaction: Transaction): void => {
    const selectionBefore = state.selection;
    const applied = applyTransaction(state.doc, transaction);

    state = {
      doc: applied.doc,
      selection: applied.selection ?? state.selection,
    };

    // Undo and redo are already history; recording them would make the stack a loop.
    if (transaction.origin !== "history") {
      const shape = editShapeOf(transaction);
      history = record(
        history,
        {
          undoSteps: applied.inverse.steps,
          redoSteps: transaction.steps,
          selectionBefore,
          selectionAfter: state.selection,
          kind: shape.kind,
          endedAt: shape.endedAt,
          size: shape.size,
          char: shape.char,
          at: now(),
        },
        shape
      );
    }

    render(element, state.doc);
    if (state.selection) writeSelection(element, state.doc, state.selection);

    notify();
  };

  const travel = (direction: "undo" | "redo"): boolean => {
    const step = direction === "undo" ? undoHistory(history) : redoHistory(history);
    if (!step) return false;

    history = step.state;
    const { entry } = step;

    apply({
      steps: direction === "undo" ? entry.undoSteps : entry.redoSteps,
      selection:
        (direction === "undo" ? entry.selectionBefore : entry.selectionAfter) ??
        undefined,
      origin: "history",
    });

    return true;
  };

  const onBeforeInput = (event: Event): void => {
    const input = event as InputEvent;

    // Composition is the exception: preventing these events stops an IME working at all,
    // because the browser needs to render its own pre-edit text. Let them through and
    // reconcile on compositionend. See ADR 0009.
    if (composing || input.isComposing) return;

    // Otherwise the engine owns editing outright. Nothing the browser would have done to
    // the DOM is allowed to happen — the DOM is a projection of the model, never a source.
    event.preventDefault();

    // Reachable from the Edit menu or a trackpad gesture even though the native stack is
    // empty, so both routes into history are honoured.
    if (input.inputType === "historyUndo") {
      travel("undo");
      return;
    }
    if (input.inputType === "historyRedo") {
      travel("redo");
      return;
    }

    const fromBrowser = targetRange(element, state.doc, input);
    const range = fromBrowser ?? rangeOf(readSelection(element, state.doc));

    const transaction = transactionFor({
      inputType: input.inputType,
      text: inputText(input),
      // Null for everything that is not a paste or a drop. Read here, synchronously off
      // the event, because that is the only place a `DataTransfer` is readable at all.
      slice: readClipboard(input.dataTransfer),
      range,
      rangeFromBrowser: fromBrowser !== null,
      docLength: docLength(state.doc),
    });

    if (!transaction) {
      onUnhandledInput?.(input.inputType);
      return;
    }

    apply(transaction);
  };

  /**
   * Catch the model up to whatever the browser wrote while it had the DOM.
   *
   * One transaction, so a whole composition is a single undo step, and diffed down to the
   * characters that actually changed rather than replacing the document wholesale.
   */
  const reconcileFromDom = (): void => {
    const { doc: fromDom, caret } = readDomState(element);
    const diff = diffDocs(state.doc, fromDom);

    if (!diff) {
      // Text unchanged, but the caret may have moved and the DOM may hold structure the
      // browser invented. Re-render to restore canonical form.
      render(element, state.doc);
      if (caret !== null) {
        state = { ...state, selection: { anchor: caret, head: caret } };
        writeSelection(element, state.doc, state.selection!);
      }
      notify();
      return;
    }

    apply({
      steps: replaceRange(diff.from, diff.to, diff.slice),
      selection: caret === null ? undefined : { anchor: caret, head: caret },
      origin: "user",
    });
  };

  const onCompositionStart = (): void => {
    composing = true;
  };

  const onCompositionEnd = (): void => {
    composing = false;
    reconcileFromDom();
  };

  /**
   * The one key handler the engine owns. ADR 0003 confines it to `beforeinput`; undo is
   * the documented exception, because preventing every `beforeinput` leaves the browser's
   * undo stack empty and ⌘Z therefore fires nothing at all. See ADR 0007.
   */
  const onKeyDown = (event: KeyboardEvent): void => {
    const command = historyShortcut(event);
    if (!command) return;
    event.preventDefault();
    travel(command);
  };

  // Copy and cut are not `beforeinput`, so they need their own listeners. ADR 0012 sets
  // out why that is a boundary of ADR 0003 rather than an exception to it.
  const { onCopy, onCut } = copyHandlers({
    element,
    getDoc: () => state.doc,
    isComposing: () => composing,
    dispatch: apply,
  });

  // Caret movement is the browser's job (ADR 0003); this only collects the result so the
  // next edit knows where it lands.
  const onSelectionChange = (): void => {
    // Position mapping assumes the render invariant, which does not hold mid-composition.
    if (composing) return;
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
  element.addEventListener("keydown", onKeyDown);
  element.addEventListener("copy", onCopy as EventListener);
  element.addEventListener("cut", onCut as EventListener);
  element.addEventListener("compositionstart", onCompositionStart);
  element.addEventListener("compositionend", onCompositionEnd);
  document.addEventListener("selectionchange", onSelectionChange);

  render(element, state.doc);

  return {
    element,
    getState: () => state,
    dispatch: apply,
    undo: () => travel("undo"),
    redo: () => travel("redo"),
    isComposing: () => composing,
    getHistory: () => ({
      canUndo: canUndo(history),
      canRedo: canRedo(history),
      depth: history.done.length,
    }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy: () => {
      element.removeEventListener("beforeinput", onBeforeInput);
      element.removeEventListener("keydown", onKeyDown);
      element.removeEventListener("copy", onCopy as EventListener);
      element.removeEventListener("cut", onCut as EventListener);
      element.removeEventListener("compositionstart", onCompositionStart);
      element.removeEventListener("compositionend", onCompositionEnd);
      document.removeEventListener("selectionchange", onSelectionChange);
      listeners.clear();
    },
  };
};
