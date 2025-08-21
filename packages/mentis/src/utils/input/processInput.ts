import { replaceTextWithDiv } from "./replaceTextWithDiv";

export const processInput = (editorRef: HTMLDivElement | null) => {
  if (!editorRef) return;
  console.log("processInput", editorRef);

  // There should only be divs
  replaceTextWithDiv(editorRef);

  // console.log("editorRef", editorRef);

  const children = Array.from(editorRef.childNodes);

  console.log("children", children);

  if (children.length === 0) {
    editorRef.innerHTML = "";
    editorRef.textContent = "";
    return;
  }

  if (children.length === 1) {
    const child = children[0];
    // If the child is a br, remove it
    if (
      child.nodeType === Node.ELEMENT_NODE &&
      child instanceof HTMLElement &&
      child.tagName.toLowerCase() === "br"
    ) {
      child.remove();
    }
  }

  children.forEach((child) => {
    // console.log("child", child);
  });
};
