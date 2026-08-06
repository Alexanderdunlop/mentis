import {
  createInspector,
  runScriptSource,
  SCENARIOS,
} from "../src/devtools/index";
import "./styles.css";

const need = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
};

const editor = need<HTMLDivElement>("#editor");
const inspector = createInspector({ editor, mount: need("#inspector") });

need("#ua").textContent = `${navigator.userAgent} · ${navigator.platform}`;

// ---------------------------------------------------------------------------
// Editor interception
// ---------------------------------------------------------------------------

const interceptToggle = need<HTMLInputElement>("#intercept");

// Capture phase on `document`, so this always runs before the editor's own
// listeners — which is what lets the event log report `defaultPrevented` truthfully.
// It is also a preview of M1: the engine will own every beforeinput this way.
document.addEventListener(
  "beforeinput",
  (event) => {
    if (!interceptToggle.checked) return;
    const target = event.target as Node | null;
    if (target && (editor.contains(target) || target === editor)) {
      event.preventDefault();
    }
  },
  true
);

// ---------------------------------------------------------------------------
// Log controls
// ---------------------------------------------------------------------------

const bindCheckbox = (selector: string, apply: (checked: boolean) => void): void => {
  const input = need<HTMLInputElement>(selector);
  apply(input.checked);
  input.addEventListener("change", () => apply(input.checked));
};

bindCheckbox("#pause", inspector.log.setPaused);
bindCheckbox("#autoscroll", inspector.log.setAutoscroll);
bindCheckbox("#selectionchange", inspector.log.setLogSelectionChange);

need("#clear").addEventListener("click", () => inspector.log.clear());

need("#copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(inspector.log.toJSON());
});

need("#download").addEventListener("click", () => {
  const blob = new Blob([inspector.log.toJSON()], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mentis-event-session.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

// ---------------------------------------------------------------------------
// Replay
// ---------------------------------------------------------------------------

const scriptInput = need<HTMLInputElement>("#script");
const delayInput = need<HTMLInputElement>("#delay");
const delayOutput = need("#delay-out");
const scriptError = need("#script-error");
const scenarioNote = need("#scenario-note");

delayInput.addEventListener("input", () => {
  delayOutput.textContent = `${delayInput.value}ms`;
});

let running: AbortController | null = null;

const run = async (source: string): Promise<void> => {
  scriptError.textContent = "";
  running?.abort();
  running = new AbortController();
  try {
    await runScriptSource(editor, source, {
      delayMs: Number(delayInput.value),
      signal: running.signal,
    });
  } catch (error) {
    scriptError.textContent =
      error instanceof Error ? error.message : String(error);
  }
};

need("#run").addEventListener("click", () => void run(scriptInput.value));
need("#stop").addEventListener("click", () => running?.abort());
scriptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") void run(scriptInput.value);
});

const scenarioList = need("#scenarios");
for (const scenario of SCENARIOS) {
  const button = document.createElement("button");
  button.textContent = scenario.name;
  button.addEventListener("click", () => {
    scriptInput.value = scenario.script;
    scenarioNote.textContent = scenario.note;
    void run(scenario.script);
  });
  scenarioList.appendChild(button);
}

// ---------------------------------------------------------------------------
// Content presets
// ---------------------------------------------------------------------------

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
  { name: "emoji", html: "a👨‍👩‍👧b" },
];

const presetList = need("#presets");
for (const preset of PRESETS) {
  const button = document.createElement("button");
  button.textContent = preset.name;
  button.addEventListener("click", () => {
    editor.innerHTML = preset.html;
    editor.focus();
    inspector.refresh();
  });
  presetList.appendChild(button);
}

editor.focus();
