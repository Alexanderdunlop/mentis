import { ensureCaret } from "./caret";
import { dispatchKey } from "./dispatch-key";
import { exec } from "./edit-primitives";
import { performNativeAction } from "./native-action";
import { parseScript } from "./parse-script";
import { NO_MODS, type ReplayStep } from "./types";

/**
 * FIDELITY. Page script cannot synthesize trusted key events, so playback is a faithful
 * *model* of the browser rather than the real thing: dispatch an untrusted `keydown`,
 * and only if nothing prevented it, perform the native action.
 *
 * Engine-handled keys (arrows, Escape, Tab, Enter-while-a-modal-is-open) therefore
 * behave correctly, because the engine's own listener is what acts on them.
 *
 * It cannot reproduce IME composition, mobile autocorrect, or hardware key repeat.
 * Those need real input — by hand, or Playwright/CDP.
 */

export interface RunOptions {
  /** Pause between steps, so playback is watchable. */
  delayMs?: number;
  signal?: AbortSignal;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Waits are handled by the loop, so this only ever sees something dispatchable. */
type InputStep = Exclude<ReplayStep, { kind: "wait" }>;

const runStep = (editor: HTMLElement, step: InputStep): void => {
  if (step.kind === "text") {
    if (dispatchKey(editor, "keydown", step.char, NO_MODS)) {
      exec("insertText", step.char);
    }
    dispatchKey(editor, "keyup", step.char, NO_MODS);
    return;
  }

  if (dispatchKey(editor, "keydown", step.key, step.mods)) {
    performNativeAction(step.key, step.mods);
  }
  dispatchKey(editor, "keyup", step.key, step.mods);
};

export const runScript = async (
  editor: HTMLElement,
  steps: ReplayStep[],
  { delayMs = 8, signal }: RunOptions = {}
): Promise<void> => {
  editor.focus();
  ensureCaret(editor);

  for (const step of steps) {
    if (signal?.aborted) return;

    if (step.kind === "wait") {
      await sleep(step.ms);
      continue;
    }

    runStep(editor, step);
    if (delayMs > 0) await sleep(delayMs);
  }
};

export const runScriptSource = (
  editor: HTMLElement,
  source: string,
  options?: RunOptions
): Promise<void> => runScript(editor, parseScript(source), options);
