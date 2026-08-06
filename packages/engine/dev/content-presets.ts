import type { Editor } from "../src/editor/types";
import { docLength } from "../src/model/doc-length";
import { replaceRange } from "../src/model/transaction";
import { need } from "./need";

const NBSP = String.fromCodePoint(0x00a0);
const FAMILY = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}";

interface Preset {
  name: string;
  /** What the engine's document should contain. */
  text: string;
  /** Raw DOM for bare mode, where the point is often a shape the model can't express. */
  html?: string;
  /** Shapes with no model equivalent — disabled while the engine is attached. */
  bareOnly?: boolean;
}

/** Each preset is a shape that has caused a real bug somewhere. */
const PRESETS: Preset[] = [
  { name: "empty", text: "" },
  { name: "plain text", text: "hello world" },
  { name: "two lines", text: "one\ntwo", html: "one<br>two" },
  { name: "trailing newline", text: "one\n", html: "one<br>" },
  {
    name: "nbsp run",
    text: `a${NBSP}${NBSP}${NBSP}b`,
    html: "a&nbsp;&nbsp;&nbsp;b",
  },
  { name: "emoji", text: `a${FAMILY}b` },
  { name: "empty text nodes", text: "ab", html: "a<span></span>b", bareOnly: true },
  {
    name: "atomic chip",
    text: "Hey @Alice there",
    html:
      'Hey <span class="chip" contenteditable="false" data-value="1">@Alice</span> there',
    bareOnly: true,
  },
];

export interface ContentPresets {
  /** Grey out the model-less presets while the engine is attached. */
  syncAvailability: (attached: boolean) => void;
}

interface Options {
  element: HTMLElement;
  getEditor: () => Editor | null;
  onApplied: () => void;
}

/**
 * Applying a preset goes through the engine whenever one is attached. Writing
 * `innerHTML` behind its back would desync the model from the DOM — the single
 * invariant M1 exists to keep — and the inspector would then report a divergence that
 * is the harness's fault rather than the engine's.
 */
export const bindContentPresets = ({
  element,
  getEditor,
  onApplied,
}: Options): ContentPresets => {
  const list = need("#presets");
  const entries: { button: HTMLButtonElement; preset: Preset }[] = [];

  for (const preset of PRESETS) {
    const button = document.createElement("button");
    button.textContent = preset.name;
    if (preset.bareOnly) button.title = "No model equivalent — bare mode only";

    button.addEventListener("click", () => {
      const editor = getEditor();

      if (editor) {
        const { doc } = editor.getState();
        editor.dispatch({
          steps: replaceRange(0, docLength(doc), preset.text),
          selection: { anchor: preset.text.length, head: preset.text.length },
          origin: "program",
        });
      } else {
        element.innerHTML = preset.html ?? preset.text;
      }

      element.focus();
      onApplied();
    });

    list.appendChild(button);
    entries.push({ button, preset });
  }

  return {
    syncAvailability: (attached) => {
      for (const { button, preset } of entries) {
        button.disabled = attached && Boolean(preset.bareOnly);
      }
    },
  };
};
