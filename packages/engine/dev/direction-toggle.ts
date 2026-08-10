import { need } from "./need";

/**
 * Flip the editor's writing direction, for looking at RTL and bidi by hand.
 *
 * Sets `dir` on the container and nothing else, because that is the entire integration —
 * the engine has no direction policy and reads the attribute nowhere ([ADR
 * 0015](../docs/adr/0015-direction-belongs-to-the-consumer.md)). Worth having in the
 * inspector anyway: the interesting part of bidi is *visual*, and the thing to look at is
 * the Model panel staying in logical order while the editor reorders on screen.
 *
 * Type Hebrew or Arabic and watch the caret. Arrow keys are the browser's (ADR 0003), and
 * engines genuinely differ about whether ArrowLeft means "visually left" or "logically
 * back" in mixed text — the model just records whatever selection arrives, which is the
 * point.
 */
export const bindDirectionToggle = (element: HTMLElement): void => {
  const toggle = need<HTMLInputElement>("#rtl");

  const sync = (): void => {
    if (toggle.checked) element.setAttribute("dir", "rtl");
    else element.removeAttribute("dir");
  };

  toggle.addEventListener("change", sync);
  sync();
};
