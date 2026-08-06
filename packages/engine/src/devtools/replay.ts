/**
 * Keystroke-script parsing and playback.
 *
 * Script syntax:
 *   plain characters      typed one at a time
 *   {Enter} {Backspace}   named keys
 *   {Ctrl+z} {Shift+Enter} {Alt+Backspace}
 *   {Backspace x3}        repeat (also `*3`)
 *   {wait 250}            pause, for watching composition or async work
 *   {{  }}                literal braces
 *
 * Example: `Hey @al{ArrowDown}{Enter} how are you?{Backspace x4}`
 *
 * FIDELITY WARNING. Page script cannot synthesize trusted key events, so playback
 * is a faithful *model* of the browser rather than the real thing:
 *
 *   - `keydown` is dispatched untrusted. Engine-handled keys (arrows, Escape, Tab,
 *     Enter-while-a-modal-is-open) behave correctly, because the engine's own
 *     listener is what acts on them.
 *   - Editing then goes through `document.execCommand`, which — deprecated as it is —
 *     is the only in-page way to produce a genuine `beforeinput`/`input` pair that
 *     participates in the native undo stack.
 *   - If the `keydown` listener calls `preventDefault`, playback skips the native
 *     action, exactly as a real browser would.
 *
 * What this cannot reproduce: IME composition, mobile autocorrect, and real hardware
 * key repeat. Those need Playwright/CDP — see `docs/prompts/e2e-harness.md`.
 */

export interface Modifiers {
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
}

export type ReplayStep =
  | { kind: "text"; char: string }
  | { kind: "key"; key: string; mods: Modifiers }
  | { kind: "wait"; ms: number };

export class ReplayParseError extends Error {}

const NO_MODS: Modifiers = { ctrl: false, meta: false, shift: false, alt: false };

const KEY_ALIASES: Record<string, string> = {
  enter: "Enter",
  return: "Enter",
  tab: "Tab",
  esc: "Escape",
  escape: "Escape",
  backspace: "Backspace",
  bs: "Backspace",
  delete: "Delete",
  del: "Delete",
  space: " ",
  left: "ArrowLeft",
  right: "ArrowRight",
  up: "ArrowUp",
  down: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
};

const MODIFIER_ALIASES: Record<string, keyof Modifiers> = {
  ctrl: "ctrl",
  control: "ctrl",
  meta: "meta",
  cmd: "meta",
  command: "meta",
  shift: "shift",
  alt: "alt",
  opt: "alt",
  option: "alt",
};

const parseToken = (token: string, at: number): ReplayStep[] => {
  const trimmed = token.trim();
  if (trimmed === "") {
    throw new ReplayParseError(`Empty {} token at index ${at}`);
  }

  const waitMatch = /^wait\s+(\d+)$/i.exec(trimmed);
  if (waitMatch) return [{ kind: "wait", ms: Number(waitMatch[1]) }];

  const segments = trimmed.split("+").filter((segment) => segment !== "");
  const rawKey = segments.pop();
  if (rawKey === undefined) {
    throw new ReplayParseError(`Token "{${token}}" at index ${at} has no key`);
  }

  const mods: Modifiers = { ...NO_MODS };
  for (const segment of segments) {
    const modifier = MODIFIER_ALIASES[segment.trim().toLowerCase()];
    if (!modifier) {
      throw new ReplayParseError(
        `Unknown modifier "${segment}" in "{${token}}" at index ${at}`
      );
    }
    mods[modifier] = true;
  }

  const repeatMatch = /^(.+?)\s*[x*](\d+)$/i.exec(rawKey.trim());
  const keyPart = (repeatMatch?.[1] ?? rawKey).trim();
  const repeat = repeatMatch ? Number(repeatMatch[2]) : 1;

  const key = KEY_ALIASES[keyPart.toLowerCase()] ?? keyPart;
  const hasMods = mods.ctrl || mods.meta || mods.shift || mods.alt;

  // A bare printable character is just typing; only treat it as a key when a
  // modifier makes it a shortcut.
  const step: ReplayStep =
    key.length === 1 && !hasMods
      ? { kind: "text", char: key }
      : { kind: "key", key, mods };

  return Array.from({ length: repeat }, () => ({ ...step }) as ReplayStep);
};

export const parseScript = (source: string): ReplayStep[] => {
  const steps: ReplayStep[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index]!;

    if (char === "{") {
      if (source[index + 1] === "{") {
        steps.push({ kind: "text", char: "{" });
        index += 2;
        continue;
      }
      const close = source.indexOf("}", index + 1);
      if (close === -1) {
        throw new ReplayParseError(`Unterminated "{" at index ${index}`);
      }
      steps.push(...parseToken(source.slice(index + 1, close), index));
      index = close + 1;
      continue;
    }

    if (char === "}" && source[index + 1] === "}") {
      steps.push({ kind: "text", char: "}" });
      index += 2;
      continue;
    }

    steps.push({ kind: "text", char });
    index += 1;
  }

  return steps;
};

