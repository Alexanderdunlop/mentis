import { runScriptSource, SCENARIOS } from "../src/devtools/index";
import { need } from "./need";

export const bindReplayControls = (editor: HTMLElement): void => {
  const script = need<HTMLInputElement>("#script");
  const delay = need<HTMLInputElement>("#delay");
  const delayOutput = need("#delay-out");
  const error = need("#script-error");
  const note = need("#scenario-note");

  delay.addEventListener("input", () => {
    delayOutput.textContent = `${delay.value}ms`;
  });

  let running: AbortController | null = null;

  const run = async (source: string): Promise<void> => {
    error.textContent = "";
    running?.abort();
    running = new AbortController();
    try {
      await runScriptSource(editor, source, {
        delayMs: Number(delay.value),
        signal: running.signal,
      });
    } catch (cause) {
      error.textContent = cause instanceof Error ? cause.message : String(cause);
    }
  };

  need("#run").addEventListener("click", () => void run(script.value));
  need("#stop").addEventListener("click", () => running?.abort());
  script.addEventListener("keydown", (event) => {
    if (event.key === "Enter") void run(script.value);
  });

  const list = need("#scenarios");
  for (const scenario of SCENARIOS) {
    const button = document.createElement("button");
    button.textContent = scenario.name;
    button.addEventListener("click", () => {
      script.value = scenario.script;
      note.textContent = scenario.note;
      void run(scenario.script);
    });
    list.appendChild(button);
  }
};
