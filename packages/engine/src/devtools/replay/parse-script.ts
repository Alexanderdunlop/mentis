import { KEY_ALIASES, MODIFIER_ALIASES } from "./aliases";
import { NO_MODS, type Modifiers, type ReplayStep } from "./types";

/**
 * Parse a keystroke script into steps. Pure — no DOM, no browser.
 *
 *   plain characters      typed one at a time
 *   {Enter} {Backspace}   named keys
 *   {Ctrl+z} {Shift+Enter} {Alt+Backspace}
 *   {Backspace x3}        repeat (also *3)
 *   {wait 250}            pause
 *   {{  }}                literal braces
 *
 * Example: `Hey @al{ArrowDown}{Enter} how are you?{Backspace x4}`
 */

export class ReplayParseError extends Error {}

const parseToken = (token: string, at: number): ReplayStep[] => {
  const trimmed = token.trim();
  if (trimmed === "") throw new ReplayParseError(`Empty {} token at index ${at}`);

  const wait = /^wait\s+(\d+)$/i.exec(trimmed);
  if (wait) return [{ kind: "wait", ms: Number(wait[1]) }];

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

  const repeated = /^(.+?)\s*[x*](\d+)$/i.exec(rawKey.trim());
  const keyPart = (repeated?.[1] ?? rawKey).trim();
  const repeat = repeated ? Number(repeated[2]) : 1;

  const key = KEY_ALIASES[keyPart.toLowerCase()] ?? keyPart;
  const modified = mods.ctrl || mods.meta || mods.shift || mods.alt;

  // A bare printable character is just typing; it's only a key when a modifier makes
  // it a shortcut.
  const step: ReplayStep =
    key.length === 1 && !modified
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
