import type { Doc, ModelSelection } from "../model/types";
import type { Transaction } from "../model/transaction";

export interface EditorState {
  doc: Doc;
  selection: ModelSelection | null;
}

export interface HistoryInfo {
  canUndo: boolean;
  canRedo: boolean;
  /** Undo entries available, after coalescing — not the number of edits made. */
  depth: number;
}

export interface Editor {
  element: HTMLElement;
  getState: () => EditorState;
  dispatch: (transaction: Transaction) => void;
  /** Returns false when there was nothing to undo. */
  undo: () => boolean;
  redo: () => boolean;
  getHistory: () => HistoryInfo;
  /** True while the browser owns the DOM for an IME composition. */
  isComposing: () => boolean;
  /** Called after every applied transaction and every selection change. */
  subscribe: (listener: (state: EditorState) => void) => () => void;
  /** Detach listeners and leave the element as a plain contentEditable. */
  destroy: () => void;
}
