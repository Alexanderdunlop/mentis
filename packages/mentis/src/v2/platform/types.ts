export interface ContentEditableAPI {
  getText(): string;
  setText(text: string): void;
  getCursorPosition(): number;
  setCursorPosition(position: number): void;
  getSelectionRange(): SelectionRange;
  // insertText(text: string, position?: number): void;
  // replaceText(start: number, end: number, text: string): void;
  // focus(): void;
  // blur(): void;
  addEventListener(event: string, callback: Function): void;
  // removeEventListener(event: string, callback: Function): void;
}

export interface ContentEditableElement {
  element: HTMLDivElement;
  api: ContentEditableAPI;
}

export type SelectionRange = {
  startIndex: number;
  endIndex: number;
};