// ---------------------------------------------------------------------------
// Playback (browser only)
// ---------------------------------------------------------------------------

export interface RunOptions {
  /** Pause between steps, so playback is watchable. */
  delayMs?: number;
  signal?: AbortSignal;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const exec = (command: string, value?: string): boolean => {
  try {
    return document.execCommand(command, false, value);
  } catch {
    return false;
  }
};

type SelectionWithModify = Selection & {
  modify?: (alter: string, direction: string, granularity: string) => void;
};

const modifySelection = (
  alter: "move" | "extend",
  direction: "forward" | "backward",
  granularity: string
): void => {
  const selection = window.getSelection() as SelectionWithModify | null;
  selection?.modify?.(alter, direction, granularity);
};

const placeCaretAtEnd = (editor: HTMLElement): void => {
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
};

const ensureCaret = (editor: HTMLElement): void => {
  const selection = window.getSelection();
  const anchor = selection?.anchorNode ?? null;
  if (!anchor || !(editor.contains(anchor) || anchor === editor)) {
    placeCaretAtEnd(editor);
  }
};

const dispatchKey = (
  editor: HTMLElement,
  type: "keydown" | "keyup",
  key: string,
  mods: Modifiers
): boolean =>
  editor.dispatchEvent(
    new KeyboardEvent(type, {
      key,
      bubbles: true,
      cancelable: true,
      composed: true,
      ctrlKey: mods.ctrl,
      metaKey: mods.meta,
      shiftKey: mods.shift,
      altKey: mods.alt,
    })
  );

/** What the browser would do by default, had the keydown not been prevented. */
const performNativeAction = (key: string, mods: Modifiers): void => {
  const wordGranularity = mods.alt || mods.ctrl ? "word" : "character";
  const alter = mods.shift ? "extend" : "move";

  switch (key) {
    case "Enter":
      exec(mods.shift ? "insertLineBreak" : "insertParagraph");
      return;
    case "Backspace":
      if (mods.alt || mods.ctrl) modifySelection("extend", "backward", "word");
      exec("delete");
      return;
    case "Delete":
      if (mods.alt || mods.ctrl) modifySelection("extend", "forward", "word");
      exec("forwardDelete");
      return;
    case "ArrowLeft":
      modifySelection(alter, "backward", wordGranularity);
      return;
    case "ArrowRight":
      modifySelection(alter, "forward", wordGranularity);
      return;
    case "ArrowUp":
      modifySelection(alter, "backward", "line");
      return;
    case "ArrowDown":
      modifySelection(alter, "forward", "line");
      return;
    case "Home":
      modifySelection(alter, "backward", "lineboundary");
      return;
    case "End":
      modifySelection(alter, "forward", "lineboundary");
      return;
    case "a":
      if (mods.ctrl || mods.meta) exec("selectAll");
      return;
    case "z":
      if (mods.ctrl || mods.meta) exec(mods.shift ? "redo" : "undo");
      return;
    case "y":
      if (mods.ctrl) exec("redo");
      return;
    default:
      // Escape, Tab, and anything else the browser does nothing with inside a
      // contenteditable. The engine's keydown listener is the only consumer.
      return;
  }
};

export const runScript = async (
  editor: HTMLElement,
  steps: ReplayStep[],
  options: RunOptions = {}
): Promise<void> => {
  const { delayMs = 8, signal } = options;

  editor.focus();
  ensureCaret(editor);

  for (const step of steps) {
    if (signal?.aborted) return;

    if (step.kind === "wait") {
      await sleep(step.ms);
      continue;
    }

    if (step.kind === "text") {
      const notPrevented = dispatchKey(editor, "keydown", step.char, NO_MODS);
      if (notPrevented) exec("insertText", step.char);
      dispatchKey(editor, "keyup", step.char, NO_MODS);
    } else {
      const notPrevented = dispatchKey(editor, "keydown", step.key, step.mods);
      if (notPrevented) performNativeAction(step.key, step.mods);
      dispatchKey(editor, "keyup", step.key, step.mods);
    }

    if (delayMs > 0) await sleep(delayMs);
  }
};

export const runScriptSource = (
  editor: HTMLElement,
  source: string,
  options?: RunOptions
): Promise<void> => runScript(editor, parseScript(source), options);
