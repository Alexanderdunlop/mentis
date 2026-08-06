const placeCaretAtEnd = (editor: HTMLElement): void => {
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
};

/** Playback needs somewhere to type; without this, the first step goes nowhere. */
export const ensureCaret = (editor: HTMLElement): void => {
  const anchor = window.getSelection()?.anchorNode ?? null;
  if (!anchor || !(editor.contains(anchor) || anchor === editor)) {
    placeCaretAtEnd(editor);
  }
};
