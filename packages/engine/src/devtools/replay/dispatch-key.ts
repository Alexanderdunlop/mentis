import type { Modifiers } from "./types";

/**
 * Dispatch an untrusted `keydown`/`keyup`. Returns false when a listener called
 * `preventDefault` — which is how playback decides whether to run the native action,
 * mirroring the browser's own contract.
 *
 * Untrusted events cannot cause editing on their own; that's what `execCommand` is for.
 * See docs/notes/contenteditable-traps.md.
 */
export const dispatchKey = (
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
