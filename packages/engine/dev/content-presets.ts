import { need } from "./need";

/** Each preset is a DOM shape that has caused a real bug somewhere. */
const PRESETS: { name: string; html: string }[] = [
  { name: "empty", html: "" },
  { name: "plain text", html: "hello world" },
  { name: "two lines (br)", html: "one<br>two" },
  { name: "trailing br", html: "one<br>" },
  {
    name: "atomic chip",
    html:
      'Hey <span class="chip" contenteditable="false" data-value="1">@Alice</span> there',
  },
  { name: "nbsp run", html: "a&nbsp;&nbsp;&nbsp;b" },
  { name: "empty text nodes", html: "a<span></span>b" },
  { name: "emoji", html: "a\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}b" },
];

export const bindContentPresets = (
  editor: HTMLElement,
  onApplied: () => void
): void => {
  const list = need("#presets");

  for (const preset of PRESETS) {
    const button = document.createElement("button");
    button.textContent = preset.name;
    button.addEventListener("click", () => {
      editor.innerHTML = preset.html;
      editor.focus();
      onApplied();
    });
    list.appendChild(button);
  }
};
