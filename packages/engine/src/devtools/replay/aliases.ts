import type { Modifiers } from "./types";

export const KEY_ALIASES: Record<string, string> = {
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

export const MODIFIER_ALIASES: Record<string, keyof Modifiers> = {
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
