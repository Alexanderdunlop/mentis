import { moveCursorToDiv } from "../selection/moveCursorToDiv";

export const replaceTextWithDiv = (element: HTMLElement): void => {
  const children = Array.from(element.childNodes);

  children.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const textNode = child as Text;
      const div = document.createElement("div");
      div.textContent = textNode.textContent || "";
      element.replaceChild(div, textNode);

      moveCursorToDiv(div);
    }
  });
};
