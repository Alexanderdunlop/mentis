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

export const NO_MODS: Modifiers = {
  ctrl: false,
  meta: false,
  shift: false,
  alt: false,
};
