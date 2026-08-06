import { need } from "./need";

/**
 * Preview of M1: swallow every `beforeinput` so you can watch what the browser *wanted*
 * to do without it happening.
 *
 * Registered in capture phase on `document` so it always runs before the editor's own
 * listeners — which is what lets the event log report `defaultPrevented` truthfully.
 */
export const bindIntercept = (editor: HTMLElement): void => {
  const toggle = need<HTMLInputElement>("#intercept");

  document.addEventListener(
    "beforeinput",
    (event) => {
      if (!toggle.checked) return;
      const target = event.target as Node | null;
      if (target && (editor.contains(target) || target === editor)) {
        event.preventDefault();
      }
    },
    true
  );
};
