export const setupTriggerState = (element: HTMLElement, trigger: string) => {
  element.textContent = trigger;
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(element);
  range.collapse(false);
  selection?.removeAllRanges();
  selection?.addRange(range);
};
