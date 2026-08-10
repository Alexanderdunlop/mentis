/**
 * Where one *user-perceived character* ends and the next begins.
 *
 * A JavaScript string is a sequence of UTF-16 code units, and almost nothing a reader
 * would call "a character" is one of them. `"👍".length` is 2. `"👨‍👩‍👧".length` is 8.
 * `"é"` is 2 when it was typed as `e` plus a combining accent. Every offset in this
 * package is a code-unit offset — deliberately, so model positions and DOM offsets are
 * the same unit (docs/adr/0013-positions-stay-code-units.md) — which means the engine has
 * to know where it is *allowed* to cut.
 *
 * Four questions, and the difference between them is only whether `at` itself counts:
 *
 * | | answer |
 * |---|---|
 * | `snapBack` | greatest boundary **≤** `at` |
 * | `snapForward` | least boundary **≥** `at` |
 * | `stepBack` | greatest boundary **<** `at` — one character backwards |
 * | `stepForward` | least boundary **>** `at` — one character forwards |
 */

/** Built once and lazily: `Intl.Segmenter` is expensive to construct and cheap to reuse. */
let segmenter: Intl.Segmenter | null = null;

/**
 * Code points, as the degraded answer where `Intl.Segmenter` is missing.
 *
 * Strictly worse — it still cuts a combining accent off its letter, and still splits a ZWJ
 * emoji into its parts — but it never produces a lone surrogate, which is the failure that
 * renders as `�` and cannot be typed away. Degrading honestly beats degrading silently.
 *
 * `for…of` over a string iterates code points, not code units, which is the whole trick.
 */
const codePointBoundaries = (text: string): number[] => {
  const found = [0];
  let at = 0;
  for (const character of text) {
    at += character.length;
    found.push(at);
  }
  return found;
};

/**
 * Every boundary in `text`, ascending, always including 0 and `text.length`.
 *
 * The whole string is segmented rather than a window around the offset. Clusters are
 * short, so a window would *nearly* always be right — and "nearly always" is how you ship
 * a bug that reproduces in one script only. These are called once per fallback delete and
 * once per composition, never per keystroke, so there is nothing to optimise for.
 *
 * No locale is passed: grapheme segmentation is locale-independent in practice. The
 * locale-sensitive granularities are word and sentence, which this package never asks for.
 */
const boundaries = (text: string): number[] => {
  if (typeof Intl.Segmenter !== "function") return codePointBoundaries(text);

  segmenter ??= new Intl.Segmenter(undefined, { granularity: "grapheme" });

  const found = [0];
  for (const { index, segment } of segmenter.segment(text)) {
    found.push(index + segment.length);
  }
  return found;
};

const greatestUnder = (found: number[], limit: number): number => {
  let best = 0;
  for (const boundary of found) {
    if (boundary >= limit) break;
    best = boundary;
  }
  return best;
};

/** Greatest boundary **≤** `at`. Returns `at` unchanged when it is already one. */
export const snapBack = (text: string, at: number): number => {
  if (at <= 0) return 0;
  if (at >= text.length) return text.length;
  return greatestUnder(boundaries(text), at + 1);
};

/** Least boundary **≥** `at`. Returns `at` unchanged when it is already one. */
export const snapForward = (text: string, at: number): number => {
  if (at <= 0) return 0;
  if (at >= text.length) return text.length;
  return boundaries(text).find((boundary) => boundary >= at) ?? text.length;
};

/** Greatest boundary **<** `at` — one user-perceived character backwards. */
export const stepBack = (text: string, at: number): number => {
  if (at <= 0) return 0;
  return greatestUnder(boundaries(text), Math.min(at, text.length));
};

/** Least boundary **>** `at` — one user-perceived character forwards. */
export const stepForward = (text: string, at: number): number => {
  if (at >= text.length) return text.length;
  return (
    boundaries(text).find((boundary) => boundary > Math.max(at, 0)) ?? text.length
  );
};

/**
 * Is this text exactly one user-perceived character?
 *
 * Undo coalescing asks, because it groups typing runs. `text.length === 1` classifies a
 * typed emoji as "not typing" and hands it its own undo step, so `hi 👍` undoes in three
 * pieces rather than as the single run it looks like.
 */
export const isSingleGrapheme = (text: string): boolean =>
  text !== "" && boundaries(text).length === 2;
