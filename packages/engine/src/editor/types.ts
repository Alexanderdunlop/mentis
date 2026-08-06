import type { Doc, ModelSelection } from "../model/types";
import type { Transaction } from "../model/transaction";

export interface EditorState {
  doc: Doc;
  selection: ModelSelection | null;
}

export interface Editor {
  element: HTMLElement;
  getState: () => EditorState;
  dispatch: (transaction: Transaction) => void;
  /** Called after every applied transaction and every selection change. */
  subscribe: (listener: (state: EditorState) => void) => () => void;
  /** Detach listeners and leave the element as a plain contentEditable. */
  destroy: () => void;
}
