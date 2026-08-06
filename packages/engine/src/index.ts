export { createEditor } from "./editor/create-editor";
export type { Editor, EditorState, HistoryInfo } from "./editor/types";

export { insertMention } from "./commands/insert-mention";

export { emptyHistory } from "./history/types";
export type { EditKind, HistoryEntry, HistoryState } from "./history/types";
export { historyShortcut } from "./input/history-shortcut";
export type { HistoryCommand } from "./input/history-shortcut";

export { createDoc, emptyDoc } from "./model/create-doc";
export { docLength } from "./model/doc-length";
export { docText } from "./model/doc-text";
export { mentions, type MentionEntry } from "./model/mentions";
export { atomNode, isAtom, isText, nodeText, textNode } from "./model/nodes";
export { sliceBetween, sliceLength, sliceText } from "./model/slice-between";
export { textBetween } from "./model/text-between";
export {
  applyTransaction,
  replaceRange,
  replaceWithText,
} from "./model/transaction";
export type { Transaction } from "./model/transaction";
export type { Step } from "./model/steps/types";
export type {
  AtomNode,
  Doc,
  InlineNode,
  ModelRange,
  ModelSelection,
  Slice,
  TextNode,
} from "./model/types";

export { mentionQuery } from "./query/mention-query";
export { isWhitespace } from "./query/is-whitespace";
export type { MentionQuery, MentionQueryOptions } from "./query/types";

export { transactionFor } from "./input/transaction-for";
export type { InputIntent } from "./input/types";

export { ATOM_CLASS, VALUE_ATTR } from "./view/atom-element";
export { positionRect } from "./view/position-rect";
