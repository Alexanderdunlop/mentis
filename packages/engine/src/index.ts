export { createEditor } from "./editor/create-editor";
export type { Editor, EditorState } from "./editor/types";

export { createDoc, emptyDoc } from "./model/create-doc";
export { docLength } from "./model/doc-length";
export { docText } from "./model/doc-text";
export { textBetween } from "./model/text-between";
export { applyTransaction, replaceRange } from "./model/transaction";
export type { Transaction } from "./model/transaction";
export type { Step } from "./model/steps/types";
export type {
  Doc,
  InlineNode,
  ModelRange,
  ModelSelection,
  TextNode,
} from "./model/types";

export { transactionFor } from "./input/transaction-for";
export type { InputIntent } from "./input/types";
