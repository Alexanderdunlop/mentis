import { describe, expect, it } from "vitest";
import {
  isSingleGrapheme,
  snapBack,
  snapForward,
  stepBack,
  stepForward,
} from "../grapheme-boundary";

/**
 * Every character here is written as an escape, never typed. Two of them contain a
 * zero-width joiner, which is invisible in source and would make the tests unreviewable —
 * the same rule the whitespace code follows.
 */
const THUMBS_UP = "\u{1F44D}"; // 2 code units: one surrogate pair
const THUMBS_UP_TONE = "\u{1F44D}\u{1F3FD}"; // 4: emoji + skin tone modifier
const FAMILY = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}"; // 8: two ZWJs
const FLAG_NZ = "\u{1F1F3}\u{1F1FF}"; // 4: two regional indicators
const E_COMBINING = "e\u{0301}"; // 2: `e` plus a combining acute

describe("the lengths that make all of this necessary", () => {
  it("counts code units, which is not what a reader counts", () => {
    expect(THUMBS_UP.length).toBe(2);
    expect(THUMBS_UP_TONE.length).toBe(4);
    expect(FAMILY.length).toBe(8);
    expect(FLAG_NZ.length).toBe(4);
    expect(E_COMBINING.length).toBe(2);
  });
});

describe("stepBack — one character backwards", () => {
  it("steps over a whole surrogate pair, not half of one", () => {
    expect(stepBack(THUMBS_UP, 2)).toBe(0);
  });

  it("steps over a skin tone modifier with the emoji it modifies", () => {
    expect(stepBack(THUMBS_UP_TONE, 4)).toBe(0);
  });

  it("steps over an entire ZWJ sequence", () => {
    expect(stepBack(FAMILY, 8)).toBe(0);
  });

  it("steps over a flag, which is two regional indicators", () => {
    expect(stepBack(FLAG_NZ, 4)).toBe(0);
  });

  it("takes a combining accent with its letter", () => {
    expect(stepBack(E_COMBINING, 2)).toBe(0);
  });

  it("is an ordinary single step through plain text", () => {
    expect(stepBack("hello", 5)).toBe(4);
    expect(stepBack("hello", 1)).toBe(0);
  });

  it("stops at the start rather than going negative", () => {
    expect(stepBack("hello", 0)).toBe(0);
  });

  it("finds the boundary in mixed content", () => {
    const text = `hi ${THUMBS_UP}!`; // "hi " (3) + emoji (2) + "!" (1)
    expect(stepBack(text, 6)).toBe(5); // over the "!"
    expect(stepBack(text, 5)).toBe(3); // over the whole emoji
    expect(stepBack(text, 3)).toBe(2); // over the space
  });
});

describe("stepForward — one character forwards", () => {
  it("steps over whole characters", () => {
    expect(stepForward(THUMBS_UP, 0)).toBe(2);
    expect(stepForward(FAMILY, 0)).toBe(8);
    expect(stepForward(FLAG_NZ, 0)).toBe(4);
    expect(stepForward(E_COMBINING, 0)).toBe(2);
  });

  it("stops at the end rather than running past it", () => {
    expect(stepForward("hello", 5)).toBe(5);
  });

  it("finds the boundary in mixed content", () => {
    const text = `hi ${THUMBS_UP}!`;
    expect(stepForward(text, 3)).toBe(5);
    expect(stepForward(text, 5)).toBe(6);
  });
});

describe("snapBack and snapForward — repair an offset without crossing a character", () => {
  it("leave an offset that is already a boundary alone", () => {
    const text = `a${THUMBS_UP}b`;
    for (const at of [0, 1, 3, 4]) {
      expect(snapBack(text, at)).toBe(at);
      expect(snapForward(text, at)).toBe(at);
    }
  });

  it("pull an offset stranded inside a surrogate pair out to either edge", () => {
    const text = `a${THUMBS_UP}b`; // boundaries at 0, 1, 3, 4 — never 2
    expect(snapBack(text, 2)).toBe(1);
    expect(snapForward(text, 2)).toBe(3);
  });

  it("pull an offset stranded inside a ZWJ sequence right out of it", () => {
    // Every interior offset belongs to one cluster, so both edges are the cluster's.
    for (const at of [1, 2, 3, 4, 5, 6, 7]) {
      expect(snapBack(FAMILY, at)).toBe(0);
      expect(snapForward(FAMILY, at)).toBe(8);
    }
  });

  it("clamp rather than run off either end", () => {
    expect(snapBack("hi", -3)).toBe(0);
    expect(snapForward("hi", 99)).toBe(2);
  });
});

describe("isSingleGrapheme", () => {
  it("is true for one character however many code units it takes", () => {
    expect(isSingleGrapheme("a")).toBe(true);
    expect(isSingleGrapheme(THUMBS_UP)).toBe(true);
    expect(isSingleGrapheme(THUMBS_UP_TONE)).toBe(true);
    expect(isSingleGrapheme(FAMILY)).toBe(true);
    expect(isSingleGrapheme(FLAG_NZ)).toBe(true);
    expect(isSingleGrapheme(E_COMBINING)).toBe(true);
  });

  it("is false for more than one, and for none", () => {
    expect(isSingleGrapheme("ab")).toBe(false);
    expect(isSingleGrapheme(THUMBS_UP + THUMBS_UP)).toBe(false);
    expect(isSingleGrapheme("")).toBe(false);
  });
});
