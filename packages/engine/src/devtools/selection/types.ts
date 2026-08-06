export interface SelectionPoint {
  path: string;
  offset: number;
  /** `#text`, `br`, or a tag name — what kind of node the boundary sits in. */
  kind: string;
}

export interface SelectionSnapshot {
  exists: boolean;
  insideEditor: boolean;
  isCollapsed: boolean;
  anchor: SelectionPoint | null;
  focus: SelectionPoint | null;
  /** Character offsets into the editor, `<br>` counted as one newline. -1 if unmappable. */
  charStart: number;
  charEnd: number;
  editorLength: number;
}
