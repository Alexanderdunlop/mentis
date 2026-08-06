export interface Scenario {
  name: string;
  script: string;
  /** What to watch for while it plays — the reason the scenario is worth keeping. */
  note: string;
}

/**
 * Preset scripts, chosen because each one exposes something that bites.
 * These become Playwright specs later; keep the scripts copy-pasteable.
 */
export const SCENARIOS: Scenario[] = [
  {
    name: "type a mention",
    script: "Hey @al{ArrowDown}{Enter} how are you?",
    note: "Arrow/Enter reach the engine as untrusted keydown — no native action needed.",
  },
  {
    name: "backspace to empty",
    script: "hi{Backspace x2}",
    note: "Watch what the browser leaves behind: an empty text node, a stray <br>, or nothing.",
  },
  {
    name: "newlines",
    script: "one{Enter}two{Enter}",
    note: "insertParagraph vs insertLineBreak, and whether the last line needs a trailing <br>.",
  },
  {
    name: "shift+enter line break",
    script: "one{Shift+Enter}two",
    note: "Compare the resulting DOM against plain Enter — browsers disagree here.",
  },
  {
    name: "select all, replace",
    script: "hello world{Ctrl+a}bye",
    note: "beforeinput.getTargetRanges() should span the whole editor.",
  },
  {
    name: "arrow into middle, type",
    script: "abcdef{ArrowLeft x3}XY",
    note: "Caret arithmetic: insertion at offset 3, not at the end.",
  },
  {
    name: "word delete",
    script: "one two three{Alt+Backspace}",
    note: "deleteWordBackward — or an extend+delete pair, depending on the browser.",
  },
  {
    name: "undo after typing",
    script: "hello world{Meta+z}",
    note: "Native undo still works at M0. It dies the moment the engine preventDefaults.",
  },
  {
    name: "emoji offsets",
    script: "a👨‍👩‍👧b{ArrowLeft}{Backspace}",
    note: 'The family emoji is 8 UTF-16 units. Watch length vs what one Backspace removes.',
  },
  {
    name: "space runs",
    script: "a   b",
    note: "Consecutive spaces: which become &nbsp;, and does that depend on white-space?",
  },
];
