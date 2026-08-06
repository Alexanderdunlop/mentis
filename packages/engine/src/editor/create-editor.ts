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
    // The engine owns editing outright. Nothing the browser would have done to the DOM is
    // allowed to happen — the DOM is a projection of the model, never a source.
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

  // Caret movement is the browser's job (ADR 0003); this only collects the result so the
  // next edit knows where it lands.
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
  element.addEventListener("keydown", onKeyDown);
  document.addEventListener("selectionchange", onSelectionChange);

  render(element, state.doc);

  return {
    element,
    getState: () => state,
    dispatch: apply,
    undo: () => travel("undo"),
    redo: () => travel("redo"),
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
      document.removeEventListener("selectionchange", onSelectionChange);
      listeners.clear();
    },
  };
};
